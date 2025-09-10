import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  Assessment as AssessmentIcon,
  QuestionAnswer as QuestionIcon,
  Handshake as MatchIcon,
  MoodBad as SentimentIcon,
  Lightbulb as InsightIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AutoFixHigh as MagicIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import CVAnalyzer from './CVAnalyzer';
import InterviewQuestionGenerator from './InterviewQuestionGenerator';
import CandidateMatchingTool from './CandidateMatchingTool';
import SentimentAnalyzer from './SentimentAnalyzer';
import PredictiveScoring from './PredictiveScoring';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface AIStats {
  totalAnalysis: number;
  avgAccuracy: number;
  timesSaved: number;
  topSkills: string[];
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    score?: number;
  }>;
}

export const AIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkAnalysisDialog, setBulkAnalysisDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');

  useEffect(() => {
    loadAIStats();
  }, []);

  const loadAIStats = async () => {
    setIsLoading(true);
    try {
      // Simula chiamata API per statistiche AI
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalAnalysis: 247,
        avgAccuracy: 89,
        timesSaved: 156,
        topSkills: ['React', 'JavaScript', 'Node.js', 'Python', 'TypeScript'],
        recentActivity: [
          {
            type: 'cv_analysis',
            description: 'Analisi CV - Marco Rossi',
            timestamp: '10 minuti fa',
            score: 84
          },
          {
            type: 'candidate_match',
            description: 'Matching candidato per Full Stack Developer',
            timestamp: '25 minuti fa',
            score: 92
          },
          {
            type: 'interview_questions',
            description: 'Domande generate per Backend Developer',
            timestamp: '1 ora fa'
          },
          {
            type: 'sentiment_analysis',
            description: 'Analisi feedback colloquio - Sara Colombo',
            timestamp: '2 ore fa',
            score: 78
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cv_analysis': return <PersonIcon color="primary" />;
      case 'candidate_match': return <MatchIcon color="success" />;
      case 'interview_questions': return <QuestionIcon color="info" />;
      case 'sentiment_analysis': return <SentimentIcon color="warning" />;
      default: return <AIIcon />;
    }
  };

  const getActivityColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const runBulkAnalysis = async () => {
    if (!selectedPosition) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/bulk-analysis/${selectedPosition}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('Bulk analysis completed:', result.data);
        // Qui puoi mostrare i risultati o navigare a una pagina dedicata
        setBulkAnalysisDialog(false);
        setSelectedPosition('');
        await loadAIStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Bulk analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🤖 AI Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Strumenti di intelligenza artificiale per il recruiting avanzato
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setBulkAnalysisDialog(true)}
          >
            Analisi Bulk
          </Button>
          <Tooltip title="Refresh dati">
            <IconButton onClick={loadAIStats} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AssessmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalAnalysis}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Analisi Totali
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <TrendingIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.avgAccuracy}%</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Precisione Media
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <MagicIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.timesSaved}h</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tempo Risparmiato
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <InsightIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.recentActivity.length}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Attività Recenti
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* AI Tools Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<PersonIcon />}
            label="Analisi CV"
            iconPosition="start"
          />
          <Tab
            icon={<QuestionIcon />}
            label="Domande Colloquio"
            iconPosition="start"
          />
          <Tab
            icon={<MatchIcon />}
            label="Matching Candidati"
            iconPosition="start"
          />
          <Tab
            icon={<SentimentIcon />}
            label="Sentiment Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<TrendingIcon />}
            label="Predictive Scoring"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <CVAnalyzer />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <InterviewQuestionGenerator />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CandidateMatchingTool />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <SentimentAnalyzer />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <PredictiveScoring />
      </TabPanel>

      {/* Sidebar - Recent Activity */}
      {stats && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>💡 AI Tips</AlertTitle>
              • Carica CV in formato PDF per migliori risultati di analisi<br/>
              • Le domande personalizzate aumentano l'efficacia del colloquio del 40%<br/>
              • Il matching automatico riduce i tempi di screening del 60%
            </Alert>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="🕒 Attività Recenti"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {stats.recentActivity.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.description}
                          secondary={activity.timestamp}
                        />
                        {activity.score && (
                          <Chip
                            label={`${activity.score}%`}
                            color={getActivityColor(activity.score)}
                            size="small"
                          />
                        )}
                      </ListItem>
                      {index < stats.recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Top Skills */}
            <Card sx={{ mt: 2 }}>
              <CardHeader
                title="🔥 Competenze Trending"
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {stats.topSkills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
                <Button
                  variant="text"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai/skills-trending');
                      const result = await response.json();
                      console.log('Skills trending:', result);
                    } catch (error) {
                      console.error('Failed to load skills trending:', error);
                    }
                  }}
                >
                  Vedi Analisi Completa →
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Bulk Analysis Dialog */}
      <Dialog
        open={bulkAnalysisDialog}
        onClose={() => setBulkAnalysisDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📊 Analisi Bulk Candidati</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Esegui un'analisi AI completa di tutti i candidati per una posizione specifica.
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Seleziona Posizione</InputLabel>
            <Select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              label="Seleziona Posizione"
            >
              <MenuItem value="pos-1">Frontend Developer</MenuItem>
              <MenuItem value="pos-2">Backend Developer</MenuItem>
              <MenuItem value="pos-3">Full Stack Developer</MenuItem>
              <MenuItem value="pos-4">DevOps Engineer</MenuItem>
              <MenuItem value="pos-5">UI/UX Designer</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            L'analisi bulk includerà:
            • Screening CV automatico
            • Matching score per posizione
            • Predictive scoring
            • Ranking candidati
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAnalysisDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={runBulkAnalysis}
            variant="contained"
            disabled={!selectedPosition || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <AssessmentIcon />}
          >
            {isLoading ? 'Analizzando...' : 'Avvia Analisi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIDashboard;