import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Star rating — display or interactive.
 * - Display:    <StarRating value={4.5} count={12} />
 * - Interactive:<StarRating value={rating} onChange={setRating} size="lg" />
 */
export default function StarRating({ value = 0, onChange, count, size = 'sm', showValue = false }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const dim = size === 'lg' ? 'h-7 w-7' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const shown = hover || value;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(shown);
          const Btn = interactive ? 'button' : 'span';
          return (
            <Btn
              key={n}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onChange(n) : undefined}
              onMouseEnter={interactive ? () => setHover(n) : undefined}
              onMouseLeave={interactive ? () => setHover(0) : undefined}
              className={interactive ? 'cursor-pointer transition hover:scale-110' : 'leading-none'}
              aria-label={interactive ? `Rate ${n} star${n > 1 ? 's' : ''}` : undefined}
            >
              <Star
                className={`${dim} ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
            </Btn>
          );
        })}
      </span>
      {showValue && value > 0 && (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {Number(value).toFixed(1)}
        </span>
      )}
      {typeof count === 'number' && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </span>
  );
}
