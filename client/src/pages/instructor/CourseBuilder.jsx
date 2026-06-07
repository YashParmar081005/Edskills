import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Globe,
  Layers,
} from 'lucide-react';
import {
  useCourse,
  useUpdateCourse,
  useTogglePublish,
  useAddModule,
  useReorderModules,
} from '../../features/courses/hooks.js';
import ModuleSection from '../../features/courses/ModuleSection.jsx';
import CourseFormModal from '../../features/courses/CourseFormModal.jsx';
import Spinner from '../../components/Spinner.jsx';

function priceLabel(p) {
  return p > 0 ? `$${Number(p).toFixed(2)}` : 'Free';
}

export default function CourseBuilder() {
  const { id } = useParams();
  const { data: course, isLoading, isError, error } = useCourse(id);

  const updateMut = useUpdateCourse(id);
  const publishMut = useTogglePublish(id);
  const addModuleMut = useAddModule(id);
  const reorderModulesMut = useReorderModules(id);

  const [editingDetails, setEditingDetails] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const modules = course?.modules || [];

  const addModule = (e) => {
    e.preventDefault();
    const t = newModuleTitle.trim();
    if (!t) return;
    addModuleMut.mutate(t, { onSuccess: () => setNewModuleTitle('') });
  };

  const moveModule = (from, to) => {
    if (to < 0 || to >= modules.length) return;
    const ids = modules.map((m) => m._id);
    const [m] = ids.splice(from, 1);
    ids.splice(to, 0, m);
    reorderModulesMut.mutate(ids);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    const code = error?.response?.status;
    return (
      <div className="glass-card mx-auto max-w-md p-8 text-center">
        <p className="text-rose-500">
          {code === 403
            ? "You don't have access to this course."
            : code === 404
              ? 'Course not found.'
              : "Couldn't load this course."}
        </p>
        <Link to="/instructor/courses" className="btn-ghost mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/instructor/courses"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> My Courses
        </Link>

        <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt=""
              className="h-24 w-40 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-600 dark:text-sky-300">
                {course.category}
              </span>
              <span className="font-semibold text-brand-600 dark:text-brand-300">
                {priceLabel(course.price)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide ${
                  course.isPublished
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : 'bg-slate-500/20 text-slate-600 dark:text-slate-300'
                }`}
              >
                {course.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="truncate text-2xl font-extrabold text-slate-900 dark:text-white">
              {course.title}
            </h1>
            {course.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button onClick={() => setEditingDetails(true)} className="btn-ghost">
              <Pencil className="h-4 w-4" /> Details
            </button>
            <button
              onClick={() => publishMut.mutate(!course.isPublished)}
              disabled={publishMut.isPending}
              className={
                course.isPublished
                  ? 'btn-ghost'
                  : 'btn-primary'
              }
            >
              {publishMut.isPending ? (
                <Spinner />
              ) : course.isPublished ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {course.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Layers className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-bold">Curriculum</h2>
        <span className="text-sm text-slate-400">
          {modules.length} module{modules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {modules.length === 0 && (
        <div className="glass-card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No modules yet. Add your first module below to start building the curriculum.
        </div>
      )}

      <div className="space-y-4">
        {modules.map((m, i) => (
          <ModuleSection
            key={m._id}
            module={m}
            courseId={id}
            index={i}
            total={modules.length}
            onMoveModule={moveModule}
          />
        ))}
      </div>

      {/* Add module */}
      <form onSubmit={addModule} className="glass-card flex items-center gap-2 p-3">
        <input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="New module title…"
          className="glass-input"
        />
        <button
          type="submit"
          className="btn-primary shrink-0"
          disabled={addModuleMut.isPending || !newModuleTitle.trim()}
        >
          {addModuleMut.isPending ? <Spinner /> : <Plus className="h-4 w-4" />}
          Add module
        </button>
      </form>

      {/* Edit details */}
      <CourseFormModal
        open={editingDetails}
        initial={course}
        onClose={() => setEditingDetails(false)}
        saving={updateMut.isPending}
        onSubmit={(payload) =>
          updateMut.mutate(payload, { onSuccess: () => setEditingDetails(false) })
        }
      />
    </div>
  );
}
