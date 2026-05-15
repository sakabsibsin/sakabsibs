import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status ?? err.statusCode ?? 500;
  sendError(res, err.message || 'Internal server error', status);
};
