import { v4 as uuidv4 } from 'uuid';
import { 
  Chat, 
  Message, 
  ChatType, 
  MessageType, 
  MessageStatus,
  ParticipantRole,
  CreateChatRequest,
  SendMessageRequest,
  ChatParticipant,
  ChatSettings
} from '../models/Chat';

class ChatService {
  // Mock database - in real implementation, use actual database
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message[]> = new Map(); // chatId -> messages[]
  
  // Online users tracking
  private onlineUsers: Set<string> = new Set();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create a mock group chat
    const groupChat: Chat = {
      id: 'chat-group-1',
      type: ChatType.GROUP,
      name: 'Team HR',
      description: 'Chat principale del team HR',
      participants: [
        {
          userId: '1',
          userEmail: 'admin@crm.com',
          userName: 'Admin User',
          role: ParticipantRole.OWNER,
          joinedAt: new Date('2024-01-01'),
          lastSeenAt: new Date(),
          isOnline: true,
          isMuted: false,
          isPinned: false
        },
        {
          userId: '2', 
          userEmail: 'hr@crm.com',
          userName: 'HR Manager',
          role: ParticipantRole.ADMIN,
          joinedAt: new Date('2024-01-02'),
          lastSeenAt: new Date(),
          isOnline: false,
          isMuted: false,
          isPinned: true
        }
      ],
      lastActivity: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
      settings: {
        allowFileSharing: true,
        allowImageSharing: true,
        maxParticipants: 50,
        isPublic: false,
        requireApproval: true
      }
    };

    // Create a candidate chat
    const candidateChat: Chat = {
      id: 'chat-candidate-1',
      type: ChatType.CANDIDATE,
      name: 'Marco Rossi - Discussione',
      participants: [
        {
          userId: '1',
          userEmail: 'admin@crm.com', 
          userName: 'Admin User',
          role: ParticipantRole.OWNER,
          joinedAt: new Date('2024-01-15'),
          isOnline: true,
          isMuted: false,
          isPinned: false
        },
        {
          userId: '2',
          userEmail: 'hr@crm.com',
          userName: 'HR Manager', 
          role: ParticipantRole.MEMBER,
          joinedAt: new Date('2024-01-15'),
          isOnline: false,
          isMuted: false,
          isPinned: false
        }
      ],
      candidateId: '1',
      lastActivity: new Date(),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: true,
      settings: {
        allowFileSharing: true,
        allowImageSharing: true,
        maxParticipants: 10,
        isPublic: false,
        requireApproval: false
      }
    };

    // Mock messages
    const groupMessages: Message[] = [
      {
        id: 'msg-1',
        chatId: 'chat-group-1',
        senderId: '1',
        senderName: 'Admin User',
        type: MessageType.TEXT,
        content: 'Benvenuti nel nuovo sistema di chat! 🎉',
        createdAt: new Date('2024-01-20T09:00:00'),
        isEdited: false,
        isDeleted: false,
        status: MessageStatus.READ,
        readBy: [
          { userId: '1', readAt: new Date('2024-01-20T09:00:00') },
          { userId: '2', readAt: new Date('2024-01-20T09:15:00') }
        ]
      },
      {
        id: 'msg-2',
        chatId: 'chat-group-1',
        senderId: '2',
        senderName: 'HR Manager',
        type: MessageType.TEXT,
        content: 'Fantastico! Finalmente possiamo comunicare in tempo reale.',
        createdAt: new Date('2024-01-20T09:16:00'),
        isEdited: false,
        isDeleted: false,
        status: MessageStatus.READ,
        readBy: [
          { userId: '2', readAt: new Date('2024-01-20T09:16:00') },
          { userId: '1', readAt: new Date('2024-01-20T09:17:00') }
        ]
      }
    ];

    const candidateMessages: Message[] = [
      {
        id: 'msg-3',
        chatId: 'chat-candidate-1', 
        senderId: '1',
        senderName: 'Admin User',
        type: MessageType.TEXT,
        content: 'Ottimo candidato per la posizione di Full Stack Developer',
        createdAt: new Date('2024-01-20T10:00:00'),
        isEdited: false,
        isDeleted: false,
        status: MessageStatus.READ,
        readBy: [
          { userId: '1', readAt: new Date('2024-01-20T10:00:00') }
        ]
      }
    ];

    // Update last messages
    groupChat.lastMessage = groupMessages[groupMessages.length - 1];
    candidateChat.lastMessage = candidateMessages[candidateMessages.length - 1];

    this.chats.set(groupChat.id, groupChat);
    this.chats.set(candidateChat.id, candidateChat);
    this.messages.set(groupChat.id, groupMessages);
    this.messages.set(candidateChat.id, candidateMessages);
  }

  // User connection management
  addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socketId);
    this.userSockets.set(userId, sockets);
    this.onlineUsers.add(userId);
    
    // Update user status in all chats
    this.updateUserOnlineStatus(userId, true);
  }

  removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    const filteredSockets = sockets.filter(id => id !== socketId);
    
    if (filteredSockets.length === 0) {
      this.userSockets.delete(userId);
      this.onlineUsers.delete(userId);
      this.updateUserOnlineStatus(userId, false);
    } else {
      this.userSockets.set(userId, filteredSockets);
    }
  }

  private updateUserOnlineStatus(userId: string, isOnline: boolean) {
    for (const chat of this.chats.values()) {
      const participant = chat.participants.find(p => p.userId === userId);
      if (participant) {
        participant.isOnline = isOnline;
        if (!isOnline) {
          participant.lastSeenAt = new Date();
        }
      }
    }
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getUserSockets(userId: string): string[] {
    return this.userSockets.get(userId) || [];
  }

  // Chat management
  async getUserChats(userId: string): Promise<Chat[]> {
    const userChats = Array.from(this.chats.values())
      .filter(chat => chat.participants.some(p => p.userId === userId))
      .sort((a, b) => {
        // Pinned chats first, then by last activity
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });
    
    return userChats;
  }

  async getChat(chatId: string, userId: string): Promise<Chat | null> {
    const chat = this.chats.get(chatId);
    if (!chat) return null;
    
    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.userId === userId);
    if (!isParticipant) return null;
    
    return chat;
  }

  async createChat(request: CreateChatRequest, creatorId: string): Promise<Chat> {
    const chatId = uuidv4();
    
    const participants: ChatParticipant[] = [
      // Creator as owner
      {
        userId: creatorId,
        userEmail: 'admin@crm.com', // In real app, get from user service
        userName: 'Admin User',
        role: ParticipantRole.OWNER,
        joinedAt: new Date(),
        isOnline: this.isUserOnline(creatorId),
        isMuted: false,
        isPinned: false
      }
    ];

    // Add other participants
    for (const participantId of request.participantIds) {
      if (participantId !== creatorId) {
        participants.push({
          userId: participantId,
          userEmail: `user${participantId}@crm.com`, // Mock
          userName: `User ${participantId}`,
          role: ParticipantRole.MEMBER,
          joinedAt: new Date(),
          isOnline: this.isUserOnline(participantId),
          isMuted: false,
          isPinned: false
        });
      }
    }

    const defaultSettings: ChatSettings = {
      allowFileSharing: true,
      allowImageSharing: true,
      maxParticipants: request.type === ChatType.DIRECT ? 2 : 50,
      isPublic: false,
      requireApproval: request.type === ChatType.GROUP
    };

    const newChat: Chat = {
      id: chatId,
      type: request.type,
      name: request.name,
      description: request.description,
      participants,
      candidateId: request.candidateId,
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
      settings: defaultSettings
    };

    this.chats.set(chatId, newChat);
    this.messages.set(chatId, []);

    return newChat;
  }

  async sendMessage(request: SendMessageRequest, senderId: string): Promise<Message> {
    const chat = this.chats.get(request.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if sender is participant
    const sender = chat.participants.find(p => p.userId === senderId);
    if (!sender) {
      throw new Error('User is not a participant of this chat');
    }

    const messageId = uuidv4();
    const message: Message = {
      id: messageId,
      chatId: request.chatId,
      senderId: senderId,
      senderName: sender.userName,
      senderAvatar: sender.userAvatar,
      type: request.type || MessageType.TEXT,
      content: request.content,
      createdAt: new Date(),
      isEdited: false,
      isDeleted: false,
      status: MessageStatus.SENT,
      readBy: [{ userId: senderId, readAt: new Date() }],
      replyTo: request.replyTo
    };

    // Add message to chat
    const chatMessages = this.messages.get(request.chatId) || [];
    chatMessages.push(message);
    this.messages.set(request.chatId, chatMessages);

    // Update chat last message and activity
    chat.lastMessage = message;
    chat.lastActivity = new Date();
    chat.updatedAt = new Date();

    return message;
  }

  async getChatMessages(
    chatId: string, 
    userId: string, 
    limit: number = 50, 
    before?: string
  ): Promise<Message[]> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new Error('Access denied');
    }

    let messages = this.messages.get(chatId) || [];

    // Filter by cursor if provided
    if (before) {
      const beforeIndex = messages.findIndex(m => m.id === before);
      if (beforeIndex > 0) {
        messages = messages.slice(0, beforeIndex);
      }
    }

    // Sort by creation date (newest first) and limit
    return messages
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async markMessageAsRead(chatId: string, messageId: string, userId: string): Promise<void> {
    const messages = this.messages.get(chatId);
    if (!messages) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Add read status if not already present
    const existingRead = message.readBy.find(r => r.userId === userId);
    if (!existingRead) {
      message.readBy.push({
        userId,
        readAt: new Date()
      });
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    let unreadCount = 0;
    
    for (const [chatId, chat] of this.chats.entries()) {
      if (!chat.participants.some(p => p.userId === userId)) continue;
      
      const messages = this.messages.get(chatId) || [];
      const userParticipant = chat.participants.find(p => p.userId === userId);
      const lastSeen = userParticipant?.lastSeenAt || new Date(0);
      
      const unreadMessages = messages.filter(m => 
        m.senderId !== userId && 
        m.createdAt > lastSeen &&
        !m.readBy.some(r => r.userId === userId)
      );
      
      unreadCount += unreadMessages.length;
    }
    
    return unreadCount;
  }

  // Update chat details
  async updateChat(chatId: string, updates: Partial<Chat>, userId: string): Promise<Chat> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if user has permission to edit
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant || (participant.role !== ParticipantRole.OWNER && participant.role !== ParticipantRole.ADMIN)) {
      throw new Error('Permission denied: Only owners and admins can edit chat details');
    }

    // Update only allowed fields
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      settings: updates.settings ? { ...chat.settings, ...updates.settings } : chat.settings
    };

    const updatedChat = {
      ...chat,
      ...allowedUpdates,
      updatedAt: new Date()
    };

    this.chats.set(chatId, updatedChat);
    return updatedChat;
  }

  // Toggle pin status
  async togglePin(chatId: string, userId: string): Promise<Chat> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if user is participant
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('Access denied: User is not a participant');
    }

    const updatedChat = {
      ...chat,
      isPinned: !chat.isPinned,
      updatedAt: new Date()
    };

    this.chats.set(chatId, updatedChat);
    return updatedChat;
  }

  // Toggle archive status
  async toggleArchive(chatId: string, userId: string): Promise<Chat> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if user is participant
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('Access denied: User is not a participant');
    }

    const updatedChat = {
      ...chat,
      isArchived: !chat.isArchived,
      updatedAt: new Date()
    };

    this.chats.set(chatId, updatedChat);
    return updatedChat;
  }

  // Delete chat
  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if user has permission to delete
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== ParticipantRole.OWNER) {
      throw new Error('Permission denied: Only chat owners can delete chats');
    }

    // Remove chat and its messages
    this.chats.delete(chatId);
    this.messages.delete(chatId);
  }
}

export const chatService = new ChatService();