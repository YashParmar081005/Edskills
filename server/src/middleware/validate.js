import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Run after a list of express-validator checks. If any failed, respond with
 * a 400 and a clear, field-keyed message. Otherwise continue.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array();
  const message = errors.map((e) => e.msg).join(', ');
  const err = new ApiError(400, message);
  err.fields = errors.reduce((acc, e) => {
    // express-validator v7 uses `path` for the field name
    const field = e.path || e.param;
    if (field && !acc[field]) acc[field] = e.msg;
    return acc;
  }, {});
  next(err);
}

export default validate;
