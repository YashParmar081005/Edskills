import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Review is too long'],
    },
  },
  { timestamps: true }
);

// One review per student per course.
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
