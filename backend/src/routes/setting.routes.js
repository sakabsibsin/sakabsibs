import { Router } from 'express';
import { listSettings, upsertSetting } from '../controllers/setting.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', listSettings);
router.put('/:key', requireAuth, upsertSetting);
export default router;
