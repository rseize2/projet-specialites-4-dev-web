import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/me', requireAuth, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.patch('/me', requireAuth, (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

export default router;
