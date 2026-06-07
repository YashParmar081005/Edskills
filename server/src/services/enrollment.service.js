import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { sendEnrollmentEmail } from './email.service.js';

/**
 * Idempotently enroll a student in a course (bumps totalEnrollments once).
 * Sends a welcome email on first enrollment (fire-and-forget).
 * @returns {Promise<{enrollment, created:boolean}>}
 */
export async function ensureEnrollment(studentId, courseId) {
  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) return { enrollment: existing, created: false };

  const enrollment = await Enrollment.create({ student: studentId, course: courseId });
  await Course.updateOne({ _id: courseId }, { $inc: { totalEnrollments: 1 } });
  sendEnrollmentEmail(studentId, courseId).catch(() => {});
  return { enrollment, created: true };
}
