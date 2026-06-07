import mongoose from 'mongoose';

export const ENROLLMENT_STATUS = ['active', 'completed'];

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ENROLLMENT_STATUS,
      default: 'active',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt acts as enrolledAt
);

// A student can enroll in a given course only once.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
