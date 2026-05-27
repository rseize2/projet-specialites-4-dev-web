import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { loginSchema, registerSchema, verify2FASchema } from '../schemas/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);

router.post('/2fa/enable', requireAuth, authController.enable2FA);
router.post('/2fa/verify', requireAuth, validate(verify2FASchema), authController.verify2FA);
router.post('/2fa/disable', requireAuth, validate(verify2FASchema), authController.disable2FA);

export default router;
