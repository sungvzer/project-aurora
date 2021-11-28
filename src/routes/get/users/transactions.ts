import assert from 'node:assert';
import User, { TransactionQueryOptions, UserSettings } from '../../../models/User';
import { MultipleResourcesResponse, ResourceObject, SingleResourceResponse } from '../../../utils/jsonAPI';
import * as err from '../../../utils/errors';
import { Request, Response } from 'express';
import { query, param, Result, ValidationError, validationResult } from 'express-validator';
import CurrencyCode, { isCurrencyCode } from '../../../models/CurrencyCode';

export const getUserTransactions = async (req: Request, res: Response) => {
    let response = new MultipleResourcesResponse("data");
    await param("id", err.invalidUserId).notEmpty().isInt({ allow_leading_zeroes: false, gt: 0 }).run(req);

    await query("minAmount", { ...err.invalidAmount, source: { parameter: "minAmount" } }).optional().isInt().run(req);
    await query("maxAmount", { ...err.invalidAmount, source: { parameter: "maxAmount" } }).optional().isInt().run(req);
    await query("startDate", { ...err.invalidDate, source: { parameter: "startDate" } }).optional().isDate({ format: 'YYYY-MM-DD' }).run(req);
    await query("endDate", { ...err.invalidDate, source: { parameter: "endDate" } }).optional().isDate({ format: 'YYYY-MM-DD' }).run(req);

    await query("currency", err.invalidCurrencyCode).optional().custom((input) => {
        return isCurrencyCode(input);
    }).run(req);

    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        for (const { msg } of errors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }

    const payloadID = req["decodedJWTPayload"]["userHeaderID"];
    const userID = parseInt(req.params.id);
    assert(payloadID);
    if (userID !== payloadID) {
        response.addError({
            code: "ERR_AUTH_MISMATCH",
            detail: `Cannot get transactions for user ${userID} as authentication header refers to a different user.`,
            status: "403",
            title: "Authentication mismatch"
        });
        res.status(403).json(response.close());
        return;
    }

    // Parse query 
    let queryOptions: TransactionQueryOptions = {};

    if (req.query.currency)
        queryOptions.currency = CurrencyCode[req.query.currency.toString()];

    if (req.query.minAmount)
        queryOptions.minAmount = parseInt(req.query.minAmount.toString());

    if (req.query.maxAmount)
        queryOptions.maxAmount = parseInt(req.query.maxAmount.toString());

    if (req.query.startDate)
        queryOptions.startDate = new Date(Date.parse(req.query.startDate.toString()));

    if (req.query.endDate)
        queryOptions.endDate = new Date(Date.parse(req.query.endDate.toString()));

    if (req.query.tag)
        queryOptions.tag = req.query.tag.toString();

    const transactionsOrError = await User.getTransactionsById(payloadID, queryOptions);

    if (transactionsOrError.isError()) {
        res.status(500).json(response.addError({
            code: "ERR_INTERNAL_ERROR",
            status: "500",
            title: "Internal server error",
            meta: {
                function: getUserTransactions.name // * Please do not change this to a constant string as we need it to be updated whenever names change
            },
            detail: "Internal server error. Please try again. Should the error occur repeatedly, report this to https://github.com/sungvzer/project-aurora/issues"
        }).close());
        return;
    }

    response.data = transactionsOrError.value.map<ResourceObject>((value) => {
        const id = value.id.toString();
        delete value.id;
        return {
            id: id,
            type: "UserTransaction",
            attributes: {
                ...value,
            },
        };
    });
    res.status(200).json(response.close());
    return;
};
