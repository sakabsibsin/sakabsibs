import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Setting } from '../models/Setting.js';

export const listSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.find();
  const obj = {};
  for (const s of settings) obj[s.key] = s.value;
  sendSuccess(res, obj);
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const setting = await Setting.findOneAndUpdate({ key }, { key, value }, { new: true, upsert: true });
  sendSuccess(res, setting);
});
