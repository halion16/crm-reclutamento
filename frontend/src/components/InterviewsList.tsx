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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Rating,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  AssignmentTurnedIn as OutcomeIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import type { 
  Interview, 
  InterviewStatus,
  InterviewOutcome,
  InterviewFilters
} from '../types';
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_OUTCOME_LABELS,
  INTERVIEW_TYPE_LABELS
} from '../types';
import { interviewsAPI, handleApiError } from '../services/api';
import InterviewOutcomeDialog from './InterviewOutcomeDialog';
import InterviewForm from './InterviewForm';
import BasicAdvancedPanel from './communication/BasicAdvancedPanel';

interface InterviewsListProps {
  refreshTrigger: number;
  candidateId?: number;
}

const InterviewsList: React.FC<InterviewsListProps> = ({
  refreshTrigger,
  candidateId
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  // Filters
  const [filters, setFilters] = useState<InterviewFilters>({
    status: undefined,
    candidateId: candidateId
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Outcome dialog
  const [outcomeDialog, setOutcomeDialog] = useState<{
    open: boolean;
    interview: Interview | null;
  }>({ open: false, interview: null });

  // Interview form dialog
  const [interviewForm, setInterviewForm] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view';
    interview: Interview | null;
  }>({ open: false, mode: 'create', interview: null });

  // Communication panel dialog
  const [communicationPanel, setCommunicationPanel] = useState<{
    open: boolean;
    candidateId: number | null;
    candidateName: string;
  }>({ open: false, candidateId: null, candidateName: '' });

  // Template per comunicazioni colloquio
  const interviewTemplates = [
    {
      id: 1,
      name: 'Conferma Colloquio',
      type: 'EMAIL' as const,
      subject: 'Conferma colloquio programmato',
      content: 'Gentile candidato, la confermiamo che il colloquio è programmato per domani alle 09:00.',
      category: 'Colloqui'
    },
    {
      id: 2,
      name: 'Reminder Colloquio',
      type: 'SMS' as const,
      content: 'Ricordati del colloquio di domani alle ore 9:00!',
      category: 'Promemoria'
    },
    {
      id: 3,
      name: 'Ringraziamento Post-Colloquio',
      type: 'EMAIL' as const, 
      subject: 'Grazie per il colloquio',
      content: 'La ringraziamo per il tempo dedicato al colloquio di oggi.',
      category: 'Follow-up'
    }
  ];

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await interviewsAPI.getAll({
        page,
        limit,
        search: debouncedSearchTerm || undefined,
        ...filters
      });
      
      if (response.success) {
        setInterviews(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      } else {
        setError('Errore nel caricamento colloqui');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchInterviews();
  }, [page, filters, debouncedSearchTerm, refreshTrigger]);

  useEffect(() => {
    if (candidateId) {
      setFilters(prev => ({ ...prev, candidateId }));
    }
  }, [candidateId]);

  const handleFilterChange = (field: keyof InterviewFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleAdd = () => {
    setInterviewForm({ open: true, mode: 'create', interview: null });
  };

  const handleEdit = (interview: Interview) => {
    setInterviewForm({ open: true, mode: 'edit', interview });
  };

  const handleFormClose = () => {
    setInterviewForm({ open: false, mode: 'create', interview: null });
  };

  const handleFormSuccess = () => {
    fetchInterviews();
  };

  const handleSendCommunication = (interview: Interview) => {
    setCommunicationPanel({
      open: true,
      candidateId: interview.candidateId,
      candidateName: interview.candidate ? 
        `${interview.candidate.firstName} ${interview.candidate.lastName}` : 
        'Candidato'
    });
  };

  const getStatusColor = (status: InterviewStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'RESCHEDULED': return 'info';
      default: return 'default';
    }
  };

  const getOutcomeColor = (outcome?: InterviewOutcome): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (!outcome) return 'default';
    switch (outcome) {
      case 'POSITIVE': return 'success';
      case 'NEGATIVE': return 'error';
      case 'CANDIDATE_DECLINED': return 'warning';
      case 'TO_RESCHEDULE': return 'info';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date) return '-';
    
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('it-IT');
    
    if (time) {
      const timeObj = new Date(time);
      const timeStr = timeObj.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr} ${timeStr}`;
    }
    
    return dateStr;
  };

  const getPhaseIcon = (phase: number) => {
    return (
      <Chip
        label={`Fase ${phase}`}
        size="small"
        variant="outlined"
        color={phase === 1 ? 'primary' : phase === 2 ? 'secondary' : 'default'}
      />
    );
  };

  const canRecordOutcome = (interview: Interview) => {
    return interview.status === 'SCHEDULED' || interview.status === 'COMPLETED';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Caricamento colloqui...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              {candidateId ? 'Colloqui del Candidato' : `Lista Colloqui (${total})`}
            </Typography>
            {!candidateId && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Programma Colloquio
              </Button>
            )}
          </Box>

          {/* Filtri */}
          {!candidateId && (
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Cerca candidati..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
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
                  {Object.entries(INTERVIEW_STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {error && (
            <Box mb={2}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {/* Tabella colloqui */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {!candidateId && <TableCell>Candidato</TableCell>}
                  <TableCell>Fase</TableCell>
                  <TableCell>Data/Ora</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Intervistatore</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Esito</TableCell>
                  <TableCell>Valutazione</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id} hover>
                    {!candidateId && (
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {interview.candidate?.firstName} {interview.candidate?.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {interview.candidate?.positionApplied || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      {getPhaseIcon(interview.interviewPhase)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(interview.scheduledDate, interview.scheduledTime)}
                      </Typography>
                      {interview.durationMinutes && (
                        <Typography variant="caption" color="textSecondary">
                          {interview.durationMinutes} min
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {interview.interviewType === 'VIDEO_CALL' && <VideoCallIcon fontSize="small" />}
                        {interview.interviewType === 'IN_PERSON' && <LocationIcon fontSize="small" />}
                        {interview.interviewType === 'PHONE' && <PersonIcon fontSize="small" />}
                        <Typography variant="body2">
                          {INTERVIEW_TYPE_LABELS[interview.interviewType]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {interview.primaryInterviewer 
                          ? `${interview.primaryInterviewer.firstName} ${interview.primaryInterviewer.lastName}`
                          : '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={INTERVIEW_STATUS_LABELS[interview.status]}
                        color={getStatusColor(interview.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {interview.outcome ? (
                        <Chip
                          label={INTERVIEW_OUTCOME_LABELS[interview.outcome]}
                          color={getOutcomeColor(interview.outcome)}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Non valutato"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {interview.overallRating ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating
                            value={interview.overallRating}
                            max={10}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2">
                            {interview.overallRating}/10
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1}>
                        <Tooltip title="Invia Comunicazione">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleSendCommunication(interview)}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(interview)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {canRecordOutcome(interview) && (
                          <Tooltip title="Registra Esito">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setOutcomeDialog({
                                open: true,
                                interview
                              })}
                            >
                              <OutcomeIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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
        </CardContent>
      </Card>

      {/* Dialog per registrazione esito */}
      <InterviewOutcomeDialog
        open={outcomeDialog.open}
        interview={outcomeDialog.interview}
        onClose={() => setOutcomeDialog({ open: false, interview: null })}
        onSuccess={() => {
          fetchInterviews();
          setOutcomeDialog({ open: false, interview: null });
        }}
      />

      {/* Interview Form */}
      <InterviewForm
        open={interviewForm.open}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        interview={interviewForm.interview}
        mode={interviewForm.mode}
        onCommunicationRequest={(candidateId) => {
          // Chiude il form e apre il pannello comunicazioni
          setInterviewForm({ open: false, mode: 'create', interview: null });
          // Usa i dati demo candidati
          const demoCandidates = [
            { id: 1, firstName: 'Marco', lastName: 'Rossi' },
            { id: 2, firstName: 'Laura', lastName: 'Bianchi' },
            { id: 3, firstName: 'Giuseppe', lastName: 'Verdi' },
            { id: 4, firstName: 'Anna', lastName: 'Neri' }
          ];
          const candidate = demoCandidates.find(c => c.id === candidateId);
          setCommunicationPanel({
            open: true,
            candidateId,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidato'
          });
        }}
      />

      {/* Communication Panel */}
      {communicationPanel.candidateId && (
        <BasicAdvancedPanel
          open={communicationPanel.open}
          onClose={() => setCommunicationPanel({ open: false, candidateId: null, candidateName: '' })}
          onSuccess={() => {
            setCommunicationPanel({ open: false, candidateId: null, candidateName: '' });
            // Non serve refreshare interviews, solo comunicazioni
          }}
          templates={interviewTemplates}
          preSelectedCandidates={[communicationPanel.candidateId]}
        />
      )}
    </>
  );
};

export default InterviewsList;