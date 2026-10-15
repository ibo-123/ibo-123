import type { NotificationItem, NotificationPreferences } from '../types';
import { apiRequest } from './api';

export function listNotifications() {
  return apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
}

export function markNotificationRead(id: string) {
  return apiRequest<{ notification: NotificationItem }>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ unreadCount: number }>('/api/notifications/read-all', {
    method: 'PATCH',
  });
}

export function getNotificationPreferences() {
  return apiRequest<{ preferences: NotificationPreferences }>('/api/notifications/preferences');
}

export function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  return apiRequest<{ preferences: NotificationPreferences }>('/api/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}
