import { Request, Response } from 'express';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import User from '../../models/User';
import { resourceObjectAttributeIs, resourceObjectHas } from '../../utils/customValidators';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import PasswordResetKey from '../../models/PasswordResetKey';
import { invalidateAllSessionsForUser } from '../../utils/databases';

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');

    /**
     * Empty Checks
     */
    await check('data', err.noResetKey).custom(resourceObjectHas('resetKey')).run(req);
    await check('data', err.missingInvalidateSessionsParameter)
        .custom(resourceObjectHas('invalidateSessions'))
        .run(req);
    await check('data', err.blankPassword).custom(resourceObjectHas('password')).run(req);

    /**
     * Validity checks
     */
    const customError = err.wrongParameterType;
    customError.detail = customError.detail
        ?.replace('{{param.name}}', 'invalidateSessions')
        .replace('{{param.type}}', 'boolean');

    await check('data', customError)
        .custom(resourceObjectAttributeIs('invalidateSessions', 'boolean'))
        .run(req);

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
    const invalidateSessions = req.body.data.attributes.invalidateSessions as boolean;

    const userIdOrError = await PasswordResetKey.consume(resetKey);
    if (userIdOrError.isError()) {
        res.status(400).json(response.addError(userIdOrError.error).close());
        return;
    }
    User.changePassword(userIdOrError.value, password);
    if (invalidateSessions) {
        invalidateAllSessionsForUser(userIdOrError.value);
    }

    response.meta = { message: 'Password correctly changed' };
    res.status(200).json(response.close());
    return;
};
