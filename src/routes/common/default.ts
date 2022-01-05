import { Request, Response } from 'express';
import { SingleResourceResponse } from '../../utils/jsonAPI';

export const defaultError = (req: Request, res: Response): void => {
    let response = new SingleResourceResponse('error');
    response.addError({
        code: 'ERR_NOT_FOUND',
        detail: 'Cannot ' + req.method + ' ' + req.originalUrl,
        title: 'Not found',
        status: '404',
    });
    res.status(404).json(response.close());
};
