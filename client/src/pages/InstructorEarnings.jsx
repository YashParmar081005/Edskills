import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet, DollarSign, CalendarDays, ShoppingCart, TrendingUp } from 'lucide-react';
import { getEarnings } from '../api/payments.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InstructorEarnings() {
  const { data, isLoading } = useQuery({ queryKey: ['earnings'], queryFn: getEarnings });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const pct = Math.round((data?.share?.instructor ?? 0.9) * 100);
  const t = data?.totals || {};
  const perCourse = data?.perCourse || [];
  const recent = data?.recent || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Wallet className="h-6 w-6 text-brand-500" /> Earnings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You earn <span className="font-semibold text-brand-600 dark:text-brand-300">{pct}%</span> of every sale.
        </p>
      </div>

      {/* Net earnings highlight */}
      <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">${t.net ?? 0}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total net earnings ({pct}%)</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">${t.gross ?? 0}</p>
            <p className="text-xs text-slate-400">Gross sales</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">${t.platformFee ?? 0}</p>
            <p className="text-xs text-slate-400">Platform fee</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="This month (net)" value={`$${t.thisMonthNet ?? 0}`} accent="from-sky-400 to-brand-600" />
        <StatCard icon={ShoppingCart} label="Total sales" value={t.sales ?? 0} accent="from-amber-400 to-orange-500" />
        <StatCard icon={DollarSign} label="Avg / sale (net)" value={`$${t.sales ? Math.round((t.net / t.sales) * 100) / 100 : 0}`} accent="from-violet-400 to-purple-600" />
      </div>

      {/* Per-course */}
      <div className="glass-card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <TrendingUp className="h-5 w-5 text-brand-500" /> Earnings by course
        </h3>
        {perCourse.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No paid sales yet. Earnings from paid-course enrollments show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {perCourse.map((c) => (
              <div key={c.courseId} className="flex items-center justify-between gap-3 rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.sales} sale{c.sales === 1 ? '' : 's'} · ${c.gross} gross</p>
                </div>
                <p className="shrink-0 font-bold text-green-600 dark:text-green-400">${c.net}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="glass-card p-5">
        <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Recent sales</h3>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Student</th>
                  <th className="pb-2 pr-4 font-medium">Course</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 text-right font-medium">Paid</th>
                  <th className="pb-2 text-right font-medium">You earn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {recent.map((r) => (
                  <tr key={r.id} className="text-slate-600 dark:text-slate-300">
                    <td className="py-2 pr-4">{r.student}</td>
                    <td className="max-w-[12rem] truncate py-2 pr-4">{r.course}</td>
                    <td className="py-2 pr-4 text-slate-400">{fmtDate(r.date)}</td>
                    <td className="py-2 pr-4 text-right">${r.amount}</td>
                    <td className="py-2 text-right font-semibold text-green-600 dark:text-green-400">${r.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
