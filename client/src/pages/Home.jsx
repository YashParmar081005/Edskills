import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  MessagesSquare,
  Award,
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  Bot,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Users,
  Layers,
  Star,
  Quote,
  ChevronDown,
} from 'lucide-react';
import { getHealth } from '../api/health.js';
import { useAuth, DASHBOARD_BY_ROLE } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

// Three.js is heavy and only used on the landing page — load it in its own chunk.
const ThreeBackground = lazy(() => import('../components/ThreeBackground.jsx'));

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { Icon: BrainCircuit, title: 'AI Quiz Generation', text: 'Auto-create multiple-choice quizzes from any lesson — and grade them instantly.' },
  { Icon: MessagesSquare, title: 'Course Q&A (RAG)', text: 'Ask anything and get answers grounded in your own course material, with citations.' },
  { Icon: ClipboardCheck, title: 'AI Assignment Grading', text: 'Students submit text or files; AI returns a score and constructive feedback in seconds.' },
  { Icon: Award, title: 'Verifiable Certificates', text: 'Earn shareable certificates with a public verification link on completion.' },
  { Icon: BarChart3, title: 'Live Analytics', text: 'Track engagement, quiz scores and progress across every course you run.' },
  { Icon: CreditCard, title: 'Seamless Checkout', text: 'Stripe-powered enrollment with automatic access — free or paid courses.' },
];

const STEPS = [
  { n: '01', Icon: GraduationCap, title: 'Create or enroll', text: 'Instructors build courses with modules & lessons. Students browse the catalog and enroll in a click.' },
  { n: '02', Icon: Bot, title: 'Learn with AI', text: 'Watch lessons, take AI-generated quizzes, and ask the built-in AI tutor anything — 24/7.' },
  { n: '03', Icon: Award, title: 'Get certified', text: 'Complete the course, track your progress to 100%, and earn a verifiable certificate.' },
];

const ROLES = [
  { Icon: ShieldCheck, title: 'Admins', color: 'from-rose-400 to-rose-600', points: ['Manage users & roles', 'Platform-wide analytics', 'Announcements & payments'] },
  { Icon: Layers, title: 'Instructors', color: 'from-amber-400 to-orange-500', points: ['Build courses & lessons', 'AI quizzes & grading', 'Answer discussions'] },
  { Icon: Users, title: 'Students', color: 'from-sky-400 to-brand-600', points: ['Browse & enroll', 'Quizzes, progress & certs', 'Ask the AI tutor'] },
];

const STATS = [
  { value: 6, suffix: '+', label: 'AI-powered tools' },
  { value: 3, suffix: '', label: 'Roles in one app' },
  { value: 100, suffix: '%', label: 'Auto-graded quizzes' },
  { value: 24, suffix: '/7', label: 'AI study buddy' },
];

const TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    role: 'CS Student',
    quote:
      'The AI quizzes and tutor made revising so much faster. It feels like having a teacher on call 24/7.',
  },
  {
    name: 'Priya Nair',
    role: 'Instructor',
    quote:
      'I built a full course in an afternoon — AI generated my quizzes and graded assignments for me.',
  },
  {
    name: 'Diego Martín',
    role: 'Bootcamp Lead',
    quote:
      'One platform for courses, discussions, payments and certificates. It replaced three tools for us.',
  },
];

const FAQS = [
  {
    q: 'Do I need an API key to use the AI features?',
    a: 'No — the platform ships with Groq-powered AI built in. Generate quizzes, grade answers and chat with the tutor right out of the box.',
  },
  {
    q: 'Can I sell paid courses?',
    a: 'Yes. Checkout is powered by Stripe — free courses enroll instantly, and paid courses unlock automatically after payment.',
  },
  {
    q: 'How do certificates work?',
    a: 'When a student completes 100% of a course they earn a PDF certificate with a public verification link anyone can check.',
  },
  {
    q: 'Is it suitable for teams and schools?',
    a: 'Absolutely. Admins manage users and roles, instructors build courses, and students learn — each with a tailored dashboard.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="font-semibold text-slate-900 dark:text-white">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-brand-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300">{a}</p>}
    </div>
  );
}

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
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance — plain timeline, plays on load and always ends visible.
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-hero] > *', { y: 34, opacity: 0, stagger: 0.12, duration: 0.8 })
        .from('[data-hero-visual]', { x: 40, opacity: 0, duration: 0.9 }, '-=0.6');

      // Gentle perpetual float on the hero mock cards
      gsap.to('[data-float]', {
        y: -16,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 3,
        stagger: 0.5,
      });

      // Scroll reveals. KEY: `fromTo` with `immediateRender: false` means the
      // hidden state is applied ONLY when the trigger fires — so if a trigger
      // ever misfires, content stays fully visible instead of stuck invisible.
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 44, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          }
        );
      });

      // Staggered children reveals (cards, steps, stats)
      gsap.utils.toArray('[data-stagger]').forEach((group) => {
        gsap.fromTo(
          group.children,
          { y: 36, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out',
            immediateRender: false,
            scrollTrigger: { trigger: group, start: 'top 95%', once: true },
          }
        );
      });

      // Count-up numbers (DOM shows the final value by default; animates from 0
      // only once the trigger fires, so a misfire still shows the real number).
      gsap.utils.toArray('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: 'power1.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          onStart: () => {
            el.textContent = `0${suffix}`;
          },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.v)}${suffix}`;
          },
        });
      });
    }, root);

    // Recompute trigger positions after the page fully lays out (lazy WebGL
    // canvas, web fonts) so triggers fire at the right scroll points.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('load', onLoad);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="relative min-h-screen overflow-x-hidden">
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>

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

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div data-hero className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-white/50 backdrop-blur-md dark:bg-white/5 dark:text-brand-300 dark:ring-white/10">
              <Sparkles className="h-4 w-4" />
              AI-powered learning, beautifully simple
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl">
              Learn smarter with{' '}
              <span className="bg-gradient-to-r from-sky-400 via-brand-500 to-brand-700 bg-clip-text text-transparent">
                EdSkill.ai
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300 md:mx-0">
              Build courses, generate quizzes with AI, grade automatically, and track progress —
              all in one glassy, modern platform for admins, instructors, and students.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start">
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

            <div className="mt-8 flex justify-center md:justify-start">
              <HealthPill />
            </div>
          </div>

          {/* Floating mock cards */}
          <div data-hero-visual className="relative hidden h-[420px] md:block">
            <div data-float className="glass-card absolute right-6 top-2 w-72 p-5">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-300">
                <BrainCircuit className="h-5 w-5" />
                <span className="text-sm font-bold">AI Quiz · React Hooks</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                What does <code className="rounded bg-sky-500/10 px-1">useEffect</code> run after?
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="rounded-lg border border-green-400/40 bg-green-400/10 px-3 py-2 text-green-700 dark:text-green-300">
                  ✓ Every render after commit
                </div>
                <div className="rounded-lg border border-white/40 bg-white/40 px-3 py-2 text-slate-500 dark:border-white/10 dark:bg-white/5">
                  Before the first paint
                </div>
              </div>
            </div>

            <div data-float className="glass-card absolute left-0 top-36 w-64 p-5">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-300">
                <Bot className="h-5 w-5" />
                <span className="text-sm font-bold">AI Tutor</span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                “Explain closures with a simple example.”
              </p>
              <div className="mt-2 rounded-lg bg-gradient-to-br from-sky-400/15 to-brand-600/15 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">
                A closure lets a function remember the variables around it…
              </div>
            </div>

            <div data-float className="glass-card absolute bottom-0 right-10 flex w-56 items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Certificate earned</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">100% complete</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section
          data-stagger
          className="glass-card grid grid-cols-2 gap-6 p-8 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div
                data-count={s.value}
                data-suffix={s.suffix}
                className="bg-gradient-to-r from-sky-400 to-brand-600 bg-clip-text text-4xl font-extrabold text-transparent"
              >
                {s.value}{s.suffix}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="py-20">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Everything you need to teach & learn
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              A complete, AI-native learning stack — no plugins, no glue code.
            </p>
          </div>

          <div data-stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="glass-card group p-6 text-left transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white transition group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-12">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Three steps from sign-up to certificate.</p>
          </div>

          <div data-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ n, Icon, title, text }) => (
              <div key={n} className="glass-card relative overflow-hidden p-7">
                <span className="absolute -right-2 -top-4 text-7xl font-black text-sky-500/10 dark:text-white/5">
                  {n}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="py-12">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Built for every role
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              One platform, tailored dashboards for admins, instructors and students.
            </p>
          </div>

          <div data-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {ROLES.map(({ Icon, title, color, points }) => (
              <div key={title} className="glass-card p-7">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <ul className="mt-3 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Loved by learners & educators
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Real outcomes from students, instructors and teams.
            </p>
          </div>

          <div data-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card flex flex-col p-6">
                <Quote className="h-7 w-7 text-sky-400/60" />
                <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-300">“{t.quote}”</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-brand-600 text-sm font-bold text-white">
                    {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12">
          <div data-reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Everything you might be wondering.</p>
          </div>

          <div data-stagger className="mx-auto mt-10 max-w-2xl space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section data-reveal className="py-20">
          <div className="glass-card relative overflow-hidden p-10 text-center md:p-16">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-sky-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Ready to learn smarter?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
              Join EdSkill.ai and turn any topic into an interactive, AI-assisted course today.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              {isAuthenticated ? (
                <Link to={dash} className="btn-primary px-7 py-3 text-base">
                  Go to dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary px-7 py-3 text-base">
                    Get started free <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link to="/courses" className="btn-ghost px-7 py-3 text-base">
                    Browse courses
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/30 pt-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} EdSkill.ai — built with the MERN stack & Groq AI.</p>
        </div>
      </footer>
    </div>
  );
}
