import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import type { Message } from '../../services/chatApi';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'TEXT' | 'FILE' | 'IMAGE') => Promise<void> | void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: Message;
  onClearReply?: () => void;
  maxLength?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Scrivi un messaggio...',
  replyTo,
  onClearReply,
  maxLength = 2000
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState<HTMLElement | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      handleTypingIndicator();
    }
  };

  const handleTypingIndicator = () => {
    if (!isTyping && message.trim()) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 2000);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        event.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    setIsSending(true);
    
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      // Focus back on input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAttachmentMenu(event.currentTarget);
  };

  const handleAttachmentClose = () => {
    setAttachmentMenu(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // TODO: Implement file upload
    }
    handleAttachmentClose();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Image selected:', file.name);
      // TODO: Implement image upload
    }
    handleAttachmentClose();
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // TODO: Stop recording and send voice message
    } else {
      setIsRecording(true);
      // TODO: Start recording
    }
  };

  const canSend = message.trim().length > 0 && !disabled && !isSending;

  return (
    <Box sx={{ p: 2 }}>
      {/* Reply Indicator */}
      {replyTo && (
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="primary" fontWeight="bold">
                Rispondi a {replyTo.senderName}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                noWrap
                sx={{ maxWidth: 300 }}
              >
                {replyTo.content}
              </Typography>
            </Box>
            {onClearReply && (
              <IconButton size="small" onClick={onClearReply}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Paper>
      )}

      {/* Input Area */}
      <Box display="flex" alignItems="flex-end" gap={1}>
        {/* Attachment Button */}
        <Tooltip title="Allega file">
          <IconButton
            size="small"
            onClick={handleAttachmentClick}
            disabled={disabled}
            sx={{ mb: 1 }}
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>

        {/* Message Input */}
        <TextField
          ref={inputRef}
          multiline
          maxRows={4}
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              paddingRight: 1
            }
          }}
          InputProps={{
            endAdornment: (
              <Box display="flex" alignItems="center" gap={0.5} sx={{ ml: 1 }}>
                {/* Character Count */}
                {message.length > maxLength * 0.8 && (
                  <Typography
                    variant="caption"
                    color={message.length >= maxLength ? 'error' : 'textSecondary'}
                    sx={{ minWidth: 'fit-content' }}
                  >
                    {message.length}/{maxLength}
                  </Typography>
                )}
                
                {/* Emoji Button */}
                <Tooltip title="Emoji">
                  <IconButton size="small" disabled={disabled}>
                    <EmojiIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }}
        />

        {/* Voice Record Button */}
        <Tooltip title={isRecording ? "Ferma registrazione" : "Registra vocale"}>
          <IconButton
            size="small"
            onClick={handleVoiceRecord}
            disabled={disabled}
            color={isRecording ? "error" : "default"}
            sx={{ mb: 1 }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

        {/* Send Button */}
        <Tooltip title="Invia messaggio">
          <span>
            <IconButton
              onClick={handleSendMessage}
              disabled={!canSend}
              color="primary"
              size="large"
              sx={{ mb: 1 }}
            >
              {isSending ? (
                <CircularProgress size={20} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Typing Indicator */}
      {isTyping && (
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
        >
          Digitando...
        </Typography>
      )}

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachmentMenu}
        open={Boolean(attachmentMenu)}
        onClose={handleAttachmentClose}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <AttachIcon fontSize="small" sx={{ mr: 1 }} />
          Allega file
        </MenuItem>
        <MenuItem onClick={() => imageInputRef.current?.click()}>
          <ImageIcon fontSize="small" sx={{ mr: 1 }} />
          Allega immagine
        </MenuItem>
      </Menu>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileSelect}
        accept="*/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        hidden
        onChange={handleImageSelect}
        accept="image/*"
      />
    </Box>
  );
};

export default MessageInput;