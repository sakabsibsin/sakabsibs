import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { uploadToCloudinary } from '../services/upload.service.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No image file provided. Please select an image.', 400);
  try {
    const result = await uploadToCloudinary(req.file.buffer);
    sendSuccess(res, result, 201);
  } catch (err) {
    const message = err?.message?.includes('Invalid image')
      ? 'The image file is corrupted or unsupported. Please try a different file.'
      : 'Image upload to storage failed. Please check your connection and try again.';
    sendError(res, message, 500);
  }
});
