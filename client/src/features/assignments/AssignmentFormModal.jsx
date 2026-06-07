import { useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import GlassModal from '../../components/GlassModal.jsx';
import Spinner from '../../components/Spinner.jsx';

/** Convert an ISO date to the value a datetime-local input expects. */
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 16);
}

export default function AssignmentFormModal({ open, onClose, onSubmit, initial, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    dueDate: toLocalInput(initial?.dueDate),
    maxScore: initial?.maxScore ?? 100,
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required.');
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      maxScore: Number(form.maxScore) || 100,
    });
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit assignment' : 'New assignment'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Title
          </label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Build a To-Do App"
            className="glass-input"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Instructions / rubric
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={5}
            placeholder="Describe the task and how it will be graded (the AI grader uses this as the rubric)."
            className="glass-input resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Due date
            </label>
            <input
              name="dueDate"
              type="datetime-local"
              value={form.dueDate}
              onChange={onChange}
              className="glass-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Max score
            </label>
            <input
              name="maxScore"
              type="number"
              min="1"
              value={form.maxScore}
              onChange={onChange}
              className="glass-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? <Spinner /> : <ClipboardList className="h-4 w-4" />}
            {isEdit ? 'Save changes' : 'Create assignment'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
