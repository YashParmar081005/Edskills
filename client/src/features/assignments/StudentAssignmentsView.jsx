import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  CalendarClock,
  Paperclip,
  Upload,
  Loader2,
  CheckCircle2,
  Award,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useSubmitAssignment } from './hooks.js';
import { uploadFile } from '../../api/assignments.js';
import { dueInfo } from '../../lib/dates.js';
import Spinner from '../../components/Spinner.jsx';

function StatusBadge({ submission, overdue }) {
  if (submission?.status === 'graded') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-300">
        <Award className="h-3 w-3" /> Graded
      </span>
    );
  }
  if (submission) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-300">
        <CheckCircle2 className="h-3 w-3" /> Submitted
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        overdue
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
          : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
      }`}
    >
      <Clock className="h-3 w-3" /> {overdue ? 'Past due' : 'Not submitted'}
    </span>
  );
}

function StudentAssignmentCard({ assignment, courseId }) {
  const submission = assignment.mySubmission;
  const { label, overdue } = dueInfo(assignment.dueDate);
  const submitMut = useSubmitAssignment(courseId);

  const graded = submission?.status === 'graded';
  const canSubmit = !overdue && !graded;
  const [showForm, setShowForm] = useState(!submission && !overdue);
  const [content, setContent] = useState(submission?.content || '');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file && !submission?.fileUrl) {
      return toast.error('Write an answer or attach a file.');
    }
    let fileUrl = submission?.fileUrl || '';
    let fileName = submission?.fileName || '';
    if (file) {
      setProgress(0);
      try {
        const up = await uploadFile(file, setProgress);
        fileUrl = up.url;
        fileName = up.fileName;
      } catch (err) {
        setProgress(null);
        return toast.error(err.response?.data?.message || 'File upload failed');
      }
      setProgress(null);
    }
    submitMut.mutate(
      { id: assignment._id, payload: { content, fileUrl, fileName } },
      { onSuccess: () => { setShowForm(false); setFile(null); } }
    );
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
          <p
            className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
              overdue && !submission ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" /> {label} · {assignment.maxScore} pts
          </p>
        </div>
        <StatusBadge submission={submission} overdue={overdue} />
      </div>

      {assignment.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
          {assignment.description}
        </p>
      )}

      {/* Grade result */}
      {graded && (
        <div className="mt-4 rounded-xl bg-green-500/10 p-4">
          <p className="flex items-center gap-2 text-lg font-bold text-green-600 dark:text-green-300">
            <Award className="h-5 w-5" /> {submission.score} / {assignment.maxScore}
          </p>
          {submission.feedback && (
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{submission.feedback}</p>
          )}
        </div>
      )}

      {/* Existing submission summary */}
      {submission && !showForm && (
        <div className="mt-4 space-y-2 rounded-xl bg-white/30 p-3 text-sm dark:bg-white/5">
          {submission.content && (
            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {submission.content}
            </p>
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
          {canSubmit && (
            <button onClick={() => setShowForm(true)} className="btn-ghost mt-1 !py-1.5 text-xs">
              Edit / resubmit
            </button>
          )}
        </div>
      )}

      {/* Submit form */}
      {canSubmit && showForm && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Type your answer… (the AI grader reads this text)"
            className="glass-input resize-none text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-ghost cursor-pointer text-sm">
              {progress !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {progress !== null ? `Uploading ${progress}%` : file ? 'Change file' : 'Attach file'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={progress !== null}
              />
            </label>
            {file && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileText className="h-3.5 w-3.5" /> {file.name}
              </span>
            )}
            <button
              type="submit"
              disabled={submitMut.isPending || progress !== null}
              className="btn-primary ml-auto"
            >
              {submitMut.isPending ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
              {submission ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {overdue && !submission && (
        <p className="mt-3 text-sm text-rose-500">
          The due date has passed — submissions are closed.
        </p>
      )}
    </div>
  );
}

export default function StudentAssignmentsView({ courseId, assignments }) {
  if (!assignments.length) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments yet</h3>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Your instructor hasn't posted any assignments for this course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1 text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-sky-500" /> Text answers may be auto-graded by AI;
        your instructor reviews the final grade.
      </p>
      {assignments.map((a) => (
        <StudentAssignmentCard key={a._id} assignment={a} courseId={courseId} />
      ))}
    </div>
  );
}
