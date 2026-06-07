import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowBigUp,
  BadgeCheck,
  CheckCircle2,
  Trash2,
  Send,
  MessagesSquare,
} from 'lucide-react';
import {
  useThread,
  useUpvoteThread,
  useUpvoteReply,
  useMarkAnswer,
  useCreateReply,
  useDeleteThread,
  useDeleteReply,
  forumKeys,
} from '../features/forum/hooks.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { timeAgo } from '../lib/dates.js';

const ROLE_TINT = {
  instructor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  admin: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  student: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
};

function AuthorChip({ author, when }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-brand-600 text-[10px] font-bold text-white">
        {author?.name?.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-medium text-slate-600 dark:text-slate-300">{author?.name}</span>
      {author?.role && (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ROLE_TINT[author.role] || ''}`}>
          {author.role}
        </span>
      )}
      <span>· {timeAgo(when)}</span>
    </div>
  );
}

function UpvoteButton({ count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-12 shrink-0 flex-col items-center rounded-xl border py-2 transition ${
        active
          ? 'border-brand-400 bg-brand-500/15 text-brand-600 dark:text-brand-300'
          : 'border-white/40 bg-white/30 text-slate-500 hover:bg-white/50 dark:border-white/10 dark:bg-white/5'
      }`}
      title={active ? 'Remove upvote' : 'Upvote'}
    >
      <ArrowBigUp className={`h-5 w-5 ${active ? 'fill-current' : ''}`} />
      <span className="text-sm font-bold">{count}</span>
    </button>
  );
}

export default function ThreadDetail() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const socket = useSocket();
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useThread(threadId);
  const upvoteThread = useUpvoteThread(threadId);
  const upvoteReply = useUpvoteReply(threadId);
  const markAnswer = useMarkAnswer(threadId);
  const createReply = useCreateReply(threadId);
  const deleteThread = useDeleteThread(data?.thread?.course);
  const deleteReply = useDeleteReply(threadId);

  const [reply, setReply] = useState('');

  // Live updates for this thread.
  useEffect(() => {
    if (!socket || !threadId) return undefined;
    socket.emit('thread:join', threadId);
    const onUpdate = ({ threadId: tid }) => {
      if (String(tid) === String(threadId)) {
        qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) });
      }
    };
    socket.on('thread:update', onUpdate);
    return () => {
      socket.emit('thread:leave', threadId);
      socket.off('thread:update', onUpdate);
    };
  }, [socket, threadId, qc]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card mx-auto max-w-md p-8 text-center">
        <p className="text-rose-500">
          {error?.response?.status === 403
            ? 'Enroll in this course to view this thread.'
            : 'Thread not found.'}
        </p>
        <Link to="/student/my-courses" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" /> My Learning
        </Link>
      </div>
    );
  }

  const { thread, replies, canModerate, isThreadAuthor } = data;
  const canMark = canModerate || isThreadAuthor;

  const submitReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    createReply.mutate(reply.trim(), { onSuccess: () => setReply('') });
  };

  return (
    <div className="animate-fade-in space-y-5">
      <Link
        to={`/courses/${thread.course}/forum`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Discussion
      </Link>

      {/* Thread */}
      <div className="glass-card flex items-start gap-4 p-6">
        <UpvoteButton
          count={thread.upvoteCount}
          active={thread.hasUpvoted}
          onClick={() => upvoteThread.mutate(thread._id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {thread.title}
            </h1>
            {(isThreadAuthor || canModerate) && (
              <button
                onClick={() =>
                  deleteThread.mutate(thread._id, {
                    onSuccess: () => navigate(`/courses/${thread.course}/forum`),
                  })
                }
                className="icon-btn h-8 w-8 shrink-0 text-rose-500"
                title="Delete thread"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {thread.body && (
            <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {thread.body}
            </p>
          )}
          <div className="mt-3">
            <AuthorChip author={thread.author} when={thread.createdAt} />
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <MessagesSquare className="h-5 w-5 text-brand-500" />
        <h2 className="font-bold">
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </h2>
      </div>

      <div className="space-y-3">
        {replies.map((r) => (
          <div
            key={r._id}
            className={`glass-card flex items-start gap-4 p-4 ${
              r.isAnswer ? 'ring-2 ring-green-400/50' : ''
            }`}
          >
            <UpvoteButton
              count={r.upvoteCount}
              active={r.hasUpvoted}
              onClick={() => upvoteReply.mutate(r._id)}
            />
            <div className="min-w-0 flex-1">
              {r.isAnswer && (
                <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> Accepted answer
                </p>
              )}
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{r.body}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <AuthorChip author={r.author} when={r.createdAt} />
                <div className="flex items-center gap-2">
                  {canMark && (
                    <button
                      onClick={() => markAnswer.mutate(r._id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                        r.isAnswer
                          ? 'text-green-600 dark:text-green-300'
                          : 'text-slate-500 hover:bg-green-500/10 hover:text-green-600 dark:text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {r.isAnswer ? 'Unmark' : 'Mark as answer'}
                    </button>
                  )}
                  {(canModerate || r.author?._id === user?.id) && (
                    <button
                      onClick={() => deleteReply.mutate(r._id)}
                      className="icon-btn h-7 w-7 text-rose-500"
                      title="Delete reply"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply form */}
      <form onSubmit={submitReply} className="glass-card p-4">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Write a reply…"
          className="glass-input resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={createReply.isPending || !reply.trim()} className="btn-primary">
            {createReply.isPending ? <Spinner /> : <Send className="h-4 w-4" />}
            Reply
          </button>
        </div>
      </form>
    </div>
  );
}
