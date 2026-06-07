import rateLimit from 'express-rate-limit';

const tooMany = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

/**
 * Auth limiter — slows brute-force login/registration.
 * Only FAILED attempts count (successful logins are skipped), so normal use
 * is never throttled.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Too many attempts. Please wait a few minutes and try again.'),
});

/**
 * AI limiter — meters AI usage PER USER (cost control + abuse protection).
 * Mounted after `protect`, so req.user is available to key on.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?._id ? `u:${req.user._id}` : req.ip),
  handler: tooMany('AI usage limit reached. Please wait a few minutes before trying again.'),
});

/**
 * General API limiter — a generous backstop against hammering.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Too many requests. Please slow down.'),
});
