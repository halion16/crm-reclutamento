import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Stack,
  Alert,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  position: string;
  status: string;
}

interface Template {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS';
  subject?: string;
  content: string;
  variables: string[];
  category: string;
}

interface AdvancedCommunicationPanelProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdvancedCommunicationPanel: React.FC<AdvancedCommunicationPanelProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'EMAIL' as 'EMAIL' | 'SMS' | 'PHONE_CALL',
    subject: '',
    content: '',
    scheduledFor: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH',
    variables: {} as Record<string, string>
  });

  // Demo data
  const demoCandidates: Candidate[] = [
    { id: 1, firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@email.com', mobile: '+39 335 1234567', position: 'Developer', status: 'Attivo' },
    { id: 2, firstName: 'Laura', lastName: 'Bianchi', email: 'laura.bianchi@email.com', mobile: '+39 335 2345678', position: 'Designer', status: 'In Colloquio' },
    { id: 3, firstName: 'Giuseppe', lastName: 'Verdi', email: 'giuseppe.verdi@email.com', mobile: '+39 335 3456789', position: 'Manager', status: 'Attivo' }
  ];

  const demoTemplates: Template[] = [
    {
      id: '1',
      name: 'Conferma Colloquio',
      type: 'EMAIL',
      subject: 'Conferma colloquio - {{posizione}}',
      content: 'Gentile {{nome}},\\n\\nLa confermiamo che il colloquio per la posizione di {{posizione}} è programmato per il {{data}} alle ore {{ora}}.\\n\\nCordiali saluti,\\nTeam HR',
      variables: ['nome', 'posizione', 'data', 'ora'],
      category: 'Colloqui'
    },
    {
      id: '2',
      name: 'Promemoria SMS',
      type: 'SMS',
      content: 'Ciao {{nome}}, ricordati del colloquio domani alle {{ora}}!',
      variables: ['nome', 'ora'],
      category: 'Promemoria'
    }
  ];

  useEffect(() => {
    if (open) {
      setCandidates(demoCandidates);
      setTemplates(demoTemplates);
    }
  }, [open]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables.reduce((acc, variable) => {
        acc[variable] = '';
        return acc;
      }, {} as Record<string, string>)
    }));
  };

  const handleCandidateToggle = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAllCandidates = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const renderVariableInputs = () => {
    if (!selectedTemplate) return null;

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Variabili Template
          </Typography>
          <Grid container spacing={2}>
            {selectedTemplate.variables.map((variable) => (
              <Grid item xs={12} sm={6} key={variable}>
                <TextField
                  label={`{{${variable}}}`}
                  value={formData.variables[variable] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    variables: {
                      ...prev.variables,
                      [variable]: e.target.value
                    }
                  }))}
                  size="small"
                  fullWidth
                  placeholder={`Valore per ${variable}`}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const previewContent = () => {
    let content = formData.content;
    Object.entries(formData.variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return content;
  };

  const handleSend = async () => {
    if (selectedCandidates.length === 0) {
      toast.error('Seleziona almeno un candidato');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Inserisci il contenuto del messaggio');
      return;
    }

    if (selectedTemplate) {
      const missingVariables = selectedTemplate.variables.filter(
        variable => !formData.variables[variable]?.trim()
      );
      if (missingVariables.length > 0) {
        toast.error(`Compila le variabili: ${missingVariables.join(', ')}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Invia comunicazione per ogni candidato selezionato
      const promises = selectedCandidates.map(candidateId => 
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004/api'}/communications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            candidateId,
            communicationType: formData.type,
            subject: formData.subject,
            messageContent: previewContent(),
            scheduledFor: formData.scheduledFor || null,
            priority: formData.priority,
            templateId: selectedTemplate?.id
          })
        })
      );

      await Promise.all(promises);
      
      toast.success(`Comunicazione inviata a ${selectedCandidates.length} candidat${selectedCandidates.length > 1 ? 'i' : 'o'}`);
      onSuccess();
      handleClose();
      
    } catch (error) {
      toast.error('Errore nell\'invio delle comunicazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    setSelectedCandidates([]);
    setSelectedTemplate(null);
    setFormData({
      type: 'EMAIL',
      subject: '',
      content: '',
      scheduledFor: '',
      priority: 'NORMAL',
      variables: {}
    });
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <EmailIcon color="primary" />;
      case 'SMS': return <SmsIcon color="secondary" />;
      case 'PHONE_CALL': return <PhoneIcon color="success" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GroupIcon />
          <Typography variant="h6">
            Comunicazione Avanzata
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="1. Candidati" />
            <Tab label="2. Template" />
            <Tab label="3. Messaggio" />
            <Tab label="4. Anteprima" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Seleziona Candidati ({selectedCandidates.length}/{candidates.length})
              </Typography>
              <Button onClick={handleSelectAllCandidates}>
                {selectedCandidates.length === candidates.length ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
              </Button>
            </Box>
            
            <List>
              {candidates.map((candidate) => (
                <ListItem key={candidate.id} divider>
                  <Checkbox
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => handleCandidateToggle(candidate.id)}
                  />
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${candidate.firstName} ${candidate.lastName}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">{candidate.email}</Typography>
                        <Typography variant="body2">{candidate.mobile}</Typography>
                        <Chip label={candidate.position} size="small" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                  <Chip label={candidate.status} color="primary" size="small" />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seleziona Template (Opzionale)
            </Typography>
            
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? 2 : 1,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getTypeIcon(template.type)}
                        <Typography variant="subtitle1" fontWeight="bold">
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {template.category}
                      </Typography>
                      <Typography variant="body2">
                        {template.content.substring(0, 100)}...
                      </Typography>
                      <Box mt={1}>
                        {template.variables.map(variable => (
                          <Chip
                            key={variable}
                            label={`{{${variable}}}`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedTemplate && renderVariableInputs()}
          </Box>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo Comunicazione</InputLabel>
              <Select
                value={formData.type}
                label="Tipo Comunicazione"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="PHONE_CALL">Chiamata</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'EMAIL' && (
              <TextField
                label="Oggetto"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                fullWidth
              />
            )}

            <TextField
              label="Contenuto"
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              fullWidth
              required
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Programmata per"
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText="Lascia vuoto per invio immediato"
              />

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorità"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="LOW">Bassa</MenuItem>
                  <MenuItem value="NORMAL">Normale</MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Anteprima Invio
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              La comunicazione verrà inviata a <strong>{selectedCandidates.length}</strong> candidat{selectedCandidates.length > 1 ? 'i' : 'o'}
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo: {getTypeIcon(formData.type)} {formData.type}
                </Typography>
                {formData.subject && (
                  <Typography variant="subtitle2" gutterBottom>
                    Oggetto: {formData.subject}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {previewContent()}
                </Typography>
              </CardContent>
            </Card>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Destinatari:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedCandidates.map(id => {
                const candidate = candidates.find(c => c.id === id);
                return candidate ? (
                  <Chip
                    key={id}
                    label={`${candidate.firstName} ${candidate.lastName}`}
                    avatar={<Avatar><PersonIcon /></Avatar>}
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Annulla
        </Button>
        {activeTab > 0 && (
          <Button onClick={() => setActiveTab(activeTab - 1)}>
            Indietro
          </Button>
        )}
        {activeTab < 3 ? (
          <Button 
            onClick={() => setActiveTab(activeTab + 1)}
            variant="contained"
            disabled={activeTab === 0 && selectedCandidates.length === 0}
          >
            Avanti
          </Button>
        ) : (
          <Button 
            onClick={handleSend} 
            variant="contained" 
            disabled={loading || selectedCandidates.length === 0}
          >
            {loading ? 'Invio...' : `Invia a ${selectedCandidates.length} candidat${selectedCandidates.length > 1 ? 'i' : 'o'}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedCommunicationPanel;