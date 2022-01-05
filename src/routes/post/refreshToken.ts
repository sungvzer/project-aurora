import { cookie, validationResult } from 'express-validator';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as commonErrors from '../../utils/errors';
import { Request, Response } from 'express';
import { getRedisConnection } from '../../utils/databases';
import * as jwt from 'jsonwebtoken';
import { generateTokenPair } from '../../utils/jwt';
import { millisecondsInADay } from '../../utils/time';

export const regenerateToken = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');
    /**
     * Empty Check
     */

    await cookie('RefreshToken', commonErrors.noRefreshToken).notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(response.addError(errors.array()[0].msg).close());
        return;
    }

    const oldRefreshToken = req.cookies['RefreshToken'];

    const redis = await getRedisConnection();
    const result = await redis.get(oldRefreshToken);

    if (!result) {
        res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
        return;
    }

    jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET,
        async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
            if (err) {
                res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
                return;
            }

            // Remove old token from list of valid tokens
            await redis.del(oldRefreshToken);
            const { accessToken, refreshToken } = generateTokenPair({
                userHeaderID: payload['userHeaderID'],
            });
            await redis.set(refreshToken, '1');
            response.data = {
                id: payload['userHeaderID'],
                type: 'AuthTokenPair',
                attributes: {
                    accessToken,
                    refreshToken,
                },
            };

            res.cookie('AccessToken', accessToken, {
                httpOnly: true,
                expires: new Date(Date.now() + millisecondsInADay),
            })
                .cookie('RefreshToken', refreshToken, {
                    expires: new Date(Date.now() + millisecondsInADay * 7),
                    httpOnly: true,
                })
                .status(200)
                .json(response.close());
        },
    );
};
