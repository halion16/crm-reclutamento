import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Typography,
  Divider,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Science as TestIcon,
  Clear as ClearIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNotifications, type NotificationSettings, type PushNotificationData } from '../../hooks/useNotifications';

interface NotificationCenterProps {
  open?: boolean;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  open = false, 
  onClose 
}) => {
  const {
    permission,
    settings,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    saveSettings,
    testNotification,
    clearAllNotifications,
    isQuietHours
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'history'>('status');
  const [tempSettings, setTempSettings] = useState<NotificationSettings>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Gestione attivazione notifiche
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribeToPush();
    }
  };

  // Salvataggio impostazioni
  const handleSaveSettings = () => {
    saveSettings(tempSettings);
  };

  // Aggiornamento impostazioni temporanee
  const updateTempSettings = (updates: Partial<NotificationSettings>) => {
    setTempSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', my: 2 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsIcon />
            <Typography variant="h6">Centro Notifiche</Typography>
            <Badge 
              color={isSubscribed ? 'success' : 'error'}
              variant="dot"
              sx={{ ml: 1 }}
            />
          </Box>
        }
        action={
          <Stack direction="row" spacing={1}>
            {['status', 'settings', 'history'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveTab(tab as any)}
                sx={{ textTransform: 'capitalize' }}
              >
                {tab}
              </Button>
            ))}
          </Stack>
        }
      />

      <CardContent>
        {/* TAB STATUS */}
        {activeTab === 'status' && (
          <Stack spacing={3}>
            {/* Stato Permessi */}
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom>
                📊 Stato Sistema
              </Typography>
              
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Supporto Browser:</Typography>
                  <Chip 
                    label={permission.supported ? 'Supportato' : 'Non Supportato'}
                    color={permission.supported ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Permessi:</Typography>
                  <Chip 
                    label={
                      permission.permission === 'granted' ? 'Concessi' :
                      permission.permission === 'denied' ? 'Negati' : 'Non Richiesti'
                    }
                    color={
                      permission.permission === 'granted' ? 'success' :
                      permission.permission === 'denied' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Sottoscrizione Push:</Typography>
                  <Chip 
                    label={isSubscribed ? 'Attiva' : 'Inattiva'}
                    color={isSubscribed ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Ore Silenziose:</Typography>
                  <Chip 
                    label={isQuietHours() ? 'Attive' : 'Inattive'}
                    color={isQuietHours() ? 'info' : 'default'}
                    size="small"
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Azioni Rapide */}
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {!isSubscribed && permission.permission !== 'denied' && (
                <Button
                  variant="contained"
                  startIcon={<NotificationsIcon />}
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                >
                  Attiva Notifiche
                </Button>
              )}

              {isSubscribed && (
                <Button
                  variant="outlined"
                  startIcon={<NotificationsOffIcon />}
                  onClick={unsubscribeFromPush}
                  disabled={isLoading}
                  color="error"
                >
                  Disattiva
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<TestIcon />}
                onClick={testNotification}
                disabled={!isSubscribed}
              >
                Test
              </Button>

              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearAllNotifications}
              >
                Pulisci
              </Button>
            </Stack>

            {/* Alert informativi */}
            {permission.permission === 'denied' && (
              <Alert severity="error">
                <AlertTitle>Notifiche Bloccate</AlertTitle>
                Le notifiche sono state bloccate dal browser. Per attivarle, clicca sull'icona 🔒 
                nella barra degli indirizzi e seleziona "Consenti notifiche".
              </Alert>
            )}

            {!permission.supported && (
              <Alert severity="warning">
                <AlertTitle>Browser Non Supportato</AlertTitle>
                Il tuo browser non supporta le notifiche push. 
                Aggiorna a una versione più recente per usare questa funzionalità.
              </Alert>
            )}

            {isSubscribed && isQuietHours() && (
              <Alert severity="info">
                <AlertTitle>Ore Silenziose Attive</AlertTitle>
                Le notifiche sono temporaneamente silenziose secondo le tue impostazioni.
              </Alert>
            )}
          </Stack>
        )}

        {/* TAB SETTINGS */}
        {activeTab === 'settings' && (
          <Stack spacing={3}>
            <Typography variant="h6">⚙️ Impostazioni Notifiche</Typography>

            {/* Tipi di Notifica */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tipi di Notifica
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempSettings.interviewReminders}
                      onChange={(e) => updateTempSettings({ 
                        interviewReminders: e.target.checked 
                      })}
                    />
                  }
                  label="🗓️ Reminder Colloqui"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempSettings.candidateUpdates}
                      onChange={(e) => updateTempSettings({ 
                        candidateUpdates: e.target.checked 
                      })}
                    />
                  }
                  label="👤 Aggiornamenti Candidati"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempSettings.urgentTasks}
                      onChange={(e) => updateTempSettings({ 
                        urgentTasks: e.target.checked 
                      })}
                    />
                  }
                  label="⚠️ Attività Urgenti"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempSettings.deadlineAlerts}
                      onChange={(e) => updateTempSettings({ 
                        deadlineAlerts: e.target.checked 
                      })}
                    />
                  }
                  label="⏰ Avvisi Scadenze"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempSettings.generalNotifications}
                      onChange={(e) => updateTempSettings({ 
                        generalNotifications: e.target.checked 
                      })}
                    />
                  }
                  label="📢 Notifiche Generali"
                />
              </Stack>
            </Paper>

            {/* Timing */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tempistiche
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Anticipo Reminder Colloqui</InputLabel>
                <Select
                  value={tempSettings.reminderMinutes}
                  onChange={(e) => updateTempSettings({ 
                    reminderMinutes: Number(e.target.value) 
                  })}
                >
                  <MenuItem value={5}>5 minuti</MenuItem>
                  <MenuItem value={15}>15 minuti</MenuItem>
                  <MenuItem value={30}>30 minuti</MenuItem>
                  <MenuItem value={60}>1 ora</MenuItem>
                  <MenuItem value={120}>2 ore</MenuItem>
                </Select>
              </FormControl>
            </Paper>

            {/* Ore Silenziose */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                🌙 Ore Silenziose
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={tempSettings.quietHoursEnabled}
                    onChange={(e) => updateTempSettings({ 
                      quietHoursEnabled: e.target.checked 
                    })}
                  />
                }
                label="Abilita Ore Silenziose"
              />

              {tempSettings.quietHoursEnabled && (
                <Stack direction="row" spacing={2} mt={2}>
                  <TextField
                    label="Inizio"
                    type="time"
                    value={tempSettings.quietHoursStart}
                    onChange={(e) => updateTempSettings({ 
                      quietHoursStart: e.target.value 
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Fine"
                    type="time"
                    value={tempSettings.quietHoursEnd}
                    onChange={(e) => updateTempSettings({ 
                      quietHoursEnd: e.target.value 
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              )}
            </Paper>

            {/* Salva Impostazioni */}
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={handleSaveSettings}
              fullWidth
            >
              Salva Impostazioni
            </Button>
          </Stack>
        )}

        {/* TAB HISTORY */}
        {activeTab === 'history' && (
          <Stack spacing={2}>
            <Typography variant="h6">📈 Cronologia Notifiche</Typography>
            
            <Alert severity="info">
              La cronologia delle notifiche sarà implementata nella prossima versione.
              Qui verranno mostrate le ultime notifiche inviate e ricevute.
            </Alert>

            {/* Placeholder per cronologia */}
            <Paper sx={{ p: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="🗓️ Reminder Colloquio - Marco Rossi"
                    secondary="Oggi, 14:30"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Delivered" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="👤 Candidato Aggiornato - Sara Colombo"
                    secondary="Ieri, 16:45"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Clicked" color="primary" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="⚠️ Azione Urgente - Review CV"
                    secondary="2 giorni fa, 09:15"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Dismissed" color="default" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;