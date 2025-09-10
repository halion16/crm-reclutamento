import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ServiceStatus {
  status: 'online' | 'offline' | 'unknown';
  message: string;
  cost?: number;
  credits?: number;
  priority?: number;
}

interface SystemStatus {
  windowsPhone: ServiceStatus;
  skebby: ServiceStatus;
  recommendations: {
    primary: string;
    fallback: string | null;
  };
}

const SMSTestPanel: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    phoneNumber: '',
    message: '',
    service: 'auto' as 'auto' | 'windows_phone' | 'skebby'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sms-test/status`);
      if (!response.ok) throw new Error('Errore nel controllo stato');
      
      const data = await response.json();
      setSystemStatus({
        windowsPhone: data.services.windowsPhone,
        skebby: data.services.skebby,
        recommendations: data.recommendations
      });
    } catch (error) {
      console.error('Errore controllo stato:', error);
      toast.error('Errore nel controllo dello stato dei servizi');
    } finally {
      setLoading(false);
    }
  };

  const testService = async (service: 'windows_phone' | 'skebby') => {
    setTestLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sms-test/${service.replace('_', '-')}/test`);
      if (!response.ok) throw new Error('Errore nel test');
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${service === 'windows_phone' ? 'Windows Phone' : 'Skebby'}: ${data.message}`);
      } else {
        toast.error(`❌ ${service === 'windows_phone' ? 'Windows Phone' : 'Skebby'}: ${data.message}`);
      }
      
      // Ricarica stato dopo il test
      await checkSystemStatus();
    } catch (error) {
      console.error(`Errore test ${service}:`, error);
      toast.error(`Errore nel test di ${service}`);
    } finally {
      setTestLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testForm.phoneNumber || !testForm.message) {
      toast.error('Inserisci numero di telefono e messaggio');
      return;
    }

    setTestLoading(true);
    try {
      let endpoint = '';
      
      if (testForm.service === 'windows_phone') {
        endpoint = `${API_BASE_URL}/sms-test/windows-phone/send-test`;
      } else if (testForm.service === 'skebby') {
        endpoint = `${API_BASE_URL}/communications/sms/skebby`;
      } else {
        // Auto - usa smart SMS
        endpoint = `${API_BASE_URL}/communications/sms/smart`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testForm.phoneNumber,
          message: testForm.message,
          candidateId: 'test-candidate',
          urgency: 'medium',
          messageType: 'personal'
        })
      });

      if (!response.ok) throw new Error('Errore invio SMS');
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ SMS inviato via ${data.method || testForm.service}!`);
        setTestForm({ ...testForm, message: '' });
      } else {
        toast.error(`❌ Errore invio SMS: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Errore invio SMS test:', error);
      toast.error('Errore nell\'invio del SMS di test');
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <SuccessIcon />;
      case 'offline': return <ErrorIcon />;
      default: return <RefreshIcon />;
    }
  };

  if (loading && !systemStatus) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Controllo stato sistema...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          🔧 Test SMS Services
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={checkSystemStatus}
          disabled={loading}
        >
          Aggiorna Stato
        </Button>
      </Box>

      {/* Status Overview */}
      {systemStatus && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      <Typography variant="h6">📱 Windows Phone</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Automazione telefono aziendale
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="end" gap={1}>
                    <Chip
                      icon={getStatusIcon(systemStatus.windowsPhone.status)}
                      label={systemStatus.windowsPhone.status.toUpperCase()}
                      color={getStatusColor(systemStatus.windowsPhone.status)}
                      size="small"
                    />
                    <Chip label="GRATUITO" color="success" size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {systemStatus.windowsPhone.message}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TestIcon />}
                  onClick={() => testService('windows_phone')}
                  disabled={testLoading}
                  sx={{ mt: 2 }}
                >
                  Test Connessione
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box>
                      <Typography variant="h6">☁️ Skebby SMS</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Servizio cloud SMS
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="end" gap={1}>
                    <Chip
                      icon={getStatusIcon(systemStatus.skebby.status)}
                      label={systemStatus.skebby.status.toUpperCase()}
                      color={getStatusColor(systemStatus.skebby.status)}
                      size="small"
                    />
                    <Chip label="€0.045/SMS" color="warning" size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {systemStatus.skebby.message}
                  {systemStatus.skebby.credits && (
                    <span> • Crediti: {systemStatus.skebby.credits}</span>
                  )}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TestIcon />}
                  onClick={() => testService('skebby')}
                  disabled={testLoading}
                  sx={{ mt: 2 }}
                >
                  Test Connessione
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recommendations */}
      {systemStatus && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Metodo Raccomandato:</strong> {systemStatus.recommendations.primary} • 
            <strong> Fallback:</strong> {systemStatus.recommendations.fallback || 'Nessuno'}
          </Typography>
        </Alert>
      )}

      {/* Test SMS Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📤 Test Invio SMS
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numero di Telefono"
                value={testForm.phoneNumber}
                onChange={(e) => setTestForm({ ...testForm, phoneNumber: e.target.value })}
                placeholder="+39 123 456 7890"
                helperText="Usa il tuo numero per testare"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Servizio</InputLabel>
                <Select
                  value={testForm.service}
                  onChange={(e) => setTestForm({ ...testForm, service: e.target.value as any })}
                >
                  <MenuItem value="auto">🤖 Automatico (Smart)</MenuItem>
                  <MenuItem value="windows_phone">📱 Windows Phone</MenuItem>
                  <MenuItem value="skebby">☁️ Skebby</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Messaggio"
            multiline
            rows={3}
            value={testForm.message}
            onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
            placeholder="Messaggio di test dal CRM..."
            sx={{ mb: 2 }}
            helperText={`${testForm.message.length}/160 caratteri`}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={testLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={sendTestSMS}
            disabled={testLoading || !testForm.phoneNumber || !testForm.message}
          >
            {testLoading ? 'Invio in corso...' : 'Invia SMS di Test'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SMSTestPanel;