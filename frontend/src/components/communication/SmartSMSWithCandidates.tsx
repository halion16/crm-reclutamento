import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import SmartSMSPanel from './SmartSMSPanel';
import type { Candidate } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SmartSMSWithCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/candidates`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei candidati');
      }
      
      const data = await response.json();
      // Filtra solo candidati con numero di telefono
      const candidatesWithPhone = data.filter((c: Candidate) => 
        c.mobile && c.mobile.trim() !== ''
      );
      
      setCandidates(candidatesWithPhone);
      
      if (candidatesWithPhone.length === 0) {
        setError('Nessun candidato con numero di telefono trovato');
      }
    } catch (error) {
      console.error('Errore caricamento candidati:', error);
      setError('Errore nel caricamento dei candidati. Verifica che il backend sia attivo.');
      
      // Mock data per testing se il backend non è disponibile
      const mockCandidates: Candidate[] = [
        {
          id: 'mock-1',
          firstName: 'Mario',
          lastName: 'Rossi',
          email: 'mario.rossi@email.com',
          mobile: '+39 333 123 4567',
          position: 'Software Developer',
          status: 'ACTIVE'
        },
        {
          id: 'mock-2', 
          firstName: 'Giulia',
          lastName: 'Bianchi',
          email: 'giulia.bianchi@email.com',
          mobile: '+39 347 987 6543',
          position: 'UX Designer',
          status: 'ACTIVE'
        }
      ] as Candidate[];
      
      setCandidates(mockCandidates);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setSelectedCandidate(candidate || null);
  };

  const handleSMSSent = (result: any) => {
    console.log('SMS inviato con successo:', result);
    // Potresti voler aggiornare lo stato o mostrare una notifica
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento candidati...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📱 Smart SMS - Test con Candidati Reali
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selezione Candidato */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            1. Seleziona Candidato
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Candidato</InputLabel>
            <Select
              value={selectedCandidate?.id || ''}
              label="Candidato"
              onChange={(e) => handleCandidateSelect(e.target.value)}
            >
              {candidates.map((candidate) => (
                <MenuItem key={candidate.id} value={candidate.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {candidate.firstName} {candidate.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {candidate.mobile} • {candidate.position}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCandidate && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Candidato selezionato:
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </Typography>
                  <Box display="flex" gap={2} mt={0.5}>
                    <Chip
                      icon={<PhoneIcon fontSize="small" />}
                      label={selectedCandidate.mobile}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      icon={<EmailIcon fontSize="small" />}
                      label={selectedCandidate.email}
                      size="small"
                      color="secondary"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pannello SMS */}
      {selectedCandidate ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              2. Invia SMS
            </Typography>
            <SmartSMSPanel
              candidate={selectedCandidate}
              onSMSSent={handleSMSSent}
            />
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Seleziona un candidato per inviare SMS tramite il sistema smart.
        </Alert>
      )}
    </Box>
  );
};

export default SmartSMSWithCandidates;