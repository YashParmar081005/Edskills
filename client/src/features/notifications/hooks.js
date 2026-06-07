import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api/notifications.js';

export const notifKey = ['notifications'];

export function useNotifications() {
  return useQuery({ queryKey: notifKey, queryFn: api.getNotifications });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKey }),
  });
}
