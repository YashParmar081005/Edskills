import mongoose from 'mongoose';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { env } from '../config/env.js';
import { Course } from '../models/Course.js';
import { Payment } from '../models/Payment.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureEnrollment } from '../services/enrollment.service.js';
import { splitRevenue, INSTRUCTOR_RATE, PLATFORM_FEE_RATE } from '../config/revenue.js';
import { resolveCoupon } from './coupon.controller.js';
import { Coupon } from '../models/Coupon.js';

const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

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
  const { courseId, couponCode } = req.body;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new ApiError(404, 'Course not found.');
  if (course.price <= 0) throw new ApiError(400, 'This course is free — just enroll.');

  const already = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (already) throw new ApiError(400, 'You are already enrolled in this course.');

  // Apply a coupon if provided.
  let price = course.price;
  let coupon = null;
  if (couponCode && String(couponCode).trim()) {
    coupon = await resolveCoupon(couponCode, course._id);
    price = Math.max(0, Math.round(course.price * (1 - coupon.percentOff / 100) * 100) / 100);
  }

  // 100%-off (or below Stripe's ~$0.50 minimum) → enroll for free, count the redemption.
  if (price < 0.5) {
    await ensureEnrollment(req.user._id, course._id);
    if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { timesRedeemed: 1 } });
    return res.json({ success: true, free: true, courseId: String(course._id) });
  }

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
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: String(course._id),
      studentId: String(req.user._id),
      couponId: coupon ? String(coupon._id) : '',
      couponCode: coupon ? coupon.code : '',
    },
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
        amount: price,
        couponCode: coupon ? coupon.code : '',
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
  const couponCode = session.metadata?.couponCode || '';
  const couponId = session.metadata?.couponId;

  // Was this session already fulfilled? (webhook + confirm can both fire)
  const existing = await Payment.findOne({ stripeSessionId: session.id }).select('status');
  const alreadyPaid = existing?.status === 'paid';

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
        couponCode,
      },
      $setOnInsert: {
        student: studentId,
        course: courseId,
        stripeSessionId: session.id,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // Count the coupon redemption only on the first paid transition.
  if (!alreadyPaid && couponId) {
    await Coupon.updateOne({ _id: couponId }, { $inc: { timesRedeemed: 1 } });
  }

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
 * GET /api/payments/earnings   (instructor/admin)
 * Net earnings (90%) across the instructor's courses: totals, this month,
 * per-course breakdown and recent sales.
 */
export const getEarnings = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).select('title').lean();
  const ids = courses.map((c) => c._id);
  const titleMap = Object.fromEntries(courses.map((c) => [String(c._id), c.title]));

  const paid = await Payment.find({ course: { $in: ids }, status: 'paid' })
    .sort({ createdAt: -1 })
    .populate('student', 'name email')
    .populate('course', 'title')
    .lean();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let gross = 0;
  let monthGross = 0;
  const perCourseMap = {};
  for (const p of paid) {
    const amt = p.amount || 0;
    gross += amt;
    if (new Date(p.createdAt) >= monthStart) monthGross += amt;
    const key = String(p.course?._id || p.course);
    if (!perCourseMap[key]) {
      perCourseMap[key] = { courseId: key, title: p.course?.title || titleMap[key] || 'Course', sales: 0, gross: 0 };
    }
    perCourseMap[key].sales += 1;
    perCourseMap[key].gross += amt;
  }

  const perCourse = Object.values(perCourseMap)
    .map((c) => ({ ...c, gross: money(c.gross), net: money(c.gross * INSTRUCTOR_RATE) }))
    .sort((a, b) => b.net - a.net);

  const recent = paid.slice(0, 15).map((p) => ({
    id: p._id,
    student: p.student?.name || 'Student',
    course: p.course?.title || 'Course',
    amount: money(p.amount || 0),
    net: money((p.amount || 0) * INSTRUCTOR_RATE),
    date: p.createdAt,
  }));

  res.json({
    success: true,
    share: { instructor: INSTRUCTOR_RATE, platform: PLATFORM_FEE_RATE },
    totals: {
      sales: paid.length,
      gross: money(gross),
      net: money(gross * INSTRUCTOR_RATE),
      platformFee: money(gross * PLATFORM_FEE_RATE),
      thisMonthNet: money(monthGross * INSTRUCTOR_RATE),
    },
    perCourse,
    recent,
  });
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
