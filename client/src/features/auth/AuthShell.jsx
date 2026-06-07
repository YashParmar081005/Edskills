import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';

/**
 * Centered glass card used by the Login & Register pages.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="glass-card w-full max-w-md animate-fade-in p-8">
          <h1 className="bg-gradient-to-r from-sky-500 to-brand-600 bg-clip-text text-2xl font-extrabold text-transparent dark:from-sky-300 dark:to-brand-400">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
