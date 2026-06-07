/**
 * Lightweight operational error carrying an HTTP status code.
 * Thrown from controllers/services and rendered by the central error handler.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default ApiError;
