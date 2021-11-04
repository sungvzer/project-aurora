import { body, check, Result, ValidationError, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import User, { UserCredentials, UserDatabaseInsertModel, UserSettings } from '../models/User';
import CurrencyCode, { isCurrencyCode } from '../models/CurrencyCode';
import AuroraError from '../models/APIError';
import ErrorOr from '../models/ErrorOr';
import { verifyPassword } from '../utils/argon';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

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
    }

    res.status(200).json({
        "error": false,
        "message": "User signed up correctly",
    });
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

    const accessToken = generateAccessToken({ userHeaderID: userIDOrError.value });
    const refreshToken = generateRefreshToken({ userHeaderID: userIDOrError.value });

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
