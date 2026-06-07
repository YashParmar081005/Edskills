import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Upload, Send, Loader2, X, Bot, Sparkles } from 'lucide-react';
import { extractDoc, askDoc } from '../../api/ai.js';

/**
 * Upload a PDF / DOCX / TXT, then ask questions answered strictly from that
 * document's text.
 */
export default function DocQa() {
  const [doc, setDoc] = useState(null); // { name, chars, text }
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await extractDoc(file);
      setDoc(data);
      setMessages([]);
      toast.success(`Loaded "${data.name}" (${data.chars.toLocaleString()} chars)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read that file');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading || !doc) return;
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { answer } = await askDoc({
        text: doc.text,
        question: q,
        history: next.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: err.response?.data?.message || 'Sorry, I could not answer that.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Uploader */}
      {!doc ? (
        <label className="glass-card flex cursor-pointer flex-col items-center gap-3 border-2 border-dashed border-sky-400/40 p-10 text-center transition hover:border-sky-400/70">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            {uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}
          </div>
          <p className="font-bold text-slate-900 dark:text-white">
            {uploading ? 'Reading your document…' : 'Upload a document'}
          </p>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            PDF, DOCX, TXT or Markdown (max 20&nbsp;MB). We extract the text so you can ask questions about it.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
        </label>
      ) : (
        <div className="glass-card flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{doc.name}</p>
              <p className="text-xs text-slate-400">{doc.chars.toLocaleString()} characters loaded</p>
            </div>
          </div>
          <button
            onClick={() => { setDoc(null); setMessages([]); }}
            className="icon-btn h-9 w-9 text-rose-500"
            title="Remove document"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Chat */}
      {doc && (
        <div className="glass-card flex h-[26rem] flex-col overflow-hidden p-0">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
                <Sparkles className="h-6 w-6 text-sky-400" />
                Ask anything about <span className="font-semibold">{doc.name}</span> — e.g.
                “Summarise this”, “What are the key points?”
              </div>
            )}
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
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the document…
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-white/30 p-3 dark:border-white/10">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the document…"
              className="glass-input !py-2 text-sm"
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary shrink-0 !px-3 !py-2">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
