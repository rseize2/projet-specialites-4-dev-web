import { Router } from 'express';
import { requireAuth, requireAdmin, require2FA } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createUserSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
} from '../schemas/admin.schema';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.use(requireAuth, require2FA, requireAdmin);

router.get('/users', validate(listUsersQuerySchema, 'query'), adminController.listUsers);
router.post('/users', validate(createUserSchema), adminController.createUser);

router.patch(
  '/users/:id/block',
  validate(userIdParamsSchema, 'params'),
  adminController.blockUser,
);
router.patch(
  '/users/:id/unblock',
  validate(userIdParamsSchema, 'params'),
  adminController.unblockUser,
);
router.delete(
  '/users/:id',
  validate(userIdParamsSchema, 'params'),
  adminController.deleteUser,
);

export default router;
