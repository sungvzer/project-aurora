import { Request, Response } from 'express';
import { check, param, Result, ValidationError, validationResult } from 'express-validator';
import { getDatabaseConnection } from '../../../utils/databases';
import { resourceObjectHas, dataIsArray, dataHas } from '../../../utils/customValidators';
import { ResourceObject, SingleResourceResponse } from '../../../utils/jsonAPI';
import * as err from '../../../utils/errors';
import validator from 'validator';
import { isCurrencyCode } from '../../../models/CurrencyCode';
import { ResultSetHeader } from 'mysql2';
import User from '../../../models/User';

export const patchUserTransaction = async (req: Request, res: Response): Promise<Response> => {
    let response = new SingleResourceResponse('data');
    let transactionID: number, userId: number;
    await check('data', err.invalidRequestBody).not().custom(dataIsArray).run(req);
    await check('data', err.unsupportedIdInRequest).not().custom(dataHas('id')).run(req);
    await param('trId', err.invalidTransactionId)
        .isInt({ allow_leading_zeroes: false, gt: 0 })
        .run(req);

    await check('data', err.invalidAmount)
        .custom((input) => {
            if (!input['attributes']['amount']) {
                return true;
            }
            if (typeof input['attributes']['amount'] !== 'number') {
                return false;
            }
            return validator.isInt(input['attributes']['amount'].toString(), {
                allow_leading_zeroes: false,
            });
        })
        .run(req);

    await check('data', err.invalidDate)
        .custom((input) => {
            if (!input['attributes']['date']) {
                return true;
            }
            return validator.isDate(input['attributes']['date'], {
                format: 'YYYY-MM-DD',
            });
        })
        .run(req);

    await check('data', err.invalidCurrencyCode)
        .custom((input) => {
            if (!input['attributes']['currency']) {
                return true;
            }
            return isCurrencyCode(input['attributes']['currency']);
        })
        .run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }
        return res.status(400).json(response.close());
    }

    transactionID = parseInt(req.params.trId);

    userId = parseInt(req.params.id);
    if (req['decodedJWTPayload']['userHeaderID'] !== userId) {
        return res.status(403).json(response.addError(err.userIdMismatch).close());
    }

    let transactionOrError = await User.getTransactionById(transactionID);
    if (transactionOrError.isError()) {
        return res.status(400).json(response.addError(transactionOrError.error).close());
    }

    let resource: ResourceObject = req.body.data;

    const currency = resource.attributes.currency;
    const date = resource.attributes.date;
    const amount = resource.attributes.amount;
    const tag = resource.attributes.tag;

    if (!currency && !date && !tag && !amount) {
        res.status(204).send();
        return;
    }

    let sql = 'UPDATE `aurora`.`Transaction` SET';
    let params = [];
    let firstParameter = true;

    if (currency) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql +=
            ' UserTransactionCurrencyID = (SELECT CurrencyID FROM Currency WHERE CurrencyCode = ?) ';
        params.push(currency);
    }
    if (date) {
        let str = '';
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' UserTransactionDate = ? ';
        if (date instanceof Date) {
            str = date.toISOString().substring(0, 10);
        } else {
            str = date;
        }
        params.push(date);
    }
    if (amount) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' UserTransactionAmount = ? ';
        params.push(amount);
    }
    if (tag) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' UserTransactionTag = ? ';
        params.push(tag);
    }

    sql += 'WHERE UserDataHeaderID = ?;';
    params.push(userId);

    const connection = await getDatabaseConnection();
    const [result] = await connection.execute<ResultSetHeader>(sql, params);

    response.data = {
        id: transactionID.toString(),
        type: 'UserTransaction',
        attributes: {
            amount: amount ? amount : transactionOrError.value.amount,
            currency: currency ? currency : transactionOrError.value.currency,
            date: date ? date : transactionOrError.value.date,
            tag: tag ? tag : transactionOrError.value.tag,
        },
    };

    return res
        .status(201)
        .header('Location', `/users/${userId}/transactions/${transactionID}`)
        .json(response.close());
};
