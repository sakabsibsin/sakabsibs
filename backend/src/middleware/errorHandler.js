import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  console.error(err.stack);

  // MongoDB duplicate key — return a readable message instead of the raw driver error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    const value = err.keyValue?.[field];
    const label = field === 'name' ? 'name' : field;
    return sendError(
      res,
      value
        ? `"${value}" already exists. Please use a different ${label}.`
        : `A record with that ${label} already exists.`,
      409
    );
  }

  const status = err.status ?? err.statusCode ?? 500;
  sendError(res, err.message || 'Internal server error', status);
};
