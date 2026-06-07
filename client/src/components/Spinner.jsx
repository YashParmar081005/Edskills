import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/** Full-screen centered loader (used while the session restores). */
export function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
