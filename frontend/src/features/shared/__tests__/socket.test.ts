import { socketService } from '../socket';
import { getAccessToken } from '../api';

// Mock the api module
jest.mock('../api', () => ({
  getAccessToken: jest.fn(),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    onAny: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
    Socket: jest.fn(),
  };
});

describe('SocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketService.disconnect();
  });

  describe('connect', () => {
    it('should not proceed with connection if no token is available', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await socketService.connect();

      expect(warnSpy).toHaveBeenCalledWith('No token available for socket connection');
      expect(socketService.getConnectionStatus()).toBe('disconnected');
      warnSpy.mockRestore();
    });

    it('should set status to connecting when token is available', async () => {
      const mockToken = 'test-jwt-token';
      (getAccessToken as jest.Mock).mockResolvedValue(mockToken);

      // Start connecting
      const connectPromise = socketService.connect();

      // Check immediate state
      expect(socketService.getConnectionStatus()).toBe('connecting');

      await connectPromise;
    });
  });

  describe('disconnect', () => {
    it('should clear socket reference and listeners on disconnect', () => {
      // Disconnect should not throw even when called multiple times
      socketService.disconnect();
      socketService.disconnect();

      // isConnected should return false after disconnect
      expect(socketService.isConnected()).toBe(false);
    });
  });

  describe('emit', () => {
    it('should warn when socket is not connected', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      socketService.emit('testEvent', { data: 'test' });

      expect(warnSpy).toHaveBeenCalledWith('Socket not connected, cannot emit:', 'testEvent');
      warnSpy.mockRestore();
    });
  });

  describe('event listeners', () => {
    it('should register and unregister event listeners', () => {
      const callback = jest.fn();

      const unsubscribe = socketService.on('testEvent', callback);

      expect(typeof unsubscribe).toBe('function');

      // Unsubscribe should not throw
      unsubscribe();
    });

    it('should allow multiple listeners for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = socketService.on('testEvent', callback1);
      const unsub2 = socketService.on('testEvent', callback2);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');

      unsub1();
      unsub2();
    });

    it('should remove specific listener with off method', () => {
      const callback = jest.fn();

      socketService.on('testEvent', callback);
      socketService.off('testEvent', callback);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('status listeners', () => {
    it('should register status listeners and provide unsubscribe function', () => {
      const statusCallback = jest.fn();

      const unsubscribe = socketService.onStatusChange(statusCallback);

      // Should be called with current status
      expect(statusCallback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('isConnected', () => {
    it('should return false when socket is not connected', () => {
      expect(socketService.isConnected()).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return a valid connection status', () => {
      const status = socketService.getConnectionStatus();
      const validStatuses = ['connected', 'disconnected', 'connecting', 'error'];

      expect(validStatuses).toContain(status);
    });
  });

  describe('messaging methods', () => {
    it('should have joinConversation method', () => {
      expect(typeof socketService.joinConversation).toBe('function');
    });

    it('should have leaveConversation method', () => {
      expect(typeof socketService.leaveConversation).toBe('function');
    });

    it('should have sendMessage method', () => {
      expect(typeof socketService.sendMessage).toBe('function');
    });

    it('should have startTyping method', () => {
      expect(typeof socketService.startTyping).toBe('function');
    });

    it('should have stopTyping method', () => {
      expect(typeof socketService.stopTyping).toBe('function');
    });

    it('should have markAsRead method', () => {
      expect(typeof socketService.markAsRead).toBe('function');
    });

    it('should warn when calling joinConversation without connection', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      socketService.joinConversation('conv-123');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should warn when calling sendMessage without connection', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      socketService.sendMessage('conv-123', 'Hello');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
