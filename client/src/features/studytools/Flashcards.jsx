import { useState } from 'react';
import toast from 'react-hot-toast';
import { Wand2, Loader2, ChevronLeft, ChevronRight, RotateCw, Layers } from 'lucide-react';
import { generateFlashcards } from '../../api/ai.js';

/** Topic → AI-generated flashcards with a flip-card study UI. */
export default function Flashcards() {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true);
    try {
      const { cards: c } = await generateFlashcards({ topic: topic.trim(), count: Number(count) });
      setCards(c || []);
      setIndex(0);
      setFlipped(false);
      if (!c?.length) toast.error('No cards came back — try again');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const go = (dir) => {
    setFlipped(false);
    setIndex((i) => (i + dir + cards.length) % cards.length);
  };

  const card = cards[index];

  return (
    <div className="space-y-5">
      <form onSubmit={generate} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. React hooks, Photosynthesis, World War II causes…"
            className="glass-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Cards</label>
          <select value={count} onChange={(e) => setCount(e.target.value)} className="glass-input sm:w-28">
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Generating…' : cards.length ? 'Regenerate' : 'Generate'}
        </button>
      </form>

      {cards.length === 0 && !loading && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flashcards on any topic</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Enter a topic and let AI build a deck. Click a card to flip between the prompt and the answer.
          </p>
        </div>
      )}

      {card && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Card {index + 1} of {cards.length}</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <RotateCw className="h-3.5 w-3.5" /> Click the card to flip
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="group relative block h-64 w-full [perspective:1200px]"
          >
            <div
              className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                flipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/40 bg-gradient-to-br from-sky-400/15 to-brand-600/15 p-6 text-center [backface-visibility:hidden] dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Prompt</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{card.front}</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-auto rounded-2xl border border-white/40 bg-white/70 p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/10 dark:bg-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Answer</span>
                <p className="text-base text-slate-700 dark:text-slate-100">{card.back}</p>
              </div>
            </div>
          </button>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => go(-1)} className="icon-btn h-11 w-11" title="Previous">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setFlipped((f) => !f)} className="btn-ghost">
              <RotateCw className="h-4 w-4" /> Flip
            </button>
            <button onClick={() => go(1)} className="icon-btn h-11 w-11" title="Next">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
