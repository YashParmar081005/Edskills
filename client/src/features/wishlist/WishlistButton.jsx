import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { getWishlistIds, toggleWishlist } from '../../api/wishlist.js';

export const wishlistIdsKey = ['wishlist', 'ids'];

export function useWishlistIds() {
  return useQuery({ queryKey: wishlistIdsKey, queryFn: getWishlistIds, staleTime: 30_000 });
}

/**
 * Heart toggle to save/unsave a course. Safe to render inside a <Link> card —
 * it stops the click from navigating.
 */
export default function WishlistButton({ courseId, className = '', size = 'md' }) {
  const qc = useQueryClient();
  const { data: ids = [] } = useWishlistIds();
  const saved = ids.includes(String(courseId));

  const mut = useMutation({
    mutationFn: () => toggleWishlist(courseId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: wishlistIdsKey });
      const prev = qc.getQueryData(wishlistIdsKey) || [];
      const next = saved ? prev.filter((id) => id !== String(courseId)) : [...prev, String(courseId)];
      qc.setQueryData(wishlistIdsKey, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(wishlistIdsKey, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistIdsKey });
      qc.invalidateQueries({ queryKey: ['wishlist', 'list'] });
    },
  });

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from saved' : 'Save for later'}
      title={saved ? 'Saved — click to remove' : 'Save for later'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mut.mutate();
      }}
      className={`flex ${dim} items-center justify-center rounded-full backdrop-blur-md transition ${
        saved
          ? 'bg-rose-500/90 text-white'
          : 'bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-900/60 dark:text-slate-200'
      } ${className}`}
    >
      <Heart className={`${icon} ${saved ? 'fill-current' : ''}`} />
    </button>
  );
}
