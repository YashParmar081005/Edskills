import mongoose from 'mongoose';
import { User, ROLES } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** GET /api/users  (admin) — list users with quick filters. */
export const listUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  const filter = {};
  if (role && ROLES.includes(role)) filter.role = role;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  const counts = await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]);
  const byRole = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  res.json({
    success: true,
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })),
    counts: {
      student: byRole.student || 0,
      instructor: byRole.instructor || 0,
      admin: byRole.admin || 0,
    },
  });
});

/** PATCH /api/users/:id/role  (admin) — change a user's role. */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role.');
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role.');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, user: user.toSafeJSON() });
});

/** DELETE /api/users/:id  (admin) — remove a user + their enrollments. */
export const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id.');
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  await Enrollment.deleteMany({ student: user._id });
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted.' });
});
