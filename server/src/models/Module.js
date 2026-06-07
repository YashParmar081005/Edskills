import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Module = mongoose.model('Module', moduleSchema);
export default Module;
