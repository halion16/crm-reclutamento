import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Business as CandidateIcon,
  MoreVert as MoreIcon,
  PushPin as PinIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { chatApi, ChatType } from '../../services/chatApi';
import type { Chat } from '../../services/chatApi';
import { chatWebSocketService } from '../../services/chatWebSocketService';

interface ChatListProps {
  selectedChatId?: string;
  onChatSelect: (chat: Chat) => void;
  onCreateChat?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  selectedChatId,
  onChatSelect,
  onCreateChat
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement | null;
    chat: Chat | null;
  }>({ element: null, chat: null });

  useEffect(() => {
    loadChats();
    setupWebSocketListeners();

    return () => {
      // Cleanup WebSocket listeners
      chatWebSocketService.off('chat:message', handleNewMessage);
      chatWebSocketService.off('chat:chat_created', handleChatCreated);
    };
  }, []);

  const loadChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { chats: fetchedChats, unreadCount: count } = await chatApi.getUserChats();
      setChats(fetchedChats);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Errore nel caricamento delle chat');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocketListeners = () => {
    chatWebSocketService.on('chat:message', handleNewMessage);
    chatWebSocketService.on('chat:chat_created', handleChatCreated);
    chatWebSocketService.on('chat:user_online', handleUserOnline);
    chatWebSocketService.on('chat:user_offline', handleUserOffline);
  };

  const handleNewMessage = (message: any) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            lastMessage: message,
            lastActivity: message.createdAt
          };
        }
        return chat;
      }).sort((a, b) => {
        // Sort by pinned first, then by last activity
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });
    });
  };

  const handleChatCreated = (newChat: Chat) => {
    setChats(prevChats => [newChat, ...prevChats]);
  };

  const handleUserOnline = (data: { userId: string; userEmail: string }) => {
    setChats(prevChats => 
      prevChats.map(chat => ({
        ...chat,
        participants: chat.participants.map(p =>
          p.userId === data.userId ? { ...p, isOnline: true } : p
        )
      }))
    );
  };

  const handleUserOffline = (data: { userId: string; timestamp: Date }) => {
    setChats(prevChats => 
      prevChats.map(chat => ({
        ...chat,
        participants: chat.participants.map(p =>
          p.userId === data.userId 
            ? { ...p, isOnline: false, lastSeenAt: data.timestamp }
            : p
        )
      }))
    );
  };

  const getChatIcon = (chat: Chat) => {
    if (chat.type === ChatType.GROUP) {
      return <GroupIcon />;
    } else if (chat.type === ChatType.CANDIDATE) {
      return <CandidateIcon />;
    } else {
      return <PersonIcon />;
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    
    if (chat.type === ChatType.DIRECT) {
      // For direct chats, show other participant's name
      const otherParticipant = chat.participants.find(p => p.userId !== '1'); // Mock current user ID
      return otherParticipant?.userName || 'Chat Diretto';
    }
    
    return 'Chat Senza Nome';
  };

  const getChatSubtitle = (chat: Chat) => {
    if (chat.lastMessage) {
      const senderName = chat.lastMessage.senderId === '1' 
        ? 'Tu' 
        : chat.lastMessage.senderName;
      
      let content = chat.lastMessage.content;
      if (content.length > 40) {
        content = content.substring(0, 40) + '...';
      }
      
      return `${senderName}: ${content}`;
    }
    
    if (chat.type === ChatType.CANDIDATE) {
      return 'Discussione sul candidato';
    }
    
    return 'Nessun messaggio';
  };

  const getLastActivity = (chat: Chat) => {
    return formatDistanceToNow(chat.lastActivity, {
      addSuffix: true,
      locale: it
    });
  };

  const getUnreadMessagesCount = (chat: Chat) => {
    // This would normally be calculated based on user's last seen time
    // For now, return a mock value
    return Math.floor(Math.random() * 5);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, chat: Chat) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, chat });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, chat: null });
  };

  const handlePinChat = async (chat: Chat) => {
    try {
      const updatedChat = await chatApi.togglePin(chat.id);
      setChats(prevChats => 
        prevChats.map(c => c.id === chat.id ? updatedChat : c)
          .sort((a, b) => {
            // Sort by pinned first, then by last activity
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
          })
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
    handleMenuClose();
  };

  const handleArchiveChat = async (chat: Chat) => {
    try {
      const updatedChat = await chatApi.toggleArchive(chat.id);
      // If chat is archived, remove it from the list
      // If unarchived, update it in place
      if (updatedChat.isArchived) {
        setChats(prevChats => prevChats.filter(c => c.id !== chat.id));
      } else {
        setChats(prevChats => 
          prevChats.map(c => c.id === chat.id ? updatedChat : c)
            .sort((a, b) => {
              // Sort by pinned first, then by last activity
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
            })
        );
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
    handleMenuClose();
  };

  const handleDeleteChat = async (chat: Chat) => {
    try {
      await chatApi.deleteChat(chat.id);
      setChats(prevChats => prevChats.filter(c => c.id !== chat.id));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h6">
          💬 Chat ({chats.length})
        </Typography>
        {unreadCount > 0 && (
          <Badge badgeContent={unreadCount} color="error">
            <Typography variant="caption">
              Non letti
            </Typography>
          </Badge>
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ p: 0 }}>
        {chats.map((chat) => {
          const unreadCount = getUnreadMessagesCount(chat);
          const isSelected = chat.id === selectedChatId;
          
          return (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => onChatSelect(chat)}
                sx={{
                  borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!chat.participants.some(p => p.isOnline)}
                  >
                    <Avatar>
                      {getChatIcon(chat)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={unreadCount > 0 ? 'bold' : 'normal'}
                        noWrap
                        flex={1}
                      >
                        {getChatName(chat)}
                      </Typography>
                      
                      {chat.isPinned && (
                        <PinIcon fontSize="small" color="primary" />
                      )}
                      
                      {chat.type === ChatType.CANDIDATE && (
                        <Chip
                          label="Candidato"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        noWrap
                        component="div"
                      >
                        {getChatSubtitle(chat)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        component="div"
                      >
                        {getLastActivity(chat)}
                      </Typography>
                    </Box>
                  }
                />
                
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  {unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" />
                  )}
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, chat)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
        
        {chats.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="textSecondary">
              Nessuna chat disponibile
            </Typography>
            {onCreateChat && (
              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                Crea una nuova chat per iniziare
              </Typography>
            )}
          </Box>
        )}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => menuAnchor.chat && handlePinChat(menuAnchor.chat)}>
          <PinIcon fontSize="small" sx={{ mr: 1 }} />
          {menuAnchor.chat?.isPinned ? 'Rimuovi pin' : 'Fissa in alto'}
        </MenuItem>
        
        <MenuItem onClick={() => menuAnchor.chat && handleArchiveChat(menuAnchor.chat)}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          {menuAnchor.chat?.isArchived ? 'Desarchivia' : 'Archivia'}
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => menuAnchor.chat && handleDeleteChat(menuAnchor.chat)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Elimina chat
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatList;