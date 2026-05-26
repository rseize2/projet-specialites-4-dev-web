import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
