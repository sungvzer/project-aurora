import ErrorOr from "../../models/ErrorOr";
import User, { UserPersonalInfo, UserSettings } from "../../models/User";
import { SingleResourceResponse } from "../../utils/jsonAPI";
import * as err from "../../utils/errors";
import { Request, Response } from "express";

export const getUser = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    const userId = parseInt(req.params.id);

    const jwtUserHeaderId = req["decodedJWTPayload"]["userHeaderID"];

    // This means we screwed up badly
    if (!jwtUserHeaderId) {
        res.status(500).json(response.addError(err.internal).close());
        return;
    }

    if (userId != jwtUserHeaderId) {
        res.status(403).json(response.addError(err.userIdMismatch).close());
        return;
    }

    const infoOrError: ErrorOr<UserPersonalInfo> = await User.getPersonalInfo(
        userId
    );
    if (infoOrError.isError()) {
        response.addError(infoOrError.error);
        res.status(404).json(response.close());
        return;
    }

    response.data = {
        id: userId.toString(),
        type: "UserPersonalInfo",
        attributes: {
            ...infoOrError.value,
        },
    };
    res.status(200).json(response.close());
};
