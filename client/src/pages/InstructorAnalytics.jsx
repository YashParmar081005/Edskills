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
import {
  ArrowLeft,
  BookOpen,
  Users,
  Percent,
  ListChecks,
  DollarSign,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { getInstructorAnalytics } from '../api/analytics.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

function ChartCard({ title, children }) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function InstructorAnalytics() {
  const { isDark } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'instructor'],
    queryFn: getInstructorAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const axis = isDark ? '#94a3b8' : '#475569';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#fff',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
  };
  const courses = (data?.perCourse || []).map((c) => ({
    name: c.title.length > 14 ? c.title.slice(0, 14) + '…' : c.title,
    Enrollments: c.enrollments,
    'Completion %': c.completionRate,
    'Quiz avg %': c.avgQuizScore,
    Revenue: c.revenue,
  }));
  const hasRevenue = (data?.totals?.grossRevenue || 0) > 0;
  const instructorPct = Math.round((data?.revenueShare?.instructor ?? 0.9) * 100);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <LineChartIcon className="h-6 w-6 text-brand-500" /> Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You keep <span className="font-semibold text-brand-600 dark:text-brand-300">{instructorPct}%</span> of
          every sale — the platform retains a {100 - instructorPct}% fee.
        </p>
      </div>

      {/* Revenue highlight */}
      <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white">
            <DollarSign className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              ${data.totals.revenue}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Your revenue ({instructorPct}% share)
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">${data.totals.grossRevenue}</p>
            <p className="text-xs text-slate-400">Gross sales</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">${data.totals.platformFee}</p>
            <p className="text-xs text-slate-400">Platform fee ({100 - instructorPct}%)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Courses" value={data.totals.courses} />
        <StatCard icon={Users} label="Students" value={data.totals.students} accent="from-amber-400 to-orange-500" />
        <StatCard icon={Percent} label="Avg completion" value={`${data.totals.avgCompletion}%`} accent="from-green-400 to-emerald-600" />
        <StatCard icon={ListChecks} label="Avg quiz score" value={`${data.totals.avgQuizScore}%`} accent="from-violet-400 to-purple-600" />
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No course data yet. Publish a course and get some enrollments to see charts.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Enrollments per course">
            <BarChart data={courses}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 12 }} />
              <YAxis tick={{ fill: axis, fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(56,189,248,0.1)' }} />
              <Bar dataKey="Enrollments" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Completion & quiz scores (%)">
            <BarChart data={courses}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 12 }} />
              <YAxis tick={{ fill: axis, fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(56,189,248,0.1)' }} />
              <Bar dataKey="Completion %" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Quiz avg %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          {hasRevenue && (
            <ChartCard title={`Your revenue per course ($ — ${instructorPct}% share)`}>
              <BarChart data={courses}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" tick={{ fill: axis, fontSize: 12 }} />
                <YAxis tick={{ fill: axis, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34,197,94,0.1)' }} formatter={(v) => `$${v}`} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
