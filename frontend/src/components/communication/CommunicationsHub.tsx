import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack
} from '@mui/material';
import {
  Message as MessageIcon,
  Template as TemplateIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Send as SendIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import CommunicationsList from '../CommunicationsList';
import CommunicationTemplates from './CommunicationTemplates';
import AdvancedCommunicationPanel from './AdvancedCommunicationPanel';

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

const CommunicationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [communicationPanelOpen, setCommunicationPanelOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCommunicationSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    if (activeTab !== 0) {
      setActiveTab(0); // Vai alla tab storico dopo l'invio
    }
  };

  const stats = {
    totalCommunications: 156,
    emailsSent: 89,
    smssSent: 42,
    callsMade: 25,
    templatesActive: 12,
    responseRate: 78
  };

  const renderOverview = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📬 Centro Comunicazioni
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<SendIcon />}
          onClick={() => setCommunicationPanelOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Nuova Comunicazione
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.totalCommunications}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Comunicazioni Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.emailsSent}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email Inviate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary" fontWeight="bold">
                {stats.smssSent}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                SMS Inviati
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.callsMade}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Chiamate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TemplateIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.templatesActive}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Template Attivi
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AnalyticsIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {stats.responseRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tasso Risposta
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚀 Azioni Rapide
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => setCommunicationPanelOpen(true)}
            >
              Comunicazione di Massa
            </Button>
            <Button
              variant="outlined"
              startIcon={<TemplateIcon />}
              onClick={() => setActiveTab(2)}
            >
              Gestisci Template
            </Button>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => setActiveTab(3)}
            >
              Report e Analytics
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Recent Activity Preview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Attività Recente
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Visualizza l'elenco completo nella tab "Storico Comunicazioni"
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label="Email di conferma inviata a 15 candidati" size="small" />
            <Chip label="SMS promemoria programmati" size="small" />
            <Chip label="3 nuovi template creati" size="small" />
            <Chip label="Report settimanale generato" size="small" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        📊 Analytics e Report
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comunicazioni per Tipo
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Email</Typography>
                  <Chip label={`${stats.emailsSent} (57%)`} color="primary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">SMS</Typography>
                  <Chip label={`${stats.smssSent} (27%)`} color="secondary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Chiamate</Typography>
                  <Chip label={`${stats.callsMade} (16%)`} color="success" size="small" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Template
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Conferma Colloquio</Typography>
                  <Chip label="92% successo" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Follow-up</Typography>
                  <Chip label="78% successo" color="info" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Promemoria</Typography>
                  <Chip label="85% successo" color="success" size="small" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendenze Settimanali
              </Typography>
              <Typography variant="body2" color="textSecondary">
                📈 +15% comunicazioni rispetto alla settimana scorsa<br/>
                📧 Email: tasso di apertura 68% (+5%)<br/>
                📱 SMS: tasso di risposta 82% (+3%)<br/>
                📞 Chiamate: contatti riusciti 71% (-2%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
            icon={<AnalyticsIcon />} 
            label="Analytics" 
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderOverview()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CommunicationsList key={refreshTrigger} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CommunicationTemplates />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {renderAnalytics()}
        </TabPanel>
      </Paper>

      <AdvancedCommunicationPanel
        open={communicationPanelOpen}
        onClose={() => setCommunicationPanelOpen(false)}
        onSuccess={handleCommunicationSuccess}
      />
    </Box>
  );
};

export default CommunicationsHub;