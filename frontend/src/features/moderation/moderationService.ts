import api from '@/features/shared/api';
import { User } from '@/types';

export const moderationService = {
  reportUser: async (userId: string, reason: string, description?: string): Promise<void> => {
    await api.post(`/moderation/report/${userId}`, { reason, description });
  },

  blockUser: async (userId: string): Promise<void> => {
    await api.post(`/moderation/block/${userId}`);
  },

  unblockUser: async (userId: string): Promise<void> => {
    await api.delete(`/moderation/block/${userId}`);
  },

  getBlockedUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/moderation/blocked');
    return response.data;
  },
};
