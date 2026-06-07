import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  UserCog,
  Mail,
  ShieldCheck,
  CalendarDays,
  Camera,
  Loader2,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Wand2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  updateProfileRequest,
  changePasswordRequest,
  uploadAvatarRequest,
} from '../api/auth.js';
import { generateAvatars } from '../api/ai.js';
import { setAccessToken } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';

const ROLE_STYLES = {
  admin: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',
  instructor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  student: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',
};

const DASHBOARD_BY_ROLE = { admin: '/admin', instructor: '/instructor', student: '/student' };

function initials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  // ---- Profile form -------------------------------------------------------
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---- AI avatar generator ------------------------------------------------
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarOptions, setAvatarOptions] = useState([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { avatars } = await generateAvatars(avatarPrompt.trim());
      setAvatarOptions(avatars || []);
      if (!avatars?.length) toast.error('No avatars came back — try again');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate avatars');
    } finally {
      setGenerating(false);
    }
  };

  const dirty =
    form.name.trim() !== user?.name ||
    form.email.trim() !== user?.email ||
    (form.avatar || '') !== (user?.avatar || '');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAvatarRequest(file);
      setForm((f) => ({ ...f, avatar: url }));
      toast.success('Photo uploaded — click Save to keep it');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSavingProfile(true);
    try {
      const { user: updated } = await updateProfileRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        avatar: form.avatar,
      });
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ---- Password form ------------------------------------------------------
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const onPwdChange = (e) => setPwd({ ...pwd, [e.target.name]: e.target.value });

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    setSavingPwd(true);
    try {
      const data = await changePasswordRequest({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      if (data.accessToken) setAccessToken(data.accessToken);
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPwd(false);
    }
  };

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

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
          <UserCog className="h-6 w-6 text-brand-500" /> My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account details and password.
        </p>
      </div>

      {/* Identity header */}
      <div className="glass-card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-2xl font-bold text-white shadow-lg">
            {form.avatar ? (
              <img src={form.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              initials(user.name)
            )}
          </div>
          <label
            className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-700"
            title="Change photo"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 sm:justify-start">
            <Mail className="h-4 w-4" /> {user.email}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${ROLE_STYLES[user.role]}`}
            >
              <ShieldCheck className="h-3 w-3" /> {user.role}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" /> Joined {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <form onSubmit={saveProfile} className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <UserCog className="h-5 w-5 text-brand-500" /> Account details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Full name
            </label>
            <input name="name" value={form.name} onChange={onChange} className="glass-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="glass-input"
            />
          </div>
        </div>

        {/* AI avatar generator (replaces the manual URL field) */}
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-brand-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Generate an avatar with AI
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe a vibe and let AI design unique avatars for you.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !generating && (e.preventDefault(), handleGenerate())}
              placeholder="e.g. friendly robot, cosmic explorer, minimalist…"
              className="glass-input text-sm"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary shrink-0 whitespace-nowrap"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? 'Generating…' : avatarOptions.length ? 'Regenerate' : 'Generate with AI'}
            </button>
          </div>

          {avatarOptions.length > 0 && (
            <>
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Pick one, then hit “Save changes”:
              </p>
              <div className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-8">
                {avatarOptions.map((a) => {
                  const selected = form.avatar === a.url;
                  return (
                    <button
                      key={a.url}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, avatar: a.url }))}
                      title={a.seed}
                      className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition hover:scale-105 ${
                        selected ? 'ring-brand-500' : 'ring-transparent hover:ring-sky-400/50'
                      }`}
                    >
                      <img src={a.url} alt={a.seed} className="h-full w-full bg-white/60 object-cover" />
                      {selected && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" className="btn-primary" disabled={savingProfile || !dirty}>
            {savingProfile ? <Spinner /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={savePassword} className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <KeyRound className="h-5 w-5 text-brand-500" /> Change password
        </h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Current password
          </label>
          <div className="relative">
            <input
              name="currentPassword"
              type={showPwd ? 'text' : 'password'}
              value={pwd.currentPassword}
              onChange={onPwdChange}
              className="glass-input pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              New password
            </label>
            <input
              name="newPassword"
              type={showPwd ? 'text' : 'password'}
              value={pwd.newPassword}
              onChange={onPwdChange}
              className="glass-input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Confirm new password
            </label>
            <input
              name="confirm"
              type={showPwd ? 'text' : 'password'}
              value={pwd.confirm}
              onChange={onPwdChange}
              className="glass-input"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="btn-primary"
            disabled={savingPwd || !pwd.currentPassword || !pwd.newPassword}
          >
            {savingPwd ? <Spinner /> : <KeyRound className="h-4 w-4" />}
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
