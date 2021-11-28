import { Router } from 'express';
import { requireAuthentication } from '../middleware/authentication';
import { deleteUser } from '../routes/delete/users';
import { getUserSettings } from '../routes/get/users/settings';
import { getUserTransactions } from '../routes/get/users/transactions';

const userRouter = Router();
userRouter.get('/:id/settings', requireAuthentication, getUserSettings);
userRouter.get('/:id/transactions', requireAuthentication, getUserTransactions);
userRouter.delete('/:id', requireAuthentication, deleteUser);

export default userRouter;
