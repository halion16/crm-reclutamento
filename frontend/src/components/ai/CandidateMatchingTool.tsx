import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  LinearProgress,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  Handshake as MatchIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

const CandidateMatchingTool: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  const calculateMatch = async () => {
    if (!selectedCandidate || !selectedPosition) return;
    
    setIsMatching(true);
    try {
      const response = await fetch('/api/ai/candidate-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId: selectedCandidate,
          positionId: selectedPosition 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMatchResult(result.data.match);
      }
    } catch (error) {
      console.error('Failed to calculate match:', error);
    } finally {
      setIsMatching(false);
    }
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="🎯 Matching Candidato-Posizione"
          subheader="Calcola la compatibilità tra candidato e posizione lavorativa"
        />
        <CardContent>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Seleziona Candidato</InputLabel>
                  <Select
                    value={selectedCandidate}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    label="Seleziona Candidato"
                  >
                    <MenuItem value="cand-1">Marco Rossi</MenuItem>
                    <MenuItem value="cand-2">Sara Colombo</MenuItem>
                    <MenuItem value="cand-3">Luigi Verdi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Seleziona Posizione</InputLabel>
                  <Select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    label="Seleziona Posizione"
                  >
                    <MenuItem value="pos-1">Frontend Developer</MenuItem>
                    <MenuItem value="pos-2">Backend Developer</MenuItem>
                    <MenuItem value="pos-3">Full Stack Developer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={calculateMatch}
              disabled={!selectedCandidate || !selectedPosition || isMatching}
              startIcon={isMatching ? <CircularProgress size={16} /> : <MatchIcon />}
              fullWidth
            >
              {isMatching ? 'Calcolando match...' : 'Calcola Compatibilità'}
            </Button>

            {matchResult && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Risultati matching per candidato e posizione selezionati
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          Score Complessivo
                        </Typography>
                        <Typography 
                          variant="h3" 
                          color={getScoreColor(matchResult.overallScore)}
                        >
                          {matchResult.overallScore}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={matchResult.overallScore}
                          color={getScoreColor(matchResult.overallScore)}
                          sx={{ mt: 2, height: 8, borderRadius: 4 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Breakdown Scores
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>Skills Match:</Typography>
                            <Chip 
                              label={`${matchResult.skillsMatch.score}%`}
                              color={getScoreColor(matchResult.skillsMatch.score)}
                              size="small"
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>Experience Match:</Typography>
                            <Chip 
                              label={`${matchResult.experienceMatch.score}%`}
                              color={getScoreColor(matchResult.experienceMatch.score)}
                              size="small"
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>Cultural Fit:</Typography>
                            <Chip 
                              label={`${matchResult.culturalFit.score}%`}
                              color={getScoreColor(matchResult.culturalFit.score)}
                              size="small"
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      ✅ Raccomandazioni
                    </Typography>
                    <List dense>
                      {matchResult.recommendations.map((rec: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      ⚠️ Preoccupazioni
                    </Typography>
                    <List dense>
                      {matchResult.concerns.map((concern: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={concern} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CandidateMatchingTool;