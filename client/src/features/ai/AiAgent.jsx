import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bot,
  X,
  Send,
  BookOpen,
  Loader2,
  Mic,
  Paperclip,
  FileText,
} from 'lucide-react';
import { chatAssistant, extractDoc } from '../../api/ai.js';
import { useAuth } from '../../context/AuthContext.jsx';

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm your EdSkill.ai assistant. Ask me anything — you can also speak with the mic or attach a PDF/doc to ask about it.",
  citations: [],
};

// Browser speech-to-text (Chrome/Edge/Safari). Null when unsupported.
const SpeechRecognition =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Universal floating AI assistant (bottom-right, on every authenticated page).
 * Course-aware (cites lessons), supports voice input and attaching a document
 * to ask questions about it.
 */
export default function AiAgent() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);

  // Attached document (text extracted server-side).
  const [doc, setDoc] = useState(null); // { name, chars, text }
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileRef = useRef(null);

  // Voice input.
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const voiceBaseRef = useRef('');

  const scrollRef = useRef(null);

  // Detect a course id in the current route (/learn/:id or /courses/:id/...).
  const match = pathname.match(/\/(?:learn|courses)\/([0-9a-fA-F]{24})/);
  const courseId = match ? match[1] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  // Stop listening if the panel closes.
  useEffect(() => {
    if (!open && recognitionRef.current) recognitionRef.current.stop();
  }, [open]);

  if (!isAuthenticated) return null;

  /* ------------------------------- Voice input ----------------------------- */
  const toggleVoice = () => {
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    voiceBaseRef.current = input ? input.trim() + ' ' : '';

    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(voiceBaseRef.current + transcript);
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        toast.error(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Voice input error.');
      }
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  /* ------------------------------ File upload ------------------------------ */
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const data = await extractDoc(file);
      setDoc(data);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `📎 Attached "${data.name}". Ask me anything about it.`,
          citations: [],
        },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read that file');
    } finally {
      setUploadingDoc(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* -------------------------------- Send ----------------------------------- */
  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (listening) recognitionRef.current?.stop();
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { reply, citations } = await chatAssistant(
        next.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
        courseId,
        doc?.text
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

  const subtitle = doc
    ? `Answering from “${doc.name}”`
    : courseId
      ? 'Course-aware · answers from lessons'
      : 'Platform & study help';

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
            <div className="min-w-0 leading-tight">
              <h3 className="font-bold text-slate-900 dark:text-white">AI Assistant</h3>
              <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
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

          {/* Attached-document chip */}
          {doc && (
            <div className="flex items-center gap-2 border-t border-slate-200 bg-sky-500/5 px-3 py-2 dark:border-white/10">
              <FileText className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                {doc.name}
              </span>
              <button
                onClick={() => setDoc(null)}
                className="icon-btn h-7 w-7"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={send} className="flex items-center gap-1.5 border-t border-slate-200 p-3 dark:border-white/10">
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingDoc}
              className="icon-btn h-9 w-9 shrink-0"
              title="Attach a PDF / document"
            >
              {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
              className="hidden"
              onChange={onFile}
            />

            {/* Voice */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`icon-btn h-9 w-9 shrink-0 ${listening ? 'animate-pulse !bg-rose-500/20 !text-rose-500' : ''}`}
              title={listening ? 'Stop listening' : 'Speak'}
            >
              <Mic className="h-4 w-4" />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Listening…' : doc ? 'Ask about the file…' : 'Ask me anything…'}
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
