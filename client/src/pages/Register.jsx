import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  GraduationCap,
  Presentation,
} from 'lucide-react';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import AuthShell from '../features/auth/AuthShell.jsx';
import GoogleButton from '../features/auth/GoogleButton.jsx';
import Spinner from '../components/Spinner.jsx';

const ROLE_OPTIONS = [
  {
    value: 'student',
    label: 'Student',
    desc: 'Enroll & learn',
    Icon: GraduationCap,
  },
  {
    value: 'instructor',
    label: 'Instructor',
    desc: 'Create courses',
    Icon: Presentation,
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      toast.success(`Account created — welcome, ${user.name.split(' ')[0]}!`);
      navigate(DASHBOARD_BY_ROLE[user.role] || '/', { replace: true });
    },
    onError: (err) => {
      const data = err.response?.data;
      setFieldErrors(data?.fields || {});
      toast.error(data?.message || 'Registration failed. Please try again.');
    },
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate(form);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the AI-powered learning platform."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* Role selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
            I want to join as
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map(({ value, label, desc, Icon }) => {
              const active = form.role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, role: value })}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-sky-400 bg-sky-400/10 ring-2 ring-sky-400/50'
                      : 'border-white/40 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? 'text-sky-500' : 'text-slate-400'}`}
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Jane Doe"
              className="glass-input pl-10"
            />
          </div>
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              className="glass-input pl-10"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
              placeholder="At least 6 characters"
              className="glass-input px-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>
          )}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? <Spinner /> : <UserPlus className="h-4 w-4" />}
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> or <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
      <GoogleButton label="Sign up with Google" />
    </AuthShell>
  );
}
