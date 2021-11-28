import User, { } from '../../models/User';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import { Request, Response } from 'express';
import { param, Result, ValidationError, validationResult } from 'express-validator';
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    let response: SingleResourceResponse = new SingleResourceResponse("data");
    /**
     * Empty and validity checks
     */
    await param("id", err.invalidUserId).notEmpty().isInt({ allow_leading_zeroes: false, gt: 0 }).run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }

    const userId = parseInt(req.params.id);
    if (req["decodedJWTPayload"]["userHeaderID"] != userId) {
        response.addError(err.userIdMismatch);
        res.status(403).json(response.close());
        return;
    }

    const exists = await User.exists(userId);
    if (!exists) {
        response.addError(err.userNotFound);
        res.status(404).json(response.close());
        return;
    }

    const errorOr = await User.delete(userId);
    if (errorOr.isError()) {
        response.addError(errorOr.error);
        res.status(400).json(response.close());
        return;
    }

    res.status(204).send();
    return;
};
