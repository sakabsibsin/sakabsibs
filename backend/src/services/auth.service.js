import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Setting } from '../models/Setting.js';
import { env } from '../config/env.js';

export const verifyAdminPassword = async (password) => {
  const setting = await Setting.findOne({ key: 'admin_password' });
  const stored = setting?.value ?? env.ADMIN_DEFAULT_PASSWORD;
  if (stored.startsWith('$2')) return bcrypt.compare(password, stored);
  return password === stored;
};

export const signAdminToken = () =>
  jwt.sign({ role: 'admin' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
