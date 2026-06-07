import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  MessagesSquare,
  ArrowBigUp,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react';
import { useThreads, useCreateThread, forumKeys } from '../features/forum/hooks.js';
import { useSocket } from '../context/SocketContext.jsx';
import GlassModal from '../components/GlassModal.jsx';
import Spinner from '../components/Spinner.jsx';
import { timeAgo } from '../lib/dates.js';

function NewThreadModal({ open, onClose, courseId }) {
  const createMut = useCreateThread(courseId);
  const [form, setForm] = useState({ title: '', body: '' });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createMut.mutate(form, {
      onSuccess: () => {
        setForm({ title: '', body: '' });
        onClose();
      },
    });
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Ask a question" maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Question title"
          className="glass-input"
          autoFocus
        />
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          placeholder="Add details… (optional)"
          className="glass-input resize-none"
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={createMut.isPending || !form.title.trim()} className="btn-primary">
            {createMut.isPending ? <Spinner /> : <Plus className="h-4 w-4" />}
            Post question
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

export default function CourseForum() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const socket = useSocket();
  const { data, isLoading, isError, error } = useThreads(courseId);
  const [showNew, setShowNew] = useState(false);

  // Live: refetch the list when anyone changes a thread in this course.
  useEffect(() => {
    if (!socket || !courseId) return undefined;
    socket.emit('course:join', courseId);
    const onThreads = ({ courseId: cid }) => {
      if (String(cid) === String(courseId)) {
        qc.invalidateQueries({ queryKey: forumKeys.threads(courseId) });
      }
    };
    socket.on('course:threads', onThreads);
    return () => {
      socket.emit('course:leave', courseId);
      socket.off('course:threads', onThreads);
    };
  }, [socket, courseId, qc]);

  const threads = data?.threads || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link
            to={`/courses/${courseId}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Course
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <MessagesSquare className="h-6 w-6 text-brand-500" /> Discussion
          </h1>
          {data?.courseTitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.courseTitle}</p>
          )}
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Ask a question
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          {error?.response?.status === 403
            ? 'Enroll in this course to join the discussion.'
            : "Couldn't load the forum."}
        </div>
      )}

      {!isLoading && threads.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No questions yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Be the first to start a discussion in this course.
          </p>
          <button onClick={() => setShowNew(true)} className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> Ask a question
          </button>
        </div>
      )}

      <div className="space-y-3">
        {threads.map((t) => (
          <Link
            key={t._id}
            to={`/threads/${t._id}`}
            className="glass-card flex items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-white/40 py-2 text-center dark:bg-white/5">
              <ArrowBigUp className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t.upvoteCount}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-bold text-slate-900 dark:text-white">{t.title}</h3>
                {t.answered && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-300">
                    <BadgeCheck className="h-3 w-3" /> Answered
                  </span>
                )}
              </div>
              {t.body && (
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                  {t.body}
                </p>
              )}
              <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span>{t.author?.name}</span>
                <span>· {timeAgo(t.createdAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {t.replyCount}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      <NewThreadModal open={showNew} onClose={() => setShowNew(false)} courseId={courseId} />
    </div>
  );
}
