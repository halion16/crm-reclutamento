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
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  MonetizationOn as SalaryIcon,
  Schedule as TimeIcon,
  Star as StarIcon
} from '@mui/icons-material';

const PredictiveScoring: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [includeInterviews, setIncludeInterviews] = useState(true);
  const [scoring, setScoring] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePredictiveScore = async () => {
    if (!selectedCandidate) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch('/api/ai/predictive-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId: selectedCandidate,
          positionId: 'pos-1',
          includeInterviews
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setScoring(result.data.scoring);
      }
    } catch (error) {
      console.error('Failed to calculate predictive score:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getDecisionColor = (decision: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (decision) {
      case 'hire': return 'success';
      case 'interview': return 'info';
      case 'consider': return 'warning';
      case 'reject': return 'error';
      default: return 'warning';
    }
  };

  const getDecisionLabel = (decision: string): string => {
    switch (decision) {
      case 'hire': return 'ASSUMERE';
      case 'interview': return 'COLLOQUIO';
      case 'consider': return 'VALUTARE';
      case 'reject': return 'RIFIUTARE';
      default: return decision.toUpperCase();
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="🔮 Predictive Scoring"
          subheader="Predizione del successo del candidato basata su AI"
        />
        <CardContent>
          <Stack spacing={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel>Seleziona Candidato</InputLabel>
                  <Select
                    value={selectedCandidate}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    label="Seleziona Candidato"
                  >
                    <MenuItem value="cand-1">Marco Rossi</MenuItem>
                    <MenuItem value="cand-2">Sara Colombo</MenuItem>
                    <MenuItem value="cand-3">Andrea Ferrari</MenuItem>
                    <MenuItem value="cand-4">Luigi Verdi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeInterviews}
                      onChange={(e) => setIncludeInterviews(e.target.checked)}
                    />
                  }
                  label="Includi Colloqui"
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={calculatePredictiveScore}
              disabled={!selectedCandidate || isCalculating}
              startIcon={isCalculating ? <CircularProgress size={16} /> : <AIIcon />}
              fullWidth
            >
              {isCalculating ? 'Calcolando predizione...' : 'Genera Predizione AI'}
            </Button>

            {scoring && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Predizione generata per candidato selezionato
                </Alert>
                
                {/* Decision Card */}
                <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h5" gutterBottom>
                    🎯 Raccomandazione Finale
                  </Typography>
                  <Chip
                    label={getDecisionLabel(scoring.recommendations.decision)}
                    color={getDecisionColor(scoring.recommendations.decision)}
                    sx={{ fontSize: '1.2rem', p: 2, mb: 2 }}
                  />
                  <Typography variant="body1" color="textSecondary">
                    {scoring.recommendations.reasoning}
                  </Typography>
                </Paper>

                {/* Predictions Grid */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <StarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Successo Hiring
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {scoring.predictions.hiringSuccess.probability}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Confidenza: {scoring.predictions.hiringSuccess.confidence}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={scoring.predictions.hiringSuccess.probability}
                        color="primary"
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <TimeIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Retention (2 anni)
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {scoring.predictions.retention.probability}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Durata attesa: {scoring.predictions.retention.expectedTenure} anni
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={scoring.predictions.retention.probability}
                        color="success"
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <TrendingIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Performance Attesa
                      </Typography>
                      <Typography variant="h4" color="info.main">
                        {scoring.predictions.performance.expectedRating}/5
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Rating performance previsto
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(scoring.predictions.performance.expectedRating / 5) * 100}
                        color="info"
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      />
                    </Paper>
                  </Grid>
                </Grid>

                {/* Factors */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      🎯 Fattori di Successo
                    </Typography>
                    <List dense>
                      {scoring.predictions.hiringSuccess.factors.map((factor: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={factor.factor}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {factor.description}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.abs(factor.impact) * 100}
                                  color={factor.impact > 0 ? 'success' : 'warning'}
                                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      ⚠️ Fattori di Rischio
                    </Typography>
                    <List dense>
                      {scoring.predictions.retention.riskFactors.map((risk: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemText primary={risk} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>

                {/* Next Steps */}
                <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    📋 Prossimi Passi Raccomandati
                  </Typography>
                  <List dense>
                    {scoring.recommendations.nextSteps.map((step: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${step}`} />
                      </ListItem>
                    ))}
                  </List>
                  
                  {scoring.recommendations.compensation && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        💰 Suggerimenti Retribuzione
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          icon={<SalaryIcon />}
                          label={`€${scoring.recommendations.compensation.suggested.toLocaleString()}`}
                          color="primary"
                        />
                        <Typography variant="body2" color="textSecondary">
                          Range: €{scoring.recommendations.compensation.range.min.toLocaleString()} - 
                          €{scoring.recommendations.compensation.range.max.toLocaleString()}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {scoring.recommendations.compensation.justification}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PredictiveScoring;