import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const ROLE_STYLES = {
  admin: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',
  instructor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  student: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',
};

function initials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3">
        <Logo />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="btn-ghost !px-2 !py-1.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-brand-600 text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-none">
                    {user.name}
                  </span>
                  <span
                    className={`mt-0.5 inline-block rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${ROLE_STYLES[user.role]}`}
                  >
                    {user.role}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>

              {open && (
                <div className="glass-card absolute right-0 mt-2 w-56 animate-fade-in p-2">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-brand-500" />
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
