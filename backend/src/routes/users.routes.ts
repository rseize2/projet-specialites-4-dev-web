import { Router } from 'express';
import { requireAuth, require2FA } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateMeSchema } from '../schemas/user.schema';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/me', requireAuth, require2FA, userController.getMe);
router.patch('/me', requireAuth, require2FA, validate(updateMeSchema), userController.updateMe);

export default router;
