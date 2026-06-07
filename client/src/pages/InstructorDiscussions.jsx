import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MessagesSquare,
  MessageCircle,
  ArrowBigUp,
  BadgeCheck,
  BookOpen,
} from 'lucide-react';
import { getMyThreads } from '../api/forum.js';
import { timeAgo } from '../lib/dates.js';
import Spinner from '../components/Spinner.jsx';

export default function InstructorDiscussions() {
  const { data: threads, isLoading } = useQuery({ queryKey: ['threads', 'mine'], queryFn: getMyThreads });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <MessagesSquare className="h-6 w-6 text-brand-500" /> Discussions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Questions from students across all your courses — jump in and answer.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && threads?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No questions yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            When students post in your course forums, their threads show up here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {threads?.map((t) => (
          <Link
            key={t._id}
            to={`/threads/${t._id}`}
            className="glass-card flex items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-white/40 py-2 text-center dark:bg-white/5">
              <MessageCircle className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.replyCount}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-bold text-slate-900 dark:text-white">{t.title}</h3>
                {t.answered ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-300">
                    <BadgeCheck className="h-3 w-3" /> Answered
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                    Needs answer
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> {t.course?.title}
                </span>
                <span>{t.author?.name}</span>
                <span>· {timeAgo(t.createdAt)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
