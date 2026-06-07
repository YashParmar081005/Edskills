import { ApiError } from './ApiError.js';

/**
 * Throw unless the user owns the course (or is an admin).
 * Pass a loaded Course document.
 */
export function ensureCourseOwner(course, user) {
  if (!course) throw new ApiError(404, 'Course not found.');
  const isOwner = String(course.instructor) === String(user._id);
  if (!isOwner && user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this course.');
  }
  return course;
}
