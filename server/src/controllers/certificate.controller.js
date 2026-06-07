import crypto from 'crypto';
import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Progress } from '../models/Progress.js';
import { Certificate } from '../models/Certificate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateCertificatePdf } from '../services/certificate.service.js';
import { isCloudinaryConfigured, uploadBuffer } from '../config/cloudinary.js';

function newCertificateId() {
  return `EDSKILL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

async function courseCompletionPercent(studentId, courseId) {
  const [total, done] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    Progress.countDocuments({ student: studentId, course: courseId, completed: true }),
  ]);
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

/**
 * GET /api/courses/:id/certificate   (protect)
 * Issues (or returns) the student's certificate once the course is 100% complete.
 */
export const getCourseCertificate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid course id.');
  const course = await Course.findById(req.params.id).populate('instructor', 'name').lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  let cert = await Certificate.findOne({ student: req.user._id, course: course._id });

  if (!cert) {
    const { total, percent } = await courseCompletionPercent(req.user._id, course._id);
    if (total === 0 || percent < 100) {
      throw new ApiError(403, 'Complete 100% of the course to earn your certificate.');
    }

    const certificateId = newCertificateId();
    let pdfUrl = '';
    try {
      const pdf = await generateCertificatePdf({
        studentName: req.user.name,
        courseTitle: course.title,
        instructorName: course.instructor?.name || 'Instructor',
        certificateId,
        issuedAt: new Date(),
      });
      if (isCloudinaryConfigured) {
        const up = await uploadBuffer(pdf, {
          folder: 'ai-lms/certificates',
          resourceType: 'auto',
        });
        pdfUrl = up.url;
      }
    } catch {
      // Non-fatal: the backend download route regenerates the PDF on demand.
    }

    try {
      cert = await Certificate.create({
        student: req.user._id,
        course: course._id,
        certificateId,
        pdfUrl,
      });
    } catch (err) {
      // Unique (student,course) race → fetch the existing one.
      if (err.code === 11000) {
        cert = await Certificate.findOne({ student: req.user._id, course: course._id });
      } else throw err;
    }
  }

  res.json({
    success: true,
    certificate: {
      certificateId: cert.certificateId,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl,
      downloadUrl: `/api/certificates/${cert.certificateId}/download`,
      courseTitle: course.title,
      studentName: req.user.name,
    },
  });
});

/**
 * GET /api/certificates/mine   (protect)
 * The current user's earned certificates.
 */
export const getMyCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ student: req.user._id })
    .sort({ issuedAt: -1 })
    .populate('course', 'title thumbnail')
    .lean();
  res.json({
    success: true,
    certificates: certs.map((c) => ({
      certificateId: c.certificateId,
      issuedAt: c.issuedAt,
      pdfUrl: c.pdfUrl,
      downloadUrl: `/api/certificates/${c.certificateId}/download`,
      course: c.course,
    })),
  });
});

/**
 * GET /api/certificates/:certificateId/download   (public)
 * Streams a freshly-rendered PDF — always works (no external dependency).
 */
export const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('student', 'name')
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } });

  if (!cert || !cert.course || !cert.student) throw new ApiError(404, 'Certificate not found.');

  const pdf = await generateCertificatePdf({
    studentName: cert.student.name,
    courseTitle: cert.course.title,
    instructorName: cert.course.instructor?.name || 'Instructor',
    certificateId: cert.certificateId,
    issuedAt: cert.issuedAt,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="certificate-${cert.certificateId}.pdf"`
  );
  res.send(pdf);
});

/**
 * GET /api/certificates/verify/:certificateId   (public)
 */
export const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('student', 'name')
    .populate('course', 'title')
    .lean();

  if (!cert) return res.json({ success: true, valid: false });

  res.json({
    success: true,
    valid: true,
    certificateId: cert.certificateId,
    studentName: cert.student?.name || 'Unknown',
    courseTitle: cert.course?.title || 'Unknown course',
    issuedAt: cert.issuedAt,
  });
});
