import { Request, Response } from 'express';
import * as routes from 'get-routes';

export const getRoutes = async (req: Request, res: Response): Promise<void> => {

    res.status(200).json({ "error": false, "routes": routes.getRoutes(req.app) });
};
