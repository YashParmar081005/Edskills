import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  MessagesSquare,
  Reply,
  BadgeCheck,
  CheckCheck,
} from 'lucide-react';
import { getAllNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications.js';
import { notifKey } from '../features/notifications/hooks.js';
import { timeAgo } from '../lib/dates.js';
import Spinner from '../components/Spinner.jsx';

const ICONS = { thread: MessagesSquare, reply: Reply, answer: BadgeCheck, system: Bell };
const pageKey = ['notifications', 'all'];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all | unread

  const { data, isLoading } = useQuery({ queryKey: pageKey, queryFn: getAllNotifications });
  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: pageKey });
    qc.invalidateQueries({ queryKey: notifKey });
  };
  const readMut = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAllMut = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  const shown = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const open = (n) => {
    if (!n.read) readMut.mutate(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Bell className="h-6 w-6 text-brand-500" /> Notifications
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={() => readAllMut.mutate()} className="btn-ghost text-sm">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition ${
              filter === f
                ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white'
                : 'border border-white/40 bg-white/40 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            }`}
          >
            {f}{f === 'unread' && unread > 0 ? ` (${unread})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : shown.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-12 text-center">
          <Bell className="h-7 w-7 text-slate-400" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-white/20 overflow-hidden p-0 dark:divide-white/5">
          {shown.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <button
                key={n._id}
                onClick={() => open(n)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/40 dark:hover:bg-white/5 ${n.read ? 'opacity-70' : ''}`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.read ? 'bg-slate-400/15 text-slate-500' : 'bg-sky-500/15 text-sky-500'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-700 dark:text-slate-200">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
