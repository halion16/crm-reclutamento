import express from 'express';
import { chatService } from '../services/chatService';
import { CreateChatRequest, SendMessageRequest } from '../models/Chat';

// Simple auth middleware (same as reports)
const simpleAuth = (req: any, res: any, next: any) => {
  req.user = {
    userId: '1',
    email: 'admin@crm.com',
    role: 'ADMIN'
  };
  next();
};

const router = express.Router();

// GET /api/chat/chats - Get user's chats
router.get('/chats', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const chats = await chatService.getUserChats(userId);
    const unreadCount = await chatService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: {
        chats,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats'
    });
  }
});

// GET /api/chat/:chatId - Get specific chat
router.get('/:chatId', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    const chat = await chatService.getChat(chatId, userId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found or access denied'
      });
    }
    
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat'
    });
  }
});

// POST /api/chat - Create new chat
router.post('/', simpleAuth, async (req, res) => {
  try {
    const createRequest: CreateChatRequest = req.body;
    const creatorId = req.user.userId;
    
    // Validation
    if (!createRequest.type) {
      return res.status(400).json({
        success: false,
        error: 'Chat type is required'
      });
    }
    
    if (!createRequest.participantIds || createRequest.participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one participant is required'
      });
    }
    
    const newChat = await chatService.createChat(createRequest, creatorId);
    
    res.status(201).json({
      success: true,
      data: newChat,
      message: 'Chat created successfully'
    });
    
    // Emit real-time event
    if (global.io) {
      // Notify all participants
      newChat.participants.forEach(participant => {
        const sockets = chatService.getUserSockets(participant.userId);
        sockets.forEach(socketId => {
          global.io.to(socketId).emit('chat:chat_created', newChat);
        });
      });
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat'
    });
  }
});

// GET /api/chat/:chatId/messages - Get chat messages
router.get('/:chatId/messages', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;
    
    const messages = await chatService.getChatMessages(chatId, userId, limit, before);
    
    res.json({
      success: true,
      data: {
        messages,
        hasMore: messages.length === limit,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else if (error instanceof Error && error.message.includes('Access denied')) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  }
});

// POST /api/chat/:chatId/messages - Send message (REST endpoint as fallback)
router.post('/:chatId/messages', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const senderId = req.user.userId;
    
    const sendRequest: SendMessageRequest = {
      chatId,
      content: req.body.content,
      type: req.body.type,
      replyTo: req.body.replyTo
    };
    
    if (!sendRequest.content || !sendRequest.content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }
    
    const newMessage = await chatService.sendMessage(sendRequest, senderId);
    
    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
    
    // Emit real-time event
    if (global.io) {
      global.io.to(`chat-${chatId}`).emit('chat:message', newMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }
});

// PUT /api/chat/:chatId/messages/:messageId/read - Mark message as read
router.put('/:chatId/messages/:messageId/read', simpleAuth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.userId;
    
    await chatService.markMessageAsRead(chatId, messageId, userId);
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
    
    // Emit real-time event
    if (global.io) {
      global.io.to(`chat-${chatId}`).emit('chat:message_read', {
        messageId,
        userId,
        readAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});

// PUT /api/chat/:chatId - Update chat details
router.put('/:chatId', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;
    
    // Validate that user can edit this chat
    const chat = await chatService.getChat(chatId, userId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found or access denied'
      });
    }
    
    const updatedChat = await chatService.updateChat(chatId, updates, userId);
    
    res.json({
      success: true,
      data: updatedChat,
      message: 'Chat updated successfully'
    });
    
    // Emit real-time event
    if (global.io) {
      global.io.to(`chat-${chatId}`).emit('chat:updated', updatedChat);
    }
  } catch (error) {
    console.error('Error updating chat:', error);
    if (error instanceof Error && error.message.includes('Permission denied')) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update chat'
      });
    }
  }
});

// PUT /api/chat/:chatId/pin - Toggle pin status
router.put('/:chatId/pin', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    const updatedChat = await chatService.togglePin(chatId, userId);
    
    res.json({
      success: true,
      data: updatedChat,
      message: `Chat ${updatedChat.isPinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle pin status'
    });
  }
});

// PUT /api/chat/:chatId/archive - Toggle archive status
router.put('/:chatId/archive', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    const updatedChat = await chatService.toggleArchive(chatId, userId);
    
    res.json({
      success: true,
      data: updatedChat,
      message: `Chat ${updatedChat.isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error('Error toggling archive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle archive status'
    });
  }
});

// DELETE /api/chat/:chatId - Delete chat
router.delete('/:chatId', simpleAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    await chatService.deleteChat(chatId, userId);
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
    
    // Emit real-time event
    if (global.io) {
      global.io.to(`chat-${chatId}`).emit('chat:deleted', { chatId });
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    if (error instanceof Error && error.message.includes('Permission denied')) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat'
      });
    }
  }
});

export default router;