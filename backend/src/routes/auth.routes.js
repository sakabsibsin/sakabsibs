import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
export default router;
