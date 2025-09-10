import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import type { ReportComponent, ComponentConfig, ReportFilter } from '../../services/reportsApi';

interface ReportPreviewProps {
  open: boolean;
  components: ReportComponent[];
  reportName?: string;
  onClose: () => void;
}

const COLORS = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f'];

const ReportPreview: React.FC<ReportPreviewProps> = ({
  open,
  components,
  reportName = 'Anteprima Report',
  onClose
}) => {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && components.length > 0) {
      loadData();
    }
  }, [open, components]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data generation based on component configuration
      const mockData: Record<string, any> = {};
      
      for (const component of components) {
        mockData[component.id] = await generateMockData(component);
      }
      
      setData(mockData);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
    setLoading(false);
  };

  const generateMockData = async (component: ReportComponent) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    switch (component.config.dataSource) {
      case 'candidates':
        return generateCandidateData(component);
      case 'interviews':
        return generateInterviewData(component);
      case 'communications':
        return generateCommunicationData(component);
      default:
        return [];
    }
  };

  const generateCandidateData = (component: ReportComponent) => {
    if (component.type === 'metric') {
      return { value: 156, label: 'Totale Candidati' };
    }

    if (component.config.groupBy === 'status') {
      return [
        { name: 'In Valutazione', value: 45, count: 45 },
        { name: 'Colloquio', value: 32, count: 32 },
        { name: 'Assunti', value: 23, count: 23 },
        { name: 'Rifiutati', value: 56, count: 56 }
      ];
    }

    if (component.config.groupBy === 'positionApplied') {
      return [
        { name: 'Developer', value: 67, count: 67 },
        { name: 'Designer', value: 34, count: 34 },
        { name: 'Manager', value: 28, count: 28 },
        { name: 'Analyst', value: 27, count: 27 }
      ];
    }

    if (component.type === 'table') {
      return [
        { 
          id: 1, 
          name: 'Marco Rossi', 
          position: 'Full Stack Developer',
          status: 'In Valutazione',
          date: '2024-01-15',
          experience: '3 anni'
        },
        { 
          id: 2, 
          name: 'Laura Bianchi', 
          position: 'UX Designer',
          status: 'Colloquio',
          date: '2024-01-14',
          experience: '5 anni'
        },
        { 
          id: 3, 
          name: 'Giuseppe Verdi', 
          position: 'Project Manager',
          status: 'Assunto',
          date: '2024-01-13',
          experience: '7 anni'
        }
      ];
    }

    return [];
  };

  const generateInterviewData = (component: ReportComponent) => {
    if (component.type === 'metric') {
      return { value: 89, label: 'Colloqui Totali' };
    }

    if (component.config.groupBy === 'status') {
      return [
        { name: 'Programmati', value: 34, count: 34 },
        { name: 'Completati', value: 45, count: 45 },
        { name: 'Annullati', value: 10, count: 10 }
      ];
    }

    if (component.type === 'table') {
      return [
        {
          id: 1,
          candidate: 'Marco Rossi',
          interviewer: 'Anna Verdi',
          date: '2024-01-16',
          time: '14:00',
          type: 'Tecnico',
          status: 'Programmato'
        },
        {
          id: 2,
          candidate: 'Laura Bianchi',
          interviewer: 'Paolo Neri',
          date: '2024-01-15',
          time: '10:30',
          type: 'HR',
          status: 'Completato'
        }
      ];
    }

    return [];
  };

  const generateCommunicationData = (component: ReportComponent) => {
    if (component.type === 'metric') {
      return { value: 234, label: 'Comunicazioni Inviate' };
    }

    return [
      { name: 'Email', value: 145, count: 145 },
      { name: 'SMS', value: 67, count: 67 },
      { name: 'Chiamate', value: 22, count: 22 }
    ];
  };

  const renderComponent = (component: ReportComponent) => {
    const componentData = data[component.id];
    
    if (!componentData) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      );
    }

    switch (component.type) {
      case 'metric':
        return (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h2" color="primary" fontWeight="bold">
                {componentData.value}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {componentData.label}
              </Typography>
            </CardContent>
          </Card>
        );

      case 'chart':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {component.title}
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  {component.config.chartType === 'bar' ? (
                    <BarChart data={componentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  ) : component.config.chartType === 'line' ? (
                    <LineChart data={componentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <AreaChart data={componentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="count" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        );

      case 'pie-chart':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {component.title}
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={componentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {componentData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {component.title}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(componentData[0] || {}).map((key) => (
                        <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {componentData.slice(0, component.config.limit || 10).map((row: any, index: number) => (
                      <TableRow key={index}>
                        {Object.values(row).map((cell: any, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Alert severity="warning">
            Tipo di componente non supportato: {component.type}
          </Alert>
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        🔍 Anteprima Report: {reportName}
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={60} />
            <Typography variant="h6" ml={2}>
              Caricamento dati del report...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {components.map((component) => (
              <Grid 
                item 
                xs={12} 
                md={component.type === 'metric' ? 6 : 12}
                lg={component.type === 'metric' ? 4 : component.type === 'table' ? 12 : 6}
                key={component.id}
              >
                {renderComponent(component)}
              </Grid>
            ))}
          </Grid>
        )}
        
        {!loading && components.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="textSecondary">
              Nessun componente da visualizzare
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Aggiungi componenti al report per vedere l'anteprima
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Chiudi Anteprima
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportPreview;