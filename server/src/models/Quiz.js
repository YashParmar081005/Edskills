import mongoose from 'mongoose';

export const QUESTION_TYPES = ['mcq', 'open'];

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: QUESTION_TYPES, default: 'mcq' },
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] }, // mcq only
    correctIndex: { type: Number, default: 0 }, // mcq only
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    // One quiz per lesson (Phase 5).
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      unique: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: { type: String, default: 'Lesson Quiz', trim: true },
    questions: { type: [questionSchema], default: [] },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
