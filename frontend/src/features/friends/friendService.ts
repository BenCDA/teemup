import api from '@/features/shared/api';
import { FriendRequest, User } from '@/types';

export const friendService = {
  getFriends: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/friends');
    return response.data;
  },

  getDiscoverUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/discover');
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get<User[]>('/users/search', { params: { query } });
    return response.data;
  },

  sendFriendRequest: async (userId: string): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(`/friends/request/${userId}`);
    return response.data;
  },

  acceptFriendRequest: async (requestId: string): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(`/friends/accept/${requestId}`);
    return response.data;
  },

  rejectFriendRequest: async (requestId: string): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(`/friends/reject/${requestId}`);
    return response.data;
  },

  cancelFriendRequest: async (requestId: string): Promise<void> => {
    await api.delete(`/friends/cancel/${requestId}`);
  },

  getPendingReceivedRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get<FriendRequest[]>('/friends/requests/received');
    return response.data;
  },

  getPendingSentRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get<FriendRequest[]>('/friends/requests/sent');
    return response.data;
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await api.delete(`/friends/${friendId}`);
  },
};
