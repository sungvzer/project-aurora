import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { getRedisConnection } from './databaseController';

export const regenerateToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.body.token;
    if (!refreshToken) {
        res.status(401).json({ "error": true, "message": "No refresh token provided" });
        return;
    }

    const redis = await getRedisConnection();
    const result = await redis.get(refreshToken);

    if (result) {
        res.status(403).json({ "error": true, "message": "Invalid refresh token" });
        return;
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
        if (err) {
            res.status(403).json({ "error": true, "message": "Invalid refresh token" });
            return;
        }
        await redis.set(refreshToken, '0');
        const accessToken = generateAccessToken({ 'userHeaderID': payload['userHeaderID'] });
        const newRefreshToken = generateRefreshToken({ 'userHeaderID': payload['userHeaderID'] });
        res.status(200).json({ "error": false, "accessToken": accessToken, "refreshToken": newRefreshToken });
    });
};
