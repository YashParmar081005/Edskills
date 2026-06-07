import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** GET /api/notifications  → recent notifications + unread count */
export const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('actor', 'name avatar')
      .lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, notifications, unreadCount });
});

/** POST /api/notifications/:id/read */
export const markRead = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id.');
  await Notification.updateOne(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } }
  );
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unreadCount });
});

/** POST /api/notifications/read-all */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true, unreadCount: 0 });
});
