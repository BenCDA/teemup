import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { getAccessToken } from './api';

// Auto-detect Socket URL from Expo's dev server
const getSocketUrl = (): string => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:9092`;
    }
  }
  return process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:9092';
};

const SOCKET_URL = getSocketUrl();

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private joinedRooms: Set<string> = new Set(); // Track joined rooms for auto-rejoin
  private pendingEmits: Array<{ event: string; data?: unknown }> = []; // Queue for events when disconnected

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
      this.setStatus('disconnected');
      return;
    }

    return new Promise<void>((resolve) => {
      this.socket = io(SOCKET_URL, {
        query: { token }, // netty-socketio reads token via getSingleUrlParam("token")
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      const timeout = setTimeout(() => {
        // Resolve anyway after 5s to not block auth flow
        resolve();
      }, 5000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.setStatus('connected');
        // Flush pending events queued while disconnected
        this.pendingEmits.forEach(({ event, data }) => this.socket?.emit(event, data));
        this.pendingEmits = [];
        // Auto-rejoin rooms after reconnection
        this.joinedRooms.forEach(room => this.socket?.emit('joinConversation', room));
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.setStatus('disconnected');
      });

      this.socket.on('reconnecting', () => {
        this.setStatus('connecting');
      });

      this.socket.on('reconnect_failed', () => {
        this.setStatus('error');
      });

      this.socket.on('connect_error', () => {
        clearTimeout(timeout);
        this.setStatus('error');
        resolve(); // Resolve (not reject) to not break auth flow
      });

      // Re-emit events to registered listeners
      this.socket.onAny((event, ...args) => {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach((listener) => listener(...args));
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.joinedRooms.clear();
    this.pendingEmits = [];
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue for flush on connect
      this.pendingEmits.push({ event, data });
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
    this.joinedRooms.add(conversationId);
    this.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.joinedRooms.delete(conversationId);
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
