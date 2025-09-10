import { io, Socket } from 'socket.io-client';
import type { Message, Chat, SendMessageRequest } from './chatApi';

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatEvents {
  // Incoming events
  'chat:message': (message: Message) => void;
  'chat:message_read': (data: { messageId: string; userId: string; readAt: Date }) => void;
  'chat:typing': (data: TypingIndicator) => void;
  'chat:user_online': (data: { userId: string; userEmail: string }) => void;
  'chat:user_offline': (data: { userId: string; timestamp: Date }) => void;
  'chat:chat_created': (chat: Chat) => void;
  'chat:user_joined': (data: { userId: string; chatId: string; timestamp: Date }) => void;
  'chat:user_left': (data: { userId: string; chatId: string; timestamp: Date }) => void;
  'error': (data: { message: string }) => void;
}

class ChatWebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventListeners: Map<keyof ChatEvents, Function[]> = new Map();
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map(); // chatId -> timer

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    try {
      this.socket = io('http://localhost:3004', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupEventListeners();
      
      console.log('💬 Initializing Chat WebSocket connection...');
    } catch (error) {
      console.error('💬 Failed to initialize Chat WebSocket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('💬 Chat WebSocket connected');
      this.isConnected = true;
      
      // Auto-authenticate with stored user data
      const authData = this.getStoredAuthData();
      if (authData) {
        this.authenticate(authData.userId, authData.userEmail);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('💬 Chat WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('💬 Chat WebSocket connection error:', error);
    });

    // Setup chat-specific event listeners
    this.socket.on('chat:message', (message: Message) => {
      console.log('💬 Received message:', message);
      this.emit('chat:message', {
        ...message,
        createdAt: new Date(message.createdAt),
        updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
        editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
        readBy: message.readBy.map(r => ({
          ...r,
          readAt: new Date(r.readAt)
        }))
      });
    });

    this.socket.on('chat:message_read', (data) => {
      this.emit('chat:message_read', {
        ...data,
        readAt: new Date(data.readAt)
      });
    });

    this.socket.on('chat:typing', (data: TypingIndicator) => {
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:user_online', (data) => {
      console.log('💬 User online:', data);
      this.emit('chat:user_online', data);
    });

    this.socket.on('chat:user_offline', (data) => {
      console.log('💬 User offline:', data);
      this.emit('chat:user_offline', {
        ...data,
        timestamp: new Date(data.timestamp)
      });
    });

    this.socket.on('chat:chat_created', (chat: Chat) => {
      this.emit('chat:chat_created', {
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        lastActivity: new Date(chat.lastActivity),
        participants: chat.participants.map(p => ({
          ...p,
          joinedAt: new Date(p.joinedAt),
          lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
        }))
      });
    });

    this.socket.on('chat:user_joined', (data) => {
      this.emit('chat:user_joined', {
        ...data,
        timestamp: new Date(data.timestamp)
      });
    });

    this.socket.on('chat:user_left', (data) => {
      this.emit('chat:user_left', {
        ...data,
        timestamp: new Date(data.timestamp)
      });
    });

    this.socket.on('error', (data) => {
      console.error('💬 Chat WebSocket error:', data);
      this.emit('error', data);
    });
  }

  private getStoredAuthData() {
    // In a real app, get this from auth context/localStorage
    return {
      userId: '1',
      userEmail: 'admin@crm.com'
    };
  }

  authenticate(userId: string, userEmail: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('💬 Cannot authenticate - socket not connected');
      return;
    }

    this.currentUserId = userId;
    this.currentUserEmail = userEmail;

    this.socket.emit('chat:authenticate', { userId, userEmail });
    console.log(`💬 Authenticated as ${userEmail}`);
  }

  joinChat(chatId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('💬 Cannot join chat - socket not connected');
      return;
    }

    this.socket.emit('chat:join', { chatId });
    console.log(`💬 Joined chat ${chatId}`);
  }

  leaveChat(chatId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('chat:leave', { chatId });
    console.log(`💬 Left chat ${chatId}`);
  }

  sendMessage(request: SendMessageRequest) {
    if (!this.socket || !this.isConnected) {
      console.warn('💬 Cannot send message - socket not connected');
      return;
    }

    this.socket.emit('chat:send_message', request);
  }

  startTyping(chatId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('chat:typing_start', { chatId });

    // Auto-stop typing after 3 seconds
    const existingTimer = this.typingTimers.get(chatId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.stopTyping(chatId);
    }, 3000);

    this.typingTimers.set(chatId, timer);
  }

  stopTyping(chatId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('chat:typing_stop', { chatId });

    const timer = this.typingTimers.get(chatId);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(chatId);
    }
  }

  markMessageAsRead(chatId: string, messageId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('chat:mark_read', { chatId, messageId });
  }

  // Event subscription methods
  on<K extends keyof ChatEvents>(event: K, callback: ChatEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends keyof ChatEvents>(event: K, callback: ChatEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof ChatEvents>(event: K, data: Parameters<ChatEvents[K]>[0]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`💬 Error in chat event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnectedToChat(): boolean {
    return this.isConnected;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Clear all timers
    for (const timer of this.typingTimers.values()) {
      clearTimeout(timer);
    }
    this.typingTimers.clear();
    
    // Clear all event listeners
    this.eventListeners.clear();
  }
}

// Create singleton instance
export const chatWebSocketService = new ChatWebSocketService();