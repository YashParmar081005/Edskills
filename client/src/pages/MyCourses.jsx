import { Link } from 'react-router-dom';
import { GraduationCap, Compass } from 'lucide-react';
import { useMyEnrollments } from '../features/learn/hooks.js';
import PublicCourseCard from '../features/learn/PublicCourseCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function MyCourses() {
  const { data: enrollments, isLoading, isError } = useMyEnrollments();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <GraduationCap className="h-6 w-6 text-brand-500" /> My Learning
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pick up where you left off.
          </p>
        </div>
        <Link to="/courses" className="btn-ghost">
          <Compass className="h-4 w-4" /> Browse more
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          Couldn't load your courses.
        </div>
      )}

      {!isLoading && enrollments?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            You're not enrolled yet
          </h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Browse the catalog and enroll in a course to start learning.
          </p>
          <Link to="/courses" className="btn-primary mt-2">
            <Compass className="h-4 w-4" /> Browse courses
          </Link>
        </div>
      )}

      {enrollments?.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <PublicCourseCard
              key={e._id}
              course={e.course}
              progressPercent={e.progressPercent}
              to={`/learn/${e.course._id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
