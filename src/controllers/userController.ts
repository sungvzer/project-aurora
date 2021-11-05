import { body, check, Result, ValidationError, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import User, { UserCredentials, UserDatabaseInsertModel, UserSettings } from '../models/User';
import CurrencyCode, { isCurrencyCode } from '../models/CurrencyCode';
import AuroraError from '../models/APIError';
import ErrorOr from '../models/ErrorOr';
import { verifyPassword } from '../utils/argon';
import { generateTokenPair } from '../utils/jwt';
import { getRedisConnection } from './databaseController';
import assert from 'node:assert';
import * as jwt from 'jsonwebtoken';

export const postSignup = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Checks
     */
    await check("email", "Email should not be blank").notEmpty().run(req);
    await check("password", "Password should not be blank").notEmpty().run(req);
    await check("firstName", "First name should not be blank").notEmpty().run(req);
    await check("lastName", "Last name should not be blank").notEmpty().run(req);
    await check("birthday", "Birthday should not be blank").notEmpty().run(req);
    await check("currency", "Currency code should not be blank").notEmpty().run(req);

    /**
     * Validity Checks
     */
    await check("currency", "Currency code is not valid").custom((input) => {
        return isCurrencyCode(input);
    }).run(req);
    await check("email", "Email is not valid").isEmail().run(req);
    await check("birthday", "Birthday should be a valid ISO date").isDate({ format: "YYYY-MM-DD" }).run(req);

    /**
     * Body sanitization
     */
    await body("email").normalizeEmail({ gmail_remove_dots: false, all_lowercase: true }).run(req);


    const errors: Result<ValidationError> = validationResult(req);
    const errorMessages: string[] = [];
    if (!errors.isEmpty()) {
        for (const { msg } of errors.array()) {
            errorMessages.push(msg);
        }
        res.status(400).json({ "error": true, "message": errorMessages });
        return;
    }

    const email = req.body.email;
    const plainTextPassword = req.body.password;
    const lastName = req.body.lastName;
    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const currencyCode = CurrencyCode[req.body.currency];
    const birthday = req.body.birthday;


    const userModel: UserDatabaseInsertModel = {
        birthday: new Date(Date.parse(birthday)),
        currencyCode,
        email,
        firstName,
        middleName,
        lastName,
        plainTextPassword
    };

    const errorOrSuccess: AuroraError = await User.create(userModel);
    if (errorOrSuccess.error) {
        res.status(400).json({
            ...errorOrSuccess
        });
        return;
    }

    res.status(200).json({
        "error": false,
        "message": "User signed up correctly",
    });
    return;
};

export const postLogout = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Check
     */
    await check("refreshToken", "No refresh token provided").notEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ "error": true, "message": errors.array()[0].msg });
        return;
    }

    const accessPayload = req["decodedJWTPayload"];
    // We assert because the authentication middleware shold handle this for us
    assert(accessPayload);

    const refreshToken = req.body.refreshToken;
    let refreshPayload: any;
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
        assert(!err); // Same reason for the assertion as of above
        refreshPayload = payload;
    });

    if (!accessPayload["userHeaderID"] || !refreshPayload["userHeaderID"]) {
        res.status(403).json({ "error": true, "message": "Invalid access or refresh token(s)" });
        return;
    }

    if (accessPayload["userHeaderID"] != refreshPayload["userHeaderID"]) {
        res.status(403).json({ "error": true, "message": "Tokens refer to different users" });
        return;
    }

    const redis = await getRedisConnection();
    const queryResult = await redis.get(refreshToken);
    if (!queryResult) {
        res.status(404).json({ "error": true, "message": `Refresh token doesn't belong to any session` });
        return;
    }
    await redis.del(refreshToken);
    res.status(200).json({ "error": false, "message": "User logged out successfully" });
    return;
};

export const postLogin = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Checks
     */
    await check("email", "Email should not be blank").notEmpty().run(req);
    await check("password", "Password should not be blank").notEmpty().run(req);

    /**
     * Validity Checks
     */
    await check("email", "Email is not valid").isEmail().run(req);

    /**
     * Body sanitization
     */
    await body("email").normalizeEmail({ gmail_remove_dots: false, all_lowercase: true }).run(req);

    /**
     * Error handling
     */
    const errors: Result<ValidationError> = validationResult(req);
    const errorMessages: string[] = [];
    if (!errors.isEmpty()) {
        for (const { msg } of errors.array()) {
            errorMessages.push(msg);
        }
        res.status(400).json({ "error": true, "message": errorMessages });
        return;
    }

    const email = req.body.email;
    const plainTextPassword = req.body.password;
    const credentialsOrError: ErrorOr<UserCredentials> = await User.getCredentialsByEmail(email);
    const userIDOrError: ErrorOr<number> = await User.getUserIdByEmail(email);
    if (credentialsOrError.isError() || userIDOrError.isError()) {
        res.status(404).json({ "error": true, "message": credentialsOrError.message });
        return;
    }

    const accessGranted: boolean = await verifyPassword(plainTextPassword, credentialsOrError.value.passwordHash);

    if (!accessGranted) {
        res.status(401).json({ "error": true, "message": "Wrong password" });
        return;
    }

    const { accessToken, refreshToken } = generateTokenPair({ userHeaderID: userIDOrError.value });
    const redis = await getRedisConnection();
    await redis.set(refreshToken, '1');

    res.status(200).json({
        "error": false, "accessToken": accessToken, "refreshToken": refreshToken
    });
    return;
};

// TODO: Return currency code and not id
export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        res.status(400).json({ "error": true, "message": "No valid ID provided" });
        return;
    }

    const jwtUserHeaderId = req["decodedJWTPayload"]["userHeaderID"];
    if (!jwtUserHeaderId) {
        res.status(500).json({ "error": true, "message": "There's been an internal error. Please login again." });
        return;
    }

    if (userId != jwtUserHeaderId) {
        res.status(403).json({ "error": true, "message": `Cannot GET settings for user ${userId}. Authenticated user is ${jwtUserHeaderId}` });
        return;

    }

    const settingsOrError: ErrorOr<UserSettings> = await User.getSettingsById(userId);
    if (settingsOrError.isError()) {
        res.status(404).json({ "error": true, "message": settingsOrError.message });
        return;
    }

    res.status(200).json({ "error": false, "settings": settingsOrError.value });
};
