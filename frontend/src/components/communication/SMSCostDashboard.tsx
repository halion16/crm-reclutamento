import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Phone,
  Cloud,
  Settings,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Timeline,
  MonetizationOn,
  Message,
  Speed,
  Build as TestIcon
} from '@mui/icons-material';
import SMSTestPanel from './SMSTestPanel';

interface CostTracker {
  dailyCost: number;
  monthlyCost: number;
  dailyCount: number;
  monthlyCount: number;
  lastReset: string;
}

interface ServiceStatus {
  windowsPhoneAvailable: boolean;
  cloudAvailable: boolean;
  dailyCosts: CostTracker;
  recommendations: string[];
}

interface SMSConfig {
  primaryMethod: 'windows_phone' | 'cloud' | 'auto';
  fallbackEnabled: boolean;
  dailyBudget: number;
  officeHoursStart: string;
  officeHoursEnd: string;
}

interface SMSStats {
  todayStats: {
    total: number;
    windowsPhone: number;
    cloud: number;
    cost: number;
    avgCost: number;
  };
  weekStats: {
    total: number;
    cost: number;
    trend: number;
  };
  monthStats: {
    total: number;
    cost: number;
    trend: number;
  };
}

const SMSCostDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    primaryMethod: 'auto',
    fallbackEnabled: true,
    dailyBudget: 50,
    officeHoursStart: '09:00',
    officeHoursEnd: '18:00'
  });
  const [smsStats, setSmsStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh ogni minuto
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in produzione saranno chiamate API reali
      const mockServiceStatus: ServiceStatus = {
        windowsPhoneAvailable: true,
        cloudAvailable: true,
        dailyCosts: {
          dailyCost: 12.45,
          monthlyCost: 245.80,
          dailyCount: 28,
          monthlyCount: 547,
          lastReset: new Date().toISOString()
        },
        recommendations: [
          '📱 Telefono aziendale funzionante - ottimo per messaggi urgenti',
          '☁️ SMS cloud disponibile - ideale per messaggi automatici',
          '💰 Spesa giornaliera sotto controllo (€12.45 / €50.00)'
        ]
      };

      const mockStats: SMSStats = {
        todayStats: {
          total: 28,
          windowsPhone: 15,
          cloud: 13,
          cost: 12.45,
          avgCost: 0.44
        },
        weekStats: {
          total: 156,
          cost: 67.20,
          trend: 8.5
        },
        monthStats: {
          total: 547,
          cost: 245.80,
          trend: -2.1
        }
      };

      setServiceStatus(mockServiceStatus);
      setSmsStats(mockStats);
      
    } catch (error) {
      console.error('Errore caricamento dati SMS dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetPercentage = (): number => {
    if (!serviceStatus) return 0;
    return Math.min((serviceStatus.dailyCosts.dailyCost / smsConfig.dailyBudget) * 100, 100);
  };

  const getBudgetColor = (): 'primary' | 'warning' | 'error' => {
    const percentage = getBudgetPercentage();
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'primary';
  };

  const handleConfigSave = async () => {
    try {
      // In produzione: chiamata API per salvare configurazione
      console.log('Salvataggio configurazione SMS:', smsConfig);
      setConfigDialogOpen(false);
      
      // Ricarica dati dopo salvataggio
      await loadData();
    } catch (error) {
      console.error('Errore salvataggio configurazione:', error);
    }
  };

  const renderServiceStatusCard = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            Stato Servizi SMS
          </Typography>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <Phone color={serviceStatus?.windowsPhoneAvailable ? 'success' : 'error'} />
              <Box>
                <Typography variant="body2">Telefono Aziendale</Typography>
                <Chip
                  label={serviceStatus?.windowsPhoneAvailable ? 'Connesso' : 'Non disponibile'}
                  color={serviceStatus?.windowsPhoneAvailable ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <Cloud color={serviceStatus?.cloudAvailable ? 'success' : 'error'} />
              <Box>
                <Typography variant="body2">SMS Cloud</Typography>
                <Chip
                  label={serviceStatus?.cloudAvailable ? 'Attivo' : 'Non disponibile'}
                  color={serviceStatus?.cloudAvailable ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {serviceStatus?.recommendations && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Raccomandazioni:
            </Typography>
            {serviceStatus.recommendations.map((rec, index) => (
              <Alert 
                key={index} 
                severity={rec.includes('❌') ? 'error' : rec.includes('⚠️') ? 'warning' : 'info'} 
                sx={{ mt: 1, fontSize: '0.875rem' }}
              >
                {rec}
              </Alert>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderBudgetCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Budget Giornaliero
        </Typography>
        
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Spesa Oggi
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              €{serviceStatus?.dailyCosts.dailyCost.toFixed(2)} / €{smsConfig.dailyBudget.toFixed(2)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getBudgetPercentage()}
            color={getBudgetColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h4" component="div" color="primary.main">
                {serviceStatus?.dailyCosts.dailyCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SMS Oggi
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h4" component="div" color="secondary.main">
                €{((serviceStatus?.dailyCosts.dailyCost || 0) / Math.max(serviceStatus?.dailyCosts.dailyCount || 1, 1)).toFixed(3)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Costo Medio
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStatsCards = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Message color="primary" />
              <Typography variant="h6">Oggi</Typography>
            </Box>
            <Typography variant="h3" component="div" color="primary.main">
              {smsStats?.todayStats.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SMS inviati
            </Typography>
            <Box mt={1}>
              <Typography variant="body2">
                📱 Telefono: {smsStats?.todayStats.windowsPhone || 0} • 
                ☁️ Cloud: {smsStats?.todayStats.cloud || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Timeline color="secondary" />
              <Typography variant="h6">Settimana</Typography>
              {smsStats?.weekStats.trend !== undefined && (
                <Chip
                  icon={smsStats.weekStats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${Math.abs(smsStats.weekStats.trend)}%`}
                  color={smsStats.weekStats.trend > 0 ? 'success' : 'error'}
                  size="small"
                />
              )}
            </Box>
            <Typography variant="h3" component="div" color="secondary.main">
              {smsStats?.weekStats.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SMS • €{smsStats?.weekStats.cost.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <MonetizationOn color="warning" />
              <Typography variant="h6">Mese</Typography>
              {smsStats?.monthStats.trend !== undefined && (
                <Chip
                  icon={smsStats.monthStats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${Math.abs(smsStats.monthStats.trend)}%`}
                  color={smsStats.monthStats.trend > 0 ? 'error' : 'success'}
                  size="small"
                />
              )}
            </Box>
            <Typography variant="h3" component="div" color="warning.main">
              €{smsStats?.monthStats.cost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {smsStats?.monthStats.total} SMS totali
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderConfigDialog = () => (
    <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Configurazione SMS Smart</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Metodo Primario</InputLabel>
              <Select
                value={smsConfig.primaryMethod}
                onChange={(e) => setSmsConfig({...smsConfig, primaryMethod: e.target.value as any})}
              >
                <MenuItem value="auto">🤖 Automatico (raccomandato)</MenuItem>
                <MenuItem value="windows_phone">📱 Telefono Aziendale</MenuItem>
                <MenuItem value="cloud">☁️ SMS Cloud</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={smsConfig.fallbackEnabled}
                  onChange={(e) => setSmsConfig({...smsConfig, fallbackEnabled: e.target.checked})}
                />
              }
              label="Abilita Fallback Automatico"
            />
            <Typography variant="body2" color="text.secondary">
              Se il metodo primario fallisce, utilizza automaticamente l'alternativo
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Budget Giornaliero (€)</InputLabel>
              <Select
                value={smsConfig.dailyBudget}
                onChange={(e) => setSmsConfig({...smsConfig, dailyBudget: Number(e.target.value)})}
              >
                <MenuItem value={25}>€25 (basso volume)</MenuItem>
                <MenuItem value={50}>€50 (medio volume)</MenuItem>
                <MenuItem value={100}>€100 (alto volume)</MenuItem>
                <MenuItem value={200}>€200 (volume molto alto)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Inizio Orario Ufficio</InputLabel>
              <Select
                value={smsConfig.officeHoursStart}
                onChange={(e) => setSmsConfig({...smsConfig, officeHoursStart: e.target.value})}
              >
                <MenuItem value="08:00">08:00</MenuItem>
                <MenuItem value="09:00">09:00</MenuItem>
                <MenuItem value="10:00">10:00</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Fine Orario Ufficio</InputLabel>
              <Select
                value={smsConfig.officeHoursEnd}
                onChange={(e) => setSmsConfig({...smsConfig, officeHoursEnd: e.target.value})}
              >
                <MenuItem value="17:00">17:00</MenuItem>
                <MenuItem value="18:00">18:00</MenuItem>
                <MenuItem value="19:00">19:00</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Logica Automatica:</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Speed fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Urgenza Alta" 
                secondary="Usa sempre telefono aziendale (più affidabile)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Messaggi Personali" 
                secondary="Telefono aziendale in orario ufficio"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Cloud fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Messaggi Automatici" 
                secondary="SMS cloud fuori orario ufficio"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><MonetizationOn fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Budget Quasi Esaurito" 
                secondary="Privilegia telefono aziendale (gratuito)"
              />
            </ListItem>
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfigDialogOpen(false)}>Annulla</Button>
        <Button onClick={handleConfigSave} variant="contained">Salva</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && !serviceStatus) {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>SMS Cost Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📱 SMS Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={() => setConfigDialogOpen(true)}
        >
          Configurazione
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<TrendingUp />}
            label="Dashboard"
            iconPosition="start"
          />
          <Tab
            icon={<TestIcon />}
            label="Test Sistema"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Stato Servizi */}
              <Grid item xs={12} md={6}>
                {renderServiceStatusCard()}
              </Grid>

              {/* Budget */}
              <Grid item xs={12} md={6}>
                {renderBudgetCard()}
              </Grid>

              {/* Statistiche */}
              <Grid item xs={12}>
                {renderStatsCards()}
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && <SMSTestPanel />}
        </Box>
      </Paper>

      {renderConfigDialog()}
    </Box>
  );
};

export default SMSCostDashboard;