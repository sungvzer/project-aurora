import User from '../../models/User';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import { Request, Response } from 'express';

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const response: SingleResourceResponse = new SingleResourceResponse('data');

    const userId = parseInt(req.params.id);
    if (req['decodedJWTPayload']['userHeaderID'] != userId) {
        response.addError(err.userIdMismatch);
        res.status(403).json(response.close());
        return;
    }

    const errorOr = await User.delete(userId);
    if (errorOr.isError()) {
        response.addError(errorOr.error);
        res.status(400).json(response.close());
        return;
    }

    res.clearCookie('RefreshToken').clearCookie('AccessToken');
    res.status(204).send();
    return;
};
