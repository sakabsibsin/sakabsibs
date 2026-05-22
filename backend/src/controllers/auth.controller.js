import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { verifyAdminPassword, signAdminToken } from '../services/auth.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { Setting } from '../models/Setting.js';
import { env } from '../config/env.js';

// Generic message used for both "admin email not configured" and the
// success path. Identical wording in both branches so the response can't
// be used to confirm whether an admin email is on file.
const FORGOT_GENERIC_MESSAGE =
  'If an admin email is configured, a reset link has been sent.';

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

export const forgotPassword = asyncHandler(async (_req, res) => {
  const emailSetting = await Setting.findOne({ key: 'admin_email' });

  // No admin_email configured → silently return success. Never reveal whether
  // an email is on file, otherwise the endpoint becomes an enumeration oracle.
  if (!emailSetting?.value) {
    return sendSuccess(res, { message: FORGOT_GENERIC_MESSAGE });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Token is stored on the admin_password setting itself. If admin_password
  // hasn't been created yet (still using ADMIN_DEFAULT_PASSWORD from env),
  // findOneAndUpdate returns null — in that case the email is still sent but
  // the reset link won't work until the password setting exists. Acceptable
  // because resetPassword surfaces a clear "invalid or expired" error.
  await Setting.findOneAndUpdate(
    { key: 'admin_password' },
    { resetToken: token, resetTokenExpiry: expiry }
  );

  const resetLink = `${env.FRONTEND_URL}/admin/reset-password?token=${token}`;
  await sendPasswordResetEmail(emailSetting.value, resetLink);

  return sendSuccess(res, { message: FORGOT_GENERIC_MESSAGE });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return sendError(res, 'Token and password are required.', 400);
  }
  if (password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters.', 400);
  }

  const setting = await Setting.findOne({
    key: 'admin_password',
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!setting) {
    return sendError(res, 'Reset link is invalid or has expired.', 400);
  }

  setting.value = await bcrypt.hash(password, 12);
  setting.resetToken = null;
  setting.resetTokenExpiry = null;
  await setting.save();

  return sendSuccess(res, { message: 'Password reset successfully. Please log in.' });
});
