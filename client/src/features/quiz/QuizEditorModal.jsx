import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  FileText,
  ListChecks,
} from 'lucide-react';
import GlassModal from '../../components/GlassModal.jsx';
import Spinner from '../../components/Spinner.jsx';
import {
  useQuizByLesson,
  useGenerateQuiz,
  useSaveQuiz,
  useDeleteQuiz,
} from './hooks.js';

const blankMcq = () => ({
  type: 'mcq',
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  points: 1,
});

function normalize(q) {
  return {
    type: q.type === 'open' ? 'open' : 'mcq',
    question: q.question || '',
    options: q.options?.length ? [...q.options] : ['', '', '', ''],
    correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
    explanation: q.explanation || '',
    points: q.points || 1,
  };
}

export default function QuizEditorModal({ open, onClose, lesson }) {
  const lessonId = lesson?._id;
  const { data, isLoading } = useQuizByLesson(lessonId, open);
  const existingQuiz = data?.quiz || null;

  const genMut = useGenerateQuiz();
  const saveMut = useSaveQuiz(lessonId);
  const delMut = useDeleteQuiz(lessonId);

  const [title, setTitle] = useState('Lesson Quiz');
  const [questions, setQuestions] = useState([]);
  const [num, setNum] = useState(5);
  const [aiGenerated, setAiGenerated] = useState(false);
  const seededFor = useRef(null);

  // Seed local state when the modal opens / the quiz loads.
  useEffect(() => {
    if (!open) {
      seededFor.current = null;
      return;
    }
    if (isLoading) return;
    const key = existingQuiz?._id || 'new';
    if (seededFor.current === key) return;
    seededFor.current = key;
    if (existingQuiz) {
      setTitle(existingQuiz.title || 'Lesson Quiz');
      setQuestions(existingQuiz.questions.map(normalize));
      setAiGenerated(!!existingQuiz.aiGenerated);
    } else {
      setTitle('Lesson Quiz');
      setQuestions([]);
      setAiGenerated(false);
    }
  }, [open, isLoading, existingQuiz]);

  const patchQuestion = (i, patch) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const patchOption = (i, oi, val) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, options: q.options.map((o, k) => (k === oi ? val : o)) } : q
      )
    );
  const removeQuestion = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const handleGenerate = () => {
    genMut.mutate(
      { lessonId, numQuestions: num },
      {
        onSuccess: (qs) => {
          setQuestions(qs.map(normalize));
          setAiGenerated(true);
          toast.success(`Generated ${qs.length} questions`);
        },
      }
    );
  };

  const handleSave = () => {
    if (!questions.length) return toast.error('Add at least one question.');
    for (const q of questions) {
      if (!q.question.trim()) return toast.error('Every question needs text.');
      if (q.type === 'mcq' && q.options.filter((o) => o.trim()).length < 2) {
        return toast.error('MCQ questions need at least 2 options.');
      }
    }
    saveMut.mutate(
      { lessonId, title, questions, aiGenerated },
      { onSuccess: onClose }
    );
  };

  const handleDelete = () => {
    if (!existingQuiz) return;
    delMut.mutate(existingQuiz._id, { onSuccess: onClose });
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={`Quiz · ${lesson?.title || ''}`}
      maxWidth="max-w-3xl"
    >
      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title + AI generate */}
          <div className="glass-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Quiz title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                AI questions
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={num}
                  onChange={(e) => setNum(Number(e.target.value))}
                  className="glass-input w-20 !py-2"
                />
                <button
                  onClick={handleGenerate}
                  disabled={genMut.isPending}
                  className="btn-primary whitespace-nowrap"
                >
                  {genMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {genMut.isPending ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>
            </div>
          </div>

          {genMut.isPending && (
            <p className="text-center text-xs text-slate-400">
              The AI is reading the lesson and writing questions…
            </p>
          )}

          {/* Questions */}
          <div className="max-h-[50vh] space-y-4 overflow-auto pr-1">
            {questions.length === 0 && (
              <div className="glass-soft p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No questions yet. Generate them with AI, or add one manually.
              </div>
            )}

            {questions.map((q, i) => (
              <div key={i} className="glass-soft p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-brand-500/15 px-2 py-1 text-xs font-bold text-brand-600 dark:text-brand-300">
                    Q{i + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => patchQuestion(i, { type: e.target.value })}
                    className="glass-input !w-auto !py-1 text-xs"
                  >
                    <option value="mcq">Multiple choice</option>
                    <option value="open">Open answer (AI-graded)</option>
                  </select>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="icon-btn ml-auto h-8 w-8 text-rose-500"
                    title="Remove question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  value={q.question}
                  onChange={(e) => patchQuestion(i, { question: e.target.value })}
                  placeholder="Question text"
                  className="glass-input mb-2"
                />

                {q.type === 'mcq' ? (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={q.correctIndex === oi}
                          onChange={() => patchQuestion(i, { correctIndex: oi })}
                          className="h-4 w-4 accent-sky-500"
                          title="Mark as correct"
                        />
                        <input
                          value={opt}
                          onChange={(e) => patchOption(i, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className={`glass-input !py-1.5 text-sm ${
                            q.correctIndex === oi ? 'ring-1 ring-green-400/60' : ''
                          }`}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Students type a free-form answer; the AI grades it against the
                    explanation/rubric below.
                  </p>
                )}

                <textarea
                  value={q.explanation}
                  onChange={(e) => patchQuestion(i, { explanation: e.target.value })}
                  rows={2}
                  placeholder={
                    q.type === 'mcq'
                      ? 'Explanation (shown after answering)'
                      : 'Model answer / grading rubric'
                  }
                  className="glass-input mt-2 resize-none text-sm"
                />
              </div>
            ))}

            <button
              onClick={() => setQuestions((qs) => [...qs, blankMcq()])}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/50 bg-white/20 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/40 dark:border-white/15 dark:bg-white/5 dark:text-slate-400"
            >
              <Plus className="h-4 w-4" /> Add question
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-white/30 pt-4 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {aiGenerated && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-sky-500" /> AI-assisted
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" /> {questions.length} questions
              </span>
            </div>
            <div className="flex gap-2">
              {existingQuiz && (
                <button
                  onClick={handleDelete}
                  disabled={delMut.isPending}
                  className="btn-ghost text-rose-500"
                >
                  {delMut.isPending ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              )}
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saveMut.isPending} className="btn-primary">
                {saveMut.isPending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                Save quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
