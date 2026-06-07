import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileQuestion, Sparkles, Pencil, BookOpen, Plus } from 'lucide-react';
import { getInstructorQuizzes } from '../api/quizzes.js';
import Spinner from '../components/Spinner.jsx';

export default function InstructorQuizzesHub() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', 'instructor'],
    queryFn: getInstructorQuizzes,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <FileQuestion className="h-6 w-6 text-brand-500" /> AI Quiz Generator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quizzes across your courses. To add or edit one, open the course builder and use the
          quiz button on a lesson.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && quizzes?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No quizzes yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Open a course, then click the 🧩 quiz button on any lesson to generate one with AI.
          </p>
          <Link to="/instructor/courses" className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> Go to my courses
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes?.map((q) => (
          <div key={q._id} className="glass-card flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
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
            <div className="mt-auto pt-4">
              <Link to={`/instructor/courses/${q.course?._id}`} className="btn-ghost w-full !py-2 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit in builder
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
