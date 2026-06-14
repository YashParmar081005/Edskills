import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell, MessagesSquare, CheckCheck, BadgeCheck, Reply } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  notifKey,
} from './hooks.js';
import { timeAgo } from '../../lib/dates.js';

const ICONS = {
  thread: MessagesSquare,
  reply: Reply,
  answer: BadgeCheck,
  system: Bell,
};

export default function NotificationBell() {
  const socket = useSocket();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  // Live: prepend new notifications + bump the unread count.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (n) => {
      qc.setQueryData(notifKey, (old) => {
        const list = old?.notifications || [];
        return {
          notifications: [n, ...list].slice(0, 30),
          unreadCount: (old?.unreadCount || 0) + 1,
        };
      });
      toast(n.message, { icon: '🔔' });
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket, qc]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openNotification = (n) => {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-btn relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="solid-card absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/30 px-4 py-3 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-start gap-3 border-b border-white/20 px-4 py-3 text-left transition last:border-0 hover:bg-white/40 dark:border-white/5 dark:hover:bg-white/5 ${
                      n.read ? 'opacity-70' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        n.read
                          ? 'bg-slate-400/15 text-slate-500'
                          : 'bg-sky-500/15 text-sky-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-700 dark:text-slate-200">
                        {n.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                  </button>
                );
              })
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-white/30 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 transition hover:bg-white/40 dark:border-white/10 dark:text-brand-300 dark:hover:bg-white/5"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
