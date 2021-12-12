import { Request, Response } from "express";
import {
    check,
    Result,
    ValidationError,
    validationResult,
} from "express-validator";
import { getDatabaseConnection } from "../../../utils/databases";
import {
    resourceObjectHas,
    dataIsArray,
    dataHas,
} from "../../../utils/customValidators";
import { ResourceObject, SingleResourceResponse } from "../../../utils/jsonAPI";
import * as err from "../../../utils/errors";
import validator from "validator";
import { isCurrencyCode } from "../../../models/CurrencyCode";
import { ResultSetHeader } from "mysql2";

export const postUserTransactions = async (
    req: Request,
    res: Response
): Promise<Response> => {
    let response = new SingleResourceResponse("data");
    let createdTransactionID: number, userId: number;
    await check("data", err.invalidRequestBody)
        .not()
        .custom(dataIsArray)
        .run(req);
    await check("data", err.unsupportedIdInRequest)
        .not()
        .custom(dataHas("id"))
        .run(req);

    await check("data", err.blankAmount)
        .custom(resourceObjectHas("amount"))
        .run(req);
    await check("data", err.blankCurrencyCode)
        .custom(resourceObjectHas("currency"))
        .run(req);
    await check("data", err.blankDate)
        .custom(resourceObjectHas("date"))
        .run(req);
    await check("data", err.blankTag).custom(resourceObjectHas("tag")).run(req);

    await check("data", err.invalidAmount)
        .custom((input) => {
            if (typeof input["attributes"]["amount"] !== "number") {
                return false;
            }
            return validator.isInt(input["attributes"]["amount"].toString(), {
                allow_leading_zeroes: false,
            });
        })
        .run(req);

    await check("data", err.invalidDate)
        .custom((input) => {
            return validator.isDate(input["attributes"]["date"], {
                format: "YYYY-MM-DD",
            });
        })
        .run(req);

    await check("data", err.invalidCurrencyCode)
        .custom((input) => {
            return isCurrencyCode(input["attributes"]["currency"]);
        })
        .run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }
        return res.status(400).json(response.close());
    }

    let resource: ResourceObject = req.body.data;
    userId = parseInt(req.params.id);
    if (req["decodedJWTPayload"]["userHeaderID"] !== userId) {
        return res
            .status(403)
            .json(response.addError(err.userIdMismatch).close());
    }

    const currency = resource.attributes.currency;
    const date = resource.attributes.date;
    const amount = resource.attributes.amount;
    const tag = resource.attributes.tag;

    const connection = await getDatabaseConnection();
    const [result] = await connection.execute<ResultSetHeader>(
        "INSERT INTO `aurora`.`Transaction`(`UserTransactionCurrencyID`,`UserDataHeaderID`,`UserTransactionAmount`,`UserTransactionDate`,`UserTransactionTag`) VALUES ((SELECT CurrencyID FROM Currency WHERE CurrencyCode = ?), ?, ?, ?, ?);",
        [currency, userId, amount, date, tag]
    );

    createdTransactionID = result.insertId;
    response.data = {
        id: createdTransactionID.toString(),
        type: "UserTransaction",
        attributes: {
            amount: amount,
            currency: currency,
            date: date,
            tag: tag,
        },
    };

    return res
        .status(201)
        .header(
            "Location",
            `/users/${userId}/transactions/${createdTransactionID}`
        )
        .json(response.close());
};
