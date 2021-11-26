import { body, check, query, Result, ValidationError, validationResult } from 'express-validator';
import validator from 'validator';
import { Request, Response } from 'express';
import User, { TransactionQueryOptions, UserCredentials, UserDatabaseInsertModel, UserSettings } from '../models/User';
import CurrencyCode, { isCurrencyCode } from '../models/CurrencyCode';
import ErrorOr from '../models/ErrorOr';
import { verifyPassword } from '../utils/argon';
import { generateTokenPair } from '../utils/jwt';
import { getRedisConnection } from './databaseController';
import assert from 'node:assert';
import * as jwt from 'jsonwebtoken';
import { MultipleResourcesResponse, ResourceObject, SingleResourceResponse } from '../utils/jsonAPI';
import { blankBirthdayError, blankCurrencyCodeError, blankEmailError, blankFirstNameError, blankLastNameError, blankPasswordError, invalidAmountError, invalidCurrencyCodeError, invalidDateError, invalidEmailError, invalidRefreshToken, noRefreshTokenError, wrongCredentials } from '../utils/errors';
import { jwtObjectHas, jwtObjectValidateEmail, jwtObjectSanitizeEmail } from '../utils/customValidators';

export const postSignup = async (req: Request, res: Response): Promise<void> => {
    let response: SingleResourceResponse = new SingleResourceResponse("data");
    /**
     * Empty Checks
     */
    await check("data", blankEmailError).custom(jwtObjectHas("email")).run(req);
    await check("data", blankPasswordError).custom(jwtObjectHas("password")).run(req);
    await check("data", blankFirstNameError).custom(jwtObjectHas("firstName")).run(req);
    await check("data", blankLastNameError).custom(jwtObjectHas("lastName")).run(req);
    await check("data", blankBirthdayError).custom(jwtObjectHas("birthday")).run(req);
    await check("data", blankCurrencyCodeError).custom(jwtObjectHas("currency")).run(req);

    /**
     * Validity Checks
     */
    await check("data", invalidCurrencyCodeError).custom((input) => {
        return isCurrencyCode(input["attributes"]["currency"]);
    }).run(req);
    await check("data", invalidEmailError).custom(jwtObjectValidateEmail).run(req);
    await check("data", invalidDateError).custom((input, _) => {
        return validator.isDate(input["attributes"]["birthday"], { format: "YYYY-MM-DD" });
    }).run(req);

    /**
     * Body sanitization
     */
    await body("data").customSanitizer(jwtObjectSanitizeEmail).run(req);


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
        plainTextPassword
    };

    const errorOrID = await User.create(userModel);
    if (errorOrID.isError()) {
        response.addError(errorOrID.error);
        res.status(400).json(response.close());
        return;
    }
    else {
        assert(errorOrID.hasValue());
    }

    delete userModel.plainTextPassword;
    response.data = { id: errorOrID.value.toString(), type: "user", attributes: { ...userModel } };

    res.status(201).json(response.close());
    return;
};

export const postLogout = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Check
     */
    let response = new SingleResourceResponse("data");
    await check("refreshToken", noRefreshTokenError).notEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const { msg: error } = errors.array()[0];
        response.addError(error);
        res.status(400).json(response.close());
        return;
    }

    const accessPayload = req["decodedJWTPayload"];
    // We assert because the authentication middleware shold handle this for us
    assert(accessPayload);

    const refreshToken = req.body.refreshToken;
    let refreshPayload: any;
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
        assert(!err); // Same reason for the assertion as of above: the authentication middleware shold handle this for us
        refreshPayload = payload;
    });

    if (!accessPayload["userHeaderID"] || !refreshPayload["userHeaderID"]) {
        res.status(403).json(response.addError(invalidRefreshToken).close());
        return;
    }

    if (accessPayload["userHeaderID"] != refreshPayload["userHeaderID"]) {
        res.status(403).json(response.addError(invalidRefreshToken).close());
        return;
    }

    const redis = await getRedisConnection();
    const queryResult = await redis.get(refreshToken);
    if (!queryResult) {
        res.status(403).json(response.addError(invalidRefreshToken).close());
        return;
    }
    await redis.del(refreshToken);
    response.meta = { "message": "User logged out successfully" };
    res.status(200).json(response.close());
    return;
};

export const postLogin = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    /**
     * Empty Checks
     */
    await check("data", blankEmailError).custom(jwtObjectHas("email")).run(req);
    await check("data", blankPasswordError).custom(jwtObjectHas("password")).run(req);

    /**
     * Validity Checks
     */
    await check("data", invalidEmailError).custom(jwtObjectValidateEmail).run(req);

    /**
     * Body sanitization
     */
    await body("data").customSanitizer(jwtObjectSanitizeEmail).run(req);

    /**
     * Error handling
     */
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        for (const { msg: error } of errors.array()) {
            response.addError(error);
        }
        res.status(400).json(response.close());
        return;
    }

    const email = req.body.data.attributes.email;
    const plainTextPassword = req.body.data.attributes.password;
    const credentialsOrError: ErrorOr<UserCredentials> = await User.getCredentialsByEmail(email);
    const userIDOrError: ErrorOr<number> = await User.getUserIdByEmail(email);
    if (credentialsOrError.isError() || userIDOrError.isError()) {
        if (credentialsOrError.isError()) {
            response.addError(credentialsOrError.error);
        }
        if (userIDOrError.isError()) {
            response.addError(userIDOrError.error);
        }
        res.status(404).json(response.close());
        return;
    }

    const accessGranted: boolean = await verifyPassword(plainTextPassword, credentialsOrError.value.passwordHash);
    if (!accessGranted) {
        response.addError(wrongCredentials);
        res.status(401).json(response.close());
        return;
    }

    const { accessToken, refreshToken } = generateTokenPair({ userHeaderID: userIDOrError.value });
    const redis = await getRedisConnection();
    await redis.set(refreshToken, '1');

    response.data = {
        id: userIDOrError.value.toString(),
        type: "Credentials",
        attributes: {
            accessToken, refreshToken
        }
    };

    res.status(200).json(response.close());
    return;
};

export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    const userId = parseInt(req.params.id);
    if (!userId) {
        res.status(400).json(response.addError({
            code: "ERR_INVALID_USER_ID",
            detail: "An empty or invalid id parameter was provided",
            status: "400",
            title: "Invalid User ID"
        }).close());
        return;
    }

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
        res.status(403).json(response.addError({
            code: "ERR_AUTH_MISMATCH",
            detail: `Cannot get settings for user ${userId} as authentication header refers to a different user.`,
            status: "403",
            title: "Authentication mismatch"
        }).close());
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

export const getUserTransactions = async (req: Request, res: Response) => {
    let response = new MultipleResourcesResponse("data");
    await query("minAmount", { ...invalidAmountError, source: { parameter: "minAmount" } }).optional().isInt().run(req);
    await query("maxAmount", { ...invalidAmountError, source: { parameter: "maxAmount" } }).optional().isInt().run(req);
    await query("startDate", { ...invalidDateError, source: { parameter: "startDate" } }).optional().isDate({ format: 'YYYY-MM-DD' }).run(req);
    await query("endDate", { ...invalidDateError, source: { parameter: "endDate" } }).optional().isDate({ format: 'YYYY-MM-DD' }).run(req);

    await query("currency", invalidCurrencyCodeError).optional().custom((input) => {
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

    const userId = req["decodedJWTPayload"]["userHeaderID"];
    assert(userId);

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

    const transactionsOrError = await User.getTransactionsById(userId, queryOptions);

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
