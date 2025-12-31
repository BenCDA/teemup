import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:9092';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.setStatus('connecting');

    const token = await getAccessToken();
    if (!token) {
      console.warn('No token available for socket connection');
      this.setStatus('disconnected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.setStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.setStatus('disconnected');
    });

    this.socket.on('reconnecting', () => {
      this.setStatus('connecting');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.setStatus('error');
    });

    // Re-emit events to registered listeners
    this.socket.onAny((event, ...args) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(...args));
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  joinConversation(conversationId: string): void {
    this.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.emit('leaveConversation', conversationId);
  }

  sendMessage(conversationId: string, content: string): void {
    this.emit('sendMessage', { conversationId, content });
  }

  startTyping(conversationId: string): void {
    this.emit('typing', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.emit('stopTyping', { conversationId });
  }

  markAsRead(conversationId: string): void {
    this.emit('markRead', { conversationId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}

export const socketService = new SocketService();
export default socketService;
