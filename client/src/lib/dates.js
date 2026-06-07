export function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Describe a due date relative to now.
 * @returns {{label:string, overdue:boolean}}
 */
export function dueInfo(iso) {
  if (!iso) return { label: 'No due date', overdue: false };
  const due = new Date(iso);
  const now = new Date();
  const overdue = now > due;
  return { label: `Due ${formatDateTime(iso)}`, overdue };
}
