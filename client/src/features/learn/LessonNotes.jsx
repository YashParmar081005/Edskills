import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { NotebookPen, Bookmark, Check, Loader2 } from 'lucide-react';
import { getCourseStudyState, saveLessonNote, toggleBookmark } from '../../api/notes.js';

/**
 * Per-lesson notes + bookmark, shown in the course player. Notes are saved on
 * blur (and via the Save button); bookmarks toggle instantly.
 */
export default function LessonNotes({ courseId, lessonId }) {
  const qc = useQueryClient();
  const stateKey = ['study-state', courseId];
  const { data } = useQuery({
    queryKey: stateKey,
    queryFn: () => getCourseStudyState(courseId),
    enabled: !!courseId,
  });

  const savedNote = data?.notes?.[lessonId] || '';
  const bookmarked = (data?.bookmarkLessonIds || []).includes(String(lessonId));

  const [text, setText] = useState(savedNote);
  const [dirty, setDirty] = useState(false);

  // Reset the editor when switching lessons (or when server data first arrives).
  useEffect(() => {
    setText(savedNote);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, savedNote]);

  const saveMut = useMutation({
    mutationFn: () => saveLessonNote(lessonId, text),
    onSuccess: () => {
      setDirty(false);
      qc.invalidateQueries({ queryKey: stateKey });
      qc.invalidateQueries({ queryKey: ['my-notes'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save note'),
  });

  const bmMut = useMutation({
    mutationFn: () => toggleBookmark(lessonId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: stateKey });
      const prev = qc.getQueryData(stateKey);
      if (prev) {
        const ids = prev.bookmarkLessonIds || [];
        qc.setQueryData(stateKey, {
          ...prev,
          bookmarkLessonIds: bookmarked
            ? ids.filter((id) => id !== String(lessonId))
            : [...ids, String(lessonId)],
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(stateKey, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: stateKey });
      qc.invalidateQueries({ queryKey: ['my-bookmarks'] });
    },
  });

  const save = () => {
    if (dirty && text.trim() !== savedNote.trim()) saveMut.mutate();
  };

  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <NotebookPen className="h-5 w-5 text-brand-500" /> My notes
        </h3>
        <button
          onClick={() => bmMut.mutate()}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            bookmarked
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'border border-white/40 bg-white/40 text-slate-600 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
          {bookmarked ? 'Bookmarked' : 'Bookmark lesson'}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
        onBlur={save}
        rows={5}
        placeholder="Write notes for this lesson… (saved automatically)"
        className="glass-input resize-none text-sm"
      />

      <div className="mt-2 flex items-center justify-end gap-2 text-xs">
        {saveMut.isPending ? (
          <span className="inline-flex items-center gap-1 text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
        ) : dirty ? (
          <button onClick={save} className="btn-primary !py-1.5 text-xs">Save note</button>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400"><Check className="h-3.5 w-3.5 text-green-500" /> Saved</span>
        )}
      </div>
    </div>
  );
}
