import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, Users, GraduationCap } from 'lucide-react';
import ProgressBar from '../../components/ProgressBar.jsx';
import StarRating from '../../components/StarRating.jsx';
import WishlistButton from '../wishlist/WishlistButton.jsx';

export function priceLabel(p) {
  return p > 0 ? `$${Number(p).toFixed(2)}` : 'Free';
}

/**
 * Course card used on Browse and My Courses.
 * Pass `progressPercent` (and `to` override) to render the enrolled variant.
 * Pass `showWishlist` to render a save-for-later heart.
 */
export default function PublicCourseCard({ course, progressPercent, to, showWishlist }) {
  const enrolled = typeof progressPercent === 'number';
  const href = to || `/courses/${course._id}`;
  const instructorName = course.instructor?.name || 'Instructor';

  return (
    <Link
      to={href}
      className="glass-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-sky-400/30 to-brand-600/30">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/70">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 backdrop-blur-md dark:bg-slate-900/60 dark:text-brand-200">
          {course.category}
        </span>
        {!enrolled && (
          <span className="absolute right-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-md">
            {priceLabel(course.price)}
          </span>
        )}
        {showWishlist && (
          <div className="absolute bottom-2 right-2">
            <WishlistButton courseId={course._id} size="sm" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <GraduationCap className="h-3.5 w-3.5" /> {instructorName}
        </p>
        {course.ratingCount > 0 && (
          <div className="mt-1.5">
            <StarRating value={course.ratingAvg} count={course.ratingCount} showValue />
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> {course.lessonCount ?? 0} lessons
          </span>
          {typeof course.totalEnrollments === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {course.totalEnrollments}
            </span>
          )}
        </div>

        {enrolled && (
          <div className="mt-auto pt-4">
            <ProgressBar percent={progressPercent} showLabel />
          </div>
        )}
      </div>
    </Link>
  );
}
