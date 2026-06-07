import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../../api/assignments.js';

export const assignmentKeys = {
  course: (courseId) => ['assignments', 'course', courseId],
  submissions: (assignmentId) => ['submissions', assignmentId],
};

export function useCourseAssignments(courseId) {
  return useQuery({
    queryKey: assignmentKeys.course(courseId),
    queryFn: () => api.listCourseAssignments(courseId),
    enabled: !!courseId,
  });
}

export function useCreateAssignment(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createAssignment(courseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.course(courseId) });
      toast.success('Assignment created');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not create assignment'),
  });
}

export function useUpdateAssignment(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateAssignment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.course(courseId) });
      toast.success('Assignment updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not update'),
  });
}

export function useDeleteAssignment(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.course(courseId) });
      toast.success('Assignment deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });
}

export function useSubmitAssignment(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.submitAssignment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.course(courseId) });
      toast.success('Submitted ✓');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not submit'),
  });
}

export function useSubmissions(assignmentId) {
  return useQuery({
    queryKey: assignmentKeys.submissions(assignmentId),
    queryFn: () => api.listSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission(assignmentId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.gradeSubmission(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.submissions(assignmentId) });
      toast.success('Grade saved');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save grade'),
  });
}

export function useAiSuggest() {
  return useMutation({
    mutationFn: (submissionId) => api.aiSuggestGrade(submissionId),
    onError: (e) => toast.error(e.response?.data?.message || 'AI grading failed'),
  });
}
