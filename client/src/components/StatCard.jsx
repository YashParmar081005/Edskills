export default function StatCard({ icon: Icon, label, value, accent = 'from-sky-400 to-brand-600' }) {
  return (
    <div className="glass-card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}
