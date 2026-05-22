import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

// RESEND_API_KEY is treated as soft-required: if missing, the server still
// boots so the storefront and admin work normally — only the forgot-password
// flow fails. The production warning lives in server.js; we don't duplicate
// it in dev where running without Resend is common and intentional.

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || 'aurum2024',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
};
