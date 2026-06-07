import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../../api/forum.js';

export const forumKeys = {
  threads: (courseId) => ['threads', courseId],
  thread: (threadId) => ['thread', threadId],
};

export function useThreads(courseId) {
  return useQuery({
    queryKey: forumKeys.threads(courseId),
    queryFn: () => api.listThreads(courseId),
    enabled: !!courseId,
  });
}

export function useThread(threadId) {
  return useQuery({
    queryKey: forumKeys.thread(threadId),
    queryFn: () => api.getThread(threadId),
    enabled: !!threadId,
  });
}

export function useCreateThread(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createThread(courseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: forumKeys.threads(courseId) });
      toast.success('Question posted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not post'),
  });
}

export function useDeleteThread(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteThread,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: forumKeys.threads(courseId) });
      toast.success('Thread deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });
}

export function useCreateReply(threadId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.createReply(threadId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
    onError: (e) => toast.error(e.response?.data?.message || 'Could not reply'),
  });
}

export function useDeleteReply(threadId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteReply,
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete reply'),
  });
}

export function useUpvoteThread(threadId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.upvoteThread,
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
  });
}

export function useUpvoteReply(threadId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.upvoteReply,
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
  });
}

export function useMarkAnswer(threadId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAnswer,
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
    onError: (e) => toast.error(e.response?.data?.message || 'Could not mark answer'),
  });
}
