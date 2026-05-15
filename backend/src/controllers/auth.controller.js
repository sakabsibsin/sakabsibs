import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { verifyAdminPassword, signAdminToken, getCookieOptions } from '../services/auth.service.js';
import { env } from '../config/env.js';

export const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const valid = await verifyAdminPassword(password);
  if (!valid) return sendError(res, 'Invalid password', 401);
  const token = signAdminToken();
  res.cookie('sakabsibs_token', token, getCookieOptions(env.NODE_ENV === 'production'));
  sendSuccess(res, { message: 'Logged in successfully' });
});

export const logout = asyncHandler(async (_req, res) => {
  // Must pass the same options used at login — browser matches on name+path+domain+secure+sameSite
  res.clearCookie('sakabsibs_token', getCookieOptions(env.NODE_ENV === 'production'));
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { authenticated: !!req.admin });
});
