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
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
export default Course;
