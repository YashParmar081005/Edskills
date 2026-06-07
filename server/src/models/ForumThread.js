import mongoose from 'mongoose';

const forumThreadSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    body: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Body is too long'],
    },
    // Users who upvoted (one vote each → count + toggle).
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ForumThread = mongoose.model('ForumThread', forumThreadSchema);
export default ForumThread;
