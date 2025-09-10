import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  TextField,
  Alert,
  LinearProgress,
  Stack,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  MoodBad as SentimentIcon,
  SentimentVeryDissatisfied,
  SentimentNeutral,
  SentimentVerySatisfied
} from '@mui/icons-material';

const SentimentAnalyzer: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSentiment = async () => {
    if (!feedbackText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/sentiment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedback: feedbackText,
          interviewId: 'test-interview',
          candidateId: 'test-candidate'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data.sentiment);
      }
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (overall: string) => {
    switch (overall) {
      case 'positive':
        return <SentimentVerySatisfied color="success" sx={{ fontSize: 40 }} />;
      case 'neutral':
        return <SentimentNeutral color="warning" sx={{ fontSize: 40 }} />;
      case 'negative':
        return <SentimentVeryDissatisfied color="error" sx={{ fontSize: 40 }} />;
      default:
        return <SentimentIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getSentimentColor = (overall: string): 'success' | 'warning' | 'error' => {
    switch (overall) {
      case 'positive': return 'success';
      case 'neutral': return 'warning';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="😊 Sentiment Analysis"
          subheader="Analizza il sentiment dei feedback dei colloqui"
        />
        <CardContent>
          <Stack spacing={3}>
            <TextField
              multiline
              rows={6}
              fullWidth
              label="Testo del Feedback"
              placeholder="Inserisci il feedback del colloquio da analizzare..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              helperText={`${feedbackText.length} caratteri`}
            />

            <Button
              variant="contained"
              onClick={analyzeSentiment}
              disabled={!feedbackText.trim() || isAnalyzing}
              startIcon={isAnalyzing ? <CircularProgress size={16} /> : <SentimentIcon />}
              fullWidth
            >
              {isAnalyzing ? 'Analizzando sentiment...' : 'Analizza Sentiment'}
            </Button>

            {analysis && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Analisi completata con confidenza del {analysis.confidence}%
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Sentiment Generale
                      </Typography>
                      {getSentimentIcon(analysis.overall)}
                      <Typography 
                        variant="h4" 
                        color={getSentimentColor(analysis.overall)}
                        sx={{ textTransform: 'capitalize', mt: 1 }}
                      >
                        {analysis.overall}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Score: {analysis.score}/5
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Dettagli Analisi
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Score Comparativo:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.abs(analysis.comparative) * 100}
                            color={getSentimentColor(analysis.overall)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Confidenza: {analysis.confidence}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={analysis.confidence}
                            color="info"
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      😊 Parole Positive
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {analysis.positive.map((word: string, index: number) => (
                        <Chip
                          key={index}
                          label={word}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      😞 Parole Negative
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {analysis.negative.map((word: string, index: number) => (
                        <Chip
                          key={index}
                          label={word}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>

                <Alert 
                  severity={getSentimentColor(analysis.overall)} 
                  sx={{ mt: 3 }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    🤖 Riassunto AI
                  </Typography>
                  {analysis.summary}
                </Alert>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SentimentAnalyzer;