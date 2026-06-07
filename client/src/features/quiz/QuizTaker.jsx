import { useState, useEffect } from 'react';
import {
  ListChecks,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
} from 'lucide-react';
import { useQuizByLesson, useAttemptQuiz } from './hooks.js';
import Spinner from '../../components/Spinner.jsx';

function scoreColor(pct) {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

export default function QuizTaker({ lessonId }) {
  const { data, isLoading } = useQuizByLesson(lessonId);
  const quiz = data?.quiz || null;
  const priorAttempt = data?.attempt || null;
  const attemptMut = useAttemptQuiz(lessonId);

  const [phase, setPhase] = useState('intro'); // intro | taking | results
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  // Reset when switching lessons.
  useEffect(() => {
    setPhase('intro');
    setAnswers({});
    setResults(null);
  }, [lessonId]);

  if (isLoading || !quiz) return null; // no quiz on this lesson → render nothing

  const setAnswer = (qi, patch) =>
    setAnswers((a) => ({ ...a, [qi]: { ...a[qi], ...patch } }));

  const submit = () => {
    const payload = quiz.questions.map((q, i) => ({
      questionIndex: i,
      ...(answers[i] || {}),
    }));
    attemptMut.mutate(
      { id: quiz._id, answers: payload },
      {
        onSuccess: (res) => {
          setResults(res);
          setPhase('results');
        },
      }
    );
  };

  const retake = () => {
    setAnswers({});
    setResults(null);
    setPhase('taking');
  };

  /* ------------------------------- Intro ---------------------------------- */
  if (phase === 'intro') {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <ListChecks className="h-5 w-5 text-sky-500" />
          <h3 className="font-bold">{quiz.title}</h3>
          {quiz.aiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''} · test your
          understanding of this lesson.
        </p>
        {priorAttempt && (
          <p className="mt-2 text-sm">
            Your last score:{' '}
            <span className={`font-bold ${scoreColor(priorAttempt.percentage)}`}>
              {priorAttempt.percentage}%
            </span>
          </p>
        )}
        <button onClick={() => setPhase('taking')} className="btn-primary mt-4">
          {priorAttempt ? <RotateCcw className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          {priorAttempt ? 'Retake quiz' : 'Start quiz'}
        </button>
      </div>
    );
  }

  /* ------------------------------- Taking --------------------------------- */
  if (phase === 'taking') {
    return (
      <div className="glass-card space-y-5 p-5">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <ListChecks className="h-5 w-5 text-sky-500" />
          <h3 className="font-bold">{quiz.title}</h3>
        </div>

        {quiz.questions.map((q, i) => (
          <div key={i} className="glass-soft p-4">
            <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">
              <span className="mr-2 text-brand-500">{i + 1}.</span>
              {q.question}
            </p>

            {q.type === 'open' ? (
              <textarea
                rows={3}
                value={answers[i]?.text || ''}
                onChange={(e) => setAnswer(i, { text: e.target.value })}
                placeholder="Type your answer…"
                className="glass-input resize-none text-sm"
              />
            ) : (
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[i]?.selectedIndex === oi;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? 'border-sky-400 bg-sky-400/10 ring-1 ring-sky-400/40'
                          : 'border-white/40 bg-white/30 hover:bg-white/50 dark:border-white/10 dark:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={selected}
                        onChange={() => setAnswer(i, { selectedIndex: oi })}
                        className="h-4 w-4 accent-sky-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <button onClick={submit} disabled={attemptMut.isPending} className="btn-primary w-full">
          {attemptMut.isPending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
          {attemptMut.isPending ? 'Grading…' : 'Submit quiz'}
        </button>
      </div>
    );
  }

  /* ------------------------------- Results -------------------------------- */
  const byIndex = Object.fromEntries((results.results || []).map((r) => [r.questionIndex, r]));

  return (
    <div className="glass-card space-y-5 p-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <Award className={`h-10 w-10 ${scoreColor(results.percentage)}`} />
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          <span className={scoreColor(results.percentage)}>{results.percentage}%</span>
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {results.score} / {results.maxScore} points
        </p>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q, i) => {
          const r = byIndex[i] || {};
          const isOpen = q.type === 'open';
          return (
            <div key={i} className="glass-soft p-4">
              <div className="mb-2 flex items-start gap-2">
                {isOpen ? (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                ) : r.correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                )}
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  <span className="mr-2 text-brand-500">{i + 1}.</span>
                  {q.question}
                </p>
                <span className="ml-auto whitespace-nowrap text-xs text-slate-400">
                  {r.pointsAwarded ?? 0}/{q.points} pt
                </span>
              </div>

              {isOpen ? (
                <div className="space-y-2 pl-6 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Your answer: </span>
                    {r.text || <em className="text-slate-400">(blank)</em>}
                  </p>
                  {r.feedback && (
                    <p className="rounded-lg bg-sky-500/10 p-2 text-sky-700 dark:text-sky-200">
                      <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                      {r.feedback}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 pl-6">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === r.correctIndex;
                    const isChosen = oi === r.selectedIndex;
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                          isCorrect
                            ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                            : isChosen
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isChosen ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && !isOpen && (
                <p className="mt-2 pl-6 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Why: </span>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={retake} className="btn-ghost w-full">
        <RotateCcw className="h-4 w-4" /> Retake quiz
      </button>
    </div>
  );
}
