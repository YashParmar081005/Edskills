import mongoose from 'mongoose';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { env } from '../config/env.js';
import { Course } from '../models/Course.js';
import { Payment } from '../models/Payment.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureEnrollment } from '../services/enrollment.service.js';
import { splitRevenue } from '../config/revenue.js';

function assertStripe() {
  if (!isStripeConfigured) {
    throw new ApiError(
      503,
      'Payments are not configured. Add STRIPE_SECRET_KEY (test key) to the server .env.'
    );
  }
}

/**
 * POST /api/payments/checkout   (protect)
 * Body: { courseId }  → creates a Stripe Checkout Session for a paid course.
 */
export const createCheckout = asyncHandler(async (req, res) => {
  assertStripe();
  const { courseId } = req.body;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new ApiError(404, 'Course not found.');
  if (course.price <= 0) throw new ApiError(400, 'This course is free — just enroll.');

  const already = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (already) throw new ApiError(400, 'You are already enrolled in this course.');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: env.stripeCurrency,
          product_data: {
            name: course.title,
            description: (course.description || '').slice(0, 300) || undefined,
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { courseId: String(course._id), studentId: String(req.user._id) },
    success_url: `${env.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&course=${course._id}`,
    cancel_url: `${env.clientUrl}/courses/${course._id}`,
  });

  await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      $setOnInsert: {
        student: req.user._id,
        course: course._id,
        stripeSessionId: session.id,
        amount: course.price,
        currency: env.stripeCurrency,
        status: 'pending',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, url: session.url, sessionId: session.id });
});

/** Mark a paid session and enroll the student (idempotent). */
async function fulfillSession(session) {
  const courseId = session.metadata?.courseId;
  const studentId = session.metadata?.studentId;
  if (!courseId || !studentId) return;

  const amount = (session.amount_total || 0) / 100;
  const { platformFee, instructorEarning } = splitRevenue(amount);

  await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      // Authoritative paid amount + 90/10 split recorded on fulfillment.
      $set: {
        status: 'paid',
        amount,
        currency: session.currency || env.stripeCurrency,
        platformFee,
        instructorEarning,
      },
      $setOnInsert: {
        student: studentId,
        course: courseId,
        stripeSessionId: session.id,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await ensureEnrollment(studentId, courseId);
}

/**
 * POST /api/payments/confirm   (protect)
 * Body: { sessionId } — verifies the session with Stripe and enrolls if paid.
 * Lets checkout work in local dev without the Stripe CLI/webhook.
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  assertStripe();
  const { sessionId } = req.body;
  if (!sessionId) throw new ApiError(400, 'sessionId is required.');

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (String(session.metadata?.studentId) !== String(req.user._id)) {
    throw new ApiError(403, 'This payment session does not belong to you.');
  }

  if (session.payment_status === 'paid') {
    await fulfillSession(session);
    return res.json({ success: true, paid: true, courseId: session.metadata.courseId });
  }
  res.json({ success: true, paid: false });
});

/**
 * GET /api/payments   (admin) — all payments, newest first.
 */
export const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('student', 'name email')
    .populate('course', 'title')
    .lean();
  const revenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0);
  res.json({ success: true, payments, revenue: Math.round(revenue * 100) / 100 });
});

/**
 * POST /api/payments/webhook   (raw body — mounted before express.json in app.js)
 * Stripe-signed events. Verifies signature, records payment, auto-enrolls.
 */
export const webhook = asyncHandler(async (req, res) => {
  assertStripe();
  if (!env.stripeWebhookSecret) {
    throw new ApiError(400, 'Webhook secret not configured (STRIPE_WEBHOOK_SECRET).');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    await fulfillSession(event.data.object);
  }

  res.json({ received: true });
});
