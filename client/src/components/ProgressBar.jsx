/**
 * Slim glassy progress bar with a sky→brand gradient fill.
 */
export default function ProgressBar({ percent = 0, showLabel = false, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{pct}% complete</span>
          {pct === 100 && <span className="font-semibold text-green-500">Done 🎉</span>}
        </div>
      )}
    </div>
  );
}
