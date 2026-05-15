import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { verifyAdminPassword, signAdminToken } from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const valid = await verifyAdminPassword(password);
  if (!valid) return sendError(res, 'Invalid password', 401);
  const token = signAdminToken();
  sendSuccess(res, { token });
});

export const logout = asyncHandler(async (_req, res) => {
  // Token lives in the client's localStorage — nothing to clear server-side
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { authenticated: !!req.admin });
});
