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
import PasswordResetKey from '../../models/PasswordResetKey';

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse('data');

    /**
     * Empty Checks
     */
    await check('data', err.noResetKey).custom(resourceObjectHas('resetKey')).run(req);
    await check('data', err.blankPassword).custom(resourceObjectHas('password')).run(req);

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

    let resetKey = req.body.data.attributes.resetKey;
    let password = req.body.data.attributes.password;

    response.meta = {
        resetKey,
        password,
    };

    let userIdOrError = await PasswordResetKey.consume(resetKey);
    if (userIdOrError.isError()) {
        res.status(400).json(response.addError(userIdOrError.error).close());
        return;
    }
    User.changePassword(userIdOrError.value, password);
    // TODO: Cleanup all refresh tokens that belong to this user

    response.meta = { message: 'Password correctly changed' };
    res.status(200).json(response.close());
    return;
};
