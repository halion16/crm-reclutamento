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
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import type { Candidate, CandidateForm as CandidateFormData } from '../types';
import { candidatesAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';

interface CandidateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidate?: Candidate | null;
  mode: 'create' | 'edit' | 'view';
}

const CandidateForm: React.FC<CandidateFormProps> = ({
  open,
  onClose,
  onSuccess,
  candidate,
  mode
}) => {
  const [formData, setFormData] = useState<CandidateFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    birthDate: '',
    positionApplied: '',
    experienceYears: null,
    educationLevel: '',
    linkedinProfile: '',
    sourceChannel: '',
    referralPerson: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (candidate && (isEditMode || isViewMode)) {
      setFormData({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        mobile: candidate.mobile || '',
        address: candidate.address || '',
        city: candidate.city || '',
        postalCode: candidate.postalCode || '',
        province: candidate.province || '',
        birthDate: candidate.birthDate ? candidate.birthDate.split('T')[0] : '',
        positionApplied: candidate.positionApplied || '',
        experienceYears: candidate.experienceYears || null,
        educationLevel: candidate.educationLevel || '',
        linkedinProfile: candidate.linkedinProfile || '',
        sourceChannel: candidate.sourceChannel || '',
        referralPerson: candidate.referralPerson || '',
        notes: candidate.notes || ''
      });
    } else if (isCreateMode) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        postalCode: '',
        province: '',
        birthDate: '',
        positionApplied: '',
        experienceYears: null,
        educationLevel: '',
        linkedinProfile: '',
        sourceChannel: '',
        referralPerson: '',
        notes: ''
      });
    }
  }, [candidate, mode, open]);

  const handleChange = (field: keyof CandidateFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'experienceYears' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (isCreateMode) {
        const response = await candidatesAPI.create(formData);
        if (response.success) {
          toast.success('Candidato creato con successo!');
          onSuccess();
          onClose();
        } else {
          toast.error('Errore nella creazione del candidato');
        }
      } else if (isEditMode && candidate) {
        const response = await candidatesAPI.update(candidate.id, formData);
        if (response.success) {
          toast.success('Candidato aggiornato con successo!');
          onSuccess();
          onClose();
        } else {
          toast.error('Errore nell\'aggiornamento del candidato');
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
      case 'create': return 'Nuovo Candidato';
      case 'edit': return 'Modifica Candidato';
      case 'view': return 'Dettagli Candidato';
      default: return 'Candidato';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Dati personali */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Dati Personali
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                disabled={isViewMode}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cognome *"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                disabled={isViewMode}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={isViewMode}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.phone}
                onChange={handleChange('phone')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cellulare"
                value={formData.mobile}
                onChange={handleChange('mobile')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data di Nascita"
                type="date"
                value={formData.birthDate}
                onChange={handleChange('birthDate')}
                disabled={isViewMode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Indirizzo */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Indirizzo
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={formData.address}
                onChange={handleChange('address')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Città"
                value={formData.city}
                onChange={handleChange('city')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CAP"
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Provincia"
                value={formData.province}
                onChange={handleChange('province')}
                disabled={isViewMode}
              />
            </Grid>
            
            {/* Dati professionali */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Dati Professionali
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Posizione Richiesta"
                value={formData.positionApplied}
                onChange={handleChange('positionApplied')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Anni di Esperienza"
                type="number"
                value={formData.experienceYears || ''}
                onChange={handleChange('experienceYears')}
                disabled={isViewMode}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isViewMode}>
                <InputLabel>Livello di Istruzione</InputLabel>
                <Select
                  value={formData.educationLevel}
                  label="Livello di Istruzione"
                  onChange={(e) => setFormData(prev => ({...prev, educationLevel: e.target.value}))}
                >
                  <MenuItem value="">Seleziona</MenuItem>
                  <MenuItem value="Diploma">Diploma</MenuItem>
                  <MenuItem value="Laurea Triennale">Laurea Triennale</MenuItem>
                  <MenuItem value="Laurea Magistrale">Laurea Magistrale</MenuItem>
                  <MenuItem value="Master">Master</MenuItem>
                  <MenuItem value="Dottorato">Dottorato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Profilo LinkedIn"
                value={formData.linkedinProfile}
                onChange={handleChange('linkedinProfile')}
                disabled={isViewMode}
              />
            </Grid>
            
            {/* Provenienza */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Provenienza Candidatura
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isViewMode}>
                <InputLabel>Canale di Provenienza</InputLabel>
                <Select
                  value={formData.sourceChannel}
                  label="Canale di Provenienza"
                  onChange={(e) => setFormData(prev => ({...prev, sourceChannel: e.target.value}))}
                >
                  <MenuItem value="">Seleziona</MenuItem>
                  <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  <MenuItem value="Website">Sito Web</MenuItem>
                  <MenuItem value="Job Board">Job Board</MenuItem>
                  <MenuItem value="Referral">Referral</MenuItem>
                  <MenuItem value="Direct">Contatto Diretto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Persona di Referenza"
                value={formData.referralPerson}
                onChange={handleChange('referralPerson')}
                disabled={isViewMode}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
                disabled={isViewMode}
              />
            </Grid>

            {/* Storico Colloqui - Solo in modalità view/edit */}
            {(isViewMode || isEditMode) && candidate && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" color="primary" gutterBottom>
                    📅 Storico Colloqui
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  {candidate.interviews && candidate.interviews.length > 0 ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <List>
                        {candidate.interviews.map((interview, index) => (
                          <ListItem key={interview.id || index} divider={index < candidate.interviews!.length - 1}>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Fase {interview.interviewPhase}
                                  </Typography>
                                  <Chip 
                                    label={interview.status} 
                                    size="small" 
                                    color={interview.status === 'COMPLETED' ? 'success' : 'primary'}
                                  />
                                  {interview.outcome && (
                                    <Chip 
                                      label={interview.outcome} 
                                      size="small" 
                                      color={interview.outcome === 'POSITIVE' ? 'success' : 'error'}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="textSecondary">
                                    📍 {interview.interviewType} 
                                    {interview.scheduledDate && ` - ${new Date(interview.scheduledDate).toLocaleDateString('it-IT')}`}
                                    {interview.scheduledTime && ` alle ${new Date(interview.scheduledTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                                  </Typography>
                                  {interview.primaryInterviewer && (
                                    <Typography variant="caption" color="textSecondary">
                                      👤 Intervistatore: {interview.primaryInterviewer.firstName} {interview.primaryInterviewer.lastName}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        📭 Nessun colloquio programmato per questo candidato
                      </Typography>
                    </Paper>
                  )}
                </Grid>
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
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
          >
            {loading ? 'Salvando...' : (isCreateMode ? 'Crea' : 'Aggiorna')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CandidateForm;