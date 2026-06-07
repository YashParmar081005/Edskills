import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  SlidersHorizontal,
  Sun,
  Moon,
  Bell,
  Mail,
  CalendarClock,
  Megaphone,
  UserCog,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { updateSettingsRequest } from '../api/auth.js';
import Spinner from '../components/Spinner.jsx';

const DASHBOARD_BY_ROLE = { admin: '/admin', instructor: '/instructor', student: '/student' };

/** A reusable toggle switch. */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-gradient-to-r from-sky-500 to-brand-600' : 'bg-slate-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

const NOTIF_FIELDS = [
  {
    key: 'emailNotifications',
    Icon: Mail,
    title: 'Email notifications',
    desc: 'Master switch for all transactional emails (enrollment, reminders).',
  },
  {
    key: 'reminderEmails',
    Icon: CalendarClock,
    title: 'Assignment reminders',
    desc: 'Get an email when an assignment is due within 24 hours.',
  },
  {
    key: 'productUpdates',
    Icon: Megaphone,
    title: 'Product updates',
    desc: 'Occasional news about new EdSkill.ai features.',
  },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    emailNotifications: user?.settings?.emailNotifications !== false,
    reminderEmails: user?.settings?.reminderEmails !== false,
    productUpdates: user?.settings?.productUpdates !== false,
  });
  const [saving, setSaving] = useState(false);

  const dirty =
    prefs.emailNotifications !== (user?.settings?.emailNotifications !== false) ||
    prefs.reminderEmails !== (user?.settings?.reminderEmails !== false) ||
    prefs.productUpdates !== (user?.settings?.productUpdates !== false);

  const setPref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const saveNotifications = async () => {
    setSaving(true);
    try {
      const { user: updated } = await updateSettingsRequest(prefs);
      updateUser(updated);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={DASHBOARD_BY_ROLE[user.role] || '/'}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <SlidersHorizontal className="h-6 w-6 text-brand-500" /> Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage appearance, notifications and your account.
        </p>
      </div>

      {/* Appearance */}
      <section className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <Sun className="h-5 w-5 text-brand-500" /> Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose how EdSkill.ai looks to you.
            </p>
          </div>
          <div className="flex rounded-xl border border-white/40 bg-white/40 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              onClick={() => setTheme('light')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                !isDark ? 'bg-white text-brand-700 shadow dark:bg-white/10' : 'text-slate-500'
              }`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isDark ? 'bg-white/10 text-sky-300 shadow' : 'text-slate-500'
              }`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <Bell className="h-5 w-5 text-brand-500" /> Notifications
        </h3>

        <div className="divide-y divide-white/30 dark:divide-white/10">
          {NOTIF_FIELDS.map(({ key, Icon, title, desc }) => {
            const disabled = key !== 'emailNotifications' && !prefs.emailNotifications;
            return (
              <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </div>
                <Toggle
                  checked={key === 'emailNotifications' ? prefs[key] : prefs[key] && prefs.emailNotifications}
                  onChange={(v) => !disabled && setPref(key, v)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button onClick={saveNotifications} className="btn-primary" disabled={saving || !dirty}>
            {saving ? <Spinner /> : <Bell className="h-4 w-4" />}
            Save preferences
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="glass-card space-y-3 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <UserCog className="h-5 w-5 text-brand-500" /> Account
        </h3>

        <div className="flex items-center justify-between rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            <span className="text-slate-600 dark:text-slate-300">{user.email}</span>
          </div>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            {user.role}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/profile" className="btn-ghost justify-start">
            <UserCog className="h-4 w-4" /> Edit profile & avatar
          </Link>
          <Link to="/profile" className="btn-ghost justify-start">
            <KeyRound className="h-4 w-4" /> Change password
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </section>
    </div>
  );
}
