import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Badge,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { useWorkflowEvents } from '../../hooks/useWorkflowEvents';
import WorkflowTestPanel from './WorkflowTestPanel';
import WorkflowMetrics from './WorkflowMetrics';
import WorkflowStatus from './WorkflowStatus';

// Types
interface KanbanColumn {
  id: string;
  title: string;
  phaseId: string;
  color: string;
  candidates: KanbanCandidate[];
  maxItems?: number;
  slaWarningHours?: number;
}

interface KanbanCandidate {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  position: string;
  avatar?: string;
  currentPhase: string;
  status: 'active' | 'completed' | 'rejected' | 'withdrawn' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  aiScore?: number;
  daysInPhase: number;
  nextAction?: NextAction;
  flags: CandidateFlag[];
  timeline: PhaseHistoryEntry[];
}

interface NextAction {
  type: 'schedule_interview' | 'send_assessment' | 'review_feedback' | 'make_decision' | 'send_offer';
  description: string;
  dueDate?: Date;
  assignedTo?: string;
  automated?: boolean;
}

interface CandidateFlag {
  type: 'urgent' | 'sla_warning' | 'missing_documents' | 'high_potential' | 'at_risk';
  message: string;
  severity: 'info' | 'warning' | 'error';
  createdAt: Date;
}

interface PhaseHistoryEntry {
  phaseId: string;
  phaseName: string;
  enteredAt: Date;
  exitedAt?: Date;
  decision: 'passed' | 'failed' | 'pending' | 'skipped';
  score?: number;
  notes?: string;
  interviewerId?: string;
  duration?: number;
  automatedTransition: boolean;
  nextPhase?: string;
}

interface MoveDialogData {
  candidate: KanbanCandidate;
  fromPhase: string;
  toPhase: string;
}

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<KanbanCandidate | null>(null);
  const [candidateMenuAnchor, setCandidateMenuAnchor] = useState<null | HTMLElement>(null);
  const [moveDialog, setMoveDialog] = useState<MoveDialogData | null>(null);
  const [moveNotes, setMoveNotes] = useState('');
  const [moveScore, setMoveScore] = useState<number | ''>('');
  const [moveDecision, setMoveDecision] = useState<'passed' | 'failed' | ''>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Setup real-time events
  const { isConnected } = useWorkflowEvents({
    onCandidateMoved: (event) => {
      console.log('Real-time: Candidate moved', event);
      // Ricarica il board quando un candidato viene spostato
      loadKanbanData();
      toast.success(`Candidato spostato in ${event.data?.toPhase || 'nuova fase'}`);
    },
    onSlaWarning: (event) => {
      toast.error(`⚠️ Avviso SLA per candidato ${event.candidateId}`);
    },
    onBottleneckDetected: (event) => {
      toast.error(`🚧 Collo di bottiglia rilevato in fase ${event.phaseId}`);
    }
  });

  useEffect(() => {
    loadKanbanData();
  }, []);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflow/kanban');
      if (!response.ok) {
        throw new Error('Failed to load kanban data');
      }
      const data = await response.json();
      setColumns(data);
    } catch (error) {
      console.error('Error loading kanban data:', error);
      toast.error('Errore nel caricamento del workflow');
      // Fallback con dati mock
      setColumns(getMockColumns());
    } finally {
      setLoading(false);
    }
  };

  const getMockColumns = (): KanbanColumn[] => [
    {
      id: 'cv_review',
      title: 'CV Review',
      phaseId: 'cv_review',
      color: '#2196F3',
      candidates: [
        {
          id: 'cs-1',
          candidateId: 'cand-1',
          name: 'Marco Rossi',
          email: 'marco.rossi@example.com',
          position: 'Frontend Developer',
          currentPhase: 'cv_review',
          status: 'active',
          priority: 'high',
          aiScore: 88,
          daysInPhase: 2,
          nextAction: {
            type: 'review_feedback',
            description: 'Rivedi CV e prendi decisione'
          },
          flags: [
            {
              type: 'urgent',
              message: 'Candidato prioritario',
              severity: 'info',
              createdAt: new Date()
            }
          ],
          timeline: []
        }
      ]
    },
    {
      id: 'phone_screening',
      title: 'Phone Screening',
      phaseId: 'phone_screening',
      color: '#FF9800',
      candidates: [
        {
          id: 'cs-2',
          candidateId: 'cand-2',
          name: 'Sara Colombo',
          email: 'sara.colombo@example.com',
          position: 'Backend Developer',
          currentPhase: 'phone_screening',
          status: 'active',
          priority: 'medium',
          aiScore: 82,
          daysInPhase: 3,
          nextAction: {
            type: 'schedule_interview',
            description: 'Programma screening telefonico',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          },
          flags: [],
          timeline: []
        }
      ]
    },
    {
      id: 'technical_interview',
      title: 'Technical Interview',
      phaseId: 'technical_interview',
      color: '#9C27B0',
      candidates: [
        {
          id: 'cs-3',
          candidateId: 'cand-3',
          name: 'Andrea Ferrari',
          email: 'andrea.ferrari@example.com',
          position: 'Full Stack Developer',
          currentPhase: 'technical_interview',
          status: 'active',
          priority: 'low',
          aiScore: 91,
          daysInPhase: 5,
          nextAction: {
            type: 'schedule_interview',
            description: 'Programma colloquio tecnico'
          },
          flags: [
            {
              type: 'high_potential',
              message: 'Score AI elevato (91)',
              severity: 'info',
              createdAt: new Date()
            }
          ],
          timeline: []
        }
      ]
    },
    {
      id: 'cultural_fit',
      title: 'Cultural Fit',
      phaseId: 'cultural_fit',
      color: '#4CAF50',
      candidates: []
    },
    {
      id: 'final_decision',
      title: 'Final Decision',
      phaseId: 'final_decision',
      color: '#E91E63',
      candidates: []
    }
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Trova colonna sorgente e candidato
    let sourceColumn: KanbanColumn | undefined;
    let candidate: KanbanCandidate | undefined;

    for (const col of columns) {
      const found = col.candidates.find(c => c.id === activeId);
      if (found) {
        sourceColumn = col;
        candidate = found;
        break;
      }
    }

    if (!candidate || !sourceColumn) return;

    // Se dropped sulla stessa colonna, non fare nulla
    if (sourceColumn.id === overId) return;

    // Trova colonna di destinazione
    const destColumn = columns.find(col => col.id === overId);
    if (!destColumn) return;

    // Movimento tra colonne - mostra dialog di conferma
    setMoveDialog({
      candidate,
      fromPhase: sourceColumn.id,
      toPhase: destColumn.id
    });
  };

  const handleMoveCandidate = async () => {
    if (!moveDialog) return;

    try {
      const response = await fetch('/api/workflow/move-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId: moveDialog.candidate.candidateId,
          fromPhase: moveDialog.fromPhase,
          toPhase: moveDialog.toPhase,
          decision: moveDecision,
          notes: moveNotes,
          score: moveScore ? Number(moveScore) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to move candidate');
      }

      // Aggiorna il board
      await loadKanbanData();
      
      toast.success(`${moveDialog.candidate.name} spostato con successo`);
      setMoveDialog(null);
      setMoveNotes('');
      setMoveScore('');
      setMoveDecision('');
    } catch (error) {
      console.error('Error moving candidate:', error);
      toast.error('Errore nello spostamento del candidato');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getFlagIcon = (flagType: string) => {
    switch (flagType) {
      case 'urgent': return <StarIcon fontSize="small" />;
      case 'sla_warning': return <WarningIcon fontSize="small" />;
      case 'high_potential': return <TrendingUpIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  const SortableCandidateCard: React.FC<{ candidate: KanbanCandidate }> = ({ candidate }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: candidate.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          cursor: 'grab',
          opacity: isDragging ? 0.8 : 1,
          boxShadow: isDragging ? 3 : 1,
          '&:hover': {
            boxShadow: 2
          }
        }}
      >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {candidate.avatar ? (
                    <img src={candidate.avatar} alt={candidate.name} />
                  ) : (
                    candidate.name.charAt(0)
                  )}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {candidate.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {candidate.position}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  setSelectedCandidate(candidate);
                  setCandidateMenuAnchor(e.currentTarget);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* AI Score */}
            {candidate.aiScore && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="caption">AI Score:</Typography>
                <Chip 
                  size="small" 
                  label={candidate.aiScore}
                  color={candidate.aiScore >= 85 ? 'success' : candidate.aiScore >= 70 ? 'warning' : 'default'}
                />
              </Box>
            )}

            {/* Priority */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip
                size="small"
                label={candidate.priority}
                color={getPriorityColor(candidate.priority) as any}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {candidate.daysInPhase} giorni in fase
              </Typography>
            </Box>

            {/* Flags */}
            {candidate.flags.length > 0 && (
              <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                {candidate.flags.map((flag, index) => (
                  <Tooltip key={index} title={flag.message}>
                    <Chip
                      size="small"
                      icon={getFlagIcon(flag.type)}
                      label={flag.type.replace('_', ' ')}
                      color={flag.severity === 'error' ? 'error' : flag.severity === 'warning' ? 'warning' : 'info'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}

            {/* Next Action */}
            {candidate.nextAction && (
              <Alert 
                severity="info" 
                sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}
              >
                <Typography variant="caption">
                  {candidate.nextAction.description}
                </Typography>
                {candidate.nextAction.dueDate && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Scadenza: {new Date(candidate.nextAction.dueDate).toLocaleDateString()}
                  </Typography>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
    );
  };

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" mt={2}>Caricamento workflow...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Workflow Colloqui
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gestisci il processo di reclutamento con drag & drop
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            width={8}
            height={8}
            borderRadius="50%"
            bgcolor={isConnected ? 'success.main' : 'error.main'}
            sx={{ animation: isConnected ? 'none' : 'pulse 1s infinite' }}
          />
          <Typography variant="caption" color="text.secondary">
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </Typography>
        </Box>
      </Box>

      {/* Status Real-time */}
      <WorkflowStatus />

      {/* Pannello Test per sviluppo */}
      <WorkflowTestPanel onRefreshBoard={loadKanbanData} />

      {/* Metriche Workflow */}
      <Box mb={3}>
        <WorkflowMetrics />
      </Box>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={2}>
          {columns.map(column => (
            <Grid item xs={12} sm={6} md key={column.id}>
              <Card 
                id={column.id}
                sx={{ 
                  height: '100%', 
                  minHeight: 600,
                  border: '2px dashed transparent',
                  '&:hover': {
                    borderColor: 'action.hover'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        width={12}
                        height={12}
                        borderRadius="50%"
                        bgcolor={column.color}
                      />
                      <Typography variant="h6">{column.title}</Typography>
                      <Badge badgeContent={column.candidates.length} color="primary" />
                    </Box>
                  </Box>

                  <SortableContext
                    items={column.candidates.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Box
                      sx={{
                        minHeight: 400,
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      {column.candidates.map((candidate) => (
                        <SortableCandidateCard
                          key={candidate.id}
                          candidate={candidate}
                        />
                      ))}
                      
                      {column.candidates.length === 0 && (
                        <Box
                          textAlign="center"
                          py={4}
                          color="text.secondary"
                          sx={{ fontStyle: 'italic' }}
                        >
                          Nessun candidato in questa fase
                        </Box>
                      )}
                    </Box>
                  </SortableContext>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <DragOverlay>
          {activeId ? (
            <Card sx={{ cursor: 'grabbing', opacity: 0.9, transform: 'rotate(5deg)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Spostamento in corso...
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Context Menu */}
      <Menu
        anchorEl={candidateMenuAnchor}
        open={Boolean(candidateMenuAnchor)}
        onClose={() => {
          setCandidateMenuAnchor(null);
          setSelectedCandidate(null);
        }}
      >
        <MenuItem onClick={() => {
          // Apri dettagli candidato
          setCandidateMenuAnchor(null);
        }}>
          <PersonIcon sx={{ mr: 1 }} />
          Vedi Profilo
        </MenuItem>
        <MenuItem onClick={() => {
          // Invia email
          setCandidateMenuAnchor(null);
        }}>
          <EmailIcon sx={{ mr: 1 }} />
          Invia Email
        </MenuItem>
        <MenuItem onClick={() => {
          // Vedi timeline
          setCandidateMenuAnchor(null);
        }}>
          <TimelineIcon sx={{ mr: 1 }} />
          Vedi Timeline
        </MenuItem>
      </Menu>

      {/* Move Confirmation Dialog */}
      <Dialog
        open={Boolean(moveDialog)}
        onClose={() => setMoveDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Sposta Candidato
        </DialogTitle>
        <DialogContent>
          {moveDialog && (
            <>
              <Typography gutterBottom>
                Stai spostando <strong>{moveDialog.candidate.name}</strong> 
                dalla fase <strong>{moveDialog.fromPhase}</strong> 
                alla fase <strong>{moveDialog.toPhase}</strong>
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Decisione</InputLabel>
                <Select
                  value={moveDecision}
                  onChange={(e) => setMoveDecision(e.target.value as any)}
                >
                  <MenuItem value="passed">Superato</MenuItem>
                  <MenuItem value="failed">Bocciato</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Punteggio (opzionale)"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                value={moveScore}
                onChange={(e) => setMoveScore(e.target.value ? Number(e.target.value) : '')}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Note (opzionale)"
                multiline
                rows={3}
                value={moveNotes}
                onChange={(e) => setMoveNotes(e.target.value)}
                placeholder="Aggiungi note sul colloquio o la valutazione..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialog(null)}>
            Annulla
          </Button>
          <Button 
            onClick={handleMoveCandidate} 
            variant="contained"
            disabled={!moveDecision}
          >
            Conferma Spostamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;