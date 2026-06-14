import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { browseCourses } from '../api/courses.js';

/** Global course search with a live results dropdown (navbar). */
export default function NavSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['nav-search', q],
    queryFn: () => browseCourses({ q }),
    enabled: q.length >= 2,
    staleTime: 20_000,
  });

  const top = results.slice(0, 6);

  const goAll = () => {
    if (!term.trim()) return;
    setOpen(false);
    navigate(`/courses?q=${encodeURIComponent(term.trim())}`);
  };

  const goCourse = (id) => {
    setOpen(false);
    setTerm('');
    navigate(`/courses/${id}`);
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <form
        onSubmit={(e) => { e.preventDefault(); goAll(); }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={term}
          onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search courses…"
          className="w-44 rounded-xl border border-white/40 bg-white/40 py-1.5 pl-9 pr-3 text-sm text-slate-700 outline-none backdrop-blur-md transition focus:w-60 focus:ring-2 focus:ring-sky-400/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        />
      </form>

      {open && q.length >= 2 && (
        <div className="solid-card absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden p-0">
          {isFetching && top.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : top.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">No courses match “{q}”.</p>
          ) : (
            <>
              {top.map((c) => (
                <button
                  key={c._id}
                  onClick={() => goCourse(c._id)}
                  className="flex w-full items-center gap-3 border-b border-white/15 px-4 py-2.5 text-left transition last:border-0 hover:bg-white/40 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-sky-400/30 to-brand-600/30">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-white/70" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</span>
                    <span className="block truncate text-xs text-slate-400">{c.instructor?.name || 'Instructor'} · {c.category}</span>
                  </span>
                </button>
              ))}
              <button
                onClick={goAll}
                className="flex w-full items-center justify-center gap-1 bg-white/30 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-white/50 dark:bg-white/5 dark:text-brand-300"
              >
                See all results <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
