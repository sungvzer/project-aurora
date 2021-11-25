import { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { blankDataFieldError, invalidRequestBody } from '../utils/errors';
import { SingleResourceResponse } from '../utils/jsonAPI';

export const verifyJsonApiRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await check("data", blankDataFieldError).notEmpty().run(req);
    await check("data", invalidRequestBody).custom((input, meta) => {
        const checkInput = (input: any): boolean => {
            const allowedResourceKeys = [
                'id', 'type', 'attributes', 'relationships', 'links', 'meta'
            ];

            if (!input["id"] && !input["type"]) {
                return false;
            }
            for (let prop in input) {
                prop = prop.toLowerCase();
                if (allowedResourceKeys.indexOf(prop) === -1) {
                    return false;
                }
            }
            return true;
        };

        if (Array.isArray(input)) {
            for (let member of input) {
                if (!checkInput(member)) {
                    return false;
                }
            }
        } else {
            if (!checkInput(input)) {
                return false;
            }
        }

        return true;

    }).run(req);

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let response = new SingleResourceResponse("error");
        for (let { msg } of errors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }

    next();
};
