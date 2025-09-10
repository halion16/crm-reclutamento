import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stack,
  Rating,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  Language as LanguageIcon,
  EmojiObjects as InsightIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface CVAnalysisResult {
  candidateInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  experience: {
    totalYears: number;
    positions: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
      relevanceScore: number;
    }>;
    industries: string[];
  };
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
    field: string;
  }>;
  aiInsights: {
    overallScore: number;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    fitScore: number;
    summaryAI: string;
  };
}

interface CVAnalyzerProps {
  onAnalysisComplete?: (analysis: CVAnalysisResult) => void;
  positionId?: string;
  candidateId?: string;
}

export const CVAnalyzer: React.FC<CVAnalyzerProps> = ({
  onAnalysisComplete,
  positionId,
  candidateId
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validazione file
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File troppo grande. Massimo 10MB consentiti.');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo di file non supportato. Carica PDF, DOCX o TXT.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      // Simula progress upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepara FormData
      const formData = new FormData();
      formData.append('cv', file);
      if (positionId) {
        formData.append('positionId', positionId);
      }

      // Chiamata API
      const response = await fetch('/api/ai/cv-analysis', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data.analysis);
        onAnalysisComplete?.(result.data.analysis);
        toast.success('✅ Analisi CV completata con successo!');
      } else {
        throw new Error(result.error || 'Analisi fallita');
      }
    } catch (err) {
      console.error('CV Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'analisi del CV';
      setError(errorMessage);
      toast.error('❌ Errore durante l\'analisi del CV');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  }, [onAnalysisComplete, positionId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isAnalyzing
  });

  const reanalyze = async () => {
    if (!candidateId) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai/cv-analysis/${candidateId}`);
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data.analysis);
        onAnalysisComplete?.(result.data.analysis);
        toast.success('✅ Analisi aggiornata!');
      } else {
        throw new Error(result.error || 'Analisi fallita');
      }
    } catch (err) {
      console.error('Re-analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il refresh dell\'analisi';
      setError(errorMessage);
      toast.error('❌ Errore durante il refresh');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="🤖 Analisi CV con AI"
          subheader="Carica un CV per ottenere un'analisi automatica completa"
          action={
            candidateId && analysis && (
              <Tooltip title="Refresh analisi">
                <IconButton onClick={reanalyze} disabled={isAnalyzing}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )
          }
        />
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: 2,
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderStyle: 'dashed',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              bgcolor: isDragActive ? 'primary.light' : 'background.paper',
              opacity: isAnalyzing ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
            
            {isAnalyzing ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  🔍 Analizzando CV...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ mt: 2, mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  {uploadProgress < 90 ? 'Caricamento in corso...' : 'Analisi AI in corso...'}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {isDragActive 
                    ? "📁 Rilascia il CV qui" 
                    : "📤 Trascina CV o clicca per selezionare"
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Formati supportati: PDF, DOCX, TXT (max 10MB)
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={isAnalyzing}
                >
                  Seleziona File
                </Button>
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Errore</AlertTitle>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Box>
          {/* Overview Card */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="📊 Panoramica Analisi"
              subheader="Score e insights principali"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Score Complessivo
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      {getScoreIcon(analysis.aiInsights.overallScore)}
                      <Typography variant="h4" color={getScoreColor(analysis.aiInsights.overallScore)} sx={{ ml: 1 }}>
                        {analysis.aiInsights.overallScore}/100
                      </Typography>
                    </Box>
                    <Rating
                      value={analysis.aiInsights.overallScore / 20}
                      precision={0.1}
                      readOnly
                      size="large"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Fit Score (Posizione)
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      <TrendingUpIcon color={getScoreColor(analysis.aiInsights.fitScore)} />
                      <Typography variant="h4" color={getScoreColor(analysis.aiInsights.fitScore)} sx={{ ml: 1 }}>
                        {analysis.aiInsights.fitScore}/100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analysis.aiInsights.fitScore}
                      color={getScoreColor(analysis.aiInsights.fitScore)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {/* AI Summary */}
              <Alert
                severity="info"
                icon={<PsychologyIcon />}
                sx={{ mt: 3 }}
              >
                <AlertTitle>🤖 Riassunto AI</AlertTitle>
                {analysis.aiInsights.summaryAI}
              </Alert>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Box>
            {/* Candidate Info */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">👤 Informazioni Candidato</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {analysis.candidateInfo.name && (
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Nome:</strong> {analysis.candidateInfo.name}</Typography>
                    </Grid>
                  )}
                  {analysis.candidateInfo.email && (
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Email:</strong> {analysis.candidateInfo.email}</Typography>
                    </Grid>
                  )}
                  {analysis.candidateInfo.phone && (
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Telefono:</strong> {analysis.candidateInfo.phone}</Typography>
                    </Grid>
                  )}
                  {analysis.candidateInfo.location && (
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Località:</strong> {analysis.candidateInfo.location}</Typography>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Skills */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">🛠️ Competenze</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    <CodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Competenze Tecniche
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {analysis.skills.technical.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Soft Skills
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {analysis.skills.soft.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    <LanguageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Lingue
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {analysis.skills.languages.map((lang, index) => (
                      <Chip
                        key={index}
                        label={lang}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>

                {analysis.skills.certifications.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🏆 Certificazioni
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {analysis.skills.certifications.map((cert, index) => (
                        <Chip
                          key={index}
                          label={cert}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Experience */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">💼 Esperienza Lavorativa</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box mb={2}>
                  <Typography variant="body1">
                    <strong>Esperienza totale:</strong> {analysis.experience.totalYears} anni
                  </Typography>
                </Box>

                {analysis.experience.positions.map((position, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="h6">{position.title}</Typography>
                        <Chip 
                          label={`${position.relevanceScore}% rilevanza`}
                          color={getScoreColor(position.relevanceScore)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="subtitle1" color="textSecondary">
                        {position.company} • {position.duration}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {position.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                {analysis.experience.industries.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🏭 Settori di Esperienza
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {analysis.experience.industries.map((industry, index) => (
                        <Chip
                          key={index}
                          label={industry}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Education */}
            {analysis.education.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">🎓 Istruzione</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {analysis.education.map((edu, index) => (
                    <Box key={index} mb={2}>
                      <Typography variant="subtitle1">
                        {edu.degree} - {edu.field}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {edu.institution}
                        {edu.year && ` • ${edu.year}`}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* AI Insights */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  <InsightIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Insights AI
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      ✅ Punti di Forza
                    </Typography>
                    <List dense>
                      {analysis.aiInsights.strengths.map((strength, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      ⚠️ Aspetti da Valutare
                    </Typography>
                    <List dense>
                      {analysis.aiInsights.concerns.map((concern, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={concern} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      💡 Raccomandazioni
                    </Typography>
                    <List dense>
                      {analysis.aiInsights.recommendations.map((rec, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon>
                            <InsightIcon color="info" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CVAnalyzer;