import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ student: 1, lesson: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
