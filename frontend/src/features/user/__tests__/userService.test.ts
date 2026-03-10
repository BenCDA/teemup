import { userService } from '../userService';
import api from '@/features/shared/api';
import { SportEvent } from '@/types';

jest.mock('@/features/shared/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should fetch user by id', async () => {
      const user = { id: 'user-1', firstName: 'John' };
      mockApi.get.mockResolvedValue({ data: user });

      const result = await userService.getUserById('user-1');

      expect(mockApi.get).toHaveBeenCalledWith('/users/user-1');
      expect(result).toEqual(user);
    });
  });

  describe('getUserFriends', () => {
    it('should fetch user friends', async () => {
      const friends = [{ id: 'f-1' }];
      mockApi.get.mockResolvedValue({ data: friends });

      const result = await userService.getUserFriends('user-1');

      expect(mockApi.get).toHaveBeenCalledWith('/users/user-1/friends');
      expect(result).toEqual(friends);
    });
  });

  describe('getUserEvents', () => {
    it('should fetch user events', async () => {
      const events = [{ id: 'e-1', sport: 'tennis' }];
      mockApi.get.mockResolvedValue({ data: events });

      const result = await userService.getUserEvents('user-1');

      expect(mockApi.get).toHaveBeenCalledWith('/events/user/user-1');
      expect(result).toEqual(events);
    });
  });

  describe('getMyEvents', () => {
    it('should fetch current user events', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await userService.getMyEvents();

      expect(mockApi.get).toHaveBeenCalledWith('/events/me');
    });
  });

  describe('getMyUpcomingEvents', () => {
    it('should fetch upcoming events', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await userService.getMyUpcomingEvents();

      expect(mockApi.get).toHaveBeenCalledWith('/events/me/upcoming');
    });
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const event = { sport: 'football', date: '2025-06-01' };
      mockApi.post.mockResolvedValue({ data: { id: '1', ...event } });

      const result = await userService.createEvent(event as Omit<SportEvent, 'id' | 'userId'>);

      expect(mockApi.post).toHaveBeenCalledWith('/events', event);
      expect(result.id).toBe('1');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      mockApi.delete.mockResolvedValue({});

      await userService.deleteEvent('e-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/events/e-1');
    });
  });
});
