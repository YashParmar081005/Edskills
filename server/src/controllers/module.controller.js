import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';

/** Load a module + its course and assert ownership. */
async function loadOwnedModule(moduleId, user) {
  if (!mongoose.isValidObjectId(moduleId)) throw new ApiError(400, 'Invalid module id.');
  const mod = await Module.findById(moduleId);
  if (!mod) throw new ApiError(404, 'Module not found.');
  const course = await Course.findById(mod.course);
  ensureCourseOwner(course, user);
  return mod;
}

/**
 * POST /api/courses/:id/modules
 */
export const addModule = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const count = await Module.countDocuments({ course: course._id });
  const mod = await Module.create({
    course: course._id,
    title: req.body.title,
    order: count,
  });

  res.status(201).json({ success: true, module: { ...mod.toObject(), lessons: [] } });
});

/**
 * PUT /api/modules/:id
 */
export const updateModule = asyncHandler(async (req, res) => {
  const mod = await loadOwnedModule(req.params.id, req.user);
  if (req.body.title !== undefined) mod.title = req.body.title;
  await mod.save();
  res.json({ success: true, module: mod });
});

/**
 * DELETE /api/modules/:id  (cascades to its lessons)
 */
export const deleteModule = asyncHandler(async (req, res) => {
  const mod = await loadOwnedModule(req.params.id, req.user);
  await Lesson.deleteMany({ module: mod._id });
  await mod.deleteOne();
  res.json({ success: true, message: 'Module deleted.' });
});

/**
 * PUT /api/courses/:id/modules/reorder   body: { orderedIds: [moduleId, ...] }
 */
export const reorderModules = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    throw new ApiError(400, 'orderedIds must be an array.');
  }

  await Promise.all(
    orderedIds.map((id, idx) =>
      Module.updateOne({ _id: id, course: course._id }, { $set: { order: idx } })
    )
  );

  res.json({ success: true, message: 'Modules reordered.' });
});
