import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Alert,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface WorkflowMetrics {
  totalCandidates: number;
  candidatesByPhase: Record<string, number>;
  averageTimePerPhase: Record<string, number>;
  conversionRates: Record<string, number>;
  bottlenecks: BottleneckAnalysis[];
  slaCompliance: SLAMetrics;
  timeToHire: {
    average: number;
    median: number;
    p90: number;
  };
}

interface BottleneckAnalysis {
  phaseId: string;
  phaseName: string;
  averageTime: number;
  standardDeviation: number;
  candidatesInPhase: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface SLAMetrics {
  overallCompliance: number;
  phaseCompliance: Record<string, number>;
  breachedSLAs: any[];
}

const WorkflowMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const phases = [
    { id: 'cv_review', name: 'CV Review', color: '#2196F3' },
    { id: 'phone_screening', name: 'Phone Screening', color: '#FF9800' },
    { id: 'technical_interview', name: 'Technical Interview', color: '#9C27B0' },
    { id: 'cultural_fit', name: 'Cultural Fit', color: '#4CAF50' },
    { id: 'final_decision', name: 'Final Decision', color: '#E91E63' }
  ];

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/workflow/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        console.error('Failed to load metrics');
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}g ${remainingHours.toFixed(0)}h`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <BarChartIcon color="primary" />
            <Typography variant="h6">Metriche Workflow</Typography>
          </Box>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" mt={2}>
            Caricamento metriche...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Impossibile caricare le metriche del workflow
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <BarChartIcon color="primary" />
            <Typography variant="h6">Metriche Workflow</Typography>
            <Chip 
              label={autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'} 
              size="small" 
              color={autoRefresh ? 'success' : 'default'}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh manuale">
              <IconButton size="small" onClick={loadMetrics}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {metrics.totalCandidates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Candidati Totali
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {metrics.slaCompliance.overallCompliance}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SLA Compliance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="info.main" gutterBottom>
                  {metrics.timeToHire.average.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Giorni Media Hiring
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {metrics.bottlenecks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bottlenecks Rilevati
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Candidati per Fase */}
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
            <TimelineIcon fontSize="small" />
            Candidati per Fase
          </Typography>
          <Grid container spacing={1}>
            {phases.map(phase => {
              const count = metrics.candidatesByPhase[phase.id] || 0;
              const percentage = metrics.totalCandidates > 0 ? (count / metrics.totalCandidates) * 100 : 0;
              
              return (
                <Grid item xs={12} sm key={phase.id}>
                  <Box p={1} border="1px solid" borderColor="divider" borderRadius={1}>
                    <Typography variant="body2" fontWeight="bold" mb={0.5}>
                      {phase.name}
                    </Typography>
                    <Typography variant="h6" color={phase.color}>
                      {count}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage}
                      sx={{ 
                        mt: 0.5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: phase.color
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Collapse in={expanded}>
          <Box>
            {/* Tempi Medi per Fase */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                <ScheduleIcon fontSize="small" />
                Tempi Medi per Fase
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fase</TableCell>
                      <TableCell align="right">Tempo Medio</TableCell>
                      <TableCell align="right">SLA Compliance</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {phases.map(phase => {
                      const avgTime = metrics.averageTimePerPhase[phase.id] || 0;
                      const compliance = metrics.slaCompliance.phaseCompliance[phase.id] || 0;
                      
                      return (
                        <TableRow key={phase.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box width={8} height={8} borderRadius="50%" bgcolor={phase.color} />
                              {phase.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatTime(avgTime)}</TableCell>
                          <TableCell align="right">{compliance}%</TableCell>
                          <TableCell align="center">
                            {compliance >= 90 ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : compliance >= 70 ? (
                              <WarningIcon color="warning" fontSize="small" />
                            ) : (
                              <WarningIcon color="error" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Conversion Rates */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon fontSize="small" />
                Tassi di Conversione
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(metrics.conversionRates).map(([transition, rate]) => {
                  const [from, to] = transition.split('_to_');
                  const fromPhase = phases.find(p => p.id === from);
                  const toPhase = phases.find(p => p.id === to);
                  
                  return (
                    <Grid item xs={6} sm={4} md={3} key={transition}>
                      <Card variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {fromPhase?.name} → {toPhase?.name}
                        </Typography>
                        <Typography variant="h6" color={rate >= 80 ? 'success.main' : rate >= 60 ? 'warning.main' : 'error.main'}>
                          {rate.toFixed(1)}%
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* Bottlenecks */}
            {metrics.bottlenecks.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                  <WarningIcon fontSize="small" />
                  Bottlenecks Rilevati
                </Typography>
                {metrics.bottlenecks.map((bottleneck, index) => (
                  <Alert 
                    key={index} 
                    severity={bottleneck.riskLevel === 'high' ? 'error' : bottleneck.riskLevel === 'medium' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2">
                      {bottleneck.phaseName} - {bottleneck.candidatesInPhase} candidati
                    </Typography>
                    <Typography variant="body2">
                      Tempo medio: {formatTime(bottleneck.averageTime)} 
                      <Chip 
                        label={bottleneck.riskLevel.toUpperCase()} 
                        size="small" 
                        color={getRiskColor(bottleneck.riskLevel) as any}
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="caption">
                      Suggerimenti: {bottleneck.suggestions.join(', ')}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}

            {/* Time to Hire */}
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                📈 Time to Hire Analytics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} border="1px solid" borderColor="divider" borderRadius={1}>
                    <Typography variant="h5" color="primary">
                      {metrics.timeToHire.average.toFixed(1)}
                    </Typography>
                    <Typography variant="caption">Media (giorni)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} border="1px solid" borderColor="divider" borderRadius={1}>
                    <Typography variant="h5" color="info.main">
                      {metrics.timeToHire.median.toFixed(1)}
                    </Typography>
                    <Typography variant="caption">Mediana (giorni)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={2} border="1px solid" borderColor="divider" borderRadius={1}>
                    <Typography variant="h5" color="warning.main">
                      {metrics.timeToHire.p90.toFixed(1)}
                    </Typography>
                    <Typography variant="caption">90° Percentile</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WorkflowMetrics;