import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['thread', 'reply', 'answer', 'system'];

const notificationSchema = new mongoose.Schema(
  {
    // Recipient.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'system' },
    message: { type: String, required: true },
    // Client-side route to open when the notification is clicked.
    link: { type: String, default: '' },
    // Who triggered it (optional).
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
