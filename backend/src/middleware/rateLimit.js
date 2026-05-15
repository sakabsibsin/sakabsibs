import rateLimit from 'express-rate-limit';

// General API rate limit — 300 requests per 5 min per IP
export const apiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limit for login — 10 attempts per 15 min per IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
