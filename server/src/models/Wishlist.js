import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  },
  { timestamps: true }
);

// A student can save a given course only once.
wishlistSchema.index({ student: 1, course: 1 }, { unique: true });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
