import { Router } from 'express';
import { login, logout, me, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimit, forgotPasswordRateLimit } from '../middleware/rateLimit.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
// Public, unauthenticated. forgot-password is tightly rate-limited (email cost);
// reset-password is validated by token presence + expiry inside the controller.
router.post('/forgot-password', forgotPasswordRateLimit, forgotPassword);
router.post('/reset-password', resetPassword);
export default router;
