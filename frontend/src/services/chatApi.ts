import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

export enum ChatType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP', 
  CANDIDATE = 'CANDIDATE'
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export interface ChatParticipant {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
  isMuted: boolean;
  isPinned: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  candidateId?: string;
  isArchived: boolean;
  isPinned: boolean;
  settings: {
    allowFileSharing: boolean;
    allowImageSharing: boolean;
    maxParticipants: number;
    isPublic: boolean;
    requireApproval: boolean;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  attachments?: {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  }[];
  createdAt: Date;
  updatedAt?: Date;
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  status: MessageStatus;
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  replyTo?: string;
  threadCount?: number;
}

export interface CreateChatRequest {
  type: ChatType;
  name?: string;
  description?: string;
  participantIds: string[];
  candidateId?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ChatApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken') || 'dummy-token';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUserChats(): Promise<{ chats: Chat[]; unreadCount: number }> {
    try {
      const response = await axios.get<ApiResponse<{ chats: Chat[]; unreadCount: number }>>(
        `${API_BASE_URL}/chat/chats`, 
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const { chats, unreadCount } = response.data.data;
        return {
          chats: chats.map(chat => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            lastActivity: new Date(chat.lastActivity),
            participants: chat.participants.map(p => ({
              ...p,
              joinedAt: new Date(p.joinedAt),
              lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
            })),
            lastMessage: chat.lastMessage ? {
              ...chat.lastMessage,
              createdAt: new Date(chat.lastMessage.createdAt),
              updatedAt: chat.lastMessage.updatedAt ? new Date(chat.lastMessage.updatedAt) : undefined,
              editedAt: chat.lastMessage.editedAt ? new Date(chat.lastMessage.editedAt) : undefined,
              readBy: chat.lastMessage.readBy.map(r => ({
                ...r,
                readAt: new Date(r.readAt)
              }))
            } : undefined
          })),
          unreadCount
        };
      }
      
      throw new Error(response.data.error || 'Failed to fetch chats');
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await axios.get<ApiResponse<Chat>>(
        `${API_BASE_URL}/chat/${chatId}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const chat = response.data.data;
        return {
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          lastActivity: new Date(chat.lastActivity),
          participants: chat.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
          })),
          lastMessage: chat.lastMessage ? {
            ...chat.lastMessage,
            createdAt: new Date(chat.lastMessage.createdAt),
            updatedAt: chat.lastMessage.updatedAt ? new Date(chat.lastMessage.updatedAt) : undefined,
            editedAt: chat.lastMessage.editedAt ? new Date(chat.lastMessage.editedAt) : undefined,
            readBy: chat.lastMessage.readBy.map(r => ({
              ...r,
              readAt: new Date(r.readAt)
            }))
          } : undefined
        };
      }
      
      throw new Error(response.data.error || 'Failed to fetch chat');
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  async createChat(request: CreateChatRequest): Promise<Chat> {
    try {
      const response = await axios.post<ApiResponse<Chat>>(
        `${API_BASE_URL}/chat`,
        request,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const chat = response.data.data;
        return {
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          lastActivity: new Date(chat.lastActivity),
          participants: chat.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
          }))
        };
      }
      
      throw new Error(response.data.error || 'Failed to create chat');
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async getChatMessages(
    chatId: string, 
    limit: number = 50, 
    before?: string
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const params: any = { limit };
      if (before) params.before = before;
      
      const response = await axios.get<ApiResponse<{ messages: Message[]; hasMore: boolean }>>(
        `${API_BASE_URL}/chat/${chatId}/messages`,
        { 
          headers: this.getAuthHeaders(),
          params
        }
      );
      
      if (response.data.success && response.data.data) {
        const { messages, hasMore } = response.data.data;
        return {
          messages: messages.map(message => ({
            ...message,
            createdAt: new Date(message.createdAt),
            updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
            editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
            readBy: message.readBy.map(r => ({
              ...r,
              readAt: new Date(r.readAt)
            }))
          })),
          hasMore
        };
      }
      
      throw new Error(response.data.error || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      const response = await axios.post<ApiResponse<Message>>(
        `${API_BASE_URL}/chat/${request.chatId}/messages`,
        request,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const message = response.data.data;
        return {
          ...message,
          createdAt: new Date(message.createdAt),
          updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
          editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
          readBy: message.readBy.map(r => ({
            ...r,
            readAt: new Date(r.readAt)
          }))
        };
      }
      
      throw new Error(response.data.error || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(chatId: string, messageId: string): Promise<void> {
    try {
      const response = await axios.put<ApiResponse<void>>(
        `${API_BASE_URL}/chat/${chatId}/messages/${messageId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark message as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async updateChat(chatId: string, updates: Partial<Chat>): Promise<Chat> {
    try {
      const response = await axios.put<ApiResponse<Chat>>(
        `${API_BASE_URL}/chat/${chatId}`,
        updates,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const chat = response.data.data;
        return {
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          lastActivity: new Date(chat.lastActivity),
          participants: chat.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
          }))
        };
      }
      
      throw new Error(response.data.error || 'Failed to update chat');
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  }

  async togglePin(chatId: string): Promise<Chat> {
    try {
      const response = await axios.put<ApiResponse<Chat>>(
        `${API_BASE_URL}/chat/${chatId}/pin`,
        {},
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const chat = response.data.data;
        return {
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          lastActivity: new Date(chat.lastActivity),
          participants: chat.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
          }))
        };
      }
      
      throw new Error(response.data.error || 'Failed to toggle pin');
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  }

  async toggleArchive(chatId: string): Promise<Chat> {
    try {
      const response = await axios.put<ApiResponse<Chat>>(
        `${API_BASE_URL}/chat/${chatId}/archive`,
        {},
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        const chat = response.data.data;
        return {
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          lastActivity: new Date(chat.lastActivity),
          participants: chat.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
          }))
        };
      }
      
      throw new Error(response.data.error || 'Failed to toggle archive');
    } catch (error) {
      console.error('Error toggling archive:', error);
      throw error;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${API_BASE_URL}/chat/${chatId}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }
}

export const chatApi = new ChatApiService();