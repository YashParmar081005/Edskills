import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE,
} from '../utils/tokens.js';

// Roles a user may self-assign at registration. Admin is created via seed.
const SELF_SIGNUP_ROLES = ['student', 'instructor'];

/** Issue tokens, persist the refresh token, set the httpOnly cookie. */
async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

/**
 * POST /api/auth/register
 * Create a student/instructor account, log them in.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const role = SELF_SIGNUP_ROLES.includes(req.body.role) ? req.body.role : 'student';

  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = new User({ name, email, role });
  await user.setPassword(password);
  await user.save();

  const accessToken = await issueTokens(user, res);

  res.status(201).json({
    success: true,
    accessToken,
    user: user.toSafeJSON(),
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // passwordHash is select:false — explicitly include it.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const accessToken = await issueTokens(user, res);

  res.json({
    success: true,
    accessToken,
    user: user.toSafeJSON(),
  });
});

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh-token cookie for a new access token (with rotation).
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(401, 'No refresh token provided.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Refresh token invalid or expired.');
  }

  const user = await User.findById(payload.sub).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Refresh token no longer valid.');
  }

  // Rotate: issue a fresh access + refresh token.
  const accessToken = await issueTokens(user, res);

  res.json({
    success: true,
    accessToken,
    user: user.toSafeJSON(),
  });
});

/**
 * POST /api/auth/logout
 * Clear the refresh cookie and invalidate the stored token.
 */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshToken: 1 } });
    } catch {
      // ignore — we're logging out anyway
    }
  }

  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Logged out.' });
});

/**
 * GET /api/auth/me  (protected)
 */
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});
