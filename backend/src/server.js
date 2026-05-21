import app from './app.js';
import { env } from './config/env.js';

// Production-only safety checks. env.js already hard-fails on missing required
// vars in any environment, so these only catch "deployed with dev defaults"
// cases that shouldn't appear in dev console at all.
if (env.NODE_ENV === 'production') {
  const warn = (msg) => console.warn(`⚠️  ${msg}`);
  const jwt = process.env.JWT_SECRET ?? '';
  if (['secret', 'your-secret', 'changeme', 'dev'].includes(jwt.toLowerCase())) {
    warn('WEAK JWT_SECRET — using an obvious default value');
  } else if (jwt.length < 32) {
    warn('SHORT JWT_SECRET — recommend at least 32 characters of entropy');
  }
  if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost')) {
    warn('FRONTEND_URL is not set to a production domain — CORS may be misconfigured');
  }
  if (process.env.ADMIN_DEFAULT_PASSWORD === 'aurum2024') {
    warn('ADMIN_DEFAULT_PASSWORD is still the seed default — change immediately via the Settings page');
  }
}

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});
