import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Done as CheckIcon,
  DoneAll as DoubleCheckIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageType, MessageStatus } from '../../services/chatApi';
import type { Message } from '../../services/chatApi';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSender = false,
  onReply,
  onEdit,
  onDelete
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getMessageTime = () => {
    const now = new Date();
    const messageDate = message.createdAt;
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return format(messageDate, 'HH:mm');
    } else if (daysDiff === 1) {
      return `Ieri ${format(messageDate, 'HH:mm')}`;
    } else if (daysDiff < 7) {
      return format(messageDate, 'EEEE HH:mm', { locale: it });
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case MessageStatus.SENT:
        return <CheckIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
      case MessageStatus.DELIVERED:
        return <DoubleCheckIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
      case MessageStatus.read:
        return <DoubleCheckIcon fontSize="small" sx={{ color: 'primary.main' }} />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.TEXT:
        return (
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4
            }}
          >
            {message.content}
          </Typography>
        );
      
      case MessageType.FILE:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📎 {message.attachments?.[0]?.originalName || 'File allegato'}
            </Typography>
            {message.content && (
              <Typography variant="body2" color="textSecondary">
                {message.content}
              </Typography>
            )}
          </Box>
        );
      
      case MessageType.IMAGE:
        return (
          <Box>
            <Box
              component="img"
              src={message.attachments?.[0]?.url}
              alt={message.attachments?.[0]?.originalName}
              sx={{
                maxWidth: 300,
                maxHeight: 200,
                borderRadius: 1,
                mb: message.content ? 1 : 0
              }}
            />
            {message.content && (
              <Typography variant="body2">
                {message.content}
              </Typography>
            )}
          </Box>
        );
      
      case MessageType.SYSTEM:
        return (
          <Typography 
            variant="caption" 
            sx={{ 
              fontStyle: 'italic',
              color: 'text.secondary'
            }}
          >
            {message.content}
          </Typography>
        );
      
      default:
        return (
          <Typography variant="body2">
            {message.content}
          </Typography>
        );
    }
  };

  if (message.type === MessageType.SYSTEM) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        my={1}
      >
        <Chip
          label={message.content}
          variant="outlined"
          size="small"
          sx={{
            fontSize: '0.75rem',
            height: 'auto',
            py: 0.5,
            backgroundColor: 'background.paper',
            borderColor: 'divider'
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection={isOwn ? 'row-reverse' : 'row'}
      alignItems="flex-start"
      gap={1}
      mb={2}
      sx={{
        '&:hover .message-actions': {
          opacity: 1
        }
      }}
    >
      {/* Avatar */}
      {!isOwn && showSender && (
        <Avatar
          src={message.senderAvatar}
          sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
        >
          {message.senderName?.charAt(0).toUpperCase()}
        </Avatar>
      )}

      {/* Message Container */}
      <Box
        sx={{
          maxWidth: '70%',
          minWidth: '100px'
        }}
      >
        {/* Sender Name */}
        {!isOwn && showSender && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ ml: 1, mb: 0.5, display: 'block' }}
          >
            {message.senderName}
          </Typography>
        )}

        {/* Reply Reference */}
        {message.replyTo && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: 'action.hover',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main'
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Risposta a messaggio precedente
            </Typography>
          </Paper>
        )}

        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isOwn ? 'primary.main' : 'background.paper',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: isOwn || !showSender ? 2 : 0.5,
            borderTopRightRadius: isOwn && showSender ? 0.5 : 2,
            position: 'relative'
          }}
        >
          {renderMessageContent()}
          
          {/* Message Footer */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={0.5}
            gap={1}
          >
            <Typography
              variant="caption"
              sx={{
                color: isOwn ? 'primary.contrastText' : 'text.secondary',
                opacity: 0.8,
                fontSize: '0.7rem'
              }}
            >
              {getMessageTime()}
              {message.isEdited && ' • modificato'}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={0.5}>
              {getMessageStatus()}
              
              {/* Thread Count */}
              {message.threadCount && message.threadCount > 0 && (
                <Chip
                  label={`${message.threadCount} risposte`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Box>
          </Box>
        </Paper>

        {/* Read Status */}
        {isOwn && message.readBy && message.readBy.length > 0 && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{
              display: 'block',
              mt: 0.5,
              textAlign: 'right',
              fontSize: '0.7rem'
            }}
          >
            Letto da {message.readBy.length} persona{message.readBy.length > 1 ? 'e' : 'a'}
          </Typography>
        )}
      </Box>

      {/* Message Actions */}
      <Box
        className="message-actions"
        sx={{
          opacity: 0,
          transition: 'opacity 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        {onReply && (
          <Tooltip title="Rispondi">
            <IconButton
              size="small"
              onClick={() => onReply(message)}
              sx={{ backgroundColor: 'background.paper' }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{ backgroundColor: 'background.paper' }}
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onReply && (
          <MenuItem onClick={() => { onReply(message); handleMenuClose(); }}>
            <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
            Rispondi
          </MenuItem>
        )}
        
        {isOwn && onEdit && (
          <MenuItem onClick={() => { onEdit(message); handleMenuClose(); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Modifica
          </MenuItem>
        )}
        
        {isOwn && onDelete && (
          <MenuItem onClick={() => { onDelete(message); handleMenuClose(); }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Elimina
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;