import apiClient from './client';
import { Notification } from '../types';

export const getNotifications = async (page = 1, limit = 30): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>('/notifications', {
    params: { page, limit },
  });
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await apiClient.patch(`/notifications/${notificationId}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await apiClient.post('/notifications/mark-all-read');
};

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`/notifications/${notificationId}`);
};
