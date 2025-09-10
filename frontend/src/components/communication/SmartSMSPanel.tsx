import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Grid
} from '@mui/material';
import {
  Send as SendIcon,
  Smartphone as SmartphoneIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  MonetizationOn as CostIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import type { Candidate } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface SmartSMSPanelProps {
  candidate: Candidate;
  onSMSSent?: (result: any) => void;
}

interface SMSOptions {
  message: string;
  urgency: 'high' | 'medium' | 'low';
  messageType: 'personal' | 'automated' | 'reminder';
  forceMethod?: 'windows_phone' | 'cloud';
}

interface SMSPreview {
  method: 'windows_phone' | 'cloud';
  cost: number;
  reasoning: string;
  availability: boolean;
}

interface RecentSMS {
  id: string;
  message: string;
  method: 'windows_phone' | 'cloud';
  cost: number;
  timestamp: string;
  success: boolean;
}

const SmartSMSPanel: React.FC<SmartSMSPanelProps> = ({ candidate, onSMSSent }) => {
  const [smsOptions, setSmsOptions] = useState<SMSOptions>({
    message: '',
    urgency: 'medium',
    messageType: 'personal',
    forceMethod: undefined
  });
  const [smsPreview, setSmsPreview] = useState<SMSPreview | null>(null);
  const [recentSMS, setRecentSMS] = useState<RecentSMS[]>([]);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadRecentSMS();
  }, [candidate.id]);

  useEffect(() => {
    // Aggiorna preview quando cambiano le opzioni
    if (smsOptions.message.length > 0) {
      generatePreview();
    }
  }, [smsOptions]);

  const loadRecentSMS = async () => {
    try {
      // Mock data per recent SMS
      const mockRecentSMS: RecentSMS[] = [
        {
          id: '1',
          message: 'Gentile Mario, il colloquio di domani è confermato per le 14:00.',
          method: 'windows_phone',
          cost: 0,
          timestamp: '2025-08-27T10:30:00Z',
          success: true
        },
        {
          id: '2',
          message: 'Promemoria: colloquio previsto oggi alle 14:00. Link: https://meet.google.com/abc-def-ghi',
          method: 'cloud',
          cost: 0.045,
          timestamp: '2025-08-26T08:00:00Z',
          success: true
        }
      ];
      
      setRecentSMS(mockRecentSMS);
    } catch (error) {
      console.error('Errore caricamento SMS recenti:', error);
    }
  };

  const generatePreview = async () => {
    if (!smsOptions.message.trim()) return;

    setPreviewLoading(true);
    try {
      // Mock preview logic - in produzione chiamata API
      const mockPreview: SMSPreview = {
        method: determineMethodPreview(smsOptions),
        cost: smsOptions.forceMethod === 'windows_phone' ? 0 : 0.045,
        reasoning: getReasoningPreview(smsOptions),
        availability: true
      };
      
      setSmsPreview(mockPreview);
    } catch (error) {
      console.error('Errore generazione preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const determineMethodPreview = (options: SMSOptions): 'windows_phone' | 'cloud' => {
    if (options.forceMethod) return options.forceMethod;
    
    const now = new Date();
    const currentHour = now.getHours();
    const isOfficeHours = currentHour >= 9 && currentHour <= 18;
    
    if (options.urgency === 'high') return 'windows_phone';
    if (options.messageType === 'automated' && !isOfficeHours) return 'cloud';
    if (options.messageType === 'personal' && isOfficeHours) return 'windows_phone';
    
    return 'windows_phone'; // Default
  };

  const getReasoningPreview = (options: SMSOptions): string => {
    if (options.forceMethod) return `Metodo forzato: ${options.forceMethod}`;
    
    const now = new Date();
    const currentHour = now.getHours();
    const isOfficeHours = currentHour >= 9 && currentHour <= 18;
    
    if (options.urgency === 'high') return 'Alta urgenza - telefono aziendale (più affidabile)';
    if (options.messageType === 'automated' && !isOfficeHours) return 'Messaggio automatico fuori orario - SMS cloud';
    if (options.messageType === 'personal' && isOfficeHours) return 'Messaggio personale in orario ufficio - telefono aziendale';
    
    return 'Configurazione automatica';
  };

  const handleSendSMS = async () => {
    if (!smsOptions.message.trim()) {
      toast.error('Inserisci il messaggio SMS');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/communications/sms/smart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          ...smsOptions
        })
      });

      if (!response.ok) throw new Error('Errore invio SMS');
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`SMS inviato con successo via ${result.method}${result.fallbackUsed ? ' (fallback)' : ''}`);
        setSmsOptions({ ...smsOptions, message: '' });
        setSmsPreview(null);
        await loadRecentSMS();
        onSMSSent?.(result);
      } else {
        toast.error(`Errore invio SMS: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Errore invio SMS:', error);
      toast.error('Errore durante l\'invio del SMS');
    } finally {
      setSending(false);
    }
  };

  const renderPreview = () => {
    if (!smsPreview || previewLoading) {
      return (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              {previewLoading && <CircularProgress size={16} />}
              <Typography variant="body2" color="text.secondary">
                {previewLoading ? 'Generazione preview...' : 'Inserisci messaggio per vedere preview'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card variant="outlined" sx={{ mt: 2, border: smsPreview.method === 'windows_phone' ? '2px solid #4caf50' : '2px solid #2196f3' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {smsPreview.method === 'windows_phone' ? (
                <SmartphoneIcon color="success" />
              ) : (
                <CloudIcon color="primary" />
              )}
              <Typography variant="subtitle1" fontWeight="bold">
                {smsPreview.method === 'windows_phone' ? 'Telefono Aziendale' : 'SMS Cloud'}
              </Typography>
              <Chip
                label={smsPreview.cost === 0 ? 'Gratuito' : `€${smsPreview.cost.toFixed(3)}`}
                color={smsPreview.cost === 0 ? 'success' : 'warning'}
                size="small"
              />
            </Box>
            <Chip
              icon={<CheckIcon />}
              label="Disponibile"
              color="success"
              size="small"
            />
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Logica:</strong> {smsPreview.reasoning}
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">Destinatario</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {candidate.firstName} {candidate.lastName}
                </Typography>
                <Typography variant="body2">{candidate.mobile}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">Caratteristiche</Typography>
                <Typography variant="body2">
                  Urgenza: <Chip label={smsOptions.urgency} size="small" /> •
                  Tipo: <Chip label={smsOptions.messageType} size="small" />
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderRecentSMS = () => (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          SMS Recenti
        </Typography>
        
        {recentSMS.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nessun SMS inviato recentemente a questo candidato
          </Typography>
        ) : (
          <List dense>
            {recentSMS.map((sms, index) => (
              <React.Fragment key={sms.id}>
                <ListItem>
                  <ListItemIcon>
                    {sms.method === 'windows_phone' ? (
                      <SmartphoneIcon color="success" />
                    ) : (
                      <CloudIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={sms.message.length > 50 ? `${sms.message.substring(0, 50)}...` : sms.message}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Typography variant="caption">
                          {new Date(sms.timestamp).toLocaleString('it-IT')}
                        </Typography>
                        <Chip
                          label={sms.cost === 0 ? 'Gratuito' : `€${sms.cost.toFixed(3)}`}
                          color={sms.cost === 0 ? 'success' : 'warning'}
                          size="small"
                        />
                        <Chip
                          label={sms.success ? 'Inviato' : 'Fallito'}
                          color={sms.success ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentSMS.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📱 Smart SMS
      </Typography>
      
      {/* Messaggio */}
      <TextField
        label="Messaggio SMS"
        multiline
        rows={3}
        value={smsOptions.message}
        onChange={(e) => setSmsOptions({ ...smsOptions, message: e.target.value })}
        fullWidth
        variant="outlined"
        placeholder="Scrivi il tuo messaggio SMS..."
        helperText={`${smsOptions.message.length}/160 caratteri`}
      />

      {/* Opzioni */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Urgenza</InputLabel>
            <Select
              value={smsOptions.urgency}
              onChange={(e) => setSmsOptions({ ...smsOptions, urgency: e.target.value as any })}
            >
              <MenuItem value="low">🟢 Bassa</MenuItem>
              <MenuItem value="medium">🟡 Media</MenuItem>
              <MenuItem value="high">🔴 Alta</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Tipo Messaggio</InputLabel>
            <Select
              value={smsOptions.messageType}
              onChange={(e) => setSmsOptions({ ...smsOptions, messageType: e.target.value as any })}
            >
              <MenuItem value="personal">👤 Personale</MenuItem>
              <MenuItem value="automated">🤖 Automatico</MenuItem>
              <MenuItem value="reminder">⏰ Promemoria</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Forza Metodo */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Metodo di Invio:
        </Typography>
        <RadioGroup
          row
          value={smsOptions.forceMethod || 'auto'}
          onChange={(e) => setSmsOptions({ 
            ...smsOptions, 
            forceMethod: e.target.value === 'auto' ? undefined : e.target.value as any 
          })}
        >
          <FormControlLabel 
            value="auto" 
            control={<Radio />} 
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <SpeedIcon fontSize="small" />
                Automatico
              </Box>
            }
          />
          <FormControlLabel 
            value="windows_phone" 
            control={<Radio />} 
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <SmartphoneIcon fontSize="small" />
                Telefono
              </Box>
            }
          />
          <FormControlLabel 
            value="cloud" 
            control={<Radio />} 
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <CloudIcon fontSize="small" />
                Cloud
              </Box>
            }
          />
        </RadioGroup>
      </Box>

      {/* Preview */}
      {renderPreview()}

      {/* Pulsante Invio */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSendSMS}
          disabled={sending || !smsOptions.message.trim()}
        >
          {sending ? 'Invio in corso...' : 'Invia SMS Smart'}
        </Button>
      </Box>

      {/* SMS Recenti */}
      {renderRecentSMS()}
    </Box>
  );
};

export default SmartSMSPanel;