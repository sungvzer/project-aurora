import { Request, Response } from 'express';
import { check, body, Result, ValidationError, validationResult } from 'express-validator';
import { getRedisConnection, periodicRefreshTokenCleanup } from '../../utils/databases';
import ErrorOr from '../../models/ErrorOr';
import User, { UserCredentials } from '../../models/User';
import { verifyPassword } from '../../utils/argon';
import {
    resourceObjectHas,
    resourceObjectValidateEmail,
    resourceObjectSanitizeEmail,
} from '../../utils/customValidators';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import { generateTokenPair } from '../../utils/jwt';
import * as err from '../../utils/errors';
import { millisecondsInADay } from '../../utils/time';

export const postLogin = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');

    /**
     * Empty Checks
     */
    await check('data', err.blankEmail).custom(resourceObjectHas('email')).run(req);
    await check('data', err.blankPassword).custom(resourceObjectHas('password')).run(req);

    /**
     * Validity Checks
     */
    await check('data', err.invalidEmail).custom(resourceObjectValidateEmail).run(req);

    /**
     * Body sanitization
     */
    await body('data').customSanitizer(resourceObjectSanitizeEmail).run(req);

    /**
     * Error handling
     */
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        for (const { msg: error } of errors.array()) {
            response.addError(error);
        }
        res.status(400).json(response.close());
        return;
    }

    const email = req.body.data.attributes.email;
    const plainTextPassword = req.body.data.attributes.password;
    const credentialsOrError: ErrorOr<UserCredentials> = await User.getCredentialsByEmail(email);
    const userIDOrError: ErrorOr<number> = await User.getUserIdByEmail(email);
    if (credentialsOrError.isError() || userIDOrError.isError()) {
        if (credentialsOrError.isError()) {
            response.addError(credentialsOrError.error);
        }
        if (userIDOrError.isError()) {
            response.addError(userIDOrError.error);
        }
        res.status(404).json(response.close());
        return;
    }

    const accessGranted: boolean = await verifyPassword(
        plainTextPassword,
        credentialsOrError.value.passwordHash,
    );
    if (!accessGranted) {
        response.addError(err.wrongCredentials);
        res.status(401).json(response.close());
        return;
    }
    const redis = await getRedisConnection();
    const userID = userIDOrError.value;

    /* Once we verify that the credentials are ok, we are good with refreshing
       current tokens instead of generating new ones.
       Even though this behavior is really stupid, clients should never allow
       login after they have already access to the API */
    if (req.cookies.RefreshToken) {
        const storedRefreshToken = await redis.get(`${userID}-${req.cookies.RefreshToken}`);
        if (storedRefreshToken == '1') {
            res.redirect(307, '/refreshToken');
            return;
        }
    }

    // Given we're talking about milliseconds, storing it once ensures consistency
    const refreshExpiryTimestamp = Date.now() + millisecondsInADay * 7;

    const { accessToken, refreshToken } = generateTokenPair({
        userHeaderID: userID,
    });
    await redis.set(userID.toString() + '-' + refreshToken, '1', {
        PXAT: refreshExpiryTimestamp,
    });

    response.meta = {
        message: 'Access granted',
        userId: userID.toString(),
    };

    periodicRefreshTokenCleanup();

    res.cookie('AccessToken', accessToken, {
        httpOnly: true,
        expires: new Date(Date.now() + millisecondsInADay),
    })
        .cookie('RefreshToken', refreshToken, {
            expires: new Date(refreshExpiryTimestamp),
            httpOnly: true,
        })
        .status(200)
        .json(response.close());
};
