import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  VideoCall as VideoIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Business as CandidateIcon,
  PushPin as PinIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChatType, chatApi } from '../../services/chatApi';
import type { Chat, Message } from '../../services/chatApi';
import { chatWebSocketService } from '../../services/chatWebSocketService';
import type { TypingIndicator } from '../../services/chatWebSocketService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicators from './TypingIndicators';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  onClose?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  currentUserId,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: chat.name || '',
    description: chat.description || ''
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    allowFileSharing: chat.settings?.allowFileSharing || true,
    allowImageSharing: chat.settings?.allowImageSharing || true,
    maxParticipants: chat.settings?.maxParticipants || 50,
    isPublic: chat.settings?.isPublic || false,
    requireApproval: chat.settings?.requireApproval || true
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
      joinChat();
      setupWebSocketListeners();
    }

    return () => {
      if (chat) {
        leaveChat();
        cleanupWebSocketListeners();
      }
    };
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { messages: fetchedMessages, hasMore: more } = await chatApi.getChatMessages(chat.id);
      setMessages(fetchedMessages.reverse()); // Reverse to show oldest first
      setHasMore(more);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Errore nel caricamento dei messaggi');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const { messages: olderMessages, hasMore: more } = await chatApi.getChatMessages(
        chat.id,
        50,
        oldestMessage?.id
      );
      
      setMessages(prev => [...olderMessages.reverse(), ...prev]);
      setHasMore(more);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const joinChat = () => {
    chatWebSocketService.joinChat(chat.id);
  };

  const leaveChat = () => {
    chatWebSocketService.leaveChat(chat.id);
  };

  const setupWebSocketListeners = () => {
    chatWebSocketService.on('chat:message', handleNewMessage);
    chatWebSocketService.on('chat:typing', handleTypingIndicator);
    chatWebSocketService.on('chat:message_read', handleMessageRead);
  };

  const cleanupWebSocketListeners = () => {
    chatWebSocketService.off('chat:message', handleNewMessage);
    chatWebSocketService.off('chat:typing', handleTypingIndicator);
    chatWebSocketService.off('chat:message_read', handleMessageRead);
  };

  const handleNewMessage = (message: Message) => {
    if (message.chatId === chat.id) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if not from current user
      if (message.senderId !== currentUserId) {
        setTimeout(() => {
          chatWebSocketService.markMessageAsRead(chat.id, message.id);
        }, 1000);
      }
    }
  };

  const handleTypingIndicator = (indicator: TypingIndicator) => {
    if (indicator.chatId === chat.id && indicator.userId !== currentUserId) {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => t.userId !== indicator.userId);
        if (indicator.isTyping) {
          return [...filtered, indicator];
        }
        return filtered;
      });
    }
  };

  const handleMessageRead = (data: { messageId: string; userId: string; readAt: Date }) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === data.messageId) {
          const existingRead = msg.readBy.find(r => r.userId === data.userId);
          if (!existingRead) {
            return {
              ...msg,
              readBy: [...msg.readBy, { userId: data.userId, readAt: data.readAt }]
            };
          }
        }
        return msg;
      })
    );
  };

  const handleSendMessage = async (content: string) => {
    try {
      // Message will be added via WebSocket event
      chatWebSocketService.sendMessage({
        chatId: chat.id,
        content,
        type: 'TEXT'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    
    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatIcon = () => {
    if (chat.type === ChatType.GROUP) {
      return <GroupIcon />;
    } else if (chat.type === ChatType.CANDIDATE) {
      return <CandidateIcon />;
    } else {
      return <PersonIcon />;
    }
  };

  const getChatName = () => {
    if (chat.name) return chat.name;
    
    if (chat.type === ChatType.DIRECT) {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
      return otherParticipant?.userName || 'Chat Diretto';
    }
    
    return 'Chat';
  };

  const getChatSubtitle = () => {
    if (chat.type === ChatType.GROUP) {
      const onlineCount = chat.participants.filter(p => p.isOnline).length;
      return `${chat.participants.length} membri • ${onlineCount} online`;
    } else if (chat.type === ChatType.CANDIDATE) {
      return `Candidato ID: ${chat.candidateId}`;
    } else {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
      if (otherParticipant?.isOnline) {
        return 'Online';
      } else if (otherParticipant?.lastSeenAt) {
        return `Ultimo accesso ${formatDistanceToNow(otherParticipant.lastSeenAt, { 
          addSuffix: true, 
          locale: it 
        })}`;
      }
      return 'Offline';
    }
  };

  const getOnlineStatus = () => {
    if (chat.type === ChatType.DIRECT) {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
      return otherParticipant?.isOnline || false;
    }
    return chat.participants.some(p => p.isOnline);
  };

  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handlePinChat = async () => {
    try {
      await chatApi.togglePin(chat.id);
      // Refresh chat data or emit event
      window.location.reload();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
    handleMenuClose();
  };

  const handleArchiveChat = async () => {
    try {
      await chatApi.toggleArchive(chat.id);
      if (onClose) onClose(); // Close chat window if archived
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
    handleMenuClose();
  };

  const handleDeleteChat = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questa chat?')) {
      try {
        await chatApi.deleteChat(chat.id);
        if (onClose) onClose(); // Close chat window
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
    handleMenuClose();
  };

  const handleEditChat = () => {
    setEditForm({
      name: chat.name || '',
      description: chat.description || ''
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleChatSettings = () => {
    setSettingsForm({
      allowFileSharing: chat.settings?.allowFileSharing || true,
      allowImageSharing: chat.settings?.allowImageSharing || true,
      maxParticipants: chat.settings?.maxParticipants || 50,
      isPublic: chat.settings?.isPublic || false,
      requireApproval: chat.settings?.requireApproval || true
    });
    setSettingsDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    try {
      const updatedChat = await chatApi.updateChat(chat.id, {
        name: editForm.name,
        description: editForm.description
      });
      console.log('Chat updated successfully:', updatedChat);
      setEditDialogOpen(false);
      // Refresh the page to show updated chat info
      window.location.reload();
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const updatedChat = await chatApi.updateChat(chat.id, {
        settings: settingsForm
      });
      console.log('Chat settings updated successfully:', updatedChat);
      setSettingsDialogOpen(false);
      // Refresh the page to show updated settings
      window.location.reload();
    } catch (error) {
      console.error('Error updating chat settings:', error);
    }
  };

  // Check user permissions
  const getCurrentUserRole = () => {
    const currentParticipant = chat.participants.find(p => p.userId === currentUserId);
    return currentParticipant?.role;
  };

  const canEditChat = () => {
    const role = getCurrentUserRole();
    return role === 'OWNER' || role === 'ADMIN';
  };

  const canDeleteChat = () => {
    const role = getCurrentUserRole();
    return role === 'OWNER';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress size={40} />
        <Typography variant="body2" ml={2}>
          Caricamento chat...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Chat Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color="success"
            invisible={!getOnlineStatus()}
          >
            <Avatar>
              {getChatIcon()}
            </Avatar>
          </Badge>
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" noWrap>
                {getChatName()}
              </Typography>
              
              {chat.type === ChatType.CANDIDATE && (
                <Chip
                  label="Candidato"
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              {getChatSubtitle()}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            {chat.type === ChatType.DIRECT && (
              <>
                <Tooltip title="Chiamata audio">
                  <IconButton size="small" color="primary">
                    <PhoneIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Videochiamata">
                  <IconButton size="small" color="primary">
                    <VideoIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            <Tooltip title="Informazioni chat">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Menu chat">
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Divider />

      {/* Messages Area */}
      <Box
        flex={1}
        overflow="auto"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 2
        }}
      >
        {/* Load More Messages */}
        {hasMore && (
          <Box display="flex" justifyContent="center" mb={2}>
            {loadingMore ? (
              <CircularProgress size={20} />
            ) : (
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={loadMoreMessages}
              >
                Carica messaggi precedenti
              </Typography>
            )}
          </Box>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
            showSender={chat.type !== ChatType.DIRECT}
          />
        ))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <TypingIndicators
            typingUsers={typingUsers}
            participants={chat.participants}
          />
        )}

        {/* Messages End Ref */}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={() => chatWebSocketService.startTyping(chat.id)}
        onTypingStop={() => chatWebSocketService.stopTyping(chat.id)}
        disabled={false}
        placeholder={`Scrivi un messaggio in ${getChatName()}...`}
      />

      {/* Chat Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {canEditChat() && (
          <MenuItem onClick={handleEditChat}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Modifica chat
          </MenuItem>
        )}

        <MenuItem onClick={handlePinChat}>
          <PinIcon fontSize="small" sx={{ mr: 1 }} />
          {chat.isPinned ? 'Rimuovi pin' : 'Fissa in alto'}
        </MenuItem>

        {canEditChat() && (
          <MenuItem onClick={handleChatSettings}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Impostazioni
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleArchiveChat}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          {chat.isArchived ? 'Desarchivia' : 'Archivia'}
        </MenuItem>

        {canDeleteChat() && (
          <MenuItem 
            onClick={handleDeleteChat}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Elimina chat
          </MenuItem>
        )}
      </Menu>

      {/* Edit Chat Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifica Chat
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome Chat"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Descrizione"
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={!editForm.name.trim()}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Impostazioni Chat
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.allowFileSharing}
                  onChange={(e) => setSettingsForm(prev => ({ 
                    ...prev, 
                    allowFileSharing: e.target.checked 
                  }))}
                />
              }
              label="Permetti condivisione file"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.allowImageSharing}
                  onChange={(e) => setSettingsForm(prev => ({ 
                    ...prev, 
                    allowImageSharing: e.target.checked 
                  }))}
                />
              }
              label="Permetti condivisione immagini"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.isPublic}
                  onChange={(e) => setSettingsForm(prev => ({ 
                    ...prev, 
                    isPublic: e.target.checked 
                  }))}
                />
              }
              label="Chat pubblica"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settingsForm.requireApproval}
                  onChange={(e) => setSettingsForm(prev => ({ 
                    ...prev, 
                    requireApproval: e.target.checked 
                  }))}
                />
              }
              label="Richiedi approvazione per nuovi membri"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Numero massimo partecipanti: {settingsForm.maxParticipants}
              </Typography>
              <Slider
                value={settingsForm.maxParticipants}
                onChange={(_, value) => setSettingsForm(prev => ({ 
                  ...prev, 
                  maxParticipants: value as number 
                }))}
                min={2}
                max={100}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 10, label: '10' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
          >
            Salva Impostazioni
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatWindow;