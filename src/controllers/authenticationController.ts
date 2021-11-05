import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { generateTokenPair } from '../utils/jwt';
import { getRedisConnection } from './databaseController';

export const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        res.status(401).json({ "error": true, "message": "Missing Authorization header" });
        return;
    }

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
    const oldRefreshToken = req.body.token;
    if (!oldRefreshToken) {
        res.status(401).json({ "error": true, "message": "No refresh token provided" });
        return;
    }

    const redis = await getRedisConnection();
    const result = await redis.get(oldRefreshToken);

    if (result) {
        res.status(403).json({ "error": true, "message": "Invalid refresh token" });
        return;
    }

    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET, async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
        if (err) {
            res.status(403).json({ "error": true, "message": "Invalid refresh token" });
            return;
        }
        await redis.set(oldRefreshToken, '0');
        const { accessToken, refreshToken } = generateTokenPair({ 'userHeaderID': payload['userHeaderID'] });
        res.status(200).json({ "error": false, "accessToken": accessToken, "refreshToken": refreshToken });
    });
};
