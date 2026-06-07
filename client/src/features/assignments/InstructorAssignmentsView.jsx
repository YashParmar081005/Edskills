import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  CalendarClock,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import {
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from './hooks.js';
import AssignmentFormModal from './AssignmentFormModal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { dueInfo } from '../../lib/dates.js';

export default function InstructorAssignmentsView({ courseId, assignments }) {
  const createMut = useCreateAssignment(courseId);
  const updateMut = useUpdateAssignment(courseId);
  const deleteMut = useDeleteAssignment(courseId);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create your first assignment — students will submit text or files, and you can grade
            them with AI assistance.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> New assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const { label, overdue } = dueInfo(a.dueDate);
            return (
              <div key={a._id} className="glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white">{a.title}</h3>
                    <p
                      className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                        overdue ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <CalendarClock className="h-3.5 w-3.5" /> {label} · {a.maxScore} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(a)}
                      className="icon-btn h-9 w-9"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(a)}
                      className="icon-btn h-9 w-9 text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {a.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {a.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/30 pt-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {a.submissionCount || 0} submissions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {a.gradedCount || 0} graded
                  </span>
                  <Link
                    to={`/instructor/assignments/${a._id}/submissions`}
                    className="btn-primary ml-auto !py-1.5 text-xs"
                  >
                    Grade submissions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignmentFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        saving={createMut.isPending}
        onSubmit={(payload) =>
          createMut.mutate(payload, { onSuccess: () => setShowCreate(false) })
        }
      />

      {editing && (
        <AssignmentFormModal
          open
          initial={editing}
          onClose={() => setEditing(null)}
          saving={updateMut.isPending}
          onSubmit={(payload) =>
            updateMut.mutate(
              { id: editing._id, payload },
              { onSuccess: () => setEditing(null) }
            )
          }
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={deleteMut.isPending}
        title="Delete assignment?"
        message={`"${deleting?.title}" and all its submissions will be permanently deleted.`}
        confirmLabel="Delete assignment"
        onConfirm={() =>
          deleteMut.mutate(deleting._id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}
