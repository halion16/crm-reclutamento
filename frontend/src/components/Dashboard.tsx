import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { 
  dashboardAPI,
  formatActivityDescription,
  getActivityIcon,
  handleDashboardApiError
} from '../services/dashboardAPI';
import type {
  DashboardStats,
  HRPerformance,
  UpcomingInterview,
  DashboardAlert
} from '../services/dashboardAPI';
import { toast } from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<HRPerformance[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, performanceRes, upcomingRes, alertsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getPerformance(),
        dashboardAPI.getUpcomingInterviews(),
        dashboardAPI.getAlerts()
      ]);

      if (statsRes.success) setStats(statsRes.data!);
      if (performanceRes.success) setPerformance(performanceRes.data!);
      if (upcomingRes.success) setUpcomingInterviews(upcomingRes.data!);
      if (alertsRes.success) setAlerts(alertsRes.data!);

    } catch (err) {
      const errorMessage = handleDashboardApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);


  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('it-IT');
    
    if (timeString) {
      const time = new Date(timeString);
      const timeStr = time.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr} ${timeStr}`;
    }
    
    return dateStr;
  };

  // Prepara dati per i grafici
  const candidatesByStatusData = stats ? Object.entries(stats.candidatesByStatus).map(([status, count]) => ({
    name: status,
    value: count,
    label: status === 'NEW' ? 'Nuovi' : 
           status === 'IN_PROCESS' ? 'In Processo' :
           status === 'HIRED' ? 'Assunti' :
           status === 'REJECTED' ? 'Scartati' : 
           status === 'WITHDRAWN' ? 'Ritirati' : status
  })) : [];

  const interviewsByPhaseData = stats ? Object.entries(stats.interviewsByPhase).map(([phase, count]) => ({
    name: phase.replace('phase_', 'Fase '),
    count
  })) : [];

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Dashboard CRM Reclutamento
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Caricamento dati dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDashboardData}>
            Riprova
          </Button>
        }>
          Errore nel caricamento dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard CRM Reclutamento
        </Typography>
        <IconButton onClick={loadDashboardData} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box mb={3}>
          <Grid container spacing={2}>
            {alerts.map((alert, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <Alert 
                  severity={alert.type}
                  action={
                    <Badge badgeContent={alert.count} color="error">
                      <Button color="inherit" size="small">
                        Visualizza
                      </Button>
                    </Badge>
                  }
                >
                  <Typography variant="body2" fontWeight="bold">
                    {alert.title}
                  </Typography>
                  <Typography variant="caption">
                    {alert.message}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4">
                        {stats?.totalCandidates || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Candidati Totali
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
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4">
                        {stats?.activeCandidates || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Candidati Attivi
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
                      <ScheduleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4">
                        {stats?.scheduledInterviews || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Colloqui Programmati
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
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4">
                        {stats?.completedInterviewsToday || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Colloqui Oggi
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Candidati per Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={candidatesByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {candidatesByStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Colloqui per Fase
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interviewsByPhaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Interviews */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prossimi Colloqui (7 giorni)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidato</TableCell>
                      <TableCell>Posizione</TableCell>
                      <TableCell>Data/Ora</TableCell>
                      <TableCell>Fase</TableCell>
                      <TableCell>Intervistatore</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingInterviews.slice(0, 5).map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {interview.candidate.firstName} {interview.candidate.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {interview.candidate.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {interview.candidate.positionApplied || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(interview.scheduledDate, interview.scheduledTime)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Fase ${interview.interviewPhase}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {interview.primaryInterviewer
                            ? `${interview.primaryInterviewer.firstName} ${interview.primaryInterviewer.lastName}`
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attività Recenti
              </Typography>
              <List>
                {stats?.recentActivity.slice(0, 8).map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '1rem' }}>
                          {getActivityIcon(activity.activityType)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {formatActivityDescription(activity)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {new Date(activity.performedAt).toLocaleString('it-IT')}
                            {activity.performedBy && 
                              ` • ${activity.performedBy.firstName} ${activity.performedBy.lastName}`
                            }
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* HR Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Team HR (Ultimi 30 giorni)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Ruolo</TableCell>
                      <TableCell>Candidati Creati</TableCell>
                      <TableCell>Colloqui Condotti</TableCell>
                      <TableCell>Esiti Positivi</TableCell>
                      <TableCell>Tasso Successo</TableCell>
                      <TableCell>Comunicazioni</TableCell>
                      <TableCell>Successo Comunicazioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performance.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                              {user.name.charAt(0)}
                            </Avatar>
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{user.stats.candidatesCreated}</TableCell>
                        <TableCell>{user.stats.interviewsConducted}</TableCell>
                        <TableCell>{user.stats.positiveOutcomes}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={user.stats.successRate}
                              sx={{ width: 60, mr: 1 }}
                            />
                            <Typography variant="body2">
                              {user.stats.successRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.stats.communicationsSent}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={user.stats.communicationSuccessRate}
                              sx={{ width: 60, mr: 1 }}
                            />
                            <Typography variant="body2">
                              {user.stats.communicationSuccessRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;