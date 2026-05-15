import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.sakabsibs_token;
  if (!token) return sendError(res, 'Authentication required', 401);
  try {
    jwt.verify(token, env.JWT_SECRET);
    req.admin = true;
    next();
  } catch {
    sendError(res, 'Invalid or expired session', 401);
  }
};
