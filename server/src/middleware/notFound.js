/**
 * 404 handler — reached when no route matched.
 * Forwards a tagged error to the centralized error handler.
 */
export function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export default notFound;
