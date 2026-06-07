import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  CalendarClock,
  Users,
  CheckCircle2,
  Pencil,
  Trash2,
  BookOpen,
} from 'lucide-react';
import {
  getMyAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../api/assignments.js';
import AssignmentFormModal from '../features/assignments/AssignmentFormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { dueInfo } from '../lib/dates.js';
import Spinner from '../components/Spinner.jsx';

export default function InstructorAssignmentsHub() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['assignments', 'mine'], queryFn: getMyAssignments });
  const assignments = data?.assignments || [];
  const courses = data?.courses || [];

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['assignments', 'mine'] });

  const createMut = useMutation({
    mutationFn: ({ courseId, ...payload }) => createAssignment(courseId, payload),
    onSuccess: () => { invalidate(); toast.success('Assignment created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not create'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateAssignment(id, payload),
    onSuccess: () => { invalidate(); toast.success('Assignment updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not update'),
  });
  const deleteMut = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => { invalidate(); toast.success('Assignment deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link to="/instructor" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <ClipboardList className="h-6 w-6 text-brand-500" /> Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All assignments across your courses.
          </p>
        </div>
        <button
          onClick={() => (courses.length ? setShowCreate(true) : toast.error('Create a course first'))}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> New assignment
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && assignments.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments yet</h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create an assignment for any of your courses — students submit text or files, and you
            grade with AI assistance.
          </p>
          {courses.length > 0 && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
              <Plus className="h-4 w-4" /> New assignment
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {assignments.map((a) => {
          const { label, overdue } = dueInfo(a.dueDate);
          return (
            <div key={a._id} className="glass-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-0.5 inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-300">
                    <BookOpen className="h-3.5 w-3.5" /> {a.course?.title}
                  </p>
                  <h3 className="font-bold text-slate-900 dark:text-white">{a.title}</h3>
                  <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${overdue ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    <CalendarClock className="h-3.5 w-3.5" /> {label} · {a.maxScore} pts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(a)} className="icon-btn h-9 w-9" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(a)} className="icon-btn h-9 w-9 text-rose-500" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/30 pt-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {a.submissionCount} submissions</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {a.gradedCount} graded</span>
                <Link to={`/instructor/assignments/${a._id}/submissions`} className="btn-primary ml-auto !py-1.5 text-xs">
                  Grade submissions
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <AssignmentFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        courses={courses}
        saving={createMut.isPending}
        onSubmit={(payload) => createMut.mutate(payload, { onSuccess: () => setShowCreate(false) })}
      />

      {editing && (
        <AssignmentFormModal
          open
          initial={editing}
          onClose={() => setEditing(null)}
          saving={updateMut.isPending}
          onSubmit={(payload) => updateMut.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={deleteMut.isPending}
        title="Delete assignment?"
        message={`"${deleting?.title}" and all its submissions will be permanently deleted.`}
        confirmLabel="Delete assignment"
        onConfirm={() => deleteMut.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
