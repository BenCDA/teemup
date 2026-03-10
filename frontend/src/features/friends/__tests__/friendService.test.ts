import { friendService } from '../friendService';
import api from '@/features/shared/api';

jest.mock('@/features/shared/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('friendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFriends', () => {
    it('should fetch friends list', async () => {
      const friends = [{ id: '1', firstName: 'Alice' }];
      mockApi.get.mockResolvedValue({ data: friends });

      const result = await friendService.getFriends();

      expect(mockApi.get).toHaveBeenCalledWith('/users/friends');
      expect(result).toEqual(friends);
    });
  });

  describe('searchUsers', () => {
    it('should search users with query', async () => {
      const users = [{ id: '2', firstName: 'Bob' }];
      mockApi.get.mockResolvedValue({ data: users });

      const result = await friendService.searchUsers('Bob');

      expect(mockApi.get).toHaveBeenCalledWith('/users/search', { params: { query: 'Bob' } });
      expect(result).toEqual(users);
    });
  });

  describe('sendFriendRequest', () => {
    it('should send a friend request', async () => {
      const request = { id: 'req-1', status: 'PENDING' };
      mockApi.post.mockResolvedValue({ data: request });

      const result = await friendService.sendFriendRequest('user-123');

      expect(mockApi.post).toHaveBeenCalledWith('/friends/request/user-123');
      expect(result).toEqual(request);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept a friend request', async () => {
      const request = { id: 'req-1', status: 'ACCEPTED' };
      mockApi.post.mockResolvedValue({ data: request });

      const result = await friendService.acceptFriendRequest('req-1');

      expect(mockApi.post).toHaveBeenCalledWith('/friends/accept/req-1');
      expect(result).toEqual(request);
    });
  });

  describe('rejectFriendRequest', () => {
    it('should reject a friend request', async () => {
      const request = { id: 'req-1', status: 'REJECTED' };
      mockApi.post.mockResolvedValue({ data: request });

      const result = await friendService.rejectFriendRequest('req-1');

      expect(mockApi.post).toHaveBeenCalledWith('/friends/reject/req-1');
      expect(result).toEqual(request);
    });
  });

  describe('cancelFriendRequest', () => {
    it('should cancel a friend request', async () => {
      mockApi.delete.mockResolvedValue({});

      await friendService.cancelFriendRequest('req-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/friends/cancel/req-1');
    });
  });

  describe('getPendingReceivedRequests', () => {
    it('should fetch received requests', async () => {
      const requests = [{ id: 'req-1' }];
      mockApi.get.mockResolvedValue({ data: requests });

      const result = await friendService.getPendingReceivedRequests();

      expect(mockApi.get).toHaveBeenCalledWith('/friends/requests/received');
      expect(result).toEqual(requests);
    });
  });

  describe('removeFriend', () => {
    it('should remove a friend', async () => {
      mockApi.delete.mockResolvedValue({});

      await friendService.removeFriend('friend-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/friends/friend-1');
    });
  });
});
