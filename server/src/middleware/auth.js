import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

/**
 * protect — require a valid access token.
 * Reads "Authorization: Bearer <token>", verifies it, loads the user,
 * and attaches it to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Session expired or token invalid. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  req.user = user;
  next();
});

/**
 * authorize(...roles) — gate a route to specific roles.
 * Must be used after `protect`.
 *
 *   router.post('/courses', protect, authorize('instructor', 'admin'), handler)
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Requires role: ${roles.join(' or ')}.`)
      );
    }
    next();
  };
