import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { generateTokenPair } from '../utils/jwt';
import { getRedisConnection } from './databaseController';
import { check, header, Result, ValidationError, validationResult } from 'express-validator';
import { SingleResourceResponse } from '../utils/jsonAPI';
import { expiredAuthTokenError, genericJWTError, invalidAuthTokenError, invalidRefreshTokenError, missingAuthorizationError, noRefreshTokenError } from '../utils/errors';

export const getAccessTokenFromRequest = (req: Request): string => {
    const authHeader = req.headers["authorization"];
    const [bearer, token] = authHeader.split(' ');
    if (!bearer || bearer.toLowerCase() != 'bearer' || !token) {
        return null;
    }
    return token;
};
export const requireAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    let response = new SingleResourceResponse("data");
    await header("Authorization", missingAuthorizationError).notEmpty().run(req);
    const error: Result<ValidationError> = validationResult(req);

    if (!error.isEmpty()) {
        res.status(400).json(response.addError(error.array()[0].msg).close());
        return;
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
        return res.status(401).json(response.addError(invalidAuthTokenError).close());
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            if (err.message.indexOf('expired') != -1) {
                response.addError(expiredAuthTokenError);
                return res.status(403).json(response.close());
            }
            return res.status(403).json(response.addError(genericJWTError).close());
        }
        req["decodedJWTPayload"] = payload;
        next();
    });
};

export const regenerateToken = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    /**
     * Empty Check
     */
    await check("refreshToken", noRefreshTokenError).notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(response.addError(errors.array()[0].msg).close());
        return;
    }

    const oldRefreshToken = req.body.refreshToken;

    const redis = await getRedisConnection();
    const result = await redis.get(oldRefreshToken);

    if (!result) {
        res.status(403).json(response.addError(invalidRefreshTokenError).close());
        return;
    }

    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET, async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
        if (err) {
            res.status(403).json(response.addError(invalidRefreshTokenError).close());
            return;
        }

        // Remove old token from list of valid tokens
        await redis.del(oldRefreshToken);
        const { accessToken, refreshToken } = generateTokenPair({ 'userHeaderID': payload['userHeaderID'] });
        await redis.set(refreshToken, '1');
        response.data = {
            id: payload['userHeaderID'],
            type: "AuthTokenPair",
            attributes: {
                accessToken,
                refreshToken
            }
        };
        res.status(200).json(response.close());
    });
};
