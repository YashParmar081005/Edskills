import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, NotebookPen, Bookmark, BookOpen, Video, FileText } from 'lucide-react';
import { getMyNotes, getMyBookmarks } from '../api/notes.js';
import Spinner from '../components/Spinner.jsx';

export default function MyNotes() {
  const [tab, setTab] = useState('notes');
  const notesQ = useQuery({ queryKey: ['my-notes'], queryFn: getMyNotes });
  const bmQ = useQuery({ queryKey: ['my-bookmarks'], queryFn: getMyBookmarks });

  const notes = notesQ.data || [];
  const bookmarks = bmQ.data || [];
  const loading = tab === 'notes' ? notesQ.isLoading : bmQ.isLoading;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/student" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <NotebookPen className="h-6 w-6 text-brand-500" /> Notes & Bookmarks
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Everything you've jotted down and saved while learning.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('notes')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-semibold transition ${tab === 'notes' ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white' : 'border border-white/40 bg-white/40 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}
        >
          <NotebookPen className="h-4 w-4" /> Notes ({notes.length})
        </button>
        <button
          onClick={() => setTab('bookmarks')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-semibold transition ${tab === 'bookmarks' ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white' : 'border border-white/40 bg-white/40 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}
        >
          <Bookmark className="h-4 w-4" /> Bookmarks ({bookmarks.length})
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {/* Notes */}
      {!loading && tab === 'notes' && (
        notes.length === 0 ? (
          <Empty icon={NotebookPen} title="No notes yet" hint="Open a lesson and use the Notes panel to write while you learn." />
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <Link
                key={n._id}
                to={n.course ? `/learn/${n.course._id}/${n.lesson?._id || ''}` : '#'}
                className="glass-card block p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                <p className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-300">
                  <BookOpen className="h-3.5 w-3.5" /> {n.course?.title} · {n.lesson?.title}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 line-clamp-4">
                  {n.content}
                </p>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Bookmarks */}
      {!loading && tab === 'bookmarks' && (
        bookmarks.length === 0 ? (
          <Empty icon={Bookmark} title="No bookmarks yet" hint="Bookmark a lesson from the player to find it quickly later." />
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <Link
                key={b._id}
                to={b.course ? `/learn/${b.course._id}/${b.lesson?._id || ''}` : '#'}
                className="glass-card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
                  {b.lesson?.type === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{b.lesson?.title}</p>
                  <p className="truncate text-xs text-slate-400">{b.course?.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Empty({ icon: Icon, title, hint }) {
  return (
    <div className="glass-card flex flex-col items-center gap-2 p-12 text-center">
      <Icon className="h-7 w-7 text-slate-400" />
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
