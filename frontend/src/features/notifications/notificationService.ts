import api from '@/features/shared/api';
import { Notification } from '@/types';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
      params: { page, size },
    });
    return response.data;
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications/unread');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/unread/count');
    return response.data.count;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
