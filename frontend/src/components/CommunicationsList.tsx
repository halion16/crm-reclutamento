import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { communicationsAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';
import SimpleCommunicationPanel from './SimpleCommunicationPanel';

interface Communication {
  id: number;
  candidateId: number;
  interviewId?: number;
  communicationType: 'EMAIL' | 'SMS' | 'PHONE_CALL';
  subject?: string;
  messageContent?: string;
  deliveryStatus: string;
  errorMessage?: string;
  callOutcome?: string;
  createdAt: string;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
}

const CommunicationsList: React.FC = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    candidateId: '',
    type: ''
  });

  const [communicationPanel, setCommunicationPanel] = useState({
    open: false,
    candidateId: null as number | null
  });

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filters.candidateId) params.candidateId = parseInt(filters.candidateId);
      if (filters.type) params.type = filters.type;

      const response = await communicationsAPI.getAll(params);
      if (response.success) {
        setCommunications(response.data);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        toast.error('Errore nel caricamento delle comunicazioni');
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [page, filters]);

  const handleFilterChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <EmailIcon fontSize="small" color="primary" />;
      case 'SMS': return <SmsIcon fontSize="small" color="secondary" />;
      case 'PHONE_CALL': return <PhoneIcon fontSize="small" color="success" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'SENT': return 'info';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Comunicazioni
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCommunicationPanel({ open: true, candidateId: null })}
          >
            Nuova Comunicazione
          </Button>
          <IconButton onClick={fetchCommunications} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ID Candidato"
                type="number"
                value={filters.candidateId}
                onChange={handleFilterChange('candidateId')}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Comunicazione</InputLabel>
                <Select
                  value={filters.type}
                  label="Tipo Comunicazione"
                  onChange={handleFilterChange('type')}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="PHONE_CALL">Chiamata</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabella Comunicazioni */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Candidato</TableCell>
                  <TableCell>Oggetto/Contenuto</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Esito Chiamata</TableCell>
                  <TableCell>Data/Ora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Caricamento...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : communications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Nessuna comunicazione trovata
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  communications.map((communication) => (
                    <TableRow key={communication.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTypeIcon(communication.communicationType)}
                          <Typography variant="body2">
                            {communication.communicationType === 'EMAIL' ? 'Email' :
                             communication.communicationType === 'SMS' ? 'SMS' : 'Chiamata'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {communication.candidate.firstName} {communication.candidate.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {communication.candidateId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {communication.subject && (
                            <Typography variant="body2" fontWeight="bold">
                              {communication.subject}
                            </Typography>
                          )}
                          {communication.messageContent && (
                            <Typography variant="body2" color="textSecondary">
                              {communication.messageContent.length > 100 
                                ? `${communication.messageContent.substring(0, 100)}...`
                                : communication.messageContent}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={communication.deliveryStatus}
                          color={getStatusColor(communication.deliveryStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {communication.callOutcome && (
                          <Chip 
                            label={communication.callOutcome}
                            color={communication.callOutcome === 'ANSWERED' ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(communication.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <SimpleCommunicationPanel
        open={communicationPanel.open}
        onClose={() => setCommunicationPanel({ open: false, candidateId: null })}
        candidateId={communicationPanel.candidateId}
        onSuccess={fetchCommunications}
      />
    </Box>
  );
};

export default CommunicationsList;