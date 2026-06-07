import dotenv from 'dotenv';

// Load variables from .env into process.env (no-op if the file is absent).
dotenv.config();

/**
 * Centralized, validated access to environment variables.
 * Import `env` everywhere instead of reaching into process.env directly,
 * so config lives in one place and defaults are explicit.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5500,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4321',
  mongoUri: process.env.MONGO_URI || '',

  // Auth secrets (used from Phase 2 onward).
  jwtSecret: process.env.JWT_SECRET || 'dev_access_token_secret_change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_token_secret_change_me',
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',

  // Seed admin
  adminName: process.env.ADMIN_NAME || 'Platform Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ailms.dev',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',

  // Cloudinary (Phase 3 — media upload)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // AI / LLM (Phase 5)
  aiProvider: process.env.AI_PROVIDER || 'groq',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Stripe (Phase 8 — payments)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeCurrency: process.env.STRIPE_CURRENCY || 'usd',

  // Email (Phase 9). Leave blank to use an auto Ethereal test inbox in dev.
  email: {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'AI LMS <no-reply@ailms.dev>',
  },
};

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';

/**
 * Warn loudly (but don't crash) when expected vars are missing in dev.
 * Phase 1 only requires PORT/CLIENT_URL to demo the health endpoint.
 */
export function checkEnv() {
  if (!env.mongoUri) {
    console.warn(
      '⚠️  MONGO_URI is not set. The API will run, but database features are disabled. ' +
        'Set MONGO_URI in server/.env (see .env.example).'
    );
  }
}

export default env;
