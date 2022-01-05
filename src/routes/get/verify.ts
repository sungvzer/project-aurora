import { SingleResourceResponse } from '../../utils/jsonAPI';
import { Request, Response } from 'express';

export const getVerify = async (req: Request, res: Response): Promise<void> => {
    let response = new SingleResourceResponse('data');

    response.data = {
        id: req['decodedJWTPayload']['userHeaderID'],
        type: 'UserId',
        attributes: {
            userId: req['decodedJWTPayload']['userHeaderID'],
        },
    };
    res.status(200).json(response.close());
};
