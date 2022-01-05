import { Request, Response } from 'express';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import User from '../../models/User';
import { resourceObjectHas } from '../../utils/customValidators';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import PasswordResetKey from '../../models/PasswordResetKey';

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');

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

    const resetKey = req.body.data.attributes.resetKey;
    const password = req.body.data.attributes.password;

    response.meta = {
        resetKey,
        password,
    };

    const userIdOrError = await PasswordResetKey.consume(resetKey);
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
