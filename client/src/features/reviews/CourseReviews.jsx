import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, Trash2, MessageSquare } from 'lucide-react';
import { getReviews, submitReview, deleteReview } from '../../api/reviews.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StarRating from '../../components/StarRating.jsx';
import Spinner from '../../components/Spinner.jsx';

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

/**
 * Reviews list + write/edit form for a course.
 * `canReview` = enrolled (and not the owner).
 */
export default function CourseReviews({ courseId, canReview }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['reviews', courseId], queryFn: () => getReviews(courseId) });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Pre-fill the form from the user's existing review.
  useEffect(() => {
    if (data?.mine) {
      setRating(data.mine.rating);
      setComment(data.mine.comment || '');
    }
  }, [data?.mine]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['reviews', courseId] });
    qc.invalidateQueries({ queryKey: ['publicCourse', courseId] });
    qc.invalidateQueries({ queryKey: ['browse'] });
  };

  const saveMut = useMutation({
    mutationFn: () => submitReview(courseId, { rating, comment }),
    onSuccess: () => { invalidate(); toast.success('Review saved'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save review'),
  });

  const delMut = useMutation({
    mutationFn: (id) => deleteReview(id),
    onSuccess: () => { invalidate(); setRating(0); setComment(''); toast.success('Review removed'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  const reviews = data?.reviews || [];

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        <Star className="h-5 w-5 text-amber-400" /> Ratings & reviews
      </h2>

      {/* Summary */}
      <div className="glass-card mb-4 flex items-center gap-4 p-5">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
            {data?.ratingAvg ? Number(data.ratingAvg).toFixed(1) : '—'}
          </p>
          <StarRating value={data?.ratingAvg || 0} />
          <p className="mt-1 text-xs text-slate-400">{data?.ratingCount || 0} review{data?.ratingCount === 1 ? '' : 's'}</p>
        </div>
        <div className="flex-1 text-sm text-slate-500 dark:text-slate-400">
          {data?.ratingCount > 0
            ? 'What learners say about this course.'
            : 'No reviews yet — be the first to share your experience.'}
        </div>
      </div>

      {/* Write / edit */}
      {canReview && (
        <div className="glass-card mb-5 p-5">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {data?.mine ? 'Edit your review' : 'Write a review'}
          </p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share what you liked or what could be better… (optional)"
            className="glass-input mt-3 resize-none text-sm"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || rating < 1}
              className="btn-primary"
            >
              {saveMut.isPending ? <Spinner /> : null}
              {data?.mine ? 'Update review' : 'Submit review'}
            </button>
            {data?.mine && (
              <button
                onClick={() => delMut.mutate(data.mine._id)}
                disabled={delMut.isPending}
                className="btn-ghost text-rose-500"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8 text-slate-400"><Spinner className="h-5 w-5" /></div>
      ) : reviews.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <MessageSquare className="h-6 w-6 text-slate-400" />
          No written reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-brand-600 text-xs font-bold text-white">
                  {r.student?.avatar ? (
                    <img src={r.student.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(r.student?.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {r.student?.name || 'Student'}
                    {user && String(r.student?._id) === String(user.id) && (
                      <span className="ml-2 text-xs font-normal text-sky-500">(you)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} />
                    <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
