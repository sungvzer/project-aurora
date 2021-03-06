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

    jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET,
        async (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
            if (err) {
                res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
                return;
            }
            const userId = payload['userHeaderID'].toString();
            const result = await redis.get(userId + '-' + oldRefreshToken);

            if (!result) {
                res.status(403).json(response.addError(commonErrors.invalidRefreshToken).close());
                return;
            }

            // Remove old token from list of valid tokens
            await redis.del(userId + '-' + oldRefreshToken);
            const { accessToken, refreshToken } = generateTokenPair({
                userHeaderID: parseInt(userId),
            });

            // Given we're talking about milliseconds, storing it once ensures consistency
            const refreshExpiryTimestamp = Date.now() + millisecondsInADay * 7;

            await redis.set(userId + '-' + refreshToken, '1', { PXAT: refreshExpiryTimestamp });

            response.meta = {
                userId: userId,
                message: 'Tokens updated',
            };

            res.cookie('AccessToken', accessToken, {
                httpOnly: true,
                expires: new Date(Date.now() + millisecondsInADay),
            })
                .cookie('RefreshToken', refreshToken, {
                    expires: new Date(refreshExpiryTimestamp),
                    httpOnly: true,
                })
                .status(200)
                .json(response.close());
        },
    );
};
