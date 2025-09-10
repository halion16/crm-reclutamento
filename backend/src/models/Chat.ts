export enum ChatType {
  DIRECT = 'DIRECT',           // Chat 1-on-1
  GROUP = 'GROUP',             // Chat di gruppo
  CANDIDATE = 'CANDIDATE'      // Chat per candidato specifico
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM'           // Messaggi sistema (es. "User joined")
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

// Chat/Conversation model
export interface Chat {
  id: string;
  type: ChatType;
  name?: string;              // Nome del gruppo (null per chat dirette)
  description?: string;       // Descrizione gruppo
  avatar?: string;            // Avatar gruppo
  participants: ChatParticipant[];
  lastMessage?: Message;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Specifico per chat candidato
  candidateId?: string;       // ID del candidato associato
  
  // Metadati
  isArchived: boolean;
  isPinned: boolean;
  settings: ChatSettings;
}

export interface ChatParticipant {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
  
  // Impostazioni utente per questa chat
  isMuted: boolean;
  isPinned: boolean;
}

export enum ParticipantRole {
  OWNER = 'OWNER',           // Creatore del gruppo
  ADMIN = 'ADMIN',           // Admin del gruppo
  MEMBER = 'MEMBER'          // Membro normale
}

export interface ChatSettings {
  allowFileSharing: boolean;
  allowImageSharing: boolean;
  maxParticipants: number;
  isPublic: boolean;         // Se altri possono unirsi liberamente
  requireApproval: boolean;  // Se serve approvazione per unirsi
}

// Message model
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  
  type: MessageType;
  content: string;           // Testo del messaggio o descrizione file
  
  // Per file/immagini
  attachments?: MessageAttachment[];
  
  // Metadati
  createdAt: Date;
  updatedAt?: Date;
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  
  // Status tracking
  status: MessageStatus;
  readBy: MessageReadStatus[];
  
  // Reply/Thread
  replyTo?: string;          // ID del messaggio a cui risponde
  threadCount?: number;      // Numero di risposte in thread
}

export interface MessageAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;     // Per immagini
}

export interface MessageReadStatus {
  userId: string;
  readAt: Date;
}

// DTO for API
export interface CreateChatRequest {
  type: ChatType;
  name?: string;
  description?: string;
  participantIds: string[];
  candidateId?: string;      // Per chat candidato
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
  attachments?: File[];
}

export interface UpdateChatRequest {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Partial<ChatSettings>;
}

// WebSocket Events
export interface ChatWebSocketEvents {
  // Client → Server
  'chat:join': { chatId: string };
  'chat:leave': { chatId: string };
  'chat:send_message': SendMessageRequest;
  'chat:typing_start': { chatId: string };
  'chat:typing_stop': { chatId: string };
  'chat:mark_read': { chatId: string; messageId: string };
  
  // Server → Client  
  'chat:message': Message;
  'chat:message_update': Message;
  'chat:typing': { chatId: string; userId: string; userName: string };
  'chat:user_online': { userId: string };
  'chat:user_offline': { userId: string };
  'chat:chat_updated': Chat;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
  unreadCount: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}