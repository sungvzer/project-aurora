import ErrorOr from '../../../models/ErrorOr';
import User, { UserSettings } from '../../../models/User';
import { SingleResourceResponse } from '../../../utils/jsonAPI';
import * as err from '../../../utils/errors';
import { Request, Response } from 'express';

export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    const userId = parseInt(req.params.id);

    const jwtUserHeaderId = req["decodedJWTPayload"]["userHeaderID"];

    // This means we screwed up badly
    if (!jwtUserHeaderId) {
        res.status(500).json(response.addError({
            code: "ERR_INTERNAL_LOGIN_AGAIN",
            detail: "There's been an internal error. Please login again.",
            status: "500",
            title: "Internal server error"
        }).close());
        return;
    }

    if (userId != jwtUserHeaderId) {
        res.status(403).json(response.addError(
            err.userIdMismatch
        ).close());
        return;

    }

    const settingsOrError: ErrorOr<UserSettings> = await User.getSettingsById(userId);
    if (settingsOrError.isError()) {
        response.addError(settingsOrError.error);
        res.status(404).json(response.close());
        return;
    }

    response.data = {
        id: userId.toString(),
        type: "UserSettings",
        attributes: {
            ...settingsOrError.value
        },
    };
    res.status(200).json(response.close());
};
