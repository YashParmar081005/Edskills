import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Compass } from 'lucide-react';
import { useBrowseCourses } from '../features/learn/hooks.js';
import { CATEGORIES } from '../features/courses/CourseFormModal.jsx';
import PublicCourseCard from '../features/learn/PublicCourseCard.jsx';
import Spinner from '../components/Spinner.jsx';

const FILTER_CATEGORIES = ['All', ...CATEGORIES];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'priceLow', label: 'Price: low to high' },
  { value: 'priceHigh', label: 'Price: high to low' },
];

export default function BrowseCourses() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  // debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: courses, isLoading, isFetching, isError } = useBrowseCourses({
    q: q || undefined,
    category: category === 'All' ? undefined : category,
    sort,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Compass className="h-6 w-6 text-brand-500" /> Browse courses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Discover published courses and start learning.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, topics, tags…"
            className="glass-input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input !py-2 text-sm"
          >
            {FILTER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="glass-input !py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          Couldn't load courses. Is the server running?
        </div>
      )}

      {!isLoading && courses?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses found</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Try a different search or category. New courses appear here once
            instructors publish them.
          </p>
        </div>
      )}

      {courses?.length > 0 && (
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}>
          {courses.map((c) => (
            <PublicCourseCard key={c._id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
