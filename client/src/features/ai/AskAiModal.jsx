import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { chatAssistant } from '../../api/ai.js';

/**
 * Course-scoped "Ask AI" chat, opened from the Ask & Discuss hub. Answers are
 * grounded in the selected course's lessons (with lesson citations) via the
 * same /ai/chat endpoint the floating assistant uses.
 */
export default function AskAiModal({ open, onClose, courseId, courseTitle }) {
  const greeting = {
    role: 'assistant',
    content: courseTitle
      ? `Hi! Ask me anything about "${courseTitle}" — I'll answer from the course's lessons.`
      : "Hi! Ask me anything about this course.",
    citations: [],
  };

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([greeting]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Reset the conversation each time it's opened for a (possibly different) course.
  useEffect(() => {
    if (open) {
      setMessages([greeting]);
      setInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  if (!open) return null;

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { reply, citations } = await chatAssistant(
        next.filter((m) => m !== greeting).map((m) => ({ role: m.role, content: m.content })),
        courseId
      );
      setMessages((m) => [...m, { role: 'assistant', content: reply, citations: citations || [] }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Sorry, I had trouble answering. Try again.',
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="solid-card relative my-8 flex h-[34rem] max-h-[calc(100vh-4rem)] w-full max-w-lg animate-fade-in flex-col overflow-hidden p-0"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-brand-600 text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <h3 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-brand-500" /> Ask AI
              </h3>
              <p className="truncate text-[11px] text-slate-400">
                {courseTitle ? `${courseTitle} · answers from lessons` : 'Course assistant'}
              </p>
            </div>
            <button onClick={onClose} className="icon-btn h-8 w-8" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'assistant' && m.citations?.length > 0 && courseId && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => (
                      <Link
                        key={c.lessonId}
                        to={`/learn/${courseId}/${c.lessonId}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-600 hover:bg-sky-500/25 dark:text-sky-300"
                      >
                        <BookOpen className="h-3 w-3" /> {c.lessonTitle}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-white/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this course…"
              className="glass-input !py-2 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0 !px-3 !py-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
