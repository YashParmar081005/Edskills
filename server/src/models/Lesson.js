import mongoose from 'mongoose';

export const LESSON_TYPES = ['video', 'text'];

const resourceSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    // Denormalized course ref so ownership checks & course-wide queries are cheap.
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [160, 'Title must be at most 160 characters'],
    },
    type: {
      type: String,
      enum: LESSON_TYPES,
      default: 'text',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // seconds
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
