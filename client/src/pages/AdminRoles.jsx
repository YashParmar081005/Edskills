import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, Check, Minus, Search, Users } from 'lucide-react';
import { listUsers, updateUserRole } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';

const ROLES = ['student', 'instructor', 'admin'];

// What each role can do (reflects the app's enforced access control).
const PERMISSIONS = [
  { feature: 'Browse & enroll in courses', student: true, instructor: true, admin: true },
  { feature: 'Take quizzes & submit assignments', student: true, instructor: true, admin: true },
  { feature: 'Ask AI & course discussions', student: true, instructor: true, admin: true },
  { feature: 'Create & manage courses', student: false, instructor: true, admin: true },
  { feature: 'AI quiz generation & grading', student: false, instructor: true, admin: true },
  { feature: 'Course analytics', student: false, instructor: true, admin: true },
  { feature: 'Platform analytics & payments', student: false, instructor: false, admin: true },
  { feature: 'User & role management', student: false, instructor: false, admin: true },
  { feature: 'Announcements / broadcasts', student: false, instructor: false, admin: true },
];

function Cell({ on }) {
  return on ? (
    <Check className="mx-auto h-4 w-4 text-green-500" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />
  );
}

export default function AdminRoles() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');

  const { data } = useQuery({ queryKey: ['users', 'roles-counts'], queryFn: () => listUsers() });
  const counts = data?.counts || { student: 0, instructor: 0, admin: 0 };

  const { data: results, isFetching } = useQuery({
    queryKey: ['users', 'role-search', search],
    queryFn: () => listUsers({ q: search }),
    enabled: search.trim().length > 0,
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <ShieldCheck className="h-6 w-6 text-brand-500" /> Roles &amp; Access
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Role distribution, what each role can do, and quick role changes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Students" value={counts.student} />
        <StatCard icon={Users} label="Instructors" value={counts.instructor} accent="from-amber-400 to-orange-500" />
        <StatCard icon={ShieldCheck} label="Admins" value={counts.admin} accent="from-rose-400 to-pink-600" />
      </div>

      {/* Permissions matrix */}
      <div className="glass-card overflow-hidden p-0">
        <h3 className="border-b border-white/30 px-5 py-4 font-bold text-slate-800 dark:border-white/10 dark:text-slate-100">
          Permissions by role
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-white/20 dark:border-white/5">
                <th className="px-5 py-3 text-left font-semibold">Capability</th>
                <th className="px-4 py-3 text-center font-semibold text-sky-500">Student</th>
                <th className="px-4 py-3 text-center font-semibold text-amber-500">Instructor</th>
                <th className="px-4 py-3 text-center font-semibold text-rose-500">Admin</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.feature} className="border-b border-white/15 last:border-0 dark:border-white/5">
                  <td className="px-5 py-2.5 text-slate-700 dark:text-slate-200">{p.feature}</td>
                  <td className="px-4 py-2.5"><Cell on={p.student} /></td>
                  <td className="px-4 py-2.5"><Cell on={p.instructor} /></td>
                  <td className="px-4 py-2.5"><Cell on={p.admin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick role change */}
      <div className="glass-card space-y-4 p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Change a user's role</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a user by name or email…"
            className="glass-input pl-10"
          />
        </div>

        {search.trim() && (
          <div className="space-y-2">
            {isFetching && <p className="text-sm text-slate-400">Searching…</p>}
            {results?.users?.length === 0 && !isFetching && (
              <p className="text-sm text-slate-400">No users match "{search}".</p>
            )}
            {results?.users?.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2 dark:bg-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {u.name} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    disabled={isSelf || roleMut.isPending}
                    onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                    className="glass-input !w-auto !py-1.5 text-xs disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-400">
          Need to delete accounts or see everyone?{' '}
          <Link to="/admin/users" className="text-brand-600 hover:underline dark:text-brand-300">
            Open User Management →
          </Link>
        </p>
      </div>
    </div>
  );
}
