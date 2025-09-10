import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Send as SendIcon,
  Assignment as InterviewHistoryIcon
} from '@mui/icons-material';
import type { 
  Candidate, 
  CandidateStatus, 
  CandidateFilters 
} from '../types';
import {
  CANDIDATE_STATUS_LABELS
} from '../types';
import { candidatesAPI, handleApiError } from '../services/api';
import CandidateForm from './CandidateForm';
import CandidateInterviewsModal from './CandidateInterviewsModal';
import { toast } from 'react-hot-toast';

interface CandidatesListProps {
  refreshTrigger: number;
  onScheduleInterview?: (candidateId: number) => void;
  onSendCommunication?: (candidateId: number, candidateName: string) => void;
  onViewInterviews?: (candidateId: number, candidate: Candidate) => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({ 
  refreshTrigger,
  onScheduleInterview,
  onSendCommunication,
  onViewInterviews
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  // Filters
  const [filters, setFilters] = useState<CandidateFilters>({
    search: '',
    status: undefined
  });
  
  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    candidate: Candidate | null;
  }>({ open: false, candidate: null });

  // Candidate form dialog
  const [candidateForm, setCandidateForm] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view';
    candidate: Candidate | null;
  }>({ open: false, mode: 'create', candidate: null });

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await candidatesAPI.getAll({
        page,
        limit,
        ...filters
      });
      
      if (response.success) {
        setCandidates(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      } else {
        setError('Errore nel caricamento candidati');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, filters, refreshTrigger]);

  const handleSearch = () => {
    setPage(1);
    fetchCandidates();
  };

  const handleFilterChange = (field: keyof CandidateFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setPage(1);
  };

  const handleAdd = () => {
    setCandidateForm({ open: true, mode: 'create', candidate: null });
  };

  const handleEdit = (candidate: Candidate) => {
    setCandidateForm({ open: true, mode: 'edit', candidate });
  };

  const handleView = (candidateId: number) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setCandidateForm({ open: true, mode: 'view', candidate });
    }
  };

  const handleFormClose = () => {
    setCandidateForm({ open: false, mode: 'create', candidate: null });
  };

  const handleFormSuccess = () => {
    fetchCandidates();
  };

  const handleDelete = async () => {
    if (!deleteDialog.candidate) return;
    
    try {
      const response = await candidatesAPI.delete(deleteDialog.candidate.id);
      if (response.success) {
        toast.success('Candidato eliminato con successo');
        setDeleteDialog({ open: false, candidate: null });
        fetchCandidates();
      } else {
        toast.error(response.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const getStatusColor = (status: CandidateStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'NEW': return 'primary';
      case 'IN_PROCESS': return 'warning';
      case 'HIRED': return 'success';
      case 'REJECTED': return 'error';
      case 'WITHDRAWN': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Caricamento candidati...</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Lista Candidati ({total})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Nuovo Candidato
          </Button>
        </Box>

        {/* Filtri */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            label="Cerca candidati"
            variant="outlined"
            size="small"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSearch} size="small">
                  <SearchIcon />
                </IconButton>
              )
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              {Object.entries(CANDIDATE_STATUS_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Box mb={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Tabella candidati */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Posizione</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Candidatura</TableCell>
                <TableCell>Colloqui</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {candidate.firstName} {candidate.lastName}
                      </Typography>
                      {candidate.mobile && (
                        <Typography variant="caption" color="textSecondary">
                          {candidate.mobile}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" color="action" />
                      {candidate.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {candidate.positionApplied || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CANDIDATE_STATUS_LABELS[candidate.currentStatus]}
                      color={getStatusColor(candidate.currentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(candidate.applicationDate)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${candidate.interviews?.length || 0} colloqui`}
                        variant="outlined"
                        size="small"
                        color={candidate.interviews?.length ? "primary" : "default"}
                      />
                      {onScheduleInterview && (
                        <Tooltip title="Programma Colloquio">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onScheduleInterview(candidate.id)}
                          >
                            <CalendarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1}>
                      {onSendCommunication && (
                        <Tooltip title="Invia Comunicazione">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => onSendCommunication(candidate.id, `${candidate.firstName} ${candidate.lastName}`)}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onViewInterviews && (
                        <Tooltip title="Storico Colloqui">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => onViewInterviews(candidate.id, candidate)}
                          >
                            <InterviewHistoryIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Visualizza">
                        <IconButton
                          size="small"
                          onClick={() => handleView(candidate.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(candidate)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ 
                            open: true, 
                            candidate 
                          })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginazione */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Dialog conferma eliminazione */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, candidate: null })}
        >
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sei sicuro di voler eliminare il candidato{' '}
              <strong>
                {deleteDialog.candidate?.firstName} {deleteDialog.candidate?.lastName}
              </strong>
              ? Questa azione non può essere annullata.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, candidate: null })}
            >
              Annulla
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
            >
              Elimina
            </Button>
          </DialogActions>
        </Dialog>

        {/* Candidate Form */}
        <CandidateForm
          open={candidateForm.open}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          candidate={candidateForm.candidate}
          mode={candidateForm.mode}
        />
      </CardContent>
    </Card>
  );
};

export default CandidatesList;