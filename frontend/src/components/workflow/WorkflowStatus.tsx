import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Update as UpdateIcon,
  EventNote as EventIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useWorkflowEvents } from '../../hooks/useWorkflowEvents';

const WorkflowStatus: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [eventHistory, setEventHistory] = useState<string[]>([]);

  const { isConnected, lastEvent, reconnectAttempts } = useWorkflowEvents({
    onCandidateMoved: (event) => {
      const message = `Candidato ${event.candidateId} spostato`;
      setEventHistory(prev => [message, ...prev.slice(0, 4)]);
    },
    onSlaWarning: (event) => {
      const message = `⚠️ Avviso SLA per ${event.candidateId}`;
      setEventHistory(prev => [message, ...prev.slice(0, 4)]);
    },
    onBottleneckDetected: (event) => {
      const message = `🚧 Bottleneck rilevato in ${event.phaseId}`;
      setEventHistory(prev => [message, ...prev.slice(0, 4)]);
    }
  });

  const getConnectionStatus = () => {
    if (isConnected) {
      return { text: 'Connesso', color: 'success', icon: <WifiIcon /> };
    } else if (reconnectAttempts > 0) {
      return { text: `Riconnessione... (${reconnectAttempts}/5)`, color: 'warning', icon: <UpdateIcon /> };
    } else {
      return { text: 'Disconnesso', color: 'error', icon: <WifiOffIcon /> };
    }
  };

  const status = getConnectionStatus();

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {status.icon}
              <Typography variant="body2" fontWeight="medium">
                Real-time Status
              </Typography>
            </Box>
            
            <Chip 
              label={status.text}
              color={status.color as any}
              size="small"
              variant="outlined"
            />

            {lastEvent && (
              <Tooltip title={`Ultimo evento: ${lastEvent.type}`}>
                <Chip
                  icon={<EventIcon />}
                  label={new Date(lastEvent.timestamp).toLocaleTimeString()}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              </Tooltip>
            )}
          </Box>

          {eventHistory.length > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={eventHistory.length} color="primary">
                <IconButton 
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Badge>
            </Box>
          )}
        </Box>

        <Collapse in={expanded}>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              📋 Eventi Recenti
            </Typography>
            <List dense>
              {eventHistory.length > 0 ? (
                eventHistory.map((event, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {event.includes('⚠️') ? (
                        <WarningIcon fontSize="small" color="warning" />
                      ) : event.includes('🚧') ? (
                        <WarningIcon fontSize="small" color="error" />
                      ) : (
                        <TrendingUpIcon fontSize="small" color="success" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={event}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="Nessun evento recente"
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WorkflowStatus;