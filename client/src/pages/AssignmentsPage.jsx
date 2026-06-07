import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useCourseAssignments } from '../features/assignments/hooks.js';
import InstructorAssignmentsView from '../features/assignments/InstructorAssignmentsView.jsx';
import StudentAssignmentsView from '../features/assignments/StudentAssignmentsView.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AssignmentsPage() {
  const { courseId } = useParams();
  const { data, isLoading, isError, error } = useCourseAssignments(courseId);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link
          to={`/courses/${courseId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Course
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <ClipboardList className="h-6 w-6 text-brand-500" /> Assignments
        </h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          {error?.response?.status === 403
            ? 'Enroll in this course to view its assignments.'
            : "Couldn't load assignments."}
        </div>
      )}

      {data &&
        (data.isOwner ? (
          <InstructorAssignmentsView courseId={courseId} assignments={data.assignments} />
        ) : (
          <StudentAssignmentsView courseId={courseId} assignments={data.assignments} />
        ))}
    </div>
  );
}
