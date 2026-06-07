import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  MessagesSquare,
  Award,
  LayoutDashboard,
} from 'lucide-react';
import { getHealth } from '../api/health.js';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const FEATURES = [
  { Icon: BrainCircuit, title: 'AI Quiz Generation', text: 'Auto-create quizzes & grade answers with AI.' },
  { Icon: MessagesSquare, title: 'Course Q&A (RAG)', text: 'Ask questions, get cited answers from lessons.' },
  { Icon: Award, title: 'Certificates', text: 'Earn verifiable certificates on completion.' },
];

function HealthPill() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const ok = data?.status === 'ok';
  const label = isLoading ? 'checking…' : isError ? 'offline' : ok ? 'online' : 'degraded';
  const color = isError || (!ok && !isLoading) ? 'bg-rose-500' : isLoading ? 'bg-amber-400' : 'bg-green-500';
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-white/40 backdrop-blur-md dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
      <span className={`h-2 w-2 rounded-full ${color} ${isLoading ? 'animate-pulse' : ''}`} />
      API {label}
      {data?.db && <span className="opacity-60">· db {data.db}</span>}
    </span>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const dash = user ? DASHBOARD_BY_ROLE[user.role] : null;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to={dash} className="btn-primary">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="animate-fade-in py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-white/50 backdrop-blur-md dark:bg-white/5 dark:text-brand-300 dark:ring-white/10">
            <Sparkles className="h-4 w-4" />
            AI-powered learning, beautifully simple
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl">
            Learn smarter with the{' '}
            <span className="bg-gradient-to-r from-sky-400 via-brand-500 to-brand-700 bg-clip-text text-transparent">
              AI LMS
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Build courses, generate quizzes with AI, grade automatically, and track
            progress — all in one glassy, modern platform for admins, instructors,
            and students.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={dash} className="btn-primary px-6 py-3 text-base">
                Go to dashboard <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary px-6 py-3 text-base">
                  Create free account <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/login" className="btn-ghost px-6 py-3 text-base">
                  I already have an account
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <HealthPill />
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-6 pb-20 sm:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="glass-card p-6 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
