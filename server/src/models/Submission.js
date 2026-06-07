import mongoose from 'mongoose';

export const SUBMISSION_STATUS = ['submitted', 'graded'];

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Denormalized for ownership checks + course-wide queries.
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    content: { type: String, default: '' }, // text answer
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },

    status: { type: String, enum: SUBMISSION_STATUS, default: 'submitted' },
    score: { type: Number, default: null },
    feedback: { type: String, default: '' }, // instructor's final feedback

    // AI suggestion (instructor can accept/edit before saving the real grade).
    aiScore: { type: Number, default: null },
    aiFeedback: { type: String, default: '' },

    gradedAt: { type: Date, default: null },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    late: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One submission per student per assignment (resubmits update it).
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
