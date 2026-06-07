import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileQuestion, Sparkles, PlayCircle, RotateCcw, Compass, BookOpen } from 'lucide-react';
import { getMyQuizzes } from '../api/quizzes.js';
import Spinner from '../components/Spinner.jsx';

function scoreColor(pct) {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

export default function MyQuizzes() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', 'mine'],
    queryFn: getMyQuizzes,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <FileQuestion className="h-6 w-6 text-brand-500" /> Quizzes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All quizzes from your enrolled courses.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && quizzes?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No quizzes yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Enroll in a course — quizzes added by your instructor will show up here.
          </p>
          <Link to="/courses" className="btn-primary mt-2">
            <Compass className="h-4 w-4" /> Browse courses
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes?.map((q) => {
          const lessonId = q.lesson?._id;
          const courseId = q.course?._id;
          const taken = q.lastScore != null;
          return (
            <div key={q._id} className="glass-card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
                  <FileQuestion className="h-5 w-5" />
                </div>
                {q.aiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{q.title}</h3>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <BookOpen className="h-3.5 w-3.5" /> {q.course?.title}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q.lesson?.title} · {q.questionCount} question{q.questionCount !== 1 ? 's' : ''}
              </p>

              <div className="mt-auto flex items-center justify-between pt-4">
                {taken ? (
                  <span className={`text-sm font-bold ${scoreColor(q.lastScore)}`}>
                    Last: {q.lastScore}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Not attempted</span>
                )}
                {lessonId ? (
                  <Link to={`/learn/${courseId}/${lessonId}`} className="btn-primary !py-2 text-xs">
                    {taken ? <RotateCcw className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    {taken ? 'Review' : 'Take quiz'}
                  </Link>
                ) : (
                  <Link to={`/learn/${courseId}`} className="btn-ghost !py-2 text-xs">
                    Open course
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
