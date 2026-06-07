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
