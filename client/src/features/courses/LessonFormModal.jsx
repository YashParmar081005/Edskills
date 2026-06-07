import { useState } from 'react';
import toast from 'react-hot-toast';
import { Video, FileText, Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import GlassModal from '../../components/GlassModal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { uploadVideo } from '../../api/courses.js';

/**
 * Add or edit a lesson. `initial` => edit mode.
 * onSubmit(payload) runs the add/update mutation.
 */
export default function LessonFormModal({ open, onClose, onSubmit, initial, saving }) {
  const isEdit = !!initial;
  const [type, setType] = useState(initial?.type || 'text');
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl || '');
  const [duration, setDuration] = useState(initial?.duration || 0);
  const [progress, setProgress] = useState(null);

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    try {
      const { url, duration: dur } = await uploadVideo(file, setProgress);
      setVideoUrl(url);
      if (dur) setDuration(dur);
      toast.success('Video uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Video upload failed');
    } finally {
      setProgress(null);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      type,
      content: type === 'text' ? content : '',
      videoUrl: type === 'video' ? videoUrl : '',
      duration: type === 'video' ? Number(duration) || 0 : 0,
    };
    onSubmit(payload);
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit lesson' : 'Add lesson'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {/* type toggle */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'text', label: 'Text', Icon: FileText },
            { v: 'video', label: 'Video', Icon: Video },
          ].map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                type === v
                  ? 'border-sky-400 bg-sky-400/10 ring-2 ring-sky-400/50'
                  : 'border-white/40 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5'
              }`}
            >
              <Icon className={`h-4 w-4 ${type === v ? 'text-sky-500' : 'text-slate-400'}`} />
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Lesson title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Hooks"
            className="glass-input"
            autoFocus
          />
        </div>

        {type === 'text' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write the lesson content (markdown supported later)…"
              className="glass-input resize-none"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* upload */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/50 bg-white/30 p-5 text-center transition hover:bg-white/50 dark:border-white/15 dark:bg-white/5">
              {progress !== null ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {progress < 100 ? `Uploading… ${progress}%` : 'Processing video… hang tight'}
                  </span>
                  <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                    <div
                      className={`h-full bg-gradient-to-r from-sky-400 to-brand-600 transition-all ${progress >= 100 ? 'animate-pulse' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {progress >= 100 && (
                    <span className="text-xs text-slate-400">
                      Sending to storage — large videos can take a minute.
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-sky-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Upload a video file
                  </span>
                  <span className="text-xs text-slate-400">MP4/WebM · up to 100 MB on the free plan</span>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideo}
                disabled={progress !== null}
              />
            </label>

            {/* or URL */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                <LinkIcon className="h-3.5 w-3.5" /> Video URL
              </label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://… (uploaded URL appears here)"
                className="glass-input text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Duration (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || progress !== null || !title.trim()}
          >
            {saving ? <Spinner /> : null}
            {isEdit ? 'Save lesson' : 'Add lesson'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
