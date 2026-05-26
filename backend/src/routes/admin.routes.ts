import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/users', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.post('/users', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.patch('/users/:id/block', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

router.patch('/users/:id/unblock', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
});

export default router;
