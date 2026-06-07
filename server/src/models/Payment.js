import mongoose from 'mongoose';

export const PAYMENT_STATUS = ['pending', 'paid', 'failed'];

const paymentSchema = new mongoose.Schema(
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
    stripeSessionId: { type: String, required: true, unique: true },
    amount: { type: Number, default: 0 }, // in major units (e.g. dollars)
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
