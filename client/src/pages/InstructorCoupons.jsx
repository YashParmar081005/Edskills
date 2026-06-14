import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Ticket, Plus, Trash2, BookOpen, Percent } from 'lucide-react';
import { listMyCoupons, createCoupon, deleteCoupon } from '../api/coupons.js';
import { getMyCourses } from '../api/courses.js';
import Spinner from '../components/Spinner.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

export default function InstructorCoupons() {
  const qc = useQueryClient();
  const { data: coupons, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: listMyCoupons });
  const { data: courses } = useQuery({ queryKey: ['courses', 'mine'], queryFn: getMyCourses });

  const [form, setForm] = useState({ code: '', courseId: '', percentOff: 20, maxRedemptions: 0, expiresAt: '' });
  const [deleting, setDeleting] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createMut = useMutation({
    mutationFn: () =>
      createCoupon({
        code: form.code.trim(),
        courseId: form.courseId,
        percentOff: Number(form.percentOff),
        maxRedemptions: Number(form.maxRedemptions) || 0,
        expiresAt: form.expiresAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
      setForm({ code: '', courseId: '', percentOff: 20, maxRedemptions: 0, expiresAt: '' });
      toast.success('Coupon created');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not create coupon'),
  });

  const delMut = useMutation({
    mutationFn: (id) => deleteCoupon(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setDeleting(null); toast.success('Coupon deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Enter a code');
    if (!form.courseId) return toast.error('Pick a course');
    createMut.mutate();
  };

  const paidCourses = (courses || []).filter((c) => c.price > 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Ticket className="h-6 w-6 text-brand-500" /> Coupons
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create discount codes students apply at checkout for your paid courses.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={submit} className="glass-card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Code</label>
          <input name="code" value={form.code} onChange={onChange} placeholder="SAVE20" className="glass-input uppercase" />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Course</label>
          <select name="courseId" value={form.courseId} onChange={onChange} className="glass-input">
            <option value="">Select a paid course…</option>
            {paidCourses.map((c) => (
              <option key={c._id} value={c._id}>{c.title} (${c.price})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">% off</label>
          <input name="percentOff" type="number" min="1" max="100" value={form.percentOff} onChange={onChange} className="glass-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Max uses (0 = ∞)</label>
          <input name="maxRedemptions" type="number" min="0" value={form.maxRedemptions} onChange={onChange} className="glass-input" />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Expires (optional)</label>
          <input name="expiresAt" type="date" value={form.expiresAt} onChange={onChange} className="glass-input" />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={createMut.isPending} className="btn-primary w-full sm:w-auto">
            {createMut.isPending ? <Spinner /> : <Plus className="h-4 w-4" />} Create coupon
          </button>
        </div>
        {paidCourses.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-300 sm:col-span-2 lg:col-span-5">
            You have no paid courses yet — set a price on a course to offer coupons.
          </p>
        )}
      </form>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-400"><Spinner className="h-6 w-6" /></div>
      ) : coupons?.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          <Ticket className="h-7 w-7 text-slate-400" /> No coupons yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons?.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const maxed = c.maxRedemptions > 0 && c.timesRedeemed >= c.maxRedemptions;
            return (
              <div key={c._id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <span className="rounded-lg bg-gradient-to-r from-sky-500/15 to-brand-600/15 px-2.5 py-1 font-mono text-sm font-bold text-brand-600 dark:text-brand-300">
                    {c.code}
                  </span>
                  <button onClick={() => setDeleting(c)} className="icon-btn h-8 w-8 text-rose-500" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  <Percent className="h-5 w-5 text-green-500" />{c.percentOff}
                  <span className="text-sm font-medium text-slate-400">off</span>
                </p>
                <p className="mt-1 inline-flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-3.5 w-3.5" /> {c.course?.title || 'Course'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/30 pt-2 text-[11px] dark:border-white/10">
                  <span className="text-slate-400">
                    Used {c.timesRedeemed}{c.maxRedemptions > 0 ? `/${c.maxRedemptions}` : ''}
                  </span>
                  <span className="text-slate-400">· Expires {fmtDate(c.expiresAt)}</span>
                  {(expired || maxed || !c.active) && (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-500">
                      {expired ? 'Expired' : maxed ? 'Maxed out' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={delMut.isPending}
        title="Delete coupon?"
        message={`Code "${deleting?.code}" will stop working immediately.`}
        confirmLabel="Delete coupon"
        onConfirm={() => delMut.mutate(deleting._id)}
      />
    </div>
  );
}
