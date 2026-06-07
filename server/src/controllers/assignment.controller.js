import mongoose from 'mongoose';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import { gradeAssignment, isAIConfigured } from '../services/ai/index.js';

/* --------------------------------- helpers ---------------------------------- */

async function loadAssignment(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid assignment id.');
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new ApiError(404, 'Assignment not found.');
  return assignment;
}

function isCourseOwner(course, user) {
  return String(course.instructor) === String(user._id) || user.role === 'admin';
}

async function assertEnrolledOrOwner(course, user) {
  if (isCourseOwner(course, user)) return true;
  const enrolled = await Enrollment.exists({ student: user._id, course: course._id });
  if (!enrolled) throw new ApiError(403, 'Enroll in this course to access its assignments.');
  return false;
}

/* ------------------------------- instructor hub ----------------------------- */

/**
 * GET /api/assignments/mine   (instructor/admin)
 * All assignments across the instructor's courses + submission counts.
 */
export const getMyAssignments = asyncHandler(async (req, res) => {
  const courseFilter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(courseFilter).select('title').sort({ title: 1 }).lean();
  const courseIds = courses.map((c) => c._id);

  const assignments = await Assignment.find({ course: { $in: courseIds } })
    .sort({ createdAt: -1 })
    .populate('course', 'title')
    .lean();

  const ids = assignments.map((a) => a._id);
  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: ids } } },
    {
      $group: {
        _id: '$assignment',
        total: { $sum: 1 },
        graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
      },
    },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c]));

  res.json({
    success: true,
    courses, // for the "new assignment" course picker
    assignments: assignments.map((a) => ({
      ...a,
      submissionCount: map[String(a._id)]?.total || 0,
      gradedCount: map[String(a._id)]?.graded || 0,
    })),
  });
});

/* ------------------------------- instructor CRUD ---------------------------- */

/** POST /api/courses/:id/assignments */
export const createAssignment = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const { title, description, dueDate, maxScore } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Assignment title is required.');

  const assignment = await Assignment.create({
    course: course._id,
    title: title.trim(),
    description: description || '',
    dueDate: dueDate ? new Date(dueDate) : null,
    maxScore: Number(maxScore) > 0 ? Number(maxScore) : 100,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, assignment });
});

/**
 * GET /api/courses/:id/assignments
 * Role-aware: instructor/owner sees all + submission counts; enrolled student
 * sees assignments + their own submission status.
 */
export const listCourseAssignments = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');
  const owner = await assertEnrolledOrOwner(course, req.user);

  const assignments = await Assignment.find({ course: course._id })
    .sort({ createdAt: -1 })
    .lean();
  const ids = assignments.map((a) => a._id);

  if (owner) {
    const counts = await Submission.aggregate([
      { $match: { assignment: { $in: ids } } },
      {
        $group: {
          _id: '$assignment',
          total: { $sum: 1 },
          graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
        },
      },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c]));
    const data = assignments.map((a) => ({
      ...a,
      submissionCount: map[String(a._id)]?.total || 0,
      gradedCount: map[String(a._id)]?.graded || 0,
    }));
    return res.json({ success: true, assignments: data, isOwner: true });
  }

  // Student: attach their own submission to each assignment.
  const subs = await Submission.find({ student: req.user._id, assignment: { $in: ids } }).lean();
  const subMap = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));
  const data = assignments.map((a) => ({
    ...a,
    mySubmission: subMap[String(a._id)] || null,
  }));
  res.json({ success: true, assignments: data, isOwner: false });
});

/** GET /api/assignments/:id  (role-aware) */
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.course).lean();
  const owner = await assertEnrolledOrOwner(course, req.user);

  if (owner) return res.json({ success: true, assignment, isOwner: true });

  const mySubmission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  }).lean();
  res.json({ success: true, assignment, isOwner: false, mySubmission: mySubmission || null });
});

/** PUT /api/assignments/:id */
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.course);
  ensureCourseOwner(course, req.user);

  const { title, description, dueDate, maxScore } = req.body;
  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : null;
  if (maxScore !== undefined && Number(maxScore) > 0) assignment.maxScore = Number(maxScore);
  await assignment.save();

  res.json({ success: true, assignment });
});

/** DELETE /api/assignments/:id  (cascades submissions) */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.course);
  ensureCourseOwner(course, req.user);

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.json({ success: true, message: 'Assignment deleted.' });
});

/* --------------------------------- student ---------------------------------- */

/**
 * POST /api/assignments/:id/submit
 * Body: { content?, fileUrl?, fileName? }  (text and/or uploaded file)
 */
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.course).lean();

  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (!enrolled) throw new ApiError(403, 'Enroll in this course to submit assignments.');

  const { content, fileUrl, fileName } = req.body;
  if (!String(content || '').trim() && !fileUrl) {
    throw new ApiError(400, 'Add a text answer or attach a file before submitting.');
  }

  const now = new Date();
  if (assignment.dueDate && now > assignment.dueDate) {
    throw new ApiError(400, 'The due date for this assignment has passed.');
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      $set: {
        course: course._id,
        content: content || '',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        status: 'submitted',
        // Resetting any prior grade on resubmission.
        score: null,
        feedback: '',
        aiScore: null,
        aiFeedback: '',
        gradedAt: null,
        gradedBy: null,
        late: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, submission });
});

/** GET /api/assignments/:id/my-submission */
export const getMySubmission = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  }).lean();
  res.json({ success: true, submission: submission || null });
});

/* ------------------------------ instructor grading -------------------------- */

/** GET /api/assignments/:id/submissions  (instructor) */
export const listSubmissions = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.course);
  ensureCourseOwner(course, req.user);

  const submissions = await Submission.find({ assignment: assignment._id })
    .sort({ createdAt: -1 })
    .populate('student', 'name email avatar')
    .lean();

  res.json({ success: true, assignment, submissions });
});

async function loadOwnedSubmission(id, user) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid submission id.');
  const submission = await Submission.findById(id).populate('student', 'name email');
  if (!submission) throw new ApiError(404, 'Submission not found.');
  const course = await Course.findById(submission.course);
  ensureCourseOwner(course, user);
  return submission;
}

/**
 * POST /api/submissions/:id/grade   (instructor)
 * Body: { score, feedback }
 */
export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await loadOwnedSubmission(req.params.id, req.user);
  const assignment = await Assignment.findById(submission.assignment).lean();

  const score = Number(req.body.score);
  if (Number.isNaN(score) || score < 0 || score > assignment.maxScore) {
    throw new ApiError(400, `Score must be between 0 and ${assignment.maxScore}.`);
  }

  submission.score = score;
  submission.feedback = req.body.feedback || '';
  submission.status = 'graded';
  submission.gradedAt = new Date();
  submission.gradedBy = req.user._id;
  await submission.save();

  res.json({ success: true, submission });
});

/**
 * POST /api/submissions/:id/ai-suggest   (instructor)
 * Runs the AI grader; stores + returns the suggestion (does NOT finalize).
 */
export const aiSuggestGrade = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) {
    throw new ApiError(503, 'AI is not configured. Add GROQ_API_KEY to the server .env.');
  }
  const submission = await loadOwnedSubmission(req.params.id, req.user);
  const assignment = await Assignment.findById(submission.assignment).lean();

  if (!String(submission.content || '').trim()) {
    throw new ApiError(
      400,
      'This submission has no text to grade (file-only). Please review the file and grade manually.'
    );
  }

  try {
    const { score, feedback } = await gradeAssignment({
      title: assignment.title,
      description: assignment.description,
      maxScore: assignment.maxScore,
      submission: submission.content,
    });
    submission.aiScore = score;
    submission.aiFeedback = feedback;
    await submission.save();
    res.json({ success: true, aiScore: score, aiFeedback: feedback });
  } catch (err) {
    throw new ApiError(502, `AI grading failed: ${err.message}`);
  }
});
