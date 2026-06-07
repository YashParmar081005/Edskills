import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumThread',
      required: true,
      index: true,
    },
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
    body: {
      type: String,
      required: [true, 'Reply body is required'],
      trim: true,
      maxlength: [5000, 'Reply is too long'],
    },
    isAnswer: { type: Boolean, default: false },
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

export const ForumReply = mongoose.model('ForumReply', forumReplySchema);
export default ForumReply;
