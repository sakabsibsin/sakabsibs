import { sendError } from '../utils/apiResponse.js';

const isProd = process.env.NODE_ENV === 'production';

export const errorHandler = (err, _req, res, _next) => {
  // Always log the stack server-side for debugging; only the response is sanitized.
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
  // Never leak raw Mongoose / driver error text on 500s in production —
  // those messages can include internal field names, file paths, or stack-y
  // detail. 4xx errors are deliberate (sendError already crafted them).
  const message =
    status >= 500
      ? (isProd ? 'Internal server error' : (err.message || 'Internal server error'))
      : (err.message || 'Internal server error');
  sendError(res, message, status);
};
