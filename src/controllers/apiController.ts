import { Request, Response } from 'express';
import * as routes from 'get-routes';
import { SingleResourceResponse } from '../utils/jsonAPI';

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse("data");
    response.data = {
        id: "0",
        type: "Routes",
        attributes: {
            ...routes.getRoutes(req.app)
        }
    };
    res.status(200).json(response.close());
};

export const defaultError = (req: Request, res: Response): void => {
    let response = new SingleResourceResponse("error");
    response.addError({
        code: "ERR_NOT_FOUND",
        detail: "Cannot " + req.method + " " + req.originalUrl,
        title: "Not found",
        status: "404"
    });
    res.status(404).json(response.close());
};
