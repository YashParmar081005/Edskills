import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Sparkles } from 'lucide-react';
import { useSubmissions } from '../features/assignments/hooks.js';
import SubmissionGradeCard from '../features/assignments/SubmissionGradeCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function SubmissionsGrading() {
  const { assignmentId } = useParams();
  const { data, isLoading, isError } = useSubmissions(assignmentId);

  const assignment = data?.assignment;
  const submissions = data?.submissions || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        {assignment && (
          <Link
            to={`/courses/${assignment.course}/assignments`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Assignments
          </Link>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {assignment ? assignment.title : 'Submissions'}
        </h1>
        {assignment && (
          <p className="mt-1 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {submissions.length} submissions
            </span>
            <span>· {assignment.maxScore} points</span>
            <span className="inline-flex items-center gap-1 text-sky-500">
              <Sparkles className="h-3.5 w-3.5" /> AI grading available
            </span>
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          Couldn't load submissions (are you the course owner?).
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No submissions yet.
        </div>
      )}

      <div className="space-y-4">
        {submissions.map((s) => (
          <SubmissionGradeCard
            key={s._id}
            submission={s}
            maxScore={assignment?.maxScore || 100}
            assignmentId={assignmentId}
          />
        ))}
      </div>
    </div>
  );
}
