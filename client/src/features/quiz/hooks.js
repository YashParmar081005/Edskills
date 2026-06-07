import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../../api/quizzes.js';

export const quizKeys = {
  byLesson: (lessonId) => ['quiz', 'lesson', lessonId],
};

export function useQuizByLesson(lessonId, enabled = true) {
  return useQuery({
    queryKey: quizKeys.byLesson(lessonId),
    queryFn: () => api.getQuizByLesson(lessonId),
    enabled: !!lessonId && enabled,
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: api.generateQuizAI,
    onError: (e) => toast.error(e.response?.data?.message || 'AI generation failed'),
  });
}

export function useSaveQuiz(lessonId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveQuiz,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.byLesson(lessonId) });
      toast.success('Quiz saved');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save quiz'),
  });
}

export function useDeleteQuiz(lessonId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteQuiz,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.byLesson(lessonId) });
      toast.success('Quiz deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete quiz'),
  });
}

export function useAttemptQuiz(lessonId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answers }) => api.attemptQuiz(id, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.byLesson(lessonId) }),
    onError: (e) => toast.error(e.response?.data?.message || 'Could not submit quiz'),
  });
}
