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
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <LineChartIcon className="h-6 w-6 text-brand-500" /> Analytics
        </h1>
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
        </div>
      )}
    </div>
  );
}
