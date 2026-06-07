import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Layers,
  PlayCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import {
  useMyCourses,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
} from '../../features/courses/hooks.js';
import CourseFormModal from '../../features/courses/CourseFormModal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Spinner from '../../components/Spinner.jsx';

function priceLabel(p) {
  return p > 0 ? `$${Number(p).toFixed(2)}` : 'Free';
}

function CourseCard({ course, onEdit, onDelete }) {
  return (
    <div className="glass-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow">
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-sky-400/30 to-brand-600/30">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/70">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${
            course.isPublished
              ? 'bg-green-500/20 text-green-700 ring-1 ring-green-500/40 dark:text-green-300'
              : 'bg-slate-500/20 text-slate-700 ring-1 ring-slate-400/40 dark:text-slate-200'
          }`}
        >
          {course.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {course.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-600 dark:text-sky-300">
            {course.category}
          </span>
          <span className="font-semibold text-brand-600 dark:text-brand-300">
            {priceLabel(course.price)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
          {course.title}
        </h3>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {course.moduleCount} modules
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> {course.lessonCount} lessons
          </span>
        </div>

        <div className="mt-4 flex gap-2 border-t border-white/30 pt-3 dark:border-white/10">
          <Link to={`/instructor/courses/${course._id}`} className="btn-primary flex-1 !py-2 text-xs">
            <Pencil className="h-3.5 w-3.5" /> Build
          </Link>
          <button onClick={() => onEdit(course)} className="btn-ghost !py-2 text-xs" title="Edit details">
            Details
          </button>
          <button
            onClick={() => onDelete(course)}
            className="icon-btn h-9 w-9 text-rose-500"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseList() {
  const navigate = useNavigate();
  const { data: courses, isLoading, isError } = useMyCourses();
  const createMut = useCreateCourse();
  const deleteMut = useDeleteCourse();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null); // course to edit details
  const [deleting, setDeleting] = useState(null);

  // When arriving from the "Course Builder" card (/instructor/courses?new=1),
  // jump straight into creating a course, then clean the URL.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = (payload) => {
    createMut.mutate(payload, {
      onSuccess: (course) => {
        setShowCreate(false);
        navigate(`/instructor/courses/${course._id}`);
      },
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/instructor"
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Courses</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New course
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <div className="glass-card p-6 text-center text-rose-500">
          Couldn't load your courses. Is the server running?
        </div>
      )}

      {!isLoading && !isError && courses?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create your first course, then add modules and lessons in the builder.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> Create your first course
          </button>
        </div>
      )}

      {!isLoading && courses?.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {/* Create */}
      <CourseFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        saving={createMut.isPending}
      />

      {/* Edit details (from list) */}
      {editing && (
        <EditDetailsModal course={editing} onClose={() => setEditing(null)} />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={deleteMut.isPending}
        title="Delete course?"
        message={`"${deleting?.title}" and all its modules & lessons will be permanently deleted.`}
        confirmLabel="Delete course"
        onConfirm={() =>
          deleteMut.mutate(deleting._id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

/* Edit-details modal needs a per-course update hook, so it's its own component. */
function EditDetailsModal({ course, onClose }) {
  const updateMut = useUpdateCourse(course._id);
  return (
    <CourseFormModal
      open
      initial={course}
      onClose={onClose}
      saving={updateMut.isPending}
      onSubmit={(payload) => updateMut.mutate(payload, { onSuccess: onClose })}
    />
  );
}
