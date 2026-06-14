import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Search, Trash2, Loader2, X } from 'lucide-react';
import { listUsers, updateUserRole, deleteUser } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Spinner from '../components/Spinner.jsx';

const ROLES = ['student', 'instructor', 'admin'];

export default function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Debounce typing so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', { search: debounced, role }],
    queryFn: () => listUsers({ q: debounced || undefined, role: role || undefined }),
    placeholderData: keepPreviousData, // keep showing the old list while refetching
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const delMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const users = data?.users || [];
  const counts = data?.counts || { student: 0, instructor: 0, admin: 0 };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Users className="h-6 w-6 text-brand-500" /> User Management
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Students" value={counts.student} />
        <StatCard icon={Users} label="Instructors" value={counts.instructor} accent="from-amber-400 to-orange-500" />
        <StatCard icon={Users} label="Admins" value={counts.admin} accent="from-rose-400 to-pink-600" />
      </div>

      <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="glass-input pl-10 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
            ) : search ? (
              <button
                onClick={() => setSearch('')}
                className="text-slate-400 transition hover:text-rose-500"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </span>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="glass-input !py-2.5 capitalize sm:w-44">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
        {(debounced || role) && (
          <span className="shrink-0 text-xs text-slate-400">
            {users.length} result{users.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-12 text-center">
          <Search className="h-7 w-7 text-slate-400" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">No users found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {debounced ? `Nothing matches “${debounced}”${role ? ` in ${role}s` : ''}.` : 'Try a different filter.'}
          </p>
          {(search || role) && (
            <button onClick={() => { setSearch(''); setRole(''); }} className="btn-ghost mt-2 text-sm">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/30 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <tr key={u.id} className="border-b border-white/15 last:border-0 dark:border-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-brand-600 text-xs font-bold text-white">
                            {u.name?.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {u.name} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                            </p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isSelf && (
                          <button onClick={() => setDeleting(u)} className="icon-btn h-8 w-8 text-rose-500" title="Delete user">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={delMut.isPending}
        title="Delete user?"
        message={`"${deleting?.name}" and their enrollments will be permanently removed.`}
        confirmLabel="Delete user"
        onConfirm={() => delMut.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
