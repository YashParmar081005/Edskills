import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, Cpu, DollarSign, Hash, Sparkles } from 'lucide-react';
import { getAiUsage } from '../api/analytics.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { timeAgo } from '../lib/dates.js';

const fmt = (n) => (n || 0).toLocaleString();
const usd = (n) => `$${(n || 0).toFixed(n < 1 ? 4 : 2)}`;

export default function AdminAiUsage() {
  const { isDark } = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ['ai-usage'], queryFn: getAiUsage });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const totals = data?.totals || { calls: 0, tokens: 0, cost: 0 };
  const byType = data?.byType || [];
  const topUsers = data?.topUsers || [];
  const recent = data?.recent || [];

  const axis = isDark ? '#94a3b8' : '#475569';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const tip = {
    background: isDark ? '#0f172a' : '#fff',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
  };
  const chartData = byType.map((t) => ({ name: t.type, Tokens: t.tokens }));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Cpu className="h-6 w-6 text-brand-500" /> AI Usage & Cost
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Token consumption and estimated spend across all AI features (Groq, est. pricing).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Sparkles} label="AI calls" value={fmt(totals.calls)} />
        <StatCard icon={Hash} label="Total tokens" value={fmt(totals.tokens)} accent="from-amber-400 to-orange-500" />
        <StatCard icon={DollarSign} label="Estimated cost" value={usd(totals.cost)} accent="from-green-400 to-emerald-600" />
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Tokens by feature</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" tick={{ fill: axis, fontSize: 12 }} />
                <YAxis tick={{ fill: axis, fontSize: 12 }} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(56,189,248,0.1)' }} formatter={(v) => fmt(v)} />
                <Bar dataKey="Tokens" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* By feature table */}
        <div className="glass-card overflow-hidden p-0">
          <h3 className="border-b border-white/30 px-5 py-3 font-bold text-slate-800 dark:border-white/10 dark:text-slate-100">By feature</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-2">Feature</th>
                <th className="px-5 py-2">Calls</th>
                <th className="px-5 py-2">Tokens</th>
                <th className="px-5 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((t) => (
                <tr key={t.type} className="border-t border-white/15 dark:border-white/5">
                  <td className="px-5 py-2 font-medium text-slate-700 dark:text-slate-200">{t.type}</td>
                  <td className="px-5 py-2 text-slate-500">{fmt(t.calls)}</td>
                  <td className="px-5 py-2 text-slate-500">{fmt(t.tokens)}</td>
                  <td className="px-5 py-2 text-slate-500">{usd(t.cost)}</td>
                </tr>
              ))}
              {byType.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">No AI usage recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top users */}
        <div className="glass-card overflow-hidden p-0">
          <h3 className="border-b border-white/30 px-5 py-3 font-bold text-slate-800 dark:border-white/10 dark:text-slate-100">Top users</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-2">User</th>
                <th className="px-5 py-2">Tokens</th>
                <th className="px-5 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={i} className="border-t border-white/15 dark:border-white/5">
                  <td className="px-5 py-2 font-medium text-slate-700 dark:text-slate-200">
                    {u.name} <span className="text-xs text-slate-400">{u.role}</span>
                  </td>
                  <td className="px-5 py-2 text-slate-500">{fmt(u.tokens)}</td>
                  <td className="px-5 py-2 text-slate-500">{usd(u.cost)}</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-400">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="glass-card overflow-hidden p-0">
          <h3 className="border-b border-white/30 px-5 py-3 font-bold text-slate-800 dark:border-white/10 dark:text-slate-100">Recent AI calls</h3>
          <div className="divide-y divide-white/15 dark:divide-white/5">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-300">{r.type}</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-300">{r.user}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{fmt(r.tokens)} tok</span>
                  <span>{usd(r.cost)}</span>
                  <span>{timeAgo(r.at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
