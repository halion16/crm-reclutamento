import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Alert,
  Divider,
  IconButton,
  Collapse,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  BugReport as TestIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Psychology as AIIcon,
  Timeline as TimelineIcon,
  Assessment as MetricsIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface WorkflowTestPanelProps {
  onRefreshBoard: () => void;
}

const WorkflowTestPanel: React.FC<WorkflowTestPanelProps> = ({ onRefreshBoard }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Test data forms
  const [newCandidateName, setNewCandidateName] = useState('Test Candidato');
  const [newCandidatePosition, setNewCandidatePosition] = useState('Frontend Developer');
  const [newCandidatePriority, setNewCandidatePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [selectedCandidateId, setSelectedCandidateId] = useState('cand-1');
  const [moveFromPhase, setMoveFromPhase] = useState('cv_review');
  const [moveToPhase, setMoveToPhase] = useState('phone_screening');
  const [moveScore, setMoveScore] = useState(85);
  const [feedbackText, setFeedbackText] = useState('Il candidato ha mostrato ottime competenze tecniche e comunicazione fluida.');

  const phases = [
    { id: 'cv_review', name: 'CV Review' },
    { id: 'phone_screening', name: 'Phone Screening' },
    { id: 'technical_interview', name: 'Technical Interview' },
    { id: 'cultural_fit', name: 'Cultural Fit' },
    { id: 'final_decision', name: 'Final Decision' }
  ];

  const addTestResult = (message: string, type: 'success' | 'error' = 'success') => {
    const timestamp = new Date().toLocaleTimeString();
    const result = `[${timestamp}] ${message}`;
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep only last 10 results
    
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // Test 1: Crea nuovo candidato nel workflow
  const testCreateCandidate = async () => {
    setLoading(true);
    try {
      const candidateId = `test-cand-${Date.now()}`;
      
      const response = await fetch(`/api/workflow/candidate/${candidateId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowTemplateId: 'default-workflow',
          positionId: 'pos-test',
          priority: newCandidatePriority
        })
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`✅ Candidato creato: ${newCandidateName} (ID: ${candidateId})`);
        onRefreshBoard();
      } else {
        throw new Error('Failed to create candidate');
      }
    } catch (error) {
      addTestResult(`❌ Errore creazione candidato: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Sposta candidato tra fasi
  const testMoveCandidate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflow/move-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          fromPhase: moveFromPhase,
          toPhase: moveToPhase,
          decision: 'passed',
          score: moveScore,
          notes: `Test movimento da ${moveFromPhase} a ${moveToPhase}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`✅ Candidato spostato: ${moveFromPhase} → ${moveToPhase} (Score: ${moveScore})`);
        onRefreshBoard();
      } else {
        throw new Error('Failed to move candidate');
      }
    } catch (error) {
      addTestResult(`❌ Errore spostamento candidato: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Analisi AI CV
  const testAIAnalysis = async () => {
    setLoading(true);
    try {
      console.log(`🤖 Iniziando analisi AI per candidato: ${selectedCandidateId}`);
      const response = await fetch('/api/workflow/ai/process-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId
        })
      });

      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('AI Analysis Response:', data);
        addTestResult(`🤖 Analisi AI avviata per candidato ${selectedCandidateId}`);
      } else {
        const errorText = await response.text();
        console.error('AI Analysis Error Response:', errorText);
        throw new Error(`Failed to start AI analysis: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      addTestResult(`❌ Errore analisi AI: ${error}`, 'error');
      throw error; // Re-throw per fermare il test completo
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Genera domande colloquio
  const testGenerateQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/ai/interview-questions/${selectedCandidateId}`);
      
      if (response.ok) {
        const data = await response.json();
        addTestResult(`💡 Generate ${data.questions.length} domande per colloquio`);
        console.log('Interview Questions:', data.questions);
      } else {
        throw new Error('Failed to generate questions');
      }
    } catch (error) {
      addTestResult(`❌ Errore generazione domande: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Analizza feedback
  const testAnalyzeFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflow/ai/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          feedback: feedbackText
        })
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`📊 Sentiment: ${data.analysis.sentiment} (Score: ${data.analysis.score})`);
        console.log('Feedback Analysis:', data.analysis);
      } else {
        throw new Error('Failed to analyze feedback');
      }
    } catch (error) {
      addTestResult(`❌ Errore analisi feedback: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Score predittivo
  const testPredictiveScore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/ai/predictive-score/${selectedCandidateId}`);
      
      if (response.ok) {
        const data = await response.json();
        addTestResult(`🎯 Score Predittivo: ${data.predictiveScore}%`);
      } else {
        throw new Error('Failed to get predictive score');
      }
    } catch (error) {
      addTestResult(`❌ Errore score predittivo: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 7: Matching posizione
  const testPositionMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/ai/position-match/${selectedCandidateId}`);
      
      if (response.ok) {
        const data = await response.json();
        addTestResult(`🎯 Match Posizione: ${data.match.matchScore.toFixed(1)}% (${data.match.positionId})`);
        console.log('Position Match:', data.match);
      } else {
        throw new Error('Failed to find position match');
      }
    } catch (error) {
      addTestResult(`❌ Errore matching posizione: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test 8: Ottieni metriche
  const testGetMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflow/metrics');
      
      if (response.ok) {
        const data = await response.json();
        addTestResult(`📈 Metriche: ${data.totalCandidates} candidati, ${data.bottlenecks.length} bottlenecks`);
        console.log('Workflow Metrics:', data);
      } else {
        throw new Error('Failed to get metrics');
      }
    } catch (error) {
      addTestResult(`❌ Errore metriche: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test completo
  const runFullTest = async () => {
    setLoading(true);
    addTestResult('🚀 Avvio test completo del workflow...');
    
    try {
      addTestResult('📝 Step 1: Creazione candidato...');
      await testCreateCandidate();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('🤖 Step 2: Analisi AI...');
      await testAIAnalysis();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('💡 Step 3: Generazione domande...');
      await testGenerateQuestions();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('📊 Step 4: Analisi feedback...');
      await testAnalyzeFeedback();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('➡️ Step 5: Movimento candidato...');
      await testMoveCandidate();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('🎯 Step 6: Score predittivo...');
      await testPredictiveScore();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('🔍 Step 7: Matching posizione...');
      await testPositionMatch();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addTestResult('📈 Step 8: Metriche finali...');
      await testGetMetrics();
      
      addTestResult('✅ Test completo completato con successo!');
    } catch (error) {
      addTestResult(`❌ Test completo fallito: ${error}`, 'error');
      console.error('Test completo errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    toast.success('Risultati cancellati');
  };

  return (
    <Card sx={{ mb: 3, border: '2px dashed #1976d2' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <TestIcon color="primary" />
            <Typography variant="h6" color="primary">
              Pannello Test Workflow
            </Typography>
            <Chip label="DEV" size="small" color="secondary" />
          </Box>
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            color="primary"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box mt={3}>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            
            <Grid container spacing={3}>
              {/* Configurazione Test */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>⚙️ Configurazione Test</Typography>
                
                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Nome Candidato"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    size="small"
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="Posizione"
                    value={newCandidatePosition}
                    onChange={(e) => setNewCandidatePosition(e.target.value)}
                    size="small"
                    margin="normal"
                  />
                  
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel>Priorità</InputLabel>
                    <Select
                      value={newCandidatePriority}
                      onChange={(e) => setNewCandidatePriority(e.target.value as any)}
                    >
                      <MenuItem value="low">Bassa</MenuItem>
                      <MenuItem value="medium">Media</MenuItem>
                      <MenuItem value="high">Alta</MenuItem>
                      <MenuItem value="urgent">Urgente</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Candidato ID (per test movimento)"
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    size="small"
                    margin="normal"
                  />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>Da Fase</InputLabel>
                        <Select
                          value={moveFromPhase}
                          onChange={(e) => setMoveFromPhase(e.target.value)}
                        >
                          {phases.map(phase => (
                            <MenuItem key={phase.id} value={phase.id}>
                              {phase.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth margin="normal" size="small">
                        <InputLabel>A Fase</InputLabel>
                        <Select
                          value={moveToPhase}
                          onChange={(e) => setMoveToPhase(e.target.value)}
                        >
                          {phases.map(phase => (
                            <MenuItem key={phase.id} value={phase.id}>
                              {phase.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Score (0-100)"
                    type="number"
                    value={moveScore}
                    onChange={(e) => setMoveScore(Number(e.target.value))}
                    size="small"
                    margin="normal"
                    inputProps={{ min: 0, max: 100 }}
                  />

                  <TextField
                    fullWidth
                    label="Feedback per Sentiment Analysis"
                    multiline
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    size="small"
                    margin="normal"
                  />
                </Box>
              </Grid>

              {/* Test Actions */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>🧪 Test Disponibili</Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testCreateCandidate}
                      disabled={loading}
                      startIcon={<PlayIcon />}
                      size="small"
                    >
                      Crea Candidato
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testMoveCandidate}
                      disabled={loading}
                      startIcon={<TimelineIcon />}
                      size="small"
                    >
                      Sposta Candidato
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testAIAnalysis}
                      disabled={loading}
                      startIcon={<AIIcon />}
                      size="small"
                    >
                      Analisi AI
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testGenerateQuestions}
                      disabled={loading}
                      size="small"
                    >
                      Domande Colloquio
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testAnalyzeFeedback}
                      disabled={loading}
                      size="small"
                    >
                      Analisi Sentiment
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testPredictiveScore}
                      disabled={loading}
                      size="small"
                    >
                      Score Predittivo
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testPositionMatch}
                      disabled={loading}
                      size="small"
                    >
                      Match Posizione
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={testGetMetrics}
                      disabled={loading}
                      startIcon={<MetricsIcon />}
                      size="small"
                    >
                      Metriche
                    </Button>
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={runFullTest}
                    disabled={loading}
                    startIcon={<PlayIcon />}
                    sx={{ mb: 1 }}
                  >
                    🚀 Esegui Test Completo
                  </Button>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={onRefreshBoard}
                        startIcon={<RefreshIcon />}
                        size="small"
                      >
                        Refresh Board
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={clearResults}
                        startIcon={<StopIcon />}
                        size="small"
                      >
                        Clear Results
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Risultati Test */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>📋 Risultati Test</Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                  {testResults.length > 0 ? (
                    testResults.map((result, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mb: 0.5,
                          color: result.includes('❌') ? 'error.main' : 'success.main'
                        }}
                      >
                        {result}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nessun test eseguito. Prova i test sopra per vedere i risultati qui.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Suggerimenti:</strong> Apri la console del browser (F12) per vedere i dettagli completi delle risposte API. 
                Il test completo eseguirà tutti i test in sequenza con pause per osservare i risultati.
              </Typography>
            </Alert>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WorkflowTestPanel;