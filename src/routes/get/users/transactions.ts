import assert from 'node:assert';
import User, { TransactionQueryOptions } from '../../../models/User';
import {
    GenericResponse,
    MultipleResourcesResponse,
    ResourceObject,
    SingleResourceResponse,
} from '../../../utils/jsonAPI';
import * as err from '../../../utils/errors';
import { Request, Response } from 'express';
import { query, Result, ValidationError, validationResult } from 'express-validator';
import CurrencyCode, { isCurrencyCode } from '../../../models/CurrencyCode';

export const getUserTransactions = async (req: Request, res: Response) => {
    let response: GenericResponse;
    await query('minAmount', {
        ...err.invalidAmount,
        source: { parameter: 'minAmount' },
    })
        .optional()
        .isInt()
        .run(req);
    await query('maxAmount', {
        ...err.invalidAmount,
        source: { parameter: 'maxAmount' },
    })
        .optional()
        .isInt()
        .run(req);
    await query('startDate', {
        ...err.invalidDate,
        source: { parameter: 'startDate' },
    })
        .optional()
        .isDate({ format: 'YYYY-MM-DD' })
        .run(req);
    await query('endDate', {
        ...err.invalidDate,
        source: { parameter: 'endDate' },
    })
        .optional()
        .isDate({ format: 'YYYY-MM-DD' })
        .run(req);

    await query('currency', err.invalidCurrencyCode)
        .optional()
        .custom((input) => {
            return isCurrencyCode(input);
        })
        .run(req);

    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        for (const { msg } of errors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }

    const payloadID = req['decodedJWTPayload']['userHeaderID'];
    const userID = parseInt(req.params.id);
    assert(payloadID);
    if (userID !== payloadID) {
        response = new SingleResourceResponse('error');
        response.addError({
            code: 'ERR_AUTH_MISMATCH',
            detail: `Cannot get transactions for user ${userID} as authentication header refers to a different user.`,
            status: '403',
            title: 'Authentication mismatch',
        });
        res.status(403).json(response.close());
        return;
    }

    // Parse query
    const queryOptions: TransactionQueryOptions = {};

    if (req.query.currency) queryOptions.currency = CurrencyCode[req.query.currency.toString()];

    if (req.query.minAmount) queryOptions.minAmount = parseInt(req.query.minAmount.toString());

    if (req.query.maxAmount) queryOptions.maxAmount = parseInt(req.query.maxAmount.toString());

    if (req.query.startDate)
        queryOptions.startDate = new Date(Date.parse(req.query.startDate.toString()));

    if (req.query.endDate)
        queryOptions.endDate = new Date(Date.parse(req.query.endDate.toString()));

    if (req.query.tag) queryOptions.tag = req.query.tag.toString();
    if (!req.params.trId) {
        response = new MultipleResourcesResponse('data');

        const transactionsOrError = await User.getTransactionsByUserId(payloadID, queryOptions);
        if (transactionsOrError.isError()) {
            res.status(500).json(
                response
                    .addError({
                        ...err.internal,
                        meta: {
                            function: getUserTransactions.name, // * Please do not change this to a constant string as we need it to be updated whenever names change
                        },
                    })
                    .close(),
            );
            return;
        }

        response.data = transactionsOrError.value.map<ResourceObject>((value) => {
            const id = value.id.toString();
            delete value.id;
            return {
                id: id,
                type: 'UserTransaction',
                attributes: {
                    ...value,
                },
            };
        });
    } else {
        response = new SingleResourceResponse('data');

        const transactionOrError = await User.getTransactionById(parseInt(req.params.trId));
        if (transactionOrError.isError()) {
            if (transactionOrError.error.status === '404') {
                response.addError(transactionOrError.error);
                res.status(404).json(transactionOrError.error);
                return;
            }

            res.status(500).json(
                response
                    .addError({
                        ...err.internal,
                        meta: {
                            function: getUserTransactions.name, // * Please do not change this to a constant string as we need it to be updated whenever names change
                        },
                    })
                    .close(),
            );
            return;
        }
        response.data = {
            id: req.params.trId,
            type: 'UserTransaction',
            attributes: { ...transactionOrError.value },
        };
    }
    res.status(200).json(response.close());
    return;
};
