import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../../api/courses.js';

export const courseKeys = {
  mine: ['courses', 'mine'],
  detail: (id) => ['course', id],
};

/* --------------------------------- Queries ---------------------------------- */

export function useMyCourses() {
  return useQuery({ queryKey: courseKeys.mine, queryFn: api.getMyCourses });
}

export function useCourse(id) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => api.getCourse(id),
    enabled: !!id,
  });
}

/* ------------------------------ Course mutations ---------------------------- */

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.mine });
      toast.success('Course created');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not create course'),
  });
}

export function useUpdateCourse(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.updateCourse(courseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.mine });
      toast.success('Saved');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save'),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.mine });
      toast.success('Course deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });
}

export function useTogglePublish(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPublished) => api.togglePublish(courseId, isPublished),
    onMutate: async (isPublished) => {
      await qc.cancelQueries({ queryKey: courseKeys.detail(courseId) });
      const prev = qc.getQueryData(courseKeys.detail(courseId));
      if (prev) qc.setQueryData(courseKeys.detail(courseId), { ...prev, isPublished });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(courseKeys.detail(courseId), ctx.prev);
      toast.error(e.response?.data?.message || 'Could not update publish state');
    },
    onSuccess: (data) => toast.success(data.message || 'Updated'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.mine });
    },
  });
}

/* ------------------------------ Module mutations ---------------------------- */

export function useAddModule(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title) => api.addModule(courseId, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Module added');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not add module'),
  });
}

export function useUpdateModule(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, title }) => api.updateModule(moduleId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) }),
    onError: (e) => toast.error(e.response?.data?.message || 'Could not rename module'),
  });
}

export function useDeleteModule(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId) => api.deleteModule(moduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Module deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete module'),
  });
}

export function useReorderModules(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds) => api.reorderModules(courseId, orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: courseKeys.detail(courseId) });
      const prev = qc.getQueryData(courseKeys.detail(courseId));
      if (prev?.modules) {
        const byId = Object.fromEntries(prev.modules.map((m) => [m._id, m]));
        const reordered = orderedIds.map((id) => byId[id]).filter(Boolean);
        qc.setQueryData(courseKeys.detail(courseId), { ...prev, modules: reordered });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(courseKeys.detail(courseId), ctx.prev);
      toast.error('Could not reorder');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) }),
  });
}

/* ------------------------------ Lesson mutations ---------------------------- */

export function useAddLesson(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, payload }) => api.addLesson(moduleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Lesson added');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not add lesson'),
  });
}

export function useUpdateLesson(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, payload }) => api.updateLesson(lessonId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Lesson saved');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save lesson'),
  });
}

export function useDeleteLesson(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId) => api.deleteLesson(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Lesson deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete lesson'),
  });
}

export function useReorderLessons(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, orderedIds }) => api.reorderLessons(moduleId, orderedIds),
    onMutate: async ({ moduleId, orderedIds }) => {
      await qc.cancelQueries({ queryKey: courseKeys.detail(courseId) });
      const prev = qc.getQueryData(courseKeys.detail(courseId));
      if (prev?.modules) {
        const modules = prev.modules.map((m) => {
          if (m._id !== moduleId) return m;
          const byId = Object.fromEntries(m.lessons.map((l) => [l._id, l]));
          return { ...m, lessons: orderedIds.map((id) => byId[id]).filter(Boolean) };
        });
        qc.setQueryData(courseKeys.detail(courseId), { ...prev, modules });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(courseKeys.detail(courseId), ctx.prev);
      toast.error('Could not reorder lessons');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) }),
  });
}
