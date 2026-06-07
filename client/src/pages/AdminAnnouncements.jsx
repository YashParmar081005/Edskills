import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Megaphone, Send, Mail, Users, Bell } from 'lucide-react';
import { broadcast, listUsers } from '../api/users.js';
import { sendReminders } from '../api/analytics.js';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AdminAnnouncements() {
  const { data } = useQuery({ queryKey: ['users', 'counts'], queryFn: () => listUsers() });
  const total = data ? data.counts.student + data.counts.instructor + data.counts.admin : null;

  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  const doBroadcast = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setBusy('broadcast');
    try {
      const { sent } = await broadcast(msg.trim());
      toast.success(`Announcement sent to ${sent} user(s)`);
      setMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setBusy('');
    }
  };

  const doReminders = async () => {
    setBusy('reminders');
    try {
      const { sent } = await sendReminders();
      toast.success(sent ? `Sent ${sent} reminder email(s)` : 'No reminders were due');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Megaphone className="h-6 w-6 text-brand-500" /> Announcements
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Broadcast notifications and send assignment reminders.
        </p>
      </div>

      {total != null && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Total users" value={total} />
          <StatCard icon={Users} label="Students" value={data.counts.student} accent="from-sky-400 to-cyan-600" />
          <StatCard icon={Users} label="Instructors" value={data.counts.instructor} accent="from-amber-400 to-orange-500" />
        </div>
      )}

      {/* Broadcast */}
      <form onSubmit={doBroadcast} className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <Bell className="h-5 w-5 text-brand-500" /> Broadcast an announcement
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sends an in-app notification to <b>every user</b>{total != null ? ` (${total})` : ''}. It
          appears in their notification bell in real time.
        </p>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="e.g. New courses just dropped — check out the catalog!"
          className="glass-input resize-none"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={busy === 'broadcast' || !msg.trim()} className="btn-primary">
            {busy === 'broadcast' ? <Spinner /> : <Send className="h-4 w-4" />} Send announcement
          </button>
        </div>
      </form>

      {/* Reminders */}
      <div className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <Mail className="h-5 w-5 text-brand-500" /> Assignment reminders
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Emails students about assignments due in the next 24 hours (this also runs automatically
          on a daily schedule).
        </p>
        <div className="flex justify-end">
          <button onClick={doReminders} disabled={busy === 'reminders'} className="btn-ghost">
            {busy === 'reminders' ? <Spinner /> : <Mail className="h-4 w-4" />} Send reminder emails now
          </button>
        </div>
      </div>
    </div>
  );
}
