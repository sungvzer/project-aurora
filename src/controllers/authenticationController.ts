import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { header, Result, ValidationError, validationResult } from 'express-validator';
import { SingleResourceResponse } from '../utils/jsonAPI';
import * as commonErrors from '../utils/errors';
import { getAccessTokenFromRequest } from '../utils/jwt';

export const requireAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    let response = new SingleResourceResponse("data");
    await header("Authorization", commonErrors.missingAuthorization).notEmpty().run(req);
    const error: Result<ValidationError> = validationResult(req);

    if (!error.isEmpty()) {
        res.status(400).json(response.addError(error.array()[0].msg).close());
        return;
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
        return res.status(401).json(response.addError(commonErrors.invalidAuthToken).close());
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            if (err.message.indexOf('expired') != -1) {
                response.addError(commonErrors.expiredAuthToken);
                return res.status(403).json(response.close());
            }
            return res.status(403).json(response.addError(commonErrors.genericJWT).close());
        }
        req["decodedJWTPayload"] = payload;
        next();
    });
};
