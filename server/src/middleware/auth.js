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
 * optionalAuth — attach req.user if a valid token is present, otherwise
 * continue as an anonymous request. Never throws. Used on endpoints that are
 * public but behave differently for the owner / enrolled user.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // ignore invalid/expired token — treat as anonymous
  }
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
