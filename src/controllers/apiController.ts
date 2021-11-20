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
