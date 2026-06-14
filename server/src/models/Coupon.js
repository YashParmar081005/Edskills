import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    percentOff: { type: Number, required: true, min: 1, max: 100 },
    maxRedemptions: { type: Number, default: 0 }, // 0 = unlimited
    timesRedeemed: { type: Number, default: 0 },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One code per course.
couponSchema.index({ course: 1, code: 1 }, { unique: true });

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
