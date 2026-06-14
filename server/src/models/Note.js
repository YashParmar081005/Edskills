import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    content: { type: String, default: '', maxlength: 10000 },
  },
  { timestamps: true }
);

// One note document per student per lesson (editable).
noteSchema.index({ student: 1, lesson: 1 }, { unique: true });

export const Note = mongoose.model('Note', noteSchema);
export default Note;
