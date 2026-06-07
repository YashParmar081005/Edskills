import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, DollarSign } from 'lucide-react';
import { listPayments } from '../api/payments.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { formatDateTime } from '../lib/dates.js';

const STATUS_TINT = {
  paid: 'bg-green-500/15 text-green-600 dark:text-green-300',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  failed: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
};

export default function AdminPayments() {
  const { data, isLoading } = useQuery({ queryKey: ['payments', 'all'], queryFn: listPayments });
  const payments = data?.payments || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <CreditCard className="h-6 w-6 text-brand-500" /> Payments
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={DollarSign} label="Total revenue" value={`$${data?.revenue ?? 0}`} accent="from-green-400 to-emerald-600" />
        <StatCard icon={CreditCard} label="Transactions" value={payments.length} />
        <StatCard icon={CreditCard} label="Paid" value={payments.filter((p) => p.status === 'paid').length} accent="from-violet-400 to-purple-600" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No payments yet. Paid-course purchases will appear here.
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/30 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-white/15 last:border-0 dark:border-white/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{p.student?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{p.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{p.course?.title || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TINT[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
