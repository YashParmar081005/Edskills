import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Paperclip,
  Sparkles,
  Loader2,
  Save,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useGradeSubmission, useAiSuggest } from './hooks.js';
import { formatDateTime } from '../../lib/dates.js';
import Spinner from '../../components/Spinner.jsx';

export default function SubmissionGradeCard({ submission, maxScore, assignmentId }) {
  const gradeMut = useGradeSubmission(assignmentId);
  const aiMut = useAiSuggest();

  const [score, setScore] = useState(submission.score ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [aiSuggestion, setAiSuggestion] = useState(
    submission.aiScore != null ? { score: submission.aiScore, feedback: submission.aiFeedback } : null
  );

  const graded = submission.status === 'graded';

  const runAi = () => {
    aiMut.mutate(submission._id, {
      onSuccess: (data) => {
        setAiSuggestion({ score: data.aiScore, feedback: data.aiFeedback });
        setScore(data.aiScore);
        setFeedback(data.aiFeedback);
        toast.success('AI suggestion ready — review & save');
      },
    });
  };

  const save = () => {
    const s = Number(score);
    if (Number.isNaN(s) || s < 0 || s > maxScore) {
      return toast.error(`Score must be between 0 and ${maxScore}.`);
    }
    gradeMut.mutate({ id: submission._id, payload: { score: s, feedback } });
  };

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-brand-600 text-xs font-bold text-white">
            {submission.student?.name?.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {submission.student?.name}
            </p>
            <p className="text-xs text-slate-400">
              Submitted {formatDateTime(submission.createdAt)}
            </p>
          </div>
        </div>
        {graded ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-300">
            <Award className="h-3 w-3" /> {submission.score}/{maxScore}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-300">
            <Clock className="h-3 w-3" /> Needs grading
          </span>
        )}
      </div>

      {/* Submission content */}
      <div className="mt-3 space-y-2 rounded-xl bg-white/30 p-3 text-sm dark:bg-white/5">
        {submission.content ? (
          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
            {submission.content}
          </p>
        ) : (
          <p className="italic text-slate-400">No text answer.</p>
        )}
        {submission.fileUrl && (
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
          >
            <Paperclip className="h-3.5 w-3.5" /> {submission.fileName || 'Attached file'}
          </a>
        )}
      </div>

      {/* AI suggestion banner */}
      {aiSuggestion && (
        <div className="mt-3 rounded-xl bg-sky-500/10 p-3 text-sm">
          <p className="flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-200">
            <Sparkles className="h-4 w-4" /> AI suggests {aiSuggestion.score}/{maxScore}
          </p>
          {aiSuggestion.feedback && (
            <p className="mt-1 text-slate-600 dark:text-slate-300">{aiSuggestion.feedback}</p>
          )}
        </div>
      )}

      {/* Grading controls */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Score / {maxScore}
            </label>
            <input
              type="number"
              min="0"
              max={maxScore}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="glass-input !py-2"
            />
          </div>
          <button
            onClick={runAi}
            disabled={aiMut.isPending || !submission.content}
            title={submission.content ? 'Suggest a grade with AI' : 'No text to grade'}
            className="btn-ghost"
          >
            {aiMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-sky-500" />
            )}
            {aiMut.isPending ? 'Grading…' : 'AI suggest'}
          </button>
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="Feedback for the student…"
          className="glass-input resize-none text-sm"
        />

        <button onClick={save} disabled={gradeMut.isPending} className="btn-primary self-end">
          {gradeMut.isPending ? <Spinner /> : graded ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {graded ? 'Update grade' : 'Save grade'}
        </button>
      </div>
    </div>
  );
}
