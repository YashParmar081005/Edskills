import mongoose from 'mongoose';

export const COURSE_CATEGORIES = [
  'Development',
  'Business',
  'Design',
  'Marketing',
  'Data Science',
  'AI & ML',
  'Personal Development',
  'Other',
];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description is too long'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Approval workflow: a course must be admin-approved before it can go public.
    // 'draft' → instructor editing · 'pending' → submitted, awaiting admin
    // 'approved' → admin OK'd (instructor may publish) · 'rejected' → sent back.
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    reviewNote: {
      type: String,
      default: '', // admin's note when rejecting (or approving)
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: {
      type: String,
      enum: COURSE_CATEGORIES,
      default: 'Other',
    },
    tags: {
      type: [String],
      default: [],
    },
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    ratingAvg: {
      type: Number,
      default: 0, // 0–5, denormalized from reviews
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
export default Course;
