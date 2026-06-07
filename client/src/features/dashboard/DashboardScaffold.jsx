import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Reusable dashboard scaffold: a glass hero header + a grid of feature cards.
 * Each dashboard (admin/instructor/student) passes its own greeting + cards.
 * A card with a `to` prop becomes a clickable link (and drops the "Soon" badge).
 */
export default function DashboardScaffold({ accent, badge, title, blurb, cards = [] }) {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <section className="glass-card overflow-hidden p-8">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${accent.badge}`}>
          <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
          {badge}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}, <span className={accent.text}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{blurb}</p>
      </section>

      {/* Feature cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ Icon, label, desc, soon, to }) => {
          const inner = (
            <>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent.iconBg}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{label}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              {soon && !to && (
                <span className="absolute right-4 top-4 rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-white/40 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                  Soon
                </span>
              )}
            </>
          );
          const cls =
            'glass-card group relative p-6 transition hover:-translate-y-0.5 hover:shadow-glow' +
            (to ? ' block cursor-pointer' : '');
          return to ? (
            <Link key={label} to={to} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={label} className={cls}>
              {inner}
            </div>
          );
        })}
      </section>
    </div>
  );
}
