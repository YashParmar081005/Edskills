import Stripe from 'stripe';
import { env } from './env.js';

export const isStripeConfigured = Boolean(env.stripeSecretKey);

/**
 * Stripe client (null when not configured so the app still boots).
 * Payment routes return a clear 503 when this is null.
 */
export const stripe = isStripeConfigured
  ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

if (isStripeConfigured) {
  console.log('💳 Stripe configured (test mode if using sk_test_…).');
} else {
  console.warn('⚠️  Stripe not configured — paid checkout disabled. Set STRIPE_SECRET_KEY in .env.');
}

export default stripe;
