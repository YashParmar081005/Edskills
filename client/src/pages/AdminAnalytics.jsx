import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  Award,
  BarChart3,
} from 'lucide-react';
import { getAdminAnalytics } from '../api/analytics.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const ROLE_COLORS = { student: '#0ea5e9', instructor: '#f59e0b', admin: '#f43f5e' };

export default function AdminAnalytics() {
  const { isDark } = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ['analytics', 'admin'], queryFn: getAdminAnalytics });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const axis = isDark ? '#94a3b8' : '#475569';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const tip = {
    background: isDark ? '#0f172a' : '#fff',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 12,
    color: isDark ? '#fff' : '#0f172a',
  };

  const roleData = (data.usersByRole || []).filter((r) => r.count > 0);
  const categoryData = (data.byCategory || []).map((c) => ({ name: c.category, Enrollments: c.enrollments }));
  const topData = (data.topCourses || []).map((c) => ({
    name: c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
    Enrollments: c.enrollments,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <BarChart3 className="h-6 w-6 text-brand-500" /> Platform Analytics
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={data.totals.students} />
        <StatCard icon={GraduationCap} label="Instructors" value={data.totals.instructors} accent="from-amber-400 to-orange-500" />
        <StatCard icon={BookOpen} label="Published courses" value={data.totals.published} accent="from-green-400 to-emerald-600" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${data.totals.revenue}`} accent="from-violet-400 to-purple-600" />
        <StatCard icon={Users} label="Enrollments" value={data.totals.enrollments} />
        <StatCard icon={Award} label="Certificates" value={data.totals.certificates} accent="from-rose-400 to-pink-600" />
        <StatCard icon={BarChart3} label="Quiz attempts" value={data.totals.quizAttempts} accent="from-sky-400 to-cyan-600" />
        <StatCard icon={BarChart3} label="Avg quiz score" value={`${data.totals.avgQuizScore}%`} accent="from-teal-400 to-emerald-600" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Users by role</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="count" nameKey="role" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {roleData.map((r) => (
                    <Cell key={r.role} fill={ROLE_COLORS[r.role] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Enrollments by category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" tick={{ fill: axis, fontSize: 11 }} />
                <YAxis tick={{ fill: axis, fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(56,189,248,0.1)' }} />
                <Bar dataKey="Enrollments" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {topData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Top courses by enrollment</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis type="number" tick={{ fill: axis, fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: axis, fontSize: 12 }} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(56,189,248,0.1)' }} />
                <Bar dataKey="Enrollments" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
