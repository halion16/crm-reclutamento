import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Rating,
  Grid,
  Chip
} from '@mui/material';
import type { 
  Interview, 
  InterviewOutcome, 
  InterviewOutcomeForm
} from '../types';
import {
  INTERVIEW_OUTCOME_LABELS 
} from '../types';
import { interviewsAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';

interface InterviewOutcomeDialogProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSuccess: () => void;
}

const InterviewOutcomeDialog: React.FC<InterviewOutcomeDialogProps> = ({
  open,
  onClose,
  interview,
  onSuccess
}) => {
  const [formData, setFormData] = useState<InterviewOutcomeForm>({
    outcome: 'PENDING',
    interviewerNotes: '',
    technicalRating: null,
    softSkillsRating: null,
    overallRating: null
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (interview) {
      setFormData({
        outcome: interview.outcome || 'PENDING',
        interviewerNotes: interview.interviewerNotes || '',
        technicalRating: interview.technicalRating || null,
        softSkillsRating: interview.softSkillsRating || null,
        overallRating: interview.overallRating || null
      });
    }
  }, [interview]);

  const handleSubmit = async () => {
    if (!interview) return;
    
    try {
      setLoading(true);
      
      const response = await interviewsAPI.recordOutcome(interview.id, formData);
      
      if (response.success) {
        toast.success('Esito colloquio registrato con successo');
        onSuccess();
        onClose();
      } else {
        toast.error(response.error || 'Errore nella registrazione dell\'esito');
      }
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isFormValid = () => {
    return formData.outcome && formData.outcome !== 'PENDING';
  };

  const formatInterviewInfo = () => {
    if (!interview?.candidate) return '';
    
    return `${interview.candidate.firstName} ${interview.candidate.lastName} - Fase ${interview.interviewPhase}`;
  };

  const getOutcomeColor = (outcome: InterviewOutcome) => {
    switch (outcome) {
      case 'POSITIVE': return 'success';
      case 'NEGATIVE': return 'error';
      case 'CANDIDATE_DECLINED': return 'warning';
      case 'TO_RESCHEDULE': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6">
            Registra Esito Colloquio
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatInterviewInfo()}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {/* Esito */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Esito Colloquio</InputLabel>
                <Select
                  value={formData.outcome}
                  label="Esito Colloquio"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    outcome: e.target.value as InterviewOutcome
                  }))}
                >
                  {Object.entries(INTERVIEW_OUTCOME_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          size="small"
                          label={label}
                          color={getOutcomeColor(value as InterviewOutcome)}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Note del Colloquio"
                value={formData.interviewerNotes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  interviewerNotes: e.target.value
                }))}
                placeholder="Inserisci qui le tue osservazioni sul candidato, punti di forza, aree di miglioramento, ecc..."
              />
            </Grid>

            {/* Ratings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Valutazioni (1-10)
              </Typography>
            </Grid>

            {/* Technical Rating */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography component="legend" gutterBottom>
                  Competenze Tecniche
                </Typography>
                <Rating
                  name="technical-rating"
                  value={formData.technicalRating}
                  max={10}
                  onChange={(_, newValue) => setFormData(prev => ({
                    ...prev,
                    technicalRating: newValue
                  }))}
                />
                <Typography variant="body2" color="textSecondary">
                  {formData.technicalRating ? `${formData.technicalRating}/10` : 'Non valutato'}
                </Typography>
              </Box>
            </Grid>

            {/* Soft Skills Rating */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography component="legend" gutterBottom>
                  Soft Skills
                </Typography>
                <Rating
                  name="soft-skills-rating"
                  value={formData.softSkillsRating}
                  max={10}
                  onChange={(_, newValue) => setFormData(prev => ({
                    ...prev,
                    softSkillsRating: newValue
                  }))}
                />
                <Typography variant="body2" color="textSecondary">
                  {formData.softSkillsRating ? `${formData.softSkillsRating}/10` : 'Non valutato'}
                </Typography>
              </Box>
            </Grid>

            {/* Overall Rating */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography component="legend" gutterBottom>
                  Valutazione Complessiva
                </Typography>
                <Rating
                  name="overall-rating"
                  value={formData.overallRating}
                  max={10}
                  onChange={(_, newValue) => setFormData(prev => ({
                    ...prev,
                    overallRating: newValue
                  }))}
                />
                <Typography variant="body2" color="textSecondary">
                  {formData.overallRating ? `${formData.overallRating}/10` : 'Non valutato'}
                </Typography>
              </Box>
            </Grid>

            {/* Informazioni aggiuntive se esito positivo */}
            {formData.outcome === 'POSITIVE' && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'success.light',
                    borderRadius: 1,
                    color: 'success.contrastText'
                  }}
                >
                  <Typography variant="body2">
                    💡 <strong>Esito Positivo:</strong> Il candidato passerà alla fase successiva del processo di selezione.
                    {interview?.interviewPhase === 3 && ' Essendo l\'ultimo colloquio, il candidato verrà marcato come "Assunto" se tutti i colloqui precedenti sono positivi.'}
                  </Typography>
                </Box>
              </Grid>
            )}

            {formData.outcome === 'NEGATIVE' && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'error.light',
                    borderRadius: 1,
                    color: 'error.contrastText'
                  }}
                >
                  <Typography variant="body2">
                    ⚠️ <strong>Esito Negativo:</strong> Il candidato non passerà alla fase successiva e verrà marcato come "Scartato".
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Annulla
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
        >
          {loading ? 'Salvando...' : 'Registra Esito'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InterviewOutcomeDialog;