import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button
} from '@mui/material';
import {
  Message as MessageIcon,
  History as HistoryIcon,
  Description as TemplateIcon,
  Send as SendIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import CommunicationsList from '../CommunicationsList';
import BasicTemplates from './BasicTemplates';
import BasicAdvancedPanel from './BasicAdvancedPanel';
import SmartSMSWithCandidates from './SmartSMSWithCandidates';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communications-tabpanel-${index}`}
      aria-labelledby={`communications-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BasicCommunicationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0); // Inizia dalla panoramica
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [communicationsRefreshTrigger, setCommunicationsRefreshTrigger] = useState(0);

  // Template demo per il testing
  useEffect(() => {
    setTemplates([
      {
        id: 1,
        name: 'Conferma Colloquio',
        type: 'EMAIL',
        subject: 'Conferma colloquio programmato',
        content: 'Gentile candidato, la confermiamo che il colloquio è programmato per domani alle 09:00.',
        category: 'Colloqui'
      },
      {
        id: 2,
        name: 'Ringraziamento',
        type: 'EMAIL', 
        subject: 'Grazie per il colloquio',
        content: 'La ringraziamo per il tempo dedicato al colloquio di oggi.',
        category: 'Follow-up'
      },
      {
        id: 3,
        name: 'Promemoria SMS',
        type: 'SMS',
        content: 'Ricordati del colloquio di domani alle ore 9:00!',
        category: 'Promemoria'
      }
    ]);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        📬 Centro Comunicazioni
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                156
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Comunicazioni Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                89
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email Inviate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary" fontWeight="bold">
                42
              </Typography>
              <Typography variant="body2" color="textSecondary">
                SMS Inviati
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                25
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Chiamate Effettuate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              🚀 Azioni Rapide
            </Typography>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setAdvancedPanelOpen(true)}
              size="large"
              sx={{ px: 3 }}
            >
              Nuova Comunicazione
            </Button>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Invia comunicazioni avanzate a più candidati utilizzando template personalizzati
          </Typography>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Riepilogo Attività
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Sistema di comunicazioni attivo. Utilizza la tab "Storico" per visualizzare 
            tutte le comunicazioni inviate e gestire nuove comunicazioni.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            🟢 Sistema operativo | 📈 +12% rispetto al mese scorso | ⏰ Ultimo aggiornamento: oggi
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<MessageIcon />} 
            label="Panoramica" 
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="Storico Comunicazioni" 
            iconPosition="start"
          />
          <Tab 
            icon={<TemplateIcon />} 
            label="Template" 
            iconPosition="start"
          />
          <Tab 
            icon={<SmsIcon />} 
            label="Smart SMS" 
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderOverview()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CommunicationsList refreshTrigger={communicationsRefreshTrigger} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <BasicTemplates />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <SmartSMSWithCandidates />
        </TabPanel>
      </Paper>

      {/* Advanced Communication Panel */}
      <BasicAdvancedPanel
        open={advancedPanelOpen}
        onClose={() => setAdvancedPanelOpen(false)}
        onSuccess={() => {
          setAdvancedPanelOpen(false);
          // Trigger refresh of communications list
          setCommunicationsRefreshTrigger(prev => prev + 1);
        }}
        templates={templates}
      />
    </Box>
  );
};

export default BasicCommunicationsHub;