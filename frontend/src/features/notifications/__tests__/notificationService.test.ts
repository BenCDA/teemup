import { notificationService } from '../notificationService';
import api from '@/features/shared/api';

jest.mock('@/features/shared/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch paginated notifications', async () => {
      const response = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await notificationService.getNotifications(0, 20);

      expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params: { page: 0, size: 20 } });
      expect(result).toEqual(response);
    });

    it('should use default pagination params', async () => {
      mockApi.get.mockResolvedValue({ data: { content: [] } });

      await notificationService.getNotifications();

      expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params: { page: 0, size: 20 } });
    });
  });

  describe('getUnreadNotifications', () => {
    it('should fetch unread notifications', async () => {
      const notifications = [{ id: '1', isRead: false }];
      mockApi.get.mockResolvedValue({ data: notifications });

      const result = await notificationService.getUnreadNotifications();

      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread');
      expect(result).toEqual(notifications);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockApi.get.mockResolvedValue({ data: { count: 5 } });

      const result = await notificationService.getUnreadCount();

      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread/count');
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: '1', isRead: true };
      mockApi.patch.mockResolvedValue({ data: notification });

      const result = await notificationService.markAsRead('1');

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/1/read');
      expect(result).toEqual(notification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      mockApi.post.mockResolvedValue({});

      await notificationService.markAllAsRead();

      expect(mockApi.post).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockApi.delete.mockResolvedValue({});

      await notificationService.deleteNotification('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/notifications/1');
    });
  });
});
