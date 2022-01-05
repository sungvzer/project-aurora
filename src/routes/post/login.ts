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
    let response = new SingleResourceResponse('data');

    /* FIXME: The current behavior "leaks" RefreshTokens and should be prevented so that the periodic cleanup does not need to occur:
              Whenever a new refresh token is issued, we should find a way to actually verify if that user already has a certain token,
              if so, we should delete it, (or provide it again if the request already possesses one?) */
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

    const { accessToken, refreshToken } = generateTokenPair({
        userHeaderID: userIDOrError.value,
    });
    const redis = await getRedisConnection();
    await redis.set(refreshToken, '1');

    response.data = {
        id: userIDOrError.value.toString(),
        type: 'Credentials',
        attributes: {
            accessToken,
            refreshToken,
        },
    };

    periodicRefreshTokenCleanup();

    res.cookie('AccessToken', accessToken, {
        httpOnly: true,
        expires: new Date(Date.now() + millisecondsInADay),
    })
        .cookie('RefreshToken', refreshToken, {
            expires: new Date(Date.now() + millisecondsInADay * 7),
            httpOnly: true,
        })
        .status(200)
        .json(response.close());
    return;
};
