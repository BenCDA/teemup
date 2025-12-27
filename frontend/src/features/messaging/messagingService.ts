import api from '@/features/shared/api';
import { Conversation, Message } from '@/types';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const messagingService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/messaging/conversations');
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/messaging/conversations/${conversationId}`);
    return response.data;
  },

  createConversation: async (participantIds: string[], name?: string): Promise<Conversation> => {
    const response = await api.post<Conversation>('/messaging/conversations', {
      participantIds,
      name,
    });
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page = 0,
    size = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>(
      `/messaging/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const response = await api.post<Message>('/messaging/messages', {
      conversationId,
      content,
    });
    return response.data;
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.put<Message>(`/messaging/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/messaging/messages/${messageId}`);
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/messaging/conversations/${conversationId}/read`);
  },
};
