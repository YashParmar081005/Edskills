import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  PlayCircle,
  ListChecks,
} from 'lucide-react';
import { useCourseLearn, learnKeys } from '../features/learn/hooks.js';
import { saveProgress } from '../api/learn.js';
import ProgressBar from '../components/ProgressBar.jsx';
import Spinner from '../components/Spinner.jsx';

export default function CoursePlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useCourseLearn(courseId);

  // Flatten lessons across modules, preserving order.
  const flat = useMemo(() => {
    if (!data) return [];
    return data.course.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))
    );
  }, [data]);

  // Live local state for ticks + overall %, seeded from server data.
  const [completed, setCompleted] = useState({});
  const [watched, setWatched] = useState({});
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!data) return;
    const c = {}, w = {};
    flat.forEach((l) => {
      c[l._id] = !!l.completed;
      w[l._id] = l.watchedSeconds || 0;
    });
    setCompleted(c);
    setWatched(w);
    setPercent(data.progress.percent);
  }, [data, flat]);

  // First-incomplete auto-pick when no lesson is in the URL.
  const autoPickId = useMemo(() => {
    if (!flat.length) return null;
    return (flat.find((l) => !l.completed) || flat[0])._id;
  }, [flat]);

  const currentId = lessonId || autoPickId;
  const current = flat.find((l) => l._id === currentId) || null;
  const currentIndex = flat.findIndex((l) => l._id === currentId);

  // Put a lesson in the URL once data is ready.
  useEffect(() => {
    if (data && autoPickId && !lessonId) {
      navigate(`/learn/${courseId}/${autoPickId}`, { replace: true });
    }
  }, [data, autoPickId, lessonId, courseId, navigate]);

  // Video refs / resume tracking
  const videoRef = useRef(null);
  const resumedRef = useRef(null);
  const lastSavedRef = useRef(0);
  useEffect(() => {
    resumedRef.current = null;
    lastSavedRef.current = 0;
  }, [currentId]);

  const persistWatched = (id, seconds) => {
    saveProgress({ lessonId: id, watchedSeconds: seconds }).catch(() => {});
  };

  const markComplete = async (id, silent = false) => {
    if (completed[id]) return;
    try {
      const res = await saveProgress({ lessonId: id, completed: true });
      setCompleted((prev) => ({ ...prev, [id]: true }));
      if (typeof res.percent === 'number') setPercent(res.percent);
      qc.invalidateQueries({ queryKey: learnKeys.myEnrollments });
      if (res.percent === 100) toast.success('Course complete! 🎉');
      else if (!silent) toast.success('Lesson complete');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save progress');
    }
  };

  const goTo = (idx) => {
    const l = flat[idx];
    if (l) navigate(`/learn/${courseId}/${l._id}`);
  };

  // Video event handlers
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || resumedRef.current === currentId) return;
    const w = watched[currentId] || 0;
    if (w > 1 && w < v.duration - 2) v.currentTime = w;
    resumedRef.current = currentId;
  };
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = Math.floor(v.currentTime);
    if (t - lastSavedRef.current >= 10) {
      lastSavedRef.current = t;
      setWatched((p) => ({ ...p, [currentId]: t }));
      persistWatched(currentId, t);
    }
  };
  const onEnded = () => markComplete(currentId, true);

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
            ? 'Enroll in this course to start learning.'
            : code === 404
              ? 'Course not found.'
              : "Couldn't load this course."}
        </p>
        <Link to={`/courses/${courseId}`} className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Go to course page
        </Link>
      </div>
    );
  }

  if (!flat.length) {
    return (
      <div className="glass-card mx-auto max-w-md p-8 text-center text-slate-500">
        This course has no lessons yet.
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="glass-card p-5">
        <Link
          to="/student/my-courses"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> My Learning
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {data.course.title}
          </h1>
          <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            {percent}% complete
          </span>
        </div>
        <ProgressBar percent={percent} className="mt-2" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Content */}
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            {current?.type === 'video' ? (
              current.videoUrl ? (
                <video
                  key={current._id}
                  ref={videoRef}
                  src={current.videoUrl}
                  controls
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={onTimeUpdate}
                  onEnded={onEnded}
                  className="aspect-video w-full bg-black"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-slate-900/80 text-slate-300">
                  <div className="text-center">
                    <Video className="mx-auto h-10 w-10 opacity-60" />
                    <p className="mt-2 text-sm">No video source for this lesson yet.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="prose-player max-h-[60vh] overflow-auto p-6">
                <div className="mb-3 flex items-center gap-2 text-brand-500">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Reading</span>
                </div>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                  {current?.content || 'No content for this lesson yet.'}
                </div>
              </div>
            )}
          </div>

          {/* Lesson title + actions */}
          <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{current?.moduleTitle}</p>
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                {current?.title}
              </h2>
            </div>
            <button
              onClick={() => markComplete(currentId)}
              disabled={completed[currentId]}
              className={completed[currentId] ? 'btn-ghost' : 'btn-primary'}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completed[currentId] ? 'Completed' : 'Mark complete'}
            </button>
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="btn-ghost disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs text-slate-400">
              Lesson {currentIndex + 1} of {flat.length}
            </span>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex >= flat.length - 1}
              className="btn-ghost disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Curriculum sidebar */}
        <aside className="glass-card h-fit p-4 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <ListChecks className="h-5 w-5 text-brand-500" />
            <h3 className="font-bold">Course content</h3>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-auto pr-1">
            {data.course.modules.map((m, mi) => (
              <div key={m._id}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {mi + 1}. {m.title}
                </p>
                <ul className="space-y-1">
                  {m.lessons.map((l) => {
                    const active = l._id === currentId;
                    const done = completed[l._id];
                    return (
                      <li key={l._id}>
                        <button
                          onClick={() => navigate(`/learn/${courseId}/${l._id}`)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                            active
                              ? 'bg-sky-500/15 font-semibold text-brand-700 ring-1 ring-sky-400/40 dark:text-brand-200'
                              : 'hover:bg-white/40 dark:hover:bg-white/5'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          ) : active ? (
                            <PlayCircle className="h-4 w-4 shrink-0 text-sky-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                          )}
                          {l.type === 'video' ? (
                            <Video className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          )}
                          <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                            {l.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
