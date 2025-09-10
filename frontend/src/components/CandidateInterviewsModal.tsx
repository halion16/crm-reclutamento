import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Rating,
  Paper,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import type { Interview, Candidate } from '../types';

interface CandidateInterviewsModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  interviews?: Interview[];
  loading?: boolean;
}

const CandidateInterviewsModal: React.FC<CandidateInterviewsModalProps> = ({
  open,
  onClose,
  candidate,
  interviews = [],
  loading = false
}) => {
  
  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_CALL':
        return <VideoCallIcon fontSize="small" color="primary" />;
      case 'IN_PERSON':
        return <LocationIcon fontSize="small" color="success" />;
      case 'PHONE':
        return <PhoneIcon fontSize="small" color="secondary" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'RESCHEDULED': return 'info';
      default: return 'default';
    }
  };

  const getOutcomeColor = (outcome?: string): 'default' | 'success' | 'error' | 'warning' | 'info' => {
    if (!outcome) return 'default';
    switch (outcome) {
      case 'POSITIVE': return 'success';
      case 'NEGATIVE': return 'error';
      case 'CANDIDATE_DECLINED': return 'warning';
      case 'TO_RESCHEDULE': return 'info';
      default: return 'default';
    }
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date) return 'Data non specificata';
    
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (time) {
      const timeObj = new Date(time);
      const timeStr = timeObj.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr} alle ${timeStr}`;
    }
    
    return dateStr;
  };

  const renderInterviewCard = (interview: Interview) => (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        width: '100%',
        minWidth: 0, // Consente al contenuto di ridursi
        '&:hover': { 
          boxShadow: 4,
          borderColor: 'primary.main'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header con Fase e Status */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={1}
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip 
              label={`Fase ${interview.interviewPhase}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={interview.status}
              color={getStatusColor(interview.status)}
              size="small"
            />
          </Box>
          {interview.outcome && (
            <Chip 
              label={interview.outcome}
              color={getOutcomeColor(interview.outcome)}
              size="small"
              sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
            />
          )}
        </Box>

        {/* Dettagli Colloquio - Layout responsive */}
        <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
          {/* Data e Ora */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <CalendarIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
            <Box>
              <Typography variant="body2" fontWeight="medium" color="text.primary">
                {formatDateTime(interview.scheduledDate, interview.scheduledTime)}
              </Typography>
            </Box>
          </Box>

          {/* Tipo e Durata */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            {getInterviewTypeIcon(interview.interviewType)}
            <Box>
              <Typography variant="body2" color="text.primary">
                {interview.interviewType === 'VIDEO_CALL' ? 'Video chiamata' : 
                 interview.interviewType === 'IN_PERSON' ? 'Di persona' : 'Telefonico'}
              </Typography>
              {interview.durationMinutes && (
                <Typography variant="caption" color="text.secondary">
                  Durata: {interview.durationMinutes} minuti
                </Typography>
              )}
            </Box>
          </Box>

          {/* Location/Link */}
          {(interview.location || interview.meetingUrl) && (
            <Box display="flex" alignItems="flex-start" gap={1}>
              <LocationIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%'
                }}
                color="text.primary"
              >
                {interview.location || interview.meetingUrl}
              </Typography>
            </Box>
          )}

          {/* Intervistatore */}
          {interview.primaryInterviewer && (
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 24, height: 24 }}>
                {interview.primaryInterviewer.firstName.charAt(0)}
              </Avatar>
              <Typography variant="body2" color="text.primary">
                <strong>Intervistatore:</strong> {interview.primaryInterviewer.firstName} {interview.primaryInterviewer.lastName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Valutazioni */}
        {interview.status === 'COMPLETED' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
              📊 Valutazioni
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {interview.technicalRating && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.primary">
                      Competenze Tecniche
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      {interview.technicalRating}/10
                    </Typography>
                  </Box>
                  <Rating 
                    value={interview.technicalRating} 
                    max={10} 
                    size="small" 
                    readOnly 
                    sx={{ display: 'flex' }}
                  />
                </Box>
              )}
              
              {interview.softSkillsRating && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.primary">
                      Soft Skills
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      {interview.softSkillsRating}/10
                    </Typography>
                  </Box>
                  <Rating 
                    value={interview.softSkillsRating} 
                    max={10} 
                    size="small" 
                    readOnly 
                    sx={{ display: 'flex' }}
                  />
                </Box>
              )}
              
              {interview.overallRating && (
                <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                      Valutazione Complessiva
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {interview.overallRating}/10
                    </Typography>
                  </Box>
                  <Rating 
                    value={interview.overallRating} 
                    max={10} 
                    size="medium" 
                    readOnly 
                    sx={{ display: 'flex' }}
                  />
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Note */}
        {interview.interviewerNotes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="start" gap={1}>
              <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5, flexShrink: 0 }} />
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                  💬 Note dell'Intervistatore
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {interview.interviewerNotes}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderTimelineView = () => {
    if (!interviews.length) {
      return (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <CalendarIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Nessun Colloquio Programmato
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Non sono ancora stati programmati colloqui per questo candidato.
          </Typography>
        </Paper>
      );
    }

    const sortedInterviews = [...interviews].sort((a, b) => a.interviewPhase - b.interviewPhase);

    return (
      <Timeline position="right" sx={{ p: 0 }}>
        {sortedInterviews.map((interview, index) => (
          <TimelineItem key={interview.id || index} sx={{ minHeight: 'auto' }}>
            <TimelineSeparator sx={{ pt: 2 }}>
              <TimelineDot 
                color={interview.status === 'COMPLETED' ? 'success' : 'primary'}
                variant={interview.status === 'COMPLETED' ? 'filled' : 'outlined'}
                sx={{ minWidth: 32, minHeight: 32 }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {interview.interviewPhase}
                </Typography>
              </TimelineDot>
              {index < sortedInterviews.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ pb: 0, pr: 0, pl: 2 }}>
              {renderInterviewCard(interview)}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          height: { xs: '90vh', sm: '80vh' },
          maxHeight: '90vh',
          m: { xs: 1, sm: 2 }
        }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6">
            📋 Storico Colloqui
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidato'}
            {candidate?.positionApplied && ` - ${candidate.positionApplied}`}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Caricamento colloqui...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {/* Stats Header */}
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={1}
              mb={3}
              flexWrap="wrap"
            >
              <Chip 
                label={`${interviews.length} Colloqui Totali`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${interviews.filter(i => i.status === 'COMPLETED').length} Completati`}
                color="success"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${interviews.filter(i => i.outcome === 'POSITIVE').length} Positivi`}
                color="success"
                size="small"
              />
            </Box>

            {/* Timeline */}
            <Box sx={{ overflowX: 'hidden' }}>
              {renderTimelineView()}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateInterviewsModal;