import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { generateTokenPair } from '../utils/jwt';
import { getRedisConnection } from './databaseController';
import { check, header, Result, ValidationError, validationResult } from 'express-validator';

export const requireAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    await header("Authorization", "Missing Authorization header").notEmpty().run(req);
    const error: Result<ValidationError> = validationResult(req);

    if (!error.isEmpty()) {
        res.status(400).json({ "error": true, "message": error.array()[0].msg });
        return;
    }

    const authHeader = req.headers["authorization"];

    const [bearer, token] = authHeader.split(' ');
    if (!bearer || bearer.toLowerCase() != 'bearer' || !token) {
        return res.status(401).json({ "error": true, "message": "Invalid authorization token" });

    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ "error": true, "message": err.message });
        }
        req["decodedJWTPayload"] = payload;
        next();
    });
};

export const regenerateToken = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Check
     */
    await check("refreshToken", "No refresh token provided").notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ "error": true, "message": errors.array()[0].msg });
        return;
    }

    const oldRefreshToken = req.body.token;

    const redis = await getRedisConnection();
    const result = await redis.get(oldRefreshToken);

    if (!result) {
        res.status(403).json({ "error": true, "message": "Invalid refresh token" });
        return;
    }

    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET, async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
        if (err) {
            res.status(403).json({ "error": true, "message": "Invalid refresh token" });
            return;
        }

        // Remove old token from list of valid tokens
        await redis.del(oldRefreshToken);
        const { accessToken, refreshToken } = generateTokenPair({ 'userHeaderID': payload['userHeaderID'] });
        await redis.set(refreshToken, '1');
        res.status(200).json({ "error": false, "accessToken": accessToken, "refreshToken": refreshToken });
    });
};
