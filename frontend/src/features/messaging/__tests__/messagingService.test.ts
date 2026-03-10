import { messagingService } from '../messagingService';
import api from '@/features/shared/api';

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

describe('messagingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should fetch conversations', async () => {
      const conversations = [{ id: 'conv-1', type: 'PRIVATE' }];
      mockApi.get.mockResolvedValue({ data: conversations });

      const result = await messagingService.getConversations();

      expect(mockApi.get).toHaveBeenCalledWith('/messaging/conversations');
      expect(result).toEqual(conversations);
    });
  });

  describe('getConversation', () => {
    it('should fetch a single conversation', async () => {
      const conversation = { id: 'conv-1', type: 'PRIVATE' };
      mockApi.get.mockResolvedValue({ data: conversation });

      const result = await messagingService.getConversation('conv-1');

      expect(mockApi.get).toHaveBeenCalledWith('/messaging/conversations/conv-1');
      expect(result).toEqual(conversation);
    });
  });

  describe('createConversation', () => {
    it('should create a conversation', async () => {
      const conversation = { id: 'conv-1' };
      mockApi.post.mockResolvedValue({ data: conversation });

      const result = await messagingService.createConversation(['user-1', 'user-2'], 'Group');

      expect(mockApi.post).toHaveBeenCalledWith('/messaging/conversations', {
        participantIds: ['user-1', 'user-2'],
        name: 'Group',
      });
      expect(result).toEqual(conversation);
    });
  });

  describe('getMessages', () => {
    it('should fetch paginated messages', async () => {
      const response = { content: [], totalElements: 0, totalPages: 0, size: 50, number: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await messagingService.getMessages('conv-1', 0, 50);

      expect(mockApi.get).toHaveBeenCalledWith('/messaging/conversations/conv-1/messages', {
        params: { page: 0, size: 50 },
      });
      expect(result).toEqual(response);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const message = { id: 'msg-1', content: 'Hello' };
      mockApi.post.mockResolvedValue({ data: message });

      const result = await messagingService.sendMessage('conv-1', 'Hello');

      expect(mockApi.post).toHaveBeenCalledWith('/messaging/messages', {
        conversationId: 'conv-1',
        content: 'Hello',
      });
      expect(result).toEqual(message);
    });
  });

  describe('editMessage', () => {
    it('should edit a message', async () => {
      const message = { id: 'msg-1', content: 'Updated', isEdited: true };
      mockApi.put.mockResolvedValue({ data: message });

      const result = await messagingService.editMessage('msg-1', 'Updated');

      expect(mockApi.put).toHaveBeenCalledWith('/messaging/messages/msg-1', { content: 'Updated' });
      expect(result).toEqual(message);
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message', async () => {
      mockApi.delete.mockResolvedValue({});

      await messagingService.deleteMessage('msg-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/messaging/messages/msg-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      mockApi.post.mockResolvedValue({});

      await messagingService.markAsRead('conv-1');

      expect(mockApi.post).toHaveBeenCalledWith('/messaging/conversations/conv-1/read');
    });
  });
});
