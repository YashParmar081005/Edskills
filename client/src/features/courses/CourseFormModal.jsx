import { useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2 } from 'lucide-react';
import GlassModal from '../../components/GlassModal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { uploadThumbnail } from '../../api/courses.js';

export const CATEGORIES = [
  'Development',
  'Business',
  'Design',
  'Marketing',
  'Data Science',
  'AI & ML',
  'Personal Development',
  'Other',
];

/**
 * Create or edit a course's metadata.
 * Pass `initial` to edit; omit to create. `onSubmit(payload)` is the mutation.
 */
export default function CourseFormModal({ open, onClose, onSubmit, initial, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || 'Development',
    price: initial?.price ?? 0,
    tags: (initial?.tags || []).join(', '),
    thumbnail: initial?.thumbnail || '',
  });
  const [uploading, setUploading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadThumbnail(file);
      setForm((f) => ({ ...f, thumbnail: url }));
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thumbnail upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price) || 0,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      thumbnail: form.thumbnail,
    };
    onSubmit(payload);
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit course details' : 'Create a new course'}
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
            placeholder="e.g. Modern React from Scratch"
            className="glass-input"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            placeholder="What will students learn?"
            className="glass-input resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Category
            </label>
            <select name="category" value={form.category} onChange={onChange} className="glass-input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Price (USD)
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={onChange}
              placeholder="0 = free"
              className="glass-input"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Tags <span className="text-slate-400">(comma separated)</span>
          </label>
          <input
            name="tags"
            value={form.tags}
            onChange={onChange}
            placeholder="react, hooks, frontend"
            className="glass-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Thumbnail
          </label>
          <div className="flex items-center gap-3">
            <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-white/40 bg-white/30 dark:border-white/10 dark:bg-white/5">
              {form.thumbnail ? (
                <img src={form.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
            </div>
            <label className="btn-ghost cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleThumb} disabled={uploading} />
            </label>
          </div>
          <input
            name="thumbnail"
            value={form.thumbnail}
            onChange={onChange}
            placeholder="…or paste an image URL"
            className="glass-input mt-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? <Spinner /> : null}
            {isEdit ? 'Save changes' : 'Create course'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
