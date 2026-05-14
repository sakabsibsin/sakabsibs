import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { connectDB } from './config/database.js';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimit } from './middleware/rateLimit.js';

const app = express();

connectDB().catch((err) => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});

// Compress all responses (gzip) — reduces payload size ~60-70%
app.use(compression());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit on all API routes
app.use('/api', apiRateLimit);
app.use('/api', routes);
app.use(errorHandler);

export default app;
