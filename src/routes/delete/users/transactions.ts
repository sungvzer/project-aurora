import User from "../../../models/User";
import { SingleResourceResponse } from "../../../utils/jsonAPI";
import * as err from "../../../utils/errors";
import { Request, Response } from "express";
import {
    param,
    Result,
    ValidationError,
    validationResult,
} from "express-validator";

export const deleteUserTransaction = async (
    req: Request,
    res: Response
): Promise<Response> => {
    let response: SingleResourceResponse = new SingleResourceResponse("data");
    await param("trId").isInt({ allow_leading_zeroes: false, gt: 0 }).run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }
        return res.status(400).json(response.close());
    }

    const userId = parseInt(req.params.id);
    const transactionId = parseInt(req.params.trId);

    if (req["decodedJWTPayload"]["userHeaderID"] != userId) {
        response.addError(err.userIdMismatch);
        res.status(403).json(response.close());
        return;
    }

    const errorOr = await User.deleteTransaction(userId, transactionId);
    if (errorOr.isError()) {
        response.addError(errorOr.error);
        res.status(400).json(response.close());
        return;
    }

    res.status(204).send();
    return;
};
