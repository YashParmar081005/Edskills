import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Video,
  FileText,
  GripVertical,
} from 'lucide-react';
import LessonFormModal from './LessonFormModal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  useUpdateModule,
  useDeleteModule,
  useAddLesson,
  useUpdateLesson,
  useDeleteLesson,
  useReorderLessons,
} from './hooks.js';

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function LessonRow({ lesson, index, total, onEdit, onDelete, onMove }) {
  const isVideo = lesson.type === 'video';
  return (
    <div className="glass-soft flex items-center gap-3 p-3">
      <div className="flex flex-col">
        <button
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          className="text-slate-400 hover:text-brand-500 disabled:opacity-30"
          title="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          className="text-slate-400 hover:text-brand-500 disabled:opacity-30"
          title="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isVideo ? 'bg-sky-500/15 text-sky-500' : 'bg-brand-500/15 text-brand-500'
        }`}
      >
        {isVideo ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {lesson.title}
        </p>
        <p className="text-xs text-slate-400">
          {isVideo
            ? `Video${lesson.duration ? ` · ${fmtDuration(lesson.duration)}` : ''}${
                lesson.videoUrl ? '' : ' · no source yet'
              }`
            : 'Text lesson'}
        </p>
      </div>

      <button onClick={() => onEdit(lesson)} className="icon-btn h-8 w-8" title="Edit lesson">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onDelete(lesson)}
        className="icon-btn h-8 w-8 text-rose-500"
        title="Delete lesson"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ModuleSection({
  module,
  courseId,
  index,
  total,
  onMoveModule,
}) {
  const lessons = module.lessons || [];

  const updateModuleMut = useUpdateModule(courseId);
  const deleteModuleMut = useDeleteModule(courseId);
  const addLessonMut = useAddLesson(courseId);
  const updateLessonMut = useUpdateLesson(courseId);
  const deleteLessonMut = useDeleteLesson(courseId);
  const reorderLessonsMut = useReorderLessons(courseId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [confirmDeleteModule, setConfirmDeleteModule] = useState(false);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== module.title) updateModuleMut.mutate({ moduleId: module._id, title: t });
    setEditingTitle(false);
  };

  const moveLesson = (from, to) => {
    if (to < 0 || to >= lessons.length) return;
    const ids = lessons.map((l) => l._id);
    const [m] = ids.splice(from, 1);
    ids.splice(to, 0, m);
    reorderLessonsMut.mutate({ moduleId: module._id, orderedIds: ids });
  };

  return (
    <div className="glass-card p-4">
      {/* Module header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            onClick={() => onMoveModule(index, index - 1)}
            disabled={index === 0}
            className="text-slate-400 hover:text-brand-500 disabled:opacity-30"
            title="Move module up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMoveModule(index, index + 1)}
            disabled={index === total - 1}
            className="text-slate-400 hover:text-brand-500 disabled:opacity-30"
            title="Move module down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />

        <span className="shrink-0 rounded-lg bg-brand-500/15 px-2 py-1 text-xs font-bold text-brand-600 dark:text-brand-300">
          {index + 1}
        </span>

        {editingTitle ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              className="glass-input !py-1.5 text-sm"
              autoFocus
            />
            <button onClick={saveTitle} className="icon-btn h-8 w-8 text-green-500">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setTitle(module.title);
                setEditingTitle(false);
              }}
              className="icon-btn h-8 w-8"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 truncate font-bold text-slate-900 dark:text-white">
              {module.title}
            </h3>
            <span className="shrink-0 text-xs text-slate-400">{lessons.length} lessons</span>
            <button
              onClick={() => setEditingTitle(true)}
              className="icon-btn h-8 w-8"
              title="Rename module"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDeleteModule(true)}
              className="icon-btn h-8 w-8 text-rose-500"
              title="Delete module"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Lessons */}
      <div className="mt-3 space-y-2 pl-2">
        {lessons.length === 0 && (
          <p className="py-2 text-center text-xs text-slate-400">
            No lessons yet — add one below.
          </p>
        )}
        {lessons.map((lesson, i) => (
          <LessonRow
            key={lesson._id}
            lesson={lesson}
            index={i}
            total={lessons.length}
            onEdit={setEditingLesson}
            onDelete={setDeletingLesson}
            onMove={moveLesson}
          />
        ))}

        <button
          onClick={() => setShowAddLesson(true)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/50 bg-white/20 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/40 dark:border-white/15 dark:bg-white/5 dark:text-slate-400"
        >
          <Plus className="h-4 w-4" /> Add lesson
        </button>
      </div>

      {/* Add lesson */}
      <LessonFormModal
        open={showAddLesson}
        onClose={() => setShowAddLesson(false)}
        saving={addLessonMut.isPending}
        onSubmit={(payload) =>
          addLessonMut.mutate(
            { moduleId: module._id, payload },
            { onSuccess: () => setShowAddLesson(false) }
          )
        }
      />

      {/* Edit lesson */}
      {editingLesson && (
        <LessonFormModal
          open
          initial={editingLesson}
          onClose={() => setEditingLesson(null)}
          saving={updateLessonMut.isPending}
          onSubmit={(payload) =>
            updateLessonMut.mutate(
              { lessonId: editingLesson._id, payload },
              { onSuccess: () => setEditingLesson(null) }
            )
          }
        />
      )}

      {/* Delete lesson */}
      <ConfirmDialog
        open={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        loading={deleteLessonMut.isPending}
        title="Delete lesson?"
        message={`"${deletingLesson?.title}" will be permanently deleted.`}
        confirmLabel="Delete lesson"
        onConfirm={() =>
          deleteLessonMut.mutate(deletingLesson._id, {
            onSuccess: () => setDeletingLesson(null),
          })
        }
      />

      {/* Delete module */}
      <ConfirmDialog
        open={confirmDeleteModule}
        onClose={() => setConfirmDeleteModule(false)}
        loading={deleteModuleMut.isPending}
        title="Delete module?"
        message={`"${module.title}" and its ${lessons.length} lesson(s) will be permanently deleted.`}
        confirmLabel="Delete module"
        onConfirm={() =>
          deleteModuleMut.mutate(module._id, {
            onSuccess: () => setConfirmDeleteModule(false),
          })
        }
      />
    </div>
  );
}
