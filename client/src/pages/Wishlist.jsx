import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Compass } from 'lucide-react';
import { getWishlist } from '../api/wishlist.js';
import PublicCourseCard from '../features/learn/PublicCourseCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Wishlist() {
  const { data, isLoading } = useQuery({ queryKey: ['wishlist', 'list'], queryFn: getWishlist });
  const courses = data?.courses || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link to="/student" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Heart className="h-6 w-6 text-rose-500" /> Saved courses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Courses you saved for later.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 text-white">
            <Heart className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No saved courses yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Tap the heart on any course in Browse to save it here for later.
          </p>
          <Link to="/courses" className="btn-primary mt-2">
            <Compass className="h-4 w-4" /> Browse courses
          </Link>
        </div>
      )}

      {courses.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <PublicCourseCard key={c._id} course={c} showWishlist />
          ))}
        </div>
      )}
    </div>
  );
}
