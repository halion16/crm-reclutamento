import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { Interview, InterviewForm as InterviewFormData, InterviewType, Candidate } from '../types';
import { INTERVIEW_TYPE_LABELS } from '../types';
import { interviewsAPI, candidatesAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';

interface InterviewFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interview?: Interview | null;
  mode: 'create' | 'edit' | 'view';
  onCommunicationRequest?: (candidateId: number) => void;
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  open,
  onClose,
  onSuccess,
  interview,
  mode,
  onCommunicationRequest
}) => {
  const [formData, setFormData] = useState<InterviewFormData>({
    candidateId: 0,
    interviewPhase: 1,
    scheduledDate: '',
    scheduledTime: '',
    durationMinutes: 60,
    interviewType: 'VIDEO_CALL',
    location: '',
    primaryInterviewerId: null,
    secondaryInterviewerId: null
  });
  
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Load eligible candidates for selection
  useEffect(() => {
    const fetchEligibleCandidates = async () => {
      try {
        const response = await candidatesAPI.getEligibleForInterview();
        if (response.success) {
          setCandidates(response.data);
        }
      } catch (error) {
        console.error('Error fetching eligible candidates:', error);
      }
    };

    if (open && isCreateMode) {
      fetchEligibleCandidates();
    }
  }, [open, isCreateMode]);

  useEffect(() => {
    if (interview && (isEditMode || isViewMode)) {
      setFormData({
        candidateId: interview.candidateId,
        interviewPhase: interview.interviewPhase,
        scheduledDate: interview.scheduledDate ? interview.scheduledDate.split('T')[0] : '',
        scheduledTime: interview.scheduledTime ? 
          new Date(interview.scheduledTime).toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }) : '',
        durationMinutes: interview.durationMinutes || 60,
        interviewType: interview.interviewType,
        location: interview.location || '',
        primaryInterviewerId: interview.primaryInterviewer?.id || null,
        secondaryInterviewerId: interview.secondaryInterviewer?.id || null
      });
    } else if (isCreateMode) {
      setFormData({
        candidateId: 0,
        interviewPhase: 1,
        scheduledDate: '',
        scheduledTime: '',
        durationMinutes: 60,
        interviewType: 'VIDEO_CALL',
        location: '',
        primaryInterviewerId: null,
        secondaryInterviewerId: null
      });
    }
  }, [interview, mode, open]);

  const handleChange = (field: keyof InterviewFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'durationMinutes' || field === 'candidateId' || field === 'interviewPhase' 
        ? (value ? parseInt(value) : (field === 'candidateId' ? 0 : field === 'interviewPhase' ? 1 : 60))
        : value
    }));
  };

  const handleSelectChange = (field: keyof InterviewFormData) => (event: any) => {
    const value = event.target.value;
    
    // If selecting a candidate, automatically set the next interview phase
    if (field === 'candidateId' && value) {
      const selectedCandidate = candidates.find(c => c.id === parseInt(value));
      const nextPhase = selectedCandidate?.nextInterviewPhase || 1;
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        interviewPhase: nextPhase as 1 | 2 | 3
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value || (field === 'candidateId' ? 0 : null)
      }));
    }
  };

  const handleSubmit = async (sendCommunication: boolean = false) => {
    if (!formData.candidateId || !formData.scheduledDate) {
      toast.error('Candidato e data sono obbligatori');
      return;
    }

    try {
      setLoading(true);
      
      if (isCreateMode) {
        const response = await interviewsAPI.create(formData);
        if (response.success) {
          toast.success('Colloquio programmato con successo!');
          onSuccess();
          
          if (sendCommunication && onCommunicationRequest) {
            // Invia richiesta di comunicazione prima di chiudere
            onCommunicationRequest(formData.candidateId);
          }
          
          onClose();
        } else {
          toast.error('Errore nella programmazione del colloquio');
        }
      } else if (isEditMode && interview) {
        const response = await interviewsAPI.update(interview.id, formData);
        if (response.success) {
          toast.success('Colloquio aggiornato con successo!');
          onSuccess();
          onClose();
        } else {
          toast.error('Errore nell\'aggiornamento del colloquio');
        }
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Programma Nuovo Colloquio';
      case 'edit': return 'Modifica Colloquio';
      case 'view': return 'Dettagli Colloquio';
      default: return 'Colloquio';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Candidato */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Candidato
              </Typography>
            </Grid>
            
            {isCreateMode ? (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Candidato *</InputLabel>
                  <Select
                    value={formData.candidateId || ''}
                    label="Candidato *"
                    onChange={handleSelectChange('candidateId')}
                    disabled={isViewMode}
                  >
                    <MenuItem value="">Seleziona candidato</MenuItem>
                    {candidates.map((candidate) => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {candidate.firstName} {candidate.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {candidate.positionApplied} - {candidate.interviewProgress}
                          </Typography>
                          <Chip 
                            label={`Fase ${candidate.nextInterviewPhase}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : interview?.candidate && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {interview.candidate.firstName} {interview.candidate.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {interview.candidate.positionApplied}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Dettagli Colloquio */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Dettagli Colloquio
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Fase Colloquio *</InputLabel>
                <Select
                  value={formData.interviewPhase}
                  label="Fase Colloquio *"
                  onChange={handleSelectChange('interviewPhase')}
                  disabled={isViewMode || (isCreateMode && formData.candidateId > 0)}
                >
                  <MenuItem value={1}>Fase 1 - Primo Colloquio</MenuItem>
                  <MenuItem value={2}>Fase 2 - Colloquio Tecnico</MenuItem>
                  <MenuItem value={3}>Fase 3 - Colloquio Finale</MenuItem>
                </Select>
              </FormControl>
              {isCreateMode && formData.candidateId > 0 && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Fase determinata automaticamente in base ai colloqui precedenti
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo Colloquio *</InputLabel>
                <Select
                  value={formData.interviewType}
                  label="Tipo Colloquio *"
                  onChange={handleSelectChange('interviewType')}
                  disabled={isViewMode}
                >
                  {Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data *"
                type="date"
                value={formData.scheduledDate}
                onChange={handleChange('scheduledDate')}
                disabled={isViewMode}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ora"
                type="time"
                value={formData.scheduledTime}
                onChange={handleChange('scheduledTime')}
                disabled={isViewMode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Durata (minuti)"
                type="number"
                value={formData.durationMinutes}
                onChange={handleChange('durationMinutes')}
                disabled={isViewMode}
                inputProps={{ min: 15, max: 240, step: 15 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Luogo/Link"
                value={formData.location}
                onChange={handleChange('location')}
                disabled={isViewMode}
                placeholder={
                  formData.interviewType === 'VIDEO_CALL' 
                    ? 'URL videochiamate' 
                    : formData.interviewType === 'IN_PERSON' 
                    ? 'Indirizzo/Sala' 
                    : 'Numero telefono'
                }
              />
            </Grid>

            {/* Status Info per Edit/View Mode */}
            {(isEditMode || isViewMode) && interview && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                    Stato Colloquio
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Chip 
                      label={interview.status} 
                      color={interview.status === 'COMPLETED' ? 'success' : 'primary'} 
                      size="small"
                    />
                  </Box>
                </Grid>

                {interview.outcome && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Esito:</Typography>
                      <Chip 
                        label={interview.outcome} 
                        color={interview.outcome === 'POSITIVE' ? 'success' : 'error'} 
                        size="small"
                      />
                    </Box>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {isViewMode ? 'Chiudi' : 'Annulla'}
        </Button>
        
        {!isViewMode && (
          <>
            <Button 
              onClick={() => handleSubmit(false)} 
              variant="contained" 
              disabled={loading || !formData.candidateId || !formData.scheduledDate}
            >
              {loading ? 'Salvando...' : (isCreateMode ? 'Programma' : 'Aggiorna')}
            </Button>
            
            {isCreateMode && onCommunicationRequest && (
              <Button 
                onClick={() => handleSubmit(true)} 
                variant="contained" 
                color="secondary"
                startIcon={<SendIcon />}
                disabled={loading || !formData.candidateId || !formData.scheduledDate}
                sx={{ ml: 1 }}
              >
                {loading ? 'Salvando...' : 'Programma e Invia Conferma'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InterviewForm;