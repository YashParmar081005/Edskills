import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToUser } from '../sockets/index.js';

/** GET /api/notifications  → notifications + unread count.
 *  ?all=1 returns up to 100 (for the full notifications page). */
export const getNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.all ? 100 : 30;
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
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

/** POST /api/notifications/broadcast  (admin) — announce to all users. */
export const broadcast = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) throw new ApiError(400, 'A message is required.');

  const users = await User.find({}).select('_id').lean();
  const docs = users.map((u) => ({
    user: u._id,
    type: 'system',
    message,
    actor: req.user._id,
  }));
  const created = await Notification.insertMany(docs);

  // Push live to everyone currently connected.
  created.forEach((n) => emitToUser(n.user, 'notification:new', n));

  res.json({ success: true, sent: created.length });
});
