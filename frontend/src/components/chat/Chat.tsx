import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Fab,
  Badge,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { ChatType as ChatTypeEnum, chatApi } from '../../services/chatApi';
import type { Chat as ChatType, CreateChatRequest } from '../../services/chatApi';
import { chatWebSocketService } from '../../services/chatWebSocketService';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const Chat: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Create Chat Form State
  const [newChatForm, setNewChatForm] = useState<{
    type: ChatTypeEnum;
    name: string;
    description: string;
    participantEmails: string[];
    candidateId: string;
  }>({
    type: ChatTypeEnum.DIRECT,
    name: '',
    description: '',
    participantEmails: [],
    candidateId: ''
  });

  const currentUserId = chatWebSocketService.getCurrentUserId() || '1';

  useEffect(() => {
    // Initialize WebSocket connection if not already connected
    if (!chatWebSocketService.isConnectedToChat()) {
      chatWebSocketService.authenticate(currentUserId, 'admin@crm.com');
    }

    // Setup global chat event listeners
    const handleNewMessage = () => {
      // Increment unread count if message is not from current user and not in current chat
      setUnreadCount(prev => prev + 1);
    };

    chatWebSocketService.on('chat:message', handleNewMessage);

    return () => {
      chatWebSocketService.off('chat:message', handleNewMessage);
    };
  }, [currentUserId]);

  const handleChatSelect = (chat: ChatType) => {
    setSelectedChat(chat);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleCreateChat = async () => {
    console.log('Creating chat with form data:', newChatForm);
    try {
      // For GROUP and CANDIDATE chats, current user is automatically included
      // For DIRECT chats, need at least one other participant
      const participantIds = newChatForm.type === ChatTypeEnum.DIRECT 
        ? ['1', ...newChatForm.participantEmails] // Mock participant IDs - in real app would be actual user IDs
        : ['1', ...newChatForm.participantEmails]; // Current user + others

      const request: CreateChatRequest = {
        type: newChatForm.type,
        name: newChatForm.name || undefined,
        description: newChatForm.description || undefined,
        participantIds,
        candidateId: newChatForm.candidateId || undefined
      };

      console.log('Sending chat creation request:', request);
      const newChat = await chatApi.createChat(request);
      console.log('Chat created successfully:', newChat);
      setSelectedChat(newChat);
      setCreateChatOpen(false);
      
      // Force a page refresh to show the new chat in the list
      // In a real app, this would be handled by WebSocket events
      window.location.reload();
      
      // Reset form
      setNewChatForm({
        type: ChatTypeEnum.DIRECT,
        name: '',
        description: '',
        participantEmails: [],
        candidateId: ''
      });
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleAddParticipant = (email: string) => {
    if (email && !newChatForm.participantEmails.includes(email)) {
      setNewChatForm(prev => ({
        ...prev,
        participantEmails: [...prev.participantEmails, email]
      }));
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setNewChatForm(prev => ({
      ...prev,
      participantEmails: prev.participantEmails.filter(e => e !== email)
    }));
  };

  // Helper to check if create button should be disabled
  const isCreateButtonDisabled = () => {
    const groupDisabled = newChatForm.type === ChatTypeEnum.GROUP && !newChatForm.name;
    const candidateDisabled = newChatForm.type === ChatTypeEnum.CANDIDATE && (!newChatForm.name || !newChatForm.candidateId);
    const directDisabled = newChatForm.type === ChatTypeEnum.DIRECT && newChatForm.participantEmails.length === 0;
    
    console.log('Button disabled check:', {
      type: newChatForm.type,
      name: newChatForm.name,
      candidateId: newChatForm.candidateId,
      participantEmails: newChatForm.participantEmails,
      groupDisabled,
      candidateDisabled,
      directDisabled,
      overall: groupDisabled || candidateDisabled || directDisabled
    });
    
    return groupDisabled || candidateDisabled || directDisabled;
  };

  const sidebar = (
    <Box sx={{ width: 350, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            💬 Chat
          </Typography>
          <Box>
            <IconButton 
              color="inherit" 
              onClick={() => setCreateChatOpen(true)}
              size="small"
            >
              <AddIcon />
            </IconButton>
            {isMobile && (
              <IconButton 
                color="inherit" 
                onClick={() => setSidebarOpen(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ChatList
          selectedChatId={selectedChat?.id}
          onChatSelect={handleChatSelect}
          onCreateChat={() => setCreateChatOpen(true)}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000 }}
          onClick={() => setSidebarOpen(true)}
        >
          <Badge badgeContent={unreadCount} color="error">
            <MenuIcon />
          </Badge>
        </Fab>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 350,
              boxSizing: 'border-box'
            }
          }}
        >
          {sidebar}
        </Drawer>
      ) : (
        <Paper elevation={1} sx={{ borderRadius: 0 }}>
          {sidebar}
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={currentUserId}
            onClose={() => setSelectedChat(null)}
          />
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            sx={{ backgroundColor: 'background.default' }}
          >
            <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="textSecondary" gutterBottom>
              Seleziona una chat
            </Typography>
            <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ maxWidth: 300 }}>
              Scegli una chat esistente dalla lista a sinistra o crea una nuova conversazione
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateChatOpen(true)}
              sx={{ mt: 3 }}
            >
              Nuova Chat
            </Button>
          </Box>
        )}
      </Box>

      {/* Create Chat Dialog */}
      <Dialog
        open={createChatOpen}
        onClose={() => setCreateChatOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Crea Nuova Chat
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Chat Type */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo di Chat</InputLabel>
              <Select
                value={newChatForm.type}
                label="Tipo di Chat"
                onChange={(e) => setNewChatForm(prev => ({ ...prev, type: e.target.value as ChatTypeEnum }))}
              >
                <MenuItem value={ChatTypeEnum.DIRECT}>Chat Diretta</MenuItem>
                <MenuItem value={ChatTypeEnum.GROUP}>Gruppo</MenuItem>
                <MenuItem value={ChatTypeEnum.CANDIDATE}>Chat Candidato</MenuItem>
              </Select>
            </FormControl>

            {/* Chat Name */}
            {newChatForm.type !== ChatTypeEnum.DIRECT && (
              <TextField
                fullWidth
                label="Nome Chat"
                value={newChatForm.name}
                onChange={(e) => setNewChatForm(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 2 }}
              />
            )}

            {/* Description */}
            <TextField
              fullWidth
              label="Descrizione (opzionale)"
              multiline
              rows={2}
              value={newChatForm.description}
              onChange={(e) => setNewChatForm(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />

            {/* Candidate ID for Candidate Chat */}
            {newChatForm.type === ChatTypeEnum.CANDIDATE && (
              <TextField
                fullWidth
                label="ID Candidato"
                value={newChatForm.candidateId}
                onChange={(e) => setNewChatForm(prev => ({ ...prev, candidateId: e.target.value }))}
                sx={{ mb: 2 }}
              />
            )}

            {/* Participants */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Partecipanti
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {newChatForm.participantEmails.map(email => (
                  <Chip
                    key={email}
                    label={email}
                    onDelete={() => handleRemoveParticipant(email)}
                    size="small"
                  />
                ))}
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="Email partecipante"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddParticipant((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChatOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleCreateChat}
            variant="contained"
            disabled={isCreateButtonDisabled()}
          >
            Crea Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;