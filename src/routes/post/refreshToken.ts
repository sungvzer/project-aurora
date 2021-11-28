import { check, validationResult } from 'express-validator';
import { resourceObjectHas } from '../../utils/customValidators';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as commonErrors from '../../utils/errors';
import { Request, Response } from 'express';
import { getRedisConnection } from '../../utils/databases';
import * as jwt from 'jsonwebtoken';
import { generateTokenPair } from '../../utils/jwt';

export const regenerateToken = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    /**
     * Empty Check
     */
    await check("data", commonErrors.noRefreshToken).custom(resourceObjectHas("refreshToken")).run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(response.addError(errors.array()[0].msg).close());
        return;
    }

    const oldRefreshToken = req.body.data.attributes.refreshToken;

    const redis = await getRedisConnection();
    const result = await redis.get(oldRefreshToken);

    if (!result) {
        res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
        return;
    }

    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET, async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
        if (err) {
            res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
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
