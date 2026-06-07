import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible modal. Closes on Esc and backdrop click.
 *
 * Rendered via a portal to <body> so it escapes any ancestor with a CSS
 * `transform`/`filter` (e.g. our `animate-fade-in` page wrappers) — otherwise
 * `position: fixed` would be relative to that ancestor, clipping the modal and
 * leaving part of the screen un-blurred. The portal guarantees a true
 * full-screen overlay that scrolls and never clips.
 */
export default function GlassModal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Full-screen blurred backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Scroll area — centers the panel when it fits, scrolls when it doesn't.
          Clicking the empty area (not the panel) closes the modal. */}
      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`solid-card relative my-8 w-full ${maxWidth} animate-fade-in p-6`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="icon-btn h-8 w-8" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
