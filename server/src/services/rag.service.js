import { Embedding } from '../models/Embedding.js';

/** Split text into overlapping word-bounded chunks. */
export function chunkText(text, size = 700, overlap = 120) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    if (end < clean.length) {
      const space = clean.lastIndexOf(' ', end);
      if (space > i + size * 0.5) end = space;
    }
    chunks.push(clean.slice(i, end).trim());
    if (end >= clean.length) break;
    i = end - overlap;
  }
  return chunks.filter(Boolean);
}

/**
 * (Re)index a lesson's text content into the Embedding collection.
 * Called whenever a lesson is created/updated. Safe to call for video lessons
 * (no text → just clears any old chunks).
 */
export async function indexLesson(lesson) {
  if (!lesson?._id) return;
  await Embedding.deleteMany({ lesson: lesson._id });
  const chunks = chunkText(lesson.content || '');
  if (!chunks.length) return;
  await Embedding.insertMany(
    chunks.map((c, idx) => ({
      course: lesson.course,
      lesson: lesson._id,
      lessonTitle: lesson.title,
      chunkText: c,
      chunkIndex: idx,
    }))
  );
}

export async function removeLessonIndex(lessonId) {
  await Embedding.deleteMany({ lesson: lessonId });
}

export async function removeCourseIndex(courseId) {
  await Embedding.deleteMany({ course: courseId });
}

/**
 * Retrieve the most relevant chunks for a question within a course.
 * Uses text search, falling back to the first chunks if nothing matches.
 */
export async function retrieveChunks(courseId, question, limit = 6) {
  let chunks = [];
  try {
    chunks = await Embedding.find(
      { course: courseId, $text: { $search: question } },
      { score: { $meta: 'textScore' }, chunkText: 1, lessonTitle: 1, lesson: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  } catch {
    chunks = [];
  }
  if (chunks.length === 0) {
    chunks = await Embedding.find({ course: courseId })
      .sort({ chunkIndex: 1 })
      .limit(limit)
      .lean();
  }
  return chunks;
}
