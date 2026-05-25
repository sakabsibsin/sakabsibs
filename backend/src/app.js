import express from 'express';
import cors from 'cors';
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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
  process.env.FRONTEND_URL?.replace('https://www.', 'https://'),
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit on all API routes
app.use('/api', apiRateLimit);
app.use('/api', routes);

// JSON 404 for unmatched /api/* — prevents the Express default HTML response
// that would break frontend error parsing.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

export default app;
