import { cookie, validationResult } from 'express-validator';
import { getRedisConnection } from '../../utils/databases';
import { SingleResourceResponse } from '../../utils/jsonAPI';
import * as err from '../../utils/errors';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import assert from 'node:assert';

export const postLogout = async (req: Request, res: Response): Promise<void> => {
    /**
     * Empty Check
     */
    const response = new SingleResourceResponse('data');
    await cookie('RefreshToken', err.noRefreshToken).notEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const { msg: error } = errors.array()[0];
        response.addError(error);
        res.status(400).json(response.close());
        return;
    }

    const accessPayload = req['decodedJWTPayload'];
    // We assert because the authentication middleware shold handle this for us
    assert(accessPayload);

    const refreshToken = req.cookies.RefreshToken;
    let refreshPayload: jwt.JwtPayload;
    jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        (err: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
            if (err) {
                console.error(err);
            }
            assert(!err); // Same reason for the assertion as of above: the authentication middleware shold handle this for us
            refreshPayload = payload;
        },
    );

    if (!accessPayload['userHeaderID'] || !refreshPayload['userHeaderID']) {
        res.status(403).json(response.addError(err.invalidRefreshToken).close());
        return;
    }

    if (accessPayload['userHeaderID'] != refreshPayload['userHeaderID']) {
        res.status(403).json(response.addError(err.invalidRefreshToken).close());
        return;
    }

    const redis = await getRedisConnection();
    const queryResult = await redis.get(
        accessPayload['userHeaderID'].toString() + '-' + refreshToken,
    );
    if (!queryResult) {
        res.status(403).json(response.addError(err.invalidRefreshToken).close());
        return;
    }
    await redis.del(accessPayload['userHeaderID'].toString() + '-' + refreshToken);
    response.meta = { message: 'User logged out successfully' };
    res.clearCookie('AccessToken').clearCookie('RefreshToken');
    res.status(200).json(response.close());
    return;
};
