import { isProduction } from '../config/env.js';

/**
 * Centralized error-handling middleware.
 * Must be registered LAST (after routes) and must keep all four args
 * so Express recognizes it as an error handler.
 *
 * Produces a consistent JSON error shape:
 *   { success: false, message, ...(stack in dev) }
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  if (statusCode < 400) statusCode = 500;

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.fields ? { fields: err.fields } : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

export default errorHandler;
