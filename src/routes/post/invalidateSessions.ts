import { cookie, validationResult } from 'express-validator';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as commonErrors from '../../utils/errors';
import { Request, Response } from 'express';
import { invalidateSessionsForRefreshToken } from '../../utils/databases';

export const invalidateSessions = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');
    /**
     * Empty Check
     */

    await cookie('RefreshToken', commonErrors.noRefreshToken).notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(response.addError(errors.array()[0].msg).close());
        return;
    }

    const currentRefreshToken = req.cookies['RefreshToken'];

    const userIdOrError = await invalidateSessionsForRefreshToken(currentRefreshToken);

    if (userIdOrError.isError()) {
        response.addError(userIdOrError.error);
        res.status(400).json(response.close());
        return;
    }

    response.meta = {
        userId: userIdOrError.value,
        message: 'All sessions except the requestor have been successfully invalidated',
    };

    res.status(200).json(response.close());
};
