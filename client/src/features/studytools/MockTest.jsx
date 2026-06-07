import { useState } from 'react';
import toast from 'react-hot-toast';
import { Wand2, Loader2, ClipboardList, CheckCircle2, XCircle, RefreshCw, Trophy } from 'lucide-react';
import { generateMockTest } from '../../api/ai.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/** Topic → AI mock test (MCQs) you can take and get scored with explanations. */
export default function MockTest() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // qIndex → optionIndex
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true);
    try {
      const { questions: qs } = await generateMockTest({
        topic: topic.trim(),
        numQuestions: Number(numQuestions),
        difficulty,
      });
      setQuestions(qs || []);
      setAnswers({});
      setSubmitted(false);
      if (!qs?.length) toast.error('No questions came back — try again');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate the test');
    } finally {
      setLoading(false);
    }
  };

  const choose = (qi, oi) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
  };

  const answeredCount = Object.keys(answers).length;
  const score = submitted
    ? questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <form onSubmit={generate} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. JavaScript closures, Cell biology, Indian history…"
            className="glass-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Questions</label>
          <select value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="glass-input sm:w-24">
            {[5, 10, 15].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="glass-input sm:w-28 capitalize">
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Generating…' : questions.length ? 'New test' : 'Generate'}
        </button>
      </form>

      {questions.length === 0 && !loading && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mock test on any topic</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Pick a topic, difficulty and length. Answer the questions, then submit to see your score and explanations.
          </p>
        </div>
      )}

      {/* Result banner */}
      {submitted && (
        <div className="glass-card flex items-center gap-4 p-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${pct >= 60 ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {score}/{questions.length} · {pct}%
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pct >= 80 ? 'Excellent work! 🎉' : pct >= 60 ? 'Nice — keep practising.' : 'Review the explanations and try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        return (
          <div key={qi} className="glass-card p-5">
            <p className="font-semibold text-slate-900 dark:text-white">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isCorrect = q.correctIndex === oi;
                let cls =
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition cursor-pointer ';
                if (submitted) {
                  if (isCorrect) cls += 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300';
                  else if (isChosen) cls += 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300';
                  else cls += 'border-white/40 text-slate-600 dark:border-white/10 dark:text-slate-300';
                } else {
                  cls += isChosen
                    ? 'border-brand-500 bg-sky-500/10 text-slate-900 dark:text-white'
                    : 'border-white/40 hover:bg-white/40 text-slate-700 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5';
                }
                return (
                  <label key={oi} className={cls}>
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={isChosen || false}
                      onChange={() => choose(qi, oi)}
                      disabled={submitted}
                      className="accent-brand-600"
                    />
                    <span className="flex-1">{opt}</span>
                    {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {submitted && isChosen && !isCorrect && <XCircle className="h-4 w-4 text-rose-500" />}
                  </label>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="mt-3 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-sky-600 dark:text-sky-300">Why:</span> {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {questions.length > 0 && !submitted && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {answeredCount}/{questions.length} answered
          </p>
          <button
            onClick={() => setSubmitted(true)}
            disabled={answeredCount < questions.length}
            className="btn-primary"
            title={answeredCount < questions.length ? 'Answer all questions first' : 'Submit test'}
          >
            <CheckCircle2 className="h-4 w-4" /> Submit test
          </button>
        </div>
      )}

      {submitted && (
        <div className="flex justify-center">
          <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="btn-ghost">
            <RefreshCw className="h-4 w-4" /> Retake this test
          </button>
        </div>
      )}
    </div>
  );
}
