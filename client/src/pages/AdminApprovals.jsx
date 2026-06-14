import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  Layers,
  PlayCircle,
  Check,
  X,
  GraduationCap,
  Eye,
} from 'lucide-react';
import { getPendingCourses, reviewCourse } from '../api/courses.js';
import GlassModal from '../components/GlassModal.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AdminApprovals() {
  const qc = useQueryClient();
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'pending'],
    queryFn: getPendingCourses,
  });
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');

  const reviewMut = useMutation({
    mutationFn: ({ id, decision, note }) => reviewCourse(id, decision, note),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['courses', 'pending'] });
      toast.success(data.message || 'Done');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const pending = courses || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <ShieldCheck className="h-6 w-6 text-brand-500" /> Course Approvals
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review instructor submissions. Approving publishes the course; rejecting sends it back with your note.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && pending.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-2 p-12 text-center">
          <ShieldCheck className="h-8 w-8 text-green-500" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Nothing to review 🎉</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No courses are awaiting approval.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending.map((c) => (
          <div key={c._id} className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/30 to-brand-600/30">
              {c.thumbnail ? (
                <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/70">
                  <BookOpen className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                Pending review
              </span>
              <h3 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
              <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <GraduationCap className="h-3.5 w-3.5" /> {c.instructor?.name} · {c.instructor?.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.moduleCount} modules</span>
                <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {c.lessonCount} lessons</span>
                <span className="font-semibold text-brand-600 dark:text-brand-300">{c.price > 0 ? `$${c.price}` : 'Free'}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link to={`/instructor/courses/${c._id}`} className="btn-ghost !py-2 text-xs" title="Preview in builder">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Link>
              <button
                onClick={() => setRejecting(c)}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => reviewMut.mutate({ id: c._id, decision: 'approve' })}
                disabled={reviewMut.isPending}
                className="btn-primary !py-2 text-xs"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      <GlassModal
        open={!!rejecting}
        onClose={() => { setRejecting(null); setNote(''); }}
        title={`Send "${rejecting?.title}" back?`}
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add a note so the instructor knows what to fix. They'll be notified and can resubmit.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="e.g. Lesson 2 has no content; please add a description and a thumbnail."
          className="glass-input mt-3 resize-none"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => { setRejecting(null); setNote(''); }} className="btn-ghost">Cancel</button>
          <button
            onClick={() =>
              reviewMut.mutate(
                { id: rejecting._id, decision: 'reject', note },
                { onSuccess: () => { setRejecting(null); setNote(''); } }
              )
            }
            disabled={reviewMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300"
          >
            {reviewMut.isPending ? <Spinner /> : <X className="h-4 w-4" />} Send back
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
