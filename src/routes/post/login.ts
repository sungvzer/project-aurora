import { Request, Response } from 'express';
import { check, body, Result, ValidationError, validationResult } from 'express-validator';
import { getRedisConnection } from '../../utils/databases';
import ErrorOr from '../../models/ErrorOr';
import User, { UserCredentials } from '../../models/User';
import { verifyPassword } from '../../utils/argon';
import { jwtObjectHas, jwtObjectValidateEmail, jwtObjectSanitizeEmail } from '../../utils/customValidators';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import { generateTokenPair } from '../../utils/jwt';
import * as err from '../../utils/errors';

export const postLogin = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    /**
     * Empty Checks
     */
    await check("data", err.blankEmail).custom(jwtObjectHas("email")).run(req);
    await check("data", err.blankPassword).custom(jwtObjectHas("password")).run(req);

    /**
     * Validity Checks
     */
    await check("data", err.invalidEmail).custom(jwtObjectValidateEmail).run(req);

    /**
     * Body sanitization
     */
    await body("data").customSanitizer(jwtObjectSanitizeEmail).run(req);

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

    const accessGranted: boolean = await verifyPassword(plainTextPassword, credentialsOrError.value.passwordHash);
    if (!accessGranted) {
        response.addError(err.wrongCredentials);
        res.status(401).json(response.close());
        return;
    }

    const { accessToken, refreshToken } = generateTokenPair({ userHeaderID: userIDOrError.value });
    const redis = await getRedisConnection();
    await redis.set(refreshToken, '1');

    response.data = {
        id: userIDOrError.value.toString(),
        type: "Credentials",
        attributes: {
            accessToken, refreshToken
        }
    };

    res.status(200).json(response.close());
    return;
};
