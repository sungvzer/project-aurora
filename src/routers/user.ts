import { Router } from 'express';
import { param, Result, ValidationError, validationResult } from 'express-validator';
import { requireAuthentication } from '../middleware/authentication';
import { verifyJsonApiRequest } from '../middleware/jsonAPI';
import { deleteUser } from '../routes/delete/users';
import { getUserSettings } from '../routes/get/users/settings';
import { getUserTransactions } from '../routes/get/users/transactions';
import { postUserTransactions } from '../routes/post/users/transactions';
import { SingleResourceResponse } from '../utils/jsonAPI';
import * as err from '../utils/errors';
import User from '../models/User';
import { deleteUserTransaction } from '../routes/delete/users/transactions';

const userRouter = Router(); userRouter.use('/:id', async (req, res, next) => {
    let response = new SingleResourceResponse("error");
    await param("id", err.invalidUserId).notEmpty().isInt({ allow_leading_zeroes: false, gt: 0 }).run(req);
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
        for (const { msg } of errors.array()) {
            response.addError(msg);
        }
        res.status(400).json(response.close());
        return;
    }
    let userId = parseInt(req.params.id);
    if (!await User.exists(userId)) {
        response.addError(err.userNotFound);
        res.status(404).json(response.close());
        return;
    }
    next();
});

userRouter.get('/:id/settings', requireAuthentication, getUserSettings);
userRouter.get('/:id/transactions/:trId?', requireAuthentication, getUserTransactions);
userRouter.delete('/:id', requireAuthentication, deleteUser);
userRouter.post('/:id/transactions', verifyJsonApiRequest, requireAuthentication, postUserTransactions);
userRouter.delete('/:id/transactions/:trId', requireAuthentication, deleteUserTransaction);

export default userRouter;
