import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Trophy,
  Star,
  Target,
  Footprints,
  HelpCircle,
  Medal,
  Award,
  ChevronRight,
} from 'lucide-react';
import { getMyGamification } from '../../api/gamification.js';

const ICONS = {
  footprints: Footprints,
  trophy: Trophy,
  help: HelpCircle,
  target: Target,
  flame: Flame,
  star: Star,
  medal: Medal,
};

export default function GamificationWidget() {
  const { data, isLoading } = useQuery({ queryKey: ['gamification', 'me'], queryFn: getMyGamification });

  if (isLoading || !data) return null;

  const pct = Math.min(100, Math.round((data.xpIntoLevel / data.xpForLevel) * 100));
  const earned = data.badges || [];
  const earnedKeys = new Set(earned.map((b) => b.key));
  const catalog = data.catalog || {};
  const locked = Object.entries(catalog).filter(([k]) => !earnedKeys.has(k));

  return (
    <section className="glass-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Level + XP */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/30 dark:stroke-white/10" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none" stroke="url(#xpgrad)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
              />
              <defs>
                <linearGradient id="xpgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">{data.level}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Level {data.level}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.xpIntoLevel}/{data.xpForLevel} XP · {data.xp} total
            </p>
            <p className="text-[11px] text-slate-400">Rank #{data.rank}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2">
          <Flame className={`h-6 w-6 ${data.streak?.current > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{data.streak?.current || 0}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">day streak</p>
          </div>
        </div>

        <Link to="/student/leaderboard" className="btn-ghost text-sm">
          <Trophy className="h-4 w-4" /> Leaderboard <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* XP bar */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
        <div className="h-full bg-gradient-to-r from-sky-400 to-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Badges */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Badges · {earned.length}/{earned.length + locked.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {earned.map((b) => {
            const Icon = ICONS[b.icon] || Award;
            return (
              <span
                key={b.key}
                title={b.desc}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-400/40 dark:text-amber-300"
              >
                <Icon className="h-3.5 w-3.5" /> {b.label}
              </span>
            );
          })}
          {locked.map(([key, b]) => {
            const Icon = ICONS[b.icon] || Award;
            return (
              <span
                key={key}
                title={`Locked · ${b.desc}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-white/30 dark:bg-white/5 dark:ring-white/10"
              >
                <Icon className="h-3.5 w-3.5 opacity-60" /> {b.label}
              </span>
            );
          })}
          {earned.length === 0 && locked.length === 0 && (
            <span className="text-xs text-slate-400">Complete lessons and quizzes to earn badges.</span>
          )}
        </div>
      </div>
    </section>
  );
}
