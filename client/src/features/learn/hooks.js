import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { browseCourses, getPublicCourse } from '../../api/courses.js';
import {
  enrollCourse,
  getMyEnrollments,
  getCourseLearn,
  saveProgress,
} from '../../api/learn.js';

export const learnKeys = {
  browse: (params) => ['browse', params],
  publicCourse: (id) => ['publicCourse', id],
  myEnrollments: ['enrollments', 'me'],
  learn: (id) => ['learn', id],
};

/* --------------------------------- Browse ----------------------------------- */

export function useBrowseCourses(params) {
  return useQuery({
    queryKey: learnKeys.browse(params),
    queryFn: () => browseCourses(params),
    keepPreviousData: true,
  });
}

export function usePublicCourse(id) {
  return useQuery({
    queryKey: learnKeys.publicCourse(id),
    queryFn: () => getPublicCourse(id),
    enabled: !!id,
  });
}

/* ------------------------------- Enrollments -------------------------------- */

export function useMyEnrollments() {
  return useQuery({ queryKey: learnKeys.myEnrollments, queryFn: getMyEnrollments });
}

export function useEnroll(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => enrollCourse(courseId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: learnKeys.publicCourse(courseId) });
      qc.invalidateQueries({ queryKey: learnKeys.myEnrollments });
      toast.success(data.alreadyEnrolled ? 'Already enrolled' : 'Enrolled! 🎉');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not enroll'),
  });
}

/* ---------------------------------- Learn ----------------------------------- */

export function useCourseLearn(id) {
  return useQuery({
    queryKey: learnKeys.learn(id),
    queryFn: () => getCourseLearn(id),
    enabled: !!id,
  });
}

/**
 * Save progress (mark complete / watched seconds) and refresh the learn view +
 * enrollments list so progress bars stay in sync.
 */
export function useSaveProgress(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveProgress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: learnKeys.learn(courseId) });
      qc.invalidateQueries({ queryKey: learnKeys.myEnrollments });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save progress'),
  });
}
