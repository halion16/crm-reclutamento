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
  Step,
  Stepper,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
  Grid,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Group as GroupIcon,
  Send as SendIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface Template {
  id: number;
  name: string;
  type: 'EMAIL' | 'SMS';
  subject?: string;
  content: string;
  category: string;
}

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  position: string;
}

interface BasicAdvancedPanelProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templates?: Template[];
  preSelectedCandidates?: number[];
}

const BasicAdvancedPanel: React.FC<BasicAdvancedPanelProps> = ({ 
  open, 
  onClose, 
  onSuccess,
  templates = [],
  preSelectedCandidates = []
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendingStatus, setSendingStatus] = useState<string>('');
  
  const [formData, setFormData] = useState({
    type: 'EMAIL' as 'EMAIL' | 'SMS',
    subject: '',
    content: '',
    useTemplate: false
  });

  // Demo candidates
  const candidates: Candidate[] = [
    { id: 1, firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@email.com', mobile: '+39 335 1234567', position: 'Developer' },
    { id: 2, firstName: 'Laura', lastName: 'Bianchi', email: 'laura.bianchi@email.com', mobile: '+39 335 2345678', position: 'Designer' },
    { id: 3, firstName: 'Giuseppe', lastName: 'Verdi', email: 'giuseppe.verdi@email.com', mobile: '+39 335 3456789', position: 'Manager' },
    { id: 4, firstName: 'Anna', lastName: 'Neri', email: 'anna.neri@email.com', mobile: '+39 335 4567890', position: 'Analyst' }
  ];

  const steps = ['Seleziona Candidati', 'Scegli Template', 'Componi Messaggio'];

  useEffect(() => {
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        type: selectedTemplate.type,
        subject: selectedTemplate.subject || '',
        content: selectedTemplate.content,
        useTemplate: true
      }));
    }
  }, [selectedTemplate]);

  // Pre-seleziona candidati quando specificato
  useEffect(() => {
    if (open && preSelectedCandidates.length > 0) {
      setSelectedCandidates(preSelectedCandidates);
      // Se c'è un solo candidato pre-selezionato, salta direttamente al passo 2
      if (preSelectedCandidates.length === 1) {
        setActiveStep(1);
      }
    }
  }, [open, preSelectedCandidates]);

  const handleCandidateToggle = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedCandidates.length === 0) {
      toast.error('Seleziona almeno un candidato');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSend = async () => {
    if (!formData.content.trim()) {
      toast.error('Inserisci il contenuto del messaggio');
      return;
    }

    setLoading(true);
    setSendProgress(0);
    setSendingStatus('Iniziando invio...');
    
    try {
      // Invio sequenziale con progress tracking
      const totalCandidates = selectedCandidates.length;
      let completedSends = 0;

      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        setSendingStatus(`Inviando a ${candidate?.firstName} ${candidate?.lastName}...`);

        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004/api'}/communications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            candidateId,
            communicationType: formData.type,
            subject: formData.subject,
            messageContent: formData.content,
            templateId: selectedTemplate?.id || null
          })
        });

        completedSends++;
        setSendProgress((completedSends / totalCandidates) * 100);
        
        // Piccola pausa per mostrare il progresso
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setSendingStatus('Completato!');
      
      toast.success(`Comunicazione inviata a ${selectedCandidates.length} candidat${selectedCandidates.length > 1 ? 'i' : 'o'}`);
      onSuccess();
      handleClose();
      
    } catch (error) {
      toast.error('Errore nell\'invio delle comunicazioni');
    } finally {
      setLoading(false);
      setSendProgress(0);
      setSendingStatus('');
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedCandidates([]);
    setSelectedTemplate(null);
    setSendProgress(0);
    setSendingStatus('');
    setFormData({
      type: 'EMAIL',
      subject: '',
      content: '',
      useTemplate: false
    });
    onClose();
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {preSelectedCandidates.length > 0 
                  ? `Candidato Selezionato (${selectedCandidates.length})`
                  : `Seleziona Candidati (${selectedCandidates.length}/${candidates.length})`}
              </Typography>
              <Box display="flex" gap={1}>
                <Button onClick={handleSelectAll} size="small" variant="outlined">
                  {selectedCandidates.length === candidates.length ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
                </Button>
                {selectedCandidates.length > 0 && (
                  <Chip 
                    label={`${selectedCandidates.length} selezionati`}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {candidates.map((candidate) => (
                <ListItem key={candidate.id} dense>
                  <Checkbox
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => handleCandidateToggle(candidate.id)}
                  />
                  <ListItemText
                    primary={`${candidate.firstName} ${candidate.lastName}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">{candidate.email}</Typography>
                        <Chip label={candidate.position} size="small" sx={{ mt: 0.5 }} />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Scegli Template (Opzionale)
            </Typography>
            
            <Box mb={2}>
              <Button
                variant={!selectedTemplate ? "contained" : "outlined"}
                onClick={() => setSelectedTemplate(null)}
                sx={{ mr: 1 }}
              >
                Messaggio Personalizzato
              </Button>
            </Box>

            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? 2 : 1,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip 
                          label={template.type} 
                          size="small"
                          color={template.type === 'EMAIL' ? 'primary' : 'secondary'}
                        />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary" gutterBottom>
                        {template.category}
                      </Typography>
                      <Typography variant="body2">
                        {template.content.substring(0, 80)}...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Componi Messaggio
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Typography variant="subtitle2" color="textSecondary">
                  📤 Modalità invio:
                </Typography>
                <Chip 
                  label="Bulk messaging"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Tipo Comunicazione</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo Comunicazione"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'EMAIL' | 'SMS' }))}
                  disabled={formData.useTemplate}
                >
                  <MenuItem value="EMAIL">📧 Email</MenuItem>
                  <MenuItem value="SMS">📱 SMS</MenuItem>
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

              {selectedTemplate && (
                <Typography variant="caption" color="primary">
                  📝 Template utilizzato: {selectedTemplate.name}
                </Typography>
              )}

              <Divider />
              
              <Typography variant="subtitle2">
                Destinatari ({selectedCandidates.length}):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedCandidates.map(id => {
                  const candidate = candidates.find(c => c.id === id);
                  return candidate ? (
                    <Chip
                      key={id}
                      label={`${candidate.firstName} ${candidate.lastName}`}
                      size="small"
                      icon={<PersonIcon />}
                    />
                  ) : null;
                })}
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GroupIcon />
          <Typography variant="h6">
            Comunicazione Avanzata
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStep()}

        {/* Progress Indicator durante l'invio */}
        {loading && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {sendingStatus}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={sendProgress} 
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                {Math.round(sendProgress)}% completato
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Annulla
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Indietro
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={activeStep === 0 && selectedCandidates.length === 0}
          >
            Avanti
          </Button>
        ) : (
          <Button 
            onClick={handleSend} 
            variant="contained" 
            disabled={loading || selectedCandidates.length === 0}
            startIcon={<SendIcon />}
          >
            {loading ? 'Invio...' : `Invia a ${selectedCandidates.length} candidat${selectedCandidates.length > 1 ? 'i' : 'o'}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BasicAdvancedPanel;