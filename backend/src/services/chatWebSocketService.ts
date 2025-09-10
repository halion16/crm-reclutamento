import { Server as SocketIOServer, Socket } from 'socket.io';
import { chatService } from './chatService';
import { SendMessageRequest, MessageType } from '../models/Chat';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

class ChatWebSocketService {
  private io: SocketIOServer | null = null;
  private typingUsers: Map<string, Set<string>> = new Map(); // chatId -> Set<userId>
  private typingTimers: Map<string, NodeJS.Timeout> = new Map(); // userId-chatId -> timer
  private cleanupInterval: NodeJS.Timeout | null = null;

  initialize(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    this.startCleanupScheduler();
    console.log('💬 Chat WebSocket service initialized');
  }

  private startCleanupScheduler() {
    // Cleanup di timer orfani ogni 5 minuti
    this.cleanupInterval = setInterval(() => {
      this.cleanupOrphanedTimers();
    }, 5 * 60 * 1000);
  }

  private cleanupOrphanedTimers() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, timer] of this.typingTimers.entries()) {
      // Timer più vecchi di 10 minuti sono considerati orfani
      const timerAge = now - (timer as any)._idleStart;
      if (timerAge > 10 * 60 * 1000) {
        clearTimeout(timer);
        this.typingTimers.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`💬 Cleaned ${cleanedCount} orphaned typing timers`);
    }
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`💬 Chat client connected: ${socket.id}`);
      
      // Handle authentication (mock for now)
      socket.on('chat:authenticate', (data: { userId: string; userEmail: string }) => {
        socket.userId = data.userId || '1'; // Mock default user
        socket.userEmail = data.userEmail || 'admin@crm.com';
        
        // Add user socket to chat service
        chatService.addUserSocket(socket.userId, socket.id);
        
        console.log(`💬 User ${socket.userEmail} authenticated on socket ${socket.id}`);
        
        // Notify others that user is online
        socket.broadcast.emit('chat:user_online', {
          userId: socket.userId,
          userEmail: socket.userEmail
        });
      });

      // Join chat room
      socket.on('chat:join', async (data: { chatId: string }) => {
        try {
          const { chatId } = data;
          const userId = socket.userId || '1';
          
          // Verify user can access this chat
          const chat = await chatService.getChat(chatId, userId);
          if (!chat) {
            socket.emit('error', { message: 'Chat not found or access denied' });
            return;
          }
          
          // Join socket room
          socket.join(`chat-${chatId}`);
          
          console.log(`💬 User ${userId} joined chat ${chatId}`);
          
          // Notify other participants
          socket.to(`chat-${chatId}`).emit('chat:user_joined', {
            userId,
            chatId,
            timestamp: new Date()
          });
          
        } catch (error) {
          console.error('Error joining chat:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Leave chat room
      socket.on('chat:leave', (data: { chatId: string }) => {
        const { chatId } = data;
        const userId = socket.userId || '1';
        
        socket.leave(`chat-${chatId}`);
        
        // Stop typing if user was typing
        this.handleTypingStop(socket, { chatId });
        
        console.log(`💬 User ${userId} left chat ${chatId}`);
        
        // Notify other participants
        socket.to(`chat-${chatId}`).emit('chat:user_left', {
          userId,
          chatId,
          timestamp: new Date()
        });
      });

      // Send message
      socket.on('chat:send_message', async (data: SendMessageRequest) => {
        try {
          const userId = socket.userId || '1';
          
          if (!data.content || !data.content.trim()) {
            socket.emit('error', { message: 'Message content is required' });
            return;
          }
          
          // Send message through service
          const newMessage = await chatService.sendMessage(data, userId);
          
          // Stop typing for this user
          this.handleTypingStop(socket, { chatId: data.chatId });
          
          // Emit message to all participants in the chat
          this.io!.to(`chat-${data.chatId}`).emit('chat:message', newMessage);
          
          console.log(`💬 Message sent in chat ${data.chatId} by user ${userId}`);
          
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { 
            message: error instanceof Error ? error.message : 'Failed to send message' 
          });
        }
      });

      // Typing indicators
      socket.on('chat:typing_start', (data: { chatId: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('chat:typing_stop', (data: { chatId: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Mark message as read
      socket.on('chat:mark_read', async (data: { chatId: string; messageId: string }) => {
        try {
          const userId = socket.userId || '1';
          const { chatId, messageId } = data;
          
          await chatService.markMessageAsRead(chatId, messageId, userId);
          
          // Notify other participants
          socket.to(`chat-${chatId}`).emit('chat:message_read', {
            messageId,
            userId,
            readAt: new Date()
          });
          
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId) {
          // Remove user socket
          chatService.removeUserSocket(userId, socket.id);
          
          // Clear typing timers
          this.clearAllTypingForUser(userId);
          
          // Notify others if user is completely offline
          if (!chatService.isUserOnline(userId)) {
            socket.broadcast.emit('chat:user_offline', {
              userId,
              timestamp: new Date()
            });
          }
        }
        
        console.log(`💬 Chat client disconnected: ${socket.id}`);
      });
    });
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { chatId: string }) {
    const userId = socket.userId || '1';
    const { chatId } = data;
    const typingKey = `${userId}-${chatId}`;
    
    // Clear existing timer
    const existingTimer = this.typingTimers.get(typingKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Add to typing users
    let chatTypingUsers = this.typingUsers.get(chatId);
    if (!chatTypingUsers) {
      chatTypingUsers = new Set();
      this.typingUsers.set(chatId, chatTypingUsers);
    }
    chatTypingUsers.add(userId);
    
    // Notify other participants
    socket.to(`chat-${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      isTyping: true
    });
    
    // Auto-stop typing after 3 seconds
    const timer = setTimeout(() => {
      this.handleTypingStop(socket, { chatId });
    }, 3000);
    
    this.typingTimers.set(typingKey, timer);
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { chatId: string }) {
    const userId = socket.userId || '1';
    const { chatId } = data;
    const typingKey = `${userId}-${chatId}`;
    
    // Clear timer
    const timer = this.typingTimers.get(typingKey);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(typingKey);
    }
    
    // Remove from typing users
    const chatTypingUsers = this.typingUsers.get(chatId);
    if (chatTypingUsers) {
      chatTypingUsers.delete(userId);
      if (chatTypingUsers.size === 0) {
        this.typingUsers.delete(chatId);
      }
    }
    
    // Notify other participants
    socket.to(`chat-${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      isTyping: false
    });
  }

  private clearAllTypingForUser(userId: string) {
    // Clear all typing timers for this user
    for (const [key, timer] of this.typingTimers.entries()) {
      if (key.startsWith(`${userId}-`)) {
        clearTimeout(timer);
        this.typingTimers.delete(key);
      }
    }
    
    // Remove user from all typing indicators
    for (const [chatId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(userId)) {
        typingUsers.delete(userId);
        if (typingUsers.size === 0) {
          this.typingUsers.delete(chatId);
        }
        
        // Notify chat participants
        if (this.io) {
          this.io.to(`chat-${chatId}`).emit('chat:typing', {
            chatId,
            userId,
            isTyping: false
          });
        }
      }
    }
  }

  // Public methods for external use
  emitToChatParticipants(chatId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`chat-${chatId}`).emit(event, data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      const sockets = chatService.getUserSockets(userId);
      sockets.forEach(socketId => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  // Graceful shutdown per cleanup
  shutdown() {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear all typing timers
    for (const [key, timer] of this.typingTimers.entries()) {
      clearTimeout(timer);
    }
    this.typingTimers.clear();
    
    // Clear typing users
    this.typingUsers.clear();
    
    console.log('💬 Chat WebSocket service shutdown completed');
  }
}

export const chatWebSocketService = new ChatWebSocketService();