import { Request, Response } from 'express';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import { getDatabaseConnection } from '../../../utils/databases';
import { dataIsArray, dataHas } from '../../../utils/customValidators';
import { ResourceObject, SingleResourceResponse } from '../../../utils/jsonAPI';
import * as err from '../../../utils/errors';
import validator from 'validator';
import { isCurrencyCode } from '../../../models/CurrencyCode';
import { ResultSetHeader } from 'mysql2';
import User from '../../../models/User';

export const patchUserSettings = async (req: Request, res: Response): Promise<Response> => {
    let response = new SingleResourceResponse('data');
    let userId: number;
    await check('data', err.invalidRequestBody).not().custom(dataIsArray).run(req);
    await check('data', err.unsupportedIdInRequest).not().custom(dataHas('id')).run(req);

    await check('data', err.invalidCurrencyCode)
        .custom((input) => {
            if (!input['attributes']['currency']) {
                return true;
            }
            return isCurrencyCode(input['attributes']['currency']);
        })
        .run(req);

    await check('data', err.invalidDarkModeValue)
        .custom((input) => {
            let value = input['attributes']['darkMode'];
            if (!value) {
                return true;
            }
            if (typeof value !== 'number') {
                return false;
            }
            return validator.isInt(value.toString(), {
                allow_leading_zeroes: false,
                min: 0,
                max: 1,
            });
        })
        .run(req);

    await check('data', err.invalidAbbreviatedAmountValue)
        .custom((input) => {
            let value = input['attributes']['abbreviatedFormat'];
            if (!value) {
                return true;
            }
            if (typeof value !== 'number') {
                return false;
            }
            return validator.isInt(value.toString(), {
                allow_leading_zeroes: false,
                min: 0,
                max: 1,
            });
        })
        .run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }
        return res.status(400).json(response.close());
    }

    userId = parseInt(req.params.id);
    if (req['decodedJWTPayload']['userHeaderID'] !== userId) {
        return res.status(403).json(response.addError(err.userIdMismatch).close());
    }

    let settingsOrError = await User.getSettingsById(userId);
    if (settingsOrError.isError()) {
        return res.status(400).json(response.addError(settingsOrError.error).close());
    }

    let resource: ResourceObject = req.body.data;

    const darkMode = resource.attributes.darkMode;
    const abbreviatedFormat = resource.attributes.abbreviatedFormat;
    const currency = resource.attributes.currency;

    if (!currency && !darkMode && !abbreviatedFormat) {
        res.status(204).send();
        return;
    }

    let sql = 'UPDATE `aurora`.`UserSetting` SET';
    let params = [];
    let firstParameter = true;

    if (currency) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' UserCurrencyID = (SELECT CurrencyID FROM Currency WHERE CurrencyCode = ?) ';
        params.push(currency);
    }
    if (darkMode) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' DarkMode = ? ';
        params.push(darkMode);
    }
    if (abbreviatedFormat) {
        if (!firstParameter) {
            sql += ',';
        } else {
            firstParameter = false;
        }
        sql += ' AbbreviatedFormat = ? ';
        params.push(abbreviatedFormat);
    }

    sql += 'WHERE UserSettingID = ?;';
    params.push(userId);

    const connection = await getDatabaseConnection();
    const [result] = await connection.execute<ResultSetHeader>(sql, params);

    response.data = {
        id: userId.toString(),
        type: 'UserSettings',
        attributes: {
            darkMode: darkMode != null ? darkMode : settingsOrError.value.darkMode,
            currency: currency ? currency : settingsOrError.value.currency,
            abbreviatedFormat:
                abbreviatedFormat != null
                    ? abbreviatedFormat
                    : settingsOrError.value.abbreviatedFormat,
        },
    };

    return res.status(201).header('Location', `/users/${userId}/settings`).json(response.close());
};
