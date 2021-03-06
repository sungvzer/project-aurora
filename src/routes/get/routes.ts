import { SingleResourceResponse } from '../../utils/jsonAPI';
import { Request, Response } from 'express';
import * as routes from 'get-routes';

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
    const response = new SingleResourceResponse('data');
    response.data = {
        id: '0',
        type: 'Routes',
        attributes: {
            ...routes.getRoutes(req.app),
        },
    };
    res.status(200).json(response.close());
};
