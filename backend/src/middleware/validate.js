import { sendError } from '../utils/apiResponse.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, messages, 400);
  }
  req.body = result.data;
  next();
};
