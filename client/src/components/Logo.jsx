import { GraduationCap } from 'lucide-react';

export default function Logo({ withText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-glow">
        <GraduationCap className="h-6 w-6" />
      </div>
      {withText && (
        <div className="leading-tight">
          <span className="block bg-gradient-to-r from-sky-500 to-brand-600 bg-clip-text text-lg font-extrabold text-transparent dark:from-sky-300 dark:to-brand-400">
            EdSkill.ai
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Learn smarter
          </span>
        </div>
      )}
    </div>
  );
}
