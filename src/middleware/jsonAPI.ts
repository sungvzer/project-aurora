import { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { isValidResourceObject } from '../utils/customValidators';
import * as err from '../utils/errors';
import { SingleResourceResponse } from '../utils/jsonAPI';

export const verifyJsonApiRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    await check('data', err.blankDataField).notEmpty().run(req);
    await check('data', err.invalidRequestBody).custom(isValidResourceObject).run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const response = new SingleResourceResponse('error');
        for (const { msg } of errors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }

    next();
};
