import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { Setting } from '../models/Setting.js';

// Keys whose raw value must never leave the server.
// admin_password is bcrypt-hashed but exposing the hash still enables offline cracking.
const SENSITIVE_KEYS = new Set(['admin_password']);

// Returns a safe placeholder for sensitive setting values so the frontend can
// detect state (e.g. "is the admin password still the unsecured default?")
// without ever seeing the actual value or hash.
const maskSensitive = (key, value) => {
  if (key === 'admin_password') {
    return typeof value === 'string' && value.startsWith('$2') ? 'hashed' : 'default';
  }
  return value;
};

export const listSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.find();
  const obj = {};
  for (const s of settings) {
    obj[s.key] = SENSITIVE_KEYS.has(s.key) ? maskSensitive(s.key, s.value) : s.value;
  }
  sendSuccess(res, obj);
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  let { value } = req.body;
  if (typeof value !== 'string') return sendError(res, 'value must be a string', 400);

  // Hash passwords before storing — never persist plaintext credentials.
  // Already-hashed values (starting with $2) are passed through so admins
  // can paste a pre-hashed value if needed.
  if (key === 'admin_password') {
    if (value.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);
    if (!value.startsWith('$2')) value = await bcrypt.hash(value, 10);
  }

  const setting = await Setting.findOneAndUpdate({ key }, { key, value }, { new: true, upsert: true });

  // Strip sensitive values from the response. For admin_password, also flag
  // passwordChanged: true so the frontend knows to force a re-login.
  if (SENSITIVE_KEYS.has(setting.key)) {
    return sendSuccess(res, {
      key: setting.key,
      updatedAt: setting.updatedAt,
      passwordChanged: setting.key === 'admin_password',
    });
  }
  sendSuccess(res, setting);
});
