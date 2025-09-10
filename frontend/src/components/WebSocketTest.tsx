// 🔥 STEP 3.5: WebSocket Test Component
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { useSocket } from '../hooks/useSocket';

const WebSocketTest: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  
  const { isConnected, socketId } = useSocket({
    workflowId: 'default-workflow',
    onGlobalUpdate: (event) => {
      const msg = `🌍 Global Update: ${event.type} - ${new Date().toLocaleTimeString()}`;
      console.log(msg, event);
      setMessages(prev => [msg, ...prev].slice(0, 10));
    },
    onWorkflowUpdate: (event) => {
      const msg = `📋 Workflow Update: ${event.type} - ${new Date().toLocaleTimeString()}`;
      console.log(msg, event);
      setMessages(prev => [msg, ...prev].slice(0, 10));
    },
    onCandidateUpdate: (event) => {
      const msg = `👤 Candidate Update: ${event.type} - ${new Date().toLocaleTimeString()}`;
      console.log(msg, event);
      setMessages(prev => [msg, ...prev].slice(0, 10));
    }
  });

  const triggerTestMove = () => {
    // Trigger a test workflow move via API
    fetch('/api/workflow/move-candidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: '1',
        fromPhase: 'cultural_fit',
        toPhase: 'final_decision',
        decision: 'passed',
        score: 88,
        notes: 'Test real-time update'
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Test move triggered:', result);
      const msg = `🧪 Test Move Triggered: ${new Date().toLocaleTimeString()}`;
      setMessages(prev => [msg, ...prev].slice(0, 10));
    })
    .catch(error => {
      console.error('Test move failed:', error);
      const msg = `❌ Test Move Failed: ${error.message}`;
      setMessages(prev => [msg, ...prev].slice(0, 10));
    });
  };

  return (
    <Box p={2} border="1px solid #ddd" borderRadius={2} mb={2}>
      <Typography variant="h6" gutterBottom>
        🧪 WebSocket Real-Time Test
      </Typography>
      
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Alert severity={isConnected ? 'success' : 'error'} sx={{ mb: 0 }}>
          Socket {isConnected ? 'Connected' : 'Disconnected'}
          {socketId && ` (ID: ${socketId})`}
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={triggerTestMove}
          disabled={!isConnected}
        >
          🚀 Test Real-Time Move
        </Button>
      </Box>
      
      <Typography variant="subtitle2" gutterBottom>
        Real-Time Events (Last 10):
      </Typography>
      
      {messages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No real-time events received yet...
        </Typography>
      ) : (
        <Box>
          {messages.map((message, index) => (
            <Typography 
              key={index} 
              variant="caption" 
              display="block"
              sx={{ 
                fontFamily: 'monospace',
                backgroundColor: index === 0 ? 'action.hover' : 'transparent',
                padding: 0.5,
                borderRadius: 1,
                marginBottom: 0.5
              }}
            >
              {message}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default WebSocketTest;