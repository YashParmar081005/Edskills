import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, X, Send, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { chatAssistant } from '../../api/ai.js';
import { useAuth } from '../../context/AuthContext.jsx';

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm your AI LMS assistant. Ask me how to use the platform, or anything about the course you're viewing.",
  citations: [],
};

/**
 * Universal floating AI assistant (bottom-right, on every authenticated page).
 * Course-aware: when the URL points at a course, answers can be grounded in
 * that course's lessons (with citations).
 */
export default function AiAgent() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Detect a course id in the current route (/learn/:id or /courses/:id/...).
  const match = pathname.match(/\/(?:learn|courses)\/([0-9a-fA-F]{24})/);
  const courseId = match ? match[1] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  if (!isAuthenticated) return null;

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
        next.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
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

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="AI assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-brand-600 text-white shadow-glow transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="solid-card fixed bottom-24 right-6 z-40 flex h-[32rem] w-[23rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-brand-600 text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <h3 className="font-bold text-slate-900 dark:text-white">AI Assistant</h3>
              <p className="text-[11px] text-slate-400">
                {courseId ? 'Course-aware · answers from lessons' : 'Platform & study help'}
              </p>
            </div>
          </div>

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

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-white/10">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={courseId ? 'Ask about this course…' : 'Ask me anything…'}
              className="glass-input !py-2 text-sm"
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary shrink-0 !px-3 !py-2">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
