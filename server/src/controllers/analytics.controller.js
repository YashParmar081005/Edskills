import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Certificate } from '../models/Certificate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { INSTRUCTOR_RATE, PLATFORM_FEE_RATE } from '../config/revenue.js';

const round = (n) => Math.round(n * 10) / 10;
const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * GET /api/analytics/instructor   (instructor/admin)
 * Per-course enrollments, completion rate, avg quiz score + totals.
 */
export const instructorAnalytics = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).select('title isPublished').lean();
  const ids = courses.map((c) => c._id);

  const [enrollAgg, lessonAgg, completedAgg, quizAgg, subCount, studentAgg, revenueAgg] = await Promise.all([
    Enrollment.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
    Lesson.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
    Progress.aggregate([
      { $match: { course: { $in: ids }, completed: true } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
    QuizAttempt.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', avg: { $avg: '$percentage' }, n: { $sum: 1 } } },
    ]),
    Submission.countDocuments({ course: { $in: ids } }),
    Enrollment.distinct('student', { course: { $in: ids } }),
    Payment.aggregate([
      { $match: { course: { $in: ids }, status: 'paid' } },
      { $group: { _id: '$course', gross: { $sum: '$amount' }, sales: { $sum: 1 } } },
    ]),
  ]);

  const eMap = Object.fromEntries(enrollAgg.map((x) => [String(x._id), x.n]));
  const lMap = Object.fromEntries(lessonAgg.map((x) => [String(x._id), x.n]));
  const cMap = Object.fromEntries(completedAgg.map((x) => [String(x._id), x.n]));
  const qMap = Object.fromEntries(quizAgg.map((x) => [String(x._id), x]));
  const rMap = Object.fromEntries(revenueAgg.map((x) => [String(x._id), x]));

  const perCourse = courses.map((c) => {
    const enrollments = eMap[String(c._id)] || 0;
    const lessons = lMap[String(c._id)] || 0;
    const completed = cMap[String(c._id)] || 0;
    const denom = enrollments * lessons;
    const completionRate = denom > 0 ? round((completed / denom) * 100) : 0;
    const avgQuizScore = qMap[String(c._id)] ? round(qMap[String(c._id)].avg) : 0;
    const gross = rMap[String(c._id)]?.gross || 0;
    const sales = rMap[String(c._id)]?.sales || 0;
    return {
      courseId: c._id,
      title: c.title,
      isPublished: c.isPublished,
      enrollments,
      lessons,
      completionRate,
      avgQuizScore,
      sales,
      grossRevenue: money(gross),
      revenue: money(gross * INSTRUCTOR_RATE), // instructor's 90% net
    };
  });

  const totalEnrollments = perCourse.reduce((s, c) => s + c.enrollments, 0);
  const grossRevenue = perCourse.reduce((s, c) => s + c.grossRevenue, 0);
  const withQuiz = perCourse.filter((c) => c.avgQuizScore > 0);
  const withEnroll = perCourse.filter((c) => c.enrollments > 0);

  res.json({
    success: true,
    revenueShare: { instructor: INSTRUCTOR_RATE, platform: PLATFORM_FEE_RATE },
    totals: {
      courses: courses.length,
      published: courses.filter((c) => c.isPublished).length,
      enrollments: totalEnrollments,
      students: studentAgg.length,
      submissions: subCount,
      grossRevenue: money(grossRevenue),
      revenue: money(grossRevenue * INSTRUCTOR_RATE), // net to instructor (90%)
      platformFee: money(grossRevenue * PLATFORM_FEE_RATE), // 10% kept by platform
      avgCompletion: withEnroll.length
        ? round(withEnroll.reduce((s, c) => s + c.completionRate, 0) / withEnroll.length)
        : 0,
      avgQuizScore: withQuiz.length
        ? round(withQuiz.reduce((s, c) => s + c.avgQuizScore, 0) / withQuiz.length)
        : 0,
    },
    perCourse,
  });
});

/**
 * GET /api/analytics/admin   (admin)
 * Platform-wide totals + breakdowns.
 */
export const adminAnalytics = asyncHandler(async (req, res) => {
  const [roleAgg, courseCount, publishedCount, enrollCount, revenueAgg, certCount, catAgg, topCourses, quizAgg] =
    await Promise.all([
      User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
      Course.countDocuments({}),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments({}),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Certificate.countDocuments({}),
      Course.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', enrollments: { $sum: '$totalEnrollments' }, courses: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
      ]),
      Course.find({ isPublished: true }).sort({ totalEnrollments: -1 }).limit(5).select('title totalEnrollments').lean(),
      QuizAttempt.aggregate([{ $group: { _id: null, avg: { $avg: '$percentage' }, n: { $sum: 1 } } }]),
    ]);

  const roles = Object.fromEntries(roleAgg.map((r) => [r._id, r.n]));

  res.json({
    success: true,
    totals: {
      students: roles.student || 0,
      instructors: roles.instructor || 0,
      admins: roles.admin || 0,
      courses: courseCount,
      published: publishedCount,
      enrollments: enrollCount,
      revenue: money(revenueAgg[0]?.total || 0), // gross platform sales
      platformEarnings: money((revenueAgg[0]?.total || 0) * PLATFORM_FEE_RATE), // 10% kept
      instructorPayouts: money((revenueAgg[0]?.total || 0) * INSTRUCTOR_RATE), // 90% to instructors
      certificates: certCount,
      quizAttempts: quizAgg[0]?.n || 0,
      avgQuizScore: quizAgg[0] ? round(quizAgg[0].avg || 0) : 0,
    },
    usersByRole: [
      { role: 'student', count: roles.student || 0 },
      { role: 'instructor', count: roles.instructor || 0 },
      { role: 'admin', count: roles.admin || 0 },
    ],
    byCategory: catAgg.map((c) => ({ category: c._id || 'Other', enrollments: c.enrollments, courses: c.courses })),
    topCourses: topCourses.map((c) => ({ title: c.title, enrollments: c.totalEnrollments || 0 })),
  });
});

/**
 * GET /api/analytics/student   (any authenticated user)
 * The current user's learning stats.
 */
export const studentAnalytics = asyncHandler(async (req, res) => {
  const sid = new mongoose.Types.ObjectId(req.user._id);
  const [enrollments, completedCount, certCount, quizAgg] = await Promise.all([
    Enrollment.find({ student: sid }).lean(),
    Enrollment.countDocuments({ student: sid, status: 'completed' }),
    Certificate.countDocuments({ student: sid }),
    QuizAttempt.aggregate([{ $match: { student: sid } }, { $group: { _id: null, avg: { $avg: '$percentage' }, n: { $sum: 1 } } }]),
  ]);

  const courseIds = enrollments.map((e) => e.course);
  const [lessonAgg, completedAgg] = await Promise.all([
    Lesson.aggregate([{ $match: { course: { $in: courseIds } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
    Progress.aggregate([
      { $match: { student: sid, completed: true } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
  ]);
  const lMap = Object.fromEntries(lessonAgg.map((x) => [String(x._id), x.n]));
  const cMap = Object.fromEntries(completedAgg.map((x) => [String(x._id), x.n]));

  const progresses = enrollments.map((e) => {
    const total = lMap[String(e.course)] || 0;
    const done = cMap[String(e.course)] || 0;
    return total ? (done / total) * 100 : 0;
  });
  const avgProgress = progresses.length ? round(progresses.reduce((s, p) => s + p, 0) / progresses.length) : 0;

  res.json({
    success: true,
    totals: {
      enrolled: enrollments.length,
      completed: completedCount,
      inProgress: enrollments.length - completedCount,
      avgProgress,
      certificates: certCount,
      quizzesTaken: quizAgg[0]?.n || 0,
      avgQuizScore: quizAgg[0] ? round(quizAgg[0].avg || 0) : 0,
    },
  });
});
