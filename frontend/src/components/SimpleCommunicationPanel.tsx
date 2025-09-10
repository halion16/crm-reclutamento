import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { toast } from 'react-hot-toast';

interface SimpleCommunicationPanelProps {
  open: boolean;
  onClose: () => void;
  candidateId: number | null;
  onSuccess: () => void;
}

const SimpleCommunicationPanel: React.FC<SimpleCommunicationPanelProps> = ({ 
  open, 
  onClose, 
  candidateId, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    candidateId: candidateId || '',
    communicationType: 'EMAIL',
    subject: '',
    messageContent: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.candidateId) {
      toast.error('Seleziona un candidato');
      return;
    }

    if (!formData.messageContent.trim()) {
      toast.error('Inserisci il contenuto del messaggio');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004/api'}/communications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId: parseInt(formData.candidateId.toString()),
          communicationType: formData.communicationType,
          subject: formData.subject,
          messageContent: formData.messageContent
        })
      });

      if (response.ok) {
        toast.success('Comunicazione inviata con successo');
        onSuccess();
        onClose();
        resetForm();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Errore nell\'invio della comunicazione');
      }
    } catch (error) {
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      candidateId: candidateId || '',
      communicationType: 'EMAIL',
      subject: '',
      messageContent: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Nuova Comunicazione
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Funzionalità di invio comunicazioni in sviluppo. 
            Le comunicazioni verranno registrate nel sistema.
          </Alert>

          <TextField
            label="ID Candidato"
            type="number"
            value={formData.candidateId}
            onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
            required
            fullWidth
            helperText="Inserisci l'ID del candidato destinatario"
          />

          <FormControl fullWidth>
            <InputLabel>Tipo Comunicazione</InputLabel>
            <Select
              value={formData.communicationType}
              label="Tipo Comunicazione"
              onChange={(e) => setFormData({ ...formData, communicationType: e.target.value })}
            >
              <MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="SMS">SMS</MenuItem>
              <MenuItem value="PHONE_CALL">Chiamata</MenuItem>
            </Select>
          </FormControl>

          {formData.communicationType === 'EMAIL' && (
            <TextField
              label="Oggetto"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              fullWidth
            />
          )}

          <TextField
            label="Contenuto Messaggio"
            multiline
            rows={4}
            value={formData.messageContent}
            onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
            required
            fullWidth
            helperText="Inserisci il testo del messaggio da inviare"
          />
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Annulla
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Invio...' : 'Invia Comunicazione'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleCommunicationPanel;