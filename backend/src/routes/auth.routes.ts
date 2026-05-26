import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { loginSchema, registerSchema, verify2FASchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.post('/login', validate(loginSchema), (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.post('/logout', requireAuth, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.post('/2fa/enable', requireAuth, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.post('/2fa/verify', requireAuth, validate(verify2FASchema), (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

export default router;
