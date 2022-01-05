import { check, body, Result, ValidationError, validationResult } from 'express-validator';
import validator from 'validator';
import CurrencyCode, { isCurrencyCode } from '../../models/CurrencyCode';
import User, { UserDatabaseInsertModel } from '../../models/User';
import {
    resourceObjectHas,
    resourceObjectValidateEmail,
    resourceObjectSanitizeEmail,
} from '../../utils/customValidators';
import { SingleResourceResponse, ResourceObject } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import { Request, Response } from 'express';
import assert from 'node:assert';

export const postSignup = async (req: Request, res: Response): Promise<void> => {
    let response: SingleResourceResponse = new SingleResourceResponse('data');
    /**
     * Empty Checks
     */
    await check('data', err.blankEmail).custom(resourceObjectHas('email')).run(req);
    await check('data', err.blankPassword).custom(resourceObjectHas('password')).run(req);
    await check('data', err.blankFirstName).custom(resourceObjectHas('firstName')).run(req);
    await check('data', err.blankLastName).custom(resourceObjectHas('lastName')).run(req);
    await check('data', err.blankBirthday).custom(resourceObjectHas('birthday')).run(req);
    await check('data', err.blankCurrencyCode).custom(resourceObjectHas('currency')).run(req);

    /**
     * Validity Checks
     */
    await check('data', err.invalidCurrencyCode)
        .custom((input) => {
            return isCurrencyCode(input['attributes']['currency']);
        })
        .run(req);
    await check('data', err.invalidEmail).custom(resourceObjectValidateEmail).run(req);
    await check('data', err.invalidDate)
        .custom((input, _) => {
            return validator.isDate(input['attributes']['birthday'], {
                format: 'YYYY-MM-DD',
            });
        })
        .run(req);

    /**
     * Body sanitization
     */
    await body('data').customSanitizer(resourceObjectSanitizeEmail).run(req);

    const validationErrors: Result<ValidationError> = validationResult(req);
    if (!validationErrors.isEmpty()) {
        for (const { msg } of validationErrors.array()) {
            response.addError(msg);
        }

        res.status(400).json(response.close());
        return;
    }

    let resource: ResourceObject = req.body.data;

    const email = resource.attributes.email;
    const plainTextPassword = resource.attributes.password;
    const lastName = resource.attributes.lastName;
    const firstName = resource.attributes.firstName;
    const middleName = resource.attributes.middleName;
    const currencyCode = CurrencyCode[resource.attributes.currency];
    const birthday = resource.attributes.birthday;

    const userModel: UserDatabaseInsertModel = {
        birthday: new Date(Date.parse(birthday)),
        currencyCode,
        email,
        firstName,
        middleName,
        lastName,
        plainTextPassword,
    };

    const errorOrID = await User.create(userModel);
    if (errorOrID.isError()) {
        response.addError(errorOrID.error);
        res.status(400).json(response.close());
        return;
    } else {
        assert(errorOrID.hasValue());
    }

    delete userModel.plainTextPassword;
    response.data = {
        id: errorOrID.value.toString(),
        type: 'user',
        attributes: { ...userModel },
    };

    res.status(201).json(response.close());
    return;
};
