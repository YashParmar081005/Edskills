import { Link } from 'react-router-dom';
import { MessagesSquare, Sparkles, BookOpen, Compass, GraduationCap } from 'lucide-react';
import { useMyEnrollments } from '../features/learn/hooks.js';
import Spinner from '../components/Spinner.jsx';

export default function DiscussHub() {
  const { data: enrollments, isLoading } = useMyEnrollments();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <MessagesSquare className="h-6 w-6 text-brand-500" /> Ask &amp; Discuss
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Join the discussion or ask the AI assistant in any of your courses.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && enrollments?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nothing to discuss yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Enroll in a course to join its forum and ask the AI assistant.
          </p>
          <Link to="/courses" className="btn-primary mt-2">
            <Compass className="h-4 w-4" /> Browse courses
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments?.map((e) => (
          <div key={e._id} className="glass-card flex flex-col p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="mt-3 line-clamp-2 font-bold text-slate-900 dark:text-white">
              {e.course?.title}
            </h3>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <GraduationCap className="h-3.5 w-3.5" /> {e.course?.instructor?.name || 'Instructor'}
            </p>

            <div className="mt-auto flex gap-2 pt-4">
              <Link to={`/courses/${e.course?._id}/forum`} className="btn-primary flex-1 !py-2 text-xs">
                <MessagesSquare className="h-3.5 w-3.5" /> Discussion
              </Link>
              <Link to={`/learn/${e.course?._id}`} className="btn-ghost flex-1 !py-2 text-xs" title="Open course — Ask AI is inside">
                <Sparkles className="h-3.5 w-3.5" /> Ask AI
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
