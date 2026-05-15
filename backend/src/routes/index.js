import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import uploadRoutes from './upload.routes.js';
import settingRoutes from './setting.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingRoutes);
router.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
export default router;
