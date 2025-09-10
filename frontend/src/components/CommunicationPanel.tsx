import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Cloud as CloudIcon,
  Smartphone as SmartphoneIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  MonetizationOn as CostIcon
} from '@mui/icons-material';
import type { 
  Candidate,
  Communication,
  CommunicationType 
} from '../types';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface CommunicationPanelProps {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
}

interface CommunicationTemplate {
  id: number;
  templateName: string;
  templateType: 'EMAIL' | 'SMS';
  subjectTemplate?: string;
  messageTemplate: string;
  usageContext?: string;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  candidate,
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  
  // Email form
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    templateId: ''
  });
  
  // SMS form  
  const [smsForm, setSmsForm] = useState({
    message: '',
    templateId: ''
  });
  
  // Call tracking
  const [activeCall, setActiveCall] = useState<{
    communicationId?: number;
    startTime: Date;
  } | null>(null);
  
  const [callOutcomeDialog, setCallOutcomeDialog] = useState({
    open: false,
    duration: 0,
    outcome: '',
    notes: ''
  });

  // Load communications history
  useEffect(() => {
    if (open && candidate.id) {
      loadCommunications();
    }
  }, [open, candidate.id]);

  // Load templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadCommunications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/communications`, {
        params: { candidateId: candidate.id, limit: 20 }
      });
      
      if (response.data.success) {
        setCommunications(response.data.data);
      }
    } catch (error) {
      console.error('Error loading communications:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/communications/templates`);
      
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const sendEmail = async () => {
    if (!emailForm.subject || !emailForm.message) {
      toast.error('Inserisci oggetto e messaggio');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/communications/email/send`, {
        candidateId: candidate.id,
        to: candidate.email,
        subject: emailForm.subject,
        message: emailForm.message
      });
      
      if (response.data.success) {
        toast.success('Email inviata con successo');
        setEmailForm({ subject: '', message: '', templateId: '' });
        loadCommunications();
      } else {
        toast.error(response.data.error || 'Errore nell\'invio email');
      }
    } catch (error) {
      toast.error('Errore nell\'invio email');
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTemplateEmail = async () => {
    if (!emailForm.templateId) {
      toast.error('Seleziona un template');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/communications/email/template`, {
        templateId: parseInt(emailForm.templateId),
        candidateId: candidate.id,
        variables: {
          // Variabili aggiuntive se necessarie
        }
      });
      
      if (response.data.success) {
        toast.success('Email da template inviata con successo');
        setEmailForm({ subject: '', message: '', templateId: '' });
        loadCommunications();
      } else {
        toast.error(response.data.error || 'Errore nell\'invio email da template');
      }
    } catch (error) {
      toast.error('Errore nell\'invio email da template');
      console.error('Error sending template email:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendSMS = async () => {
    if (!smsForm.message) {
      toast.error('Inserisci il messaggio SMS');
      return;
    }

    if (!candidate.mobile) {
      toast.error('Numero di cellulare del candidato non disponibile');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/communications/sms/send`, {
        candidateId: candidate.id,
        message: smsForm.message
      });
      
      if (response.data.success) {
        toast.success('SMS inviato con successo');
        setSmsForm({ message: '', templateId: '' });
        loadCommunications();
      } else {
        toast.error(response.data.error || 'Errore nell\'invio SMS');
      }
    } catch (error) {
      toast.error('Errore nell\'invio SMS');
      console.error('Error sending SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/communications/call/initiate`, {
        candidateId: candidate.id,
        phoneType: 'mobile'
      });
      
      if (response.data.success) {
        toast.success('Chiamata avviata');
        setActiveCall({
          communicationId: response.data.data.communicationId,
          startTime: new Date()
        });
        loadCommunications();
      } else {
        toast.error(response.data.error || 'Errore nell\'avvio della chiamata');
      }
    } catch (error) {
      toast.error('Errore nell\'avvio della chiamata');
      console.error('Error initiating call:', error);
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    if (activeCall) {
      const duration = Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000);
      setCallOutcomeDialog({
        open: true,
        duration,
        outcome: '',
        notes: ''
      });
    }
  };

  const recordCallOutcome = async () => {
    if (!activeCall) return;

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/communications/call/record-outcome`, {
        communicationId: activeCall.communicationId,
        duration: callOutcomeDialog.duration,
        outcome: callOutcomeDialog.outcome,
        notes: callOutcomeDialog.notes
      });
      
      if (response.data.success) {
        toast.success('Esito chiamata registrato');
        setActiveCall(null);
        setCallOutcomeDialog({ open: false, duration: 0, outcome: '', notes: '' });
        loadCommunications();
      } else {
        toast.error(response.data.error || 'Errore nella registrazione');
      }
    } catch (error) {
      toast.error('Errore nella registrazione dell\'esito');
      console.error('Error recording call outcome:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateId: string, type: 'EMAIL' | 'SMS') => {
    const template = templates.find(t => t.id === parseInt(templateId) && t.templateType === type);
    if (!template) return;

    if (type === 'EMAIL') {
      setEmailForm(prev => ({
        ...prev,
        subject: template.subjectTemplate || '',
        message: template.messageTemplate,
        templateId
      }));
    } else {
      setSmsForm(prev => ({
        ...prev,
        message: template.messageTemplate,
        templateId
      }));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  const getCommunicationIcon = (type: CommunicationType) => {
    switch (type) {
      case 'EMAIL': return <EmailIcon color="primary" />;
      case 'SMS': return <SmsIcon color="secondary" />;
      case 'PHONE_CALL': return <PhoneIcon color="action" />;
      default: return <EmailIcon />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'DELIVERED':
      case 'SENT': return 'success';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const emailTemplates = templates.filter(t => t.templateType === 'EMAIL');
  const smsTemplates = templates.filter(t => t.templateType === 'SMS');

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Comunicazioni - {candidate.firstName} {candidate.lastName}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<EmailIcon />} label="Email" />
            <Tab icon={<SmsIcon />} label="SMS" />
            <Tab icon={<PhoneIcon />} label="Chiamate" />
            <Tab icon={<HistoryIcon />} label="Storico" />
          </Tabs>

          <Box mt={2}>
            {/* Email Tab */}
            {activeTab === 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invia Email
                  </Typography>
                  
                  <Box mb={2}>
                    <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
                      <InputLabel>Template Email</InputLabel>
                      <Select
                        value={emailForm.templateId}
                        label="Template Email"
                        onChange={(e) => {
                          setEmailForm(prev => ({ ...prev, templateId: e.target.value }));
                          loadTemplate(e.target.value, 'EMAIL');
                        }}
                      >
                        <MenuItem value="">Nessun template</MenuItem>
                        {emailTemplates.map(template => (
                          <MenuItem key={template.id} value={template.id.toString()}>
                            {template.templateName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {emailForm.templateId && (
                      <Button
                        variant="outlined"
                        startIcon={<EmailIcon />}
                        onClick={sendTemplateEmail}
                        disabled={loading}
                      >
                        Invia da Template
                      </Button>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label="A"
                    value={candidate.email}
                    disabled
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="Oggetto"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="Messaggio"
                    multiline
                    rows={6}
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    margin="normal"
                  />
                  
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={sendEmail}
                      disabled={loading || !emailForm.subject || !emailForm.message}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Invia Email'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* SMS Tab */}
            {activeTab === 1 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invia SMS
                  </Typography>
                  
                  {!candidate.mobile && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Numero di cellulare del candidato non disponibile
                    </Alert>
                  )}
                  
                  <Box mb={2}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Template SMS</InputLabel>
                      <Select
                        value={smsForm.templateId}
                        label="Template SMS"
                        onChange={(e) => {
                          setSmsForm(prev => ({ ...prev, templateId: e.target.value }));
                          loadTemplate(e.target.value, 'SMS');
                        }}
                      >
                        <MenuItem value="">Nessun template</MenuItem>
                        {smsTemplates.map(template => (
                          <MenuItem key={template.id} value={template.id.toString()}>
                            {template.templateName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <TextField
                    fullWidth
                    label="A"
                    value={candidate.mobile || 'Non disponibile'}
                    disabled
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="Messaggio SMS"
                    multiline
                    rows={4}
                    value={smsForm.message}
                    onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                    margin="normal"
                    helperText={`${smsForm.message.length}/160 caratteri`}
                  />
                  
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={sendSMS}
                      disabled={loading || !smsForm.message || !candidate.mobile}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Invia SMS'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Phone Tab */}
            {activeTab === 2 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chiamata
                  </Typography>
                  
                  {!candidate.mobile && !candidate.phone && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Numeri di telefono del candidato non disponibili
                    </Alert>
                  )}
                  
                  <Box display="flex" gap={2} mb={2}>
                    {candidate.mobile && (
                      <Box>
                        <Typography variant="body2">Cellulare:</Typography>
                        <Typography variant="h6">{candidate.mobile}</Typography>
                      </Box>
                    )}
                    {candidate.phone && (
                      <Box>
                        <Typography variant="body2">Telefono:</Typography>
                        <Typography variant="h6">{candidate.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {activeCall ? (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Chiamata in corso... 
                        Iniziata alle {activeCall.startTime.toLocaleTimeString()}
                      </Alert>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={endCall}
                      >
                        Termina Chiamata
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<PhoneIcon />}
                      onClick={initiateCall}
                      disabled={loading || (!candidate.mobile && !candidate.phone)}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Avvia Chiamata'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* History Tab */}
            {activeTab === 3 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Storico Comunicazioni
                  </Typography>
                  
                  <List>
                    {communications.map((comm) => (
                      <React.Fragment key={comm.id}>
                        <ListItem>
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            {getCommunicationIcon(comm.communicationType)}
                            <Box flex={1}>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2">
                                      {comm.communicationType}
                                    </Typography>
                                    {comm.subject && (
                                      <Typography variant="body2" fontWeight="bold">
                                        - {comm.subject}
                                      </Typography>
                                    )}
                                    <Chip
                                      size="small"
                                      label={comm.deliveryStatus}
                                      color={getStatusColor(comm.deliveryStatus)}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      {formatDateTime(comm.createdAt)}
                                    </Typography>
                                    {comm.messageContent && (
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {comm.messageContent.length > 100
                                          ? `${comm.messageContent.substring(0, 100)}...`
                                          : comm.messageContent
                                        }
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </Box>
                          </Box>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                    
                    {communications.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="Nessuna comunicazione trovata"
                          secondary="Le comunicazioni con questo candidato appariranno qui"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Call Outcome Dialog */}
      <Dialog
        open={callOutcomeDialog.open}
        onClose={() => setCallOutcomeDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>Registra Esito Chiamata</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Durata: {Math.floor(callOutcomeDialog.duration / 60)}:{(callOutcomeDialog.duration % 60).toString().padStart(2, '0')}
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Esito</InputLabel>
            <Select
              value={callOutcomeDialog.outcome}
              label="Esito"
              onChange={(e) => setCallOutcomeDialog(prev => ({ ...prev, outcome: e.target.value }))}
            >
              <MenuItem value="ANSWERED">Risposto</MenuItem>
              <MenuItem value="NO_ANSWER">Non risponde</MenuItem>
              <MenuItem value="BUSY">Occupato</MenuItem>
              <MenuItem value="VOICEMAIL">Segreteria</MenuItem>
              <MenuItem value="CALLBACK_REQUESTED">Richiesta richiamata</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Note"
            value={callOutcomeDialog.notes}
            onChange={(e) => setCallOutcomeDialog(prev => ({ ...prev, notes: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallOutcomeDialog(prev => ({ ...prev, open: false }))}>
            Annulla
          </Button>
          <Button
            onClick={recordCallOutcome}
            variant="contained"
            disabled={!callOutcomeDialog.outcome}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CommunicationPanel;