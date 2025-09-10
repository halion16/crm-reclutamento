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
  Button
} from '@mui/material';
import {
  Message as MessageIcon,
  History as HistoryIcon,
  Send as SendIcon,
  Template as TemplateIcon
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

const SimpleCommunicationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [communicationPanelOpen, setCommunicationPanelOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCommunicationSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    if (activeTab !== 1) {
      setActiveTab(1); // Vai alla tab comunicazioni dopo l'invio
    }
  };

  const stats = {
    totalCommunications: 156,
    emailsSent: 89,
    smssSent: 42,
    callsMade: 25
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
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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
      </Grid>

      {/* Info Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Sistema Comunicazioni
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sistema completo per la gestione delle comunicazioni con candidati.
            Vai alla tab "Comunicazioni" per visualizzare lo storico e inviare nuove comunicazioni.
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
      </Paper>

      <AdvancedCommunicationPanel
        open={communicationPanelOpen}
        onClose={() => setCommunicationPanelOpen(false)}
        onSuccess={handleCommunicationSuccess}
      />
    </Box>
  );
};

export default SimpleCommunicationsHub;