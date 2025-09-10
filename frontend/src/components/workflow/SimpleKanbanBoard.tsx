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
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  Download as DownloadIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useWorkflowEvents } from '../../hooks/useWorkflowEvents';
import { useSocket } from '../../hooks/useSocket';
import WorkflowTestPanel from './WorkflowTestPanel';
import WorkflowMetrics from './WorkflowMetrics';
import WorkflowStatus from './WorkflowStatus';
import WebSocketTest from '../WebSocketTest';

// Types (same as before)
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

const SimpleKanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<KanbanCandidate | null>(null);
  const [candidateMenuAnchor, setCandidateMenuAnchor] = useState<null | HTMLElement>(null);
  const [moveDialog, setMoveDialog] = useState<MoveDialogData | null>(null);
  const [moveNotes, setMoveNotes] = useState('');
  const [moveScore, setMoveScore] = useState<number | ''>('');
  const [moveDecision, setMoveDecision] = useState<'passed' | 'failed' | ''>('');
  
  // Step 4.2: Candidate Details Modal
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState<KanbanCandidate | null>(null);
  
  // Step 4.4: Keyboard shortcuts state
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(-1);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  
  // 🔥 STEP 4.1: Drag & Drop states
  const [draggedCandidate, setDraggedCandidate] = useState<KanbanCandidate | null>(null);
  
  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  // 🔥 STEP 3.4: Setup WebSocket real-time events for Kanban board
  const { isConnected: socketConnected } = useSocket({
    workflowId: 'default-workflow',
    onGlobalUpdate: (event) => {
      console.log('🌍 Global update received in Kanban:', event);
      
      if (event.type === 'candidate_moved') {
        // Refresh Kanban data when candidate moves
        loadKanbanData();
        toast.success(`🚀 ${event.data.candidateName || 'Candidato'} spostato in ${event.data.toPhase || 'nuova fase'}`, {
          duration: 4000,
          icon: '📋'
        });
      } else if (event.type === 'interview_completed') {
        // Show notification when interview is completed
        toast.success(`🎯 Colloquio completato per ${event.data.candidateName}`, {
          duration: 4000,
          icon: '✅'
        });
        // Refresh data as interview outcome may affect workflow
        setTimeout(loadKanbanData, 1000);
      }
    },
    onWorkflowUpdate: (event) => {
      console.log('📋 Workflow update received in Kanban:', event);
      
      if (event.type === 'candidate_moved' || event.type === 'candidate_synced') {
        // Real-time update of Kanban board
        loadKanbanData();
      }
    },
    onCandidateUpdate: (event) => {
      console.log('👤 Candidate update received in Kanban:', event);
      // Refresh Kanban when individual candidates are updated
      loadKanbanData();
    }
  });

  // Fallback to old events system if socket not connected
  const { isConnected: eventsConnected } = useWorkflowEvents({
    onCandidateMoved: (event) => {
      if (!socketConnected) {
        console.log('Fallback: Candidate moved', event);
        loadKanbanData();
        toast.success(`Candidato spostato in ${event.data?.toPhase || 'nuova fase'}`);
      }
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

  // 🔥 STEP 4.1: Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Find the dragged candidate
    const foundCandidate = columns
      .flatMap(column => column.candidates)
      .find(candidate => candidate.id === active.id);
    
    setDraggedCandidate(foundCandidate || null);
    console.log('🎯 Drag started:', foundCandidate?.name);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedCandidate(null);
    
    if (!over) return;
    
    const candidateId = active.id as string;
    const targetPhaseId = over.id as string;
    
    // Find source and target phases
    const sourceColumn = columns.find(column => 
      column.candidates.some(candidate => candidate.id === candidateId)
    );
    const targetColumn = columns.find(column => column.phaseId === targetPhaseId);
    
    if (!sourceColumn || !targetColumn) return;
    if (sourceColumn.phaseId === targetColumn.phaseId) return; // Same phase
    
    const candidate = sourceColumn.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    console.log(`🔄 Drag & Drop: Moving ${candidate.name} from ${sourceColumn.title} to ${targetColumn.title}`);
    
    // Show confirmation dialog for drag & drop move
    setMoveDialog({
      candidate,
      fromPhase: sourceColumn.phaseId,
      toPhase: targetColumn.phaseId
    });
    
    toast(`📋 Conferma spostamento di ${candidate.name} in ${targetColumn.title}`, {
      duration: 3000,
      icon: '🎯'
    });
  };

  const handleDragCancel = () => {
    setDraggedCandidate(null);
  };

  // Step 4.2: Handle candidate details modal
  const handleCandidateClick = (candidate: KanbanCandidate) => {
    setCandidateDetails(candidate);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setCandidateDetails(null);
  };

  // Step 4.4: Keyboard shortcuts handlers
  const handleKeyboardNavigation = (event: KeyboardEvent) => {
    // Don't handle keyboard shortcuts when modals are open or inputs are focused
    if (detailsDialogOpen || moveDialog || 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
      return;
    }

    const currentColumn = columns[selectedColumnIndex];
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedColumnIndex(prev => Math.max(0, prev - 1));
        setSelectedCandidateIndex(0);
        toast(`📋 Colonna: ${columns[Math.max(0, selectedColumnIndex - 1)]?.title || 'Prima'}`, { icon: '📋' });
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        setSelectedColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
        setSelectedCandidateIndex(0);
        toast(`📋 Colonna: ${columns[Math.min(columns.length - 1, selectedColumnIndex + 1)]?.title || 'Ultima'}`, { icon: '📋' });
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (currentColumn?.candidates.length > 0) {
          setSelectedCandidateIndex(prev => 
            prev <= 0 ? currentColumn.candidates.length - 1 : prev - 1
          );
        }
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (currentColumn?.candidates.length > 0) {
          setSelectedCandidateIndex(prev => 
            prev >= currentColumn.candidates.length - 1 ? 0 : prev + 1
          );
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (currentColumn?.candidates[selectedCandidateIndex]) {
          handleCandidateClick(currentColumn.candidates[selectedCandidateIndex]);
        }
        break;
        
      case ' ': // Spacebar
        event.preventDefault();
        if (currentColumn?.candidates[selectedCandidateIndex]) {
          const candidate = currentColumn.candidates[selectedCandidateIndex];
          const phases = ['cv_review', 'phone_screening', 'technical_interview', 'cultural_fit', 'final_decision'];
          const currentIndex = phases.indexOf(candidate.currentPhase);
          if (currentIndex < phases.length - 1) {
            setMoveDialog({
              candidate,
              fromPhase: candidate.currentPhase,
              toPhase: phases[currentIndex + 1]
            });
          }
        }
        break;
        
      case 'r': // Refresh
      case 'R':
        event.preventDefault();
        loadKanbanData();
        toast('🔄 Aggiornamento board...', { icon: '🔄' });
        break;
        
      case 'e': // Email
      case 'E':
        event.preventDefault();
        if (currentColumn?.candidates[selectedCandidateIndex]) {
          const candidate = currentColumn.candidates[selectedCandidateIndex];
          window.open(`mailto:${candidate.email}?subject=Colloquio - ${candidate.position}`, '_blank');
          toast(`📧 Email per ${candidate.name}`, { icon: '📧' });
        }
        break;
        
      case 'm': // Move to next phase
      case 'M':
        event.preventDefault();
        if (currentColumn?.candidates[selectedCandidateIndex]) {
          const candidate = currentColumn.candidates[selectedCandidateIndex];
          const phases = ['cv_review', 'phone_screening', 'technical_interview', 'cultural_fit', 'final_decision'];
          const currentIndex = phases.indexOf(candidate.currentPhase);
          if (currentIndex < phases.length - 1) {
            setMoveDialog({
              candidate,
              fromPhase: candidate.currentPhase,
              toPhase: phases[currentIndex + 1]
            });
          }
        }
        break;
        
      case 'Escape':
        // Close any open modals
        setDetailsDialogOpen(false);
        setCandidateDetails(null);
        setMoveDialog(null);
        setCandidateMenuAnchor(null);
        setSelectedCandidate(null);
        break;
        
      case '?': // Show help
        event.preventDefault();
        toast.success(
          '⌨️ Shortcuts: ←→ columns, ↑↓ candidates, Enter=details, Space/M=move, E=email, R=refresh, Esc=close',
          { duration: 8000 }
        );
        break;
    }
  };

  // Step 4.4: Setup keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardNavigation);
    return () => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [selectedColumnIndex, selectedCandidateIndex, columns, detailsDialogOpen, moveDialog]);

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
      candidates: []
    },
    {
      id: 'technical_interview',
      title: 'Technical Interview',
      phaseId: 'technical_interview',
      color: '#9C27B0',
      candidates: []
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

  // 🔥 STEP 4.1: Droppable Column Component  
  const DroppableColumn = ({ column, isSelected }: { column: KanbanColumn; isSelected: boolean }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: column.phaseId,
    });

    return (
      <Card 
        ref={setNodeRef}
        sx={{ 
          height: '100%', 
          minHeight: 600,
          backgroundColor: isOver ? 'action.hover' : 'background.paper',
          border: isOver || isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'secondary.main' : (isOver ? 'primary.main' : 'divider'),
          transition: 'all 0.2s',
          boxShadow: isSelected ? 2 : undefined
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
              <Chip 
                label={isSelected ? "⌨️" : (isOver ? "🎯" : "📋")} 
                size="small" 
                sx={{ ml: 1 }}
                color={isSelected ? "secondary" : (isOver ? "primary" : "default")}
              />
            </Box>
          </Box>

          <SortableContext 
            items={column.candidates.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box 
              sx={{ 
                minHeight: 400,
                padding: 1,
                borderRadius: 2,
                backgroundColor: isOver ? 'primary.lighter' : 'transparent'
              }}
            >
              {column.candidates.map((candidate, index) => (
                <SortableCandidate
                  key={candidate.id}
                  candidate={candidate}
                  onCandidateClick={handleCandidateClick}
                  isSelected={isSelected && index === selectedCandidateIndex}
                />
              ))}
              
              {column.candidates.length === 0 && (
                <Box
                  textAlign="center"
                  py={4}
                  color="text.secondary"
                  sx={{
                    backgroundColor: isOver ? 'primary.lighter' : 'transparent',
                    border: isOver ? '2px dashed' : '1px dashed',
                    borderColor: isOver ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s'
                  }}
                >
                  <Typography variant="body2">
                    {isOver ? "🎯 Rilascia qui" : "Nessun candidato"}
                  </Typography>
                </Box>
              )}
            </Box>
          </SortableContext>
        </CardContent>
      </Card>
    );
  };

  // 🔥 STEP 4.1: Sortable Candidate Component
  const SortableCandidate = ({ 
    candidate, 
    onCandidateClick,
    isSelected 
  }: { 
    candidate: KanbanCandidate;
    onCandidateClick?: (candidate: KanbanCandidate) => void;
    isSelected?: boolean;
  }) => {
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
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        sx={{
          mb: 2,
          cursor: isDragging ? 'grabbing' : 'pointer',
          border: isDragging || isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'secondary.main' : (isDragging ? 'primary.main' : 'divider'),
          backgroundColor: isSelected ? 'secondary.lighter' : 'background.paper',
          boxShadow: isSelected ? 3 : undefined,
          '&:hover': {
            boxShadow: 4,
            borderColor: isSelected ? 'secondary.main' : 'primary.main'
          }
        }}
        onClick={(e) => {
          // Only handle click if not dragging and not clicking on interactive elements
          if (!isDragging && onCandidateClick && !e.defaultPrevented) {
            onCandidateClick(candidate);
          }
        }}
      >
        <Box {...listeners} sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
          {candidateCardContent(candidate)}
        </Box>
      </Card>
    );
  };

  // Card content (without Card wrapper - used inside SortableCandidate)
  const candidateCardContent = (candidate: KanbanCandidate) => (
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
              e.preventDefault();
              e.stopPropagation();
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
            <Typography variant="caption" component="span">
              {candidate.nextAction.description}
            </Typography>
            {candidate.nextAction.dueDate && (
              <Typography variant="caption" component="span" display="block" color="text.secondary">
                Scadenza: {new Date(candidate.nextAction.dueDate).toLocaleDateString()}
              </Typography>
            )}
          </Alert>
        )}

        {/* Move Button */}
        <Box mt={2}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<ArrowForwardIcon />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Simula movimento alla prossima fase
              const phases = ['cv_review', 'phone_screening', 'technical_interview', 'cultural_fit', 'final_decision'];
              const currentIndex = phases.indexOf(candidate.currentPhase);
              if (currentIndex < phases.length - 1) {
                setMoveDialog({
                  candidate,
                  fromPhase: candidate.currentPhase,
                  toPhase: phases[currentIndex + 1]
                });
              }
            }}
            disabled={candidate.currentPhase === 'final_decision'}
          >
            Sposta alla Prossima Fase
          </Button>
        </Box>
      </CardContent>
  );

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" mt={2}>Caricamento workflow...</Typography>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Workflow Colloqui
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gestisci il processo di reclutamento (versione semplificata)
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              width={8}
              height={8}
              borderRadius="50%"
              bgcolor={socketConnected ? 'success.main' : 'error.main'}
              sx={{ animation: socketConnected ? 'none' : 'pulse 1s infinite' }}
            />
            <Typography variant="caption" color="text.secondary">
              {socketConnected ? '🔌 WebSocket Connesso' : '❌ WebSocket Disconnesso'}
            </Typography>
          </Box>
          
          {/* Step 4.4: Keyboard shortcuts help */}
          <Tooltip 
            title="⌨️ Shortcuts: ←→ colonne | ↑↓ candidati | Enter=dettagli | Space/M=sposta | E=email | R=refresh | ?=help" 
            placement="bottom-end"
          >
            <Chip 
              label="⌨️ Keyboard" 
              size="small" 
              variant="outlined"
              color="secondary"
              clickable
              onClick={() => {
                toast.success(
                  '⌨️ Shortcuts: ←→ columns, ↑↓ candidates, Enter=details, Space/M=move, E=email, R=refresh, Esc=close',
                  { duration: 8000 }
                );
              }}
            />
          </Tooltip>
        </Box>
      </Box>

      {/* Status Real-time */}
      <WorkflowStatus />

      {/* 🔥 STEP 3.5: WebSocket Real-Time Test */}
      <WebSocketTest />

      {/* Pannello Test per sviluppo */}
      <WorkflowTestPanel onRefreshBoard={loadKanbanData} />

      {/* Metriche Workflow */}
      <Box mb={3}>
        <WorkflowMetrics />
      </Box>

      {/* Kanban Board with Drag & Drop */}
      <Grid container spacing={2}>
        {columns.map((column, index) => (
          <Grid item xs={12} sm={6} md key={column.id}>
            <DroppableColumn 
              column={column} 
              isSelected={index === selectedColumnIndex}
            />
          </Grid>
        ))}
      </Grid>

      {/* Step 4.3: Enhanced Quick Actions Context Menu */}
      <Menu
        anchorEl={candidateMenuAnchor}
        open={Boolean(candidateMenuAnchor)}
        onClose={() => {
          setCandidateMenuAnchor(null);
          setSelectedCandidate(null);
        }}
        PaperProps={{
          sx: { minWidth: 220 }
        }}
      >
        {selectedCandidate && (
          <>
            {/* View Actions */}
            <MenuItem 
              onClick={() => {
                handleCandidateClick(selectedCandidate);
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
              }}
            >
              <PersonIcon sx={{ mr: 1 }} />
              Vedi Profilo Completo
            </MenuItem>
            
            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('🔗 Apertura timeline candidato...', { icon: '🔗' });
              }}
            >
              <TimelineIcon sx={{ mr: 1 }} />
              Timeline Colloqui
            </MenuItem>

            {/* Communication Actions */}
            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast(`📧 Apertura client email per ${selectedCandidate.email}`, { icon: '📧' });
                window.open(`mailto:${selectedCandidate.email}?subject=Colloquio - ${selectedCandidate.position}`, '_blank');
              }}
            >
              <EmailIcon sx={{ mr: 1 }} />
              Invia Email
            </MenuItem>

            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('📞 Funzione chiamata in sviluppo', { icon: '📞' });
              }}
            >
              <PhoneIcon sx={{ mr: 1 }} />
              Chiama Candidato
            </MenuItem>

            {/* Scheduling Actions */}
            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('📅 Apertura calendario per scheduling...', { icon: '📅' });
              }}
            >
              <ScheduleIcon sx={{ mr: 1 }} />
              Prenota Colloquio
            </MenuItem>

            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('📝 Invio assessment automatico...', { icon: '📝' });
              }}
            >
              <AssignmentIcon sx={{ mr: 1 }} />
              Invia Assessment
            </MenuItem>

            {/* Movement Actions */}
            <MenuItem 
              onClick={() => {
                const phases = ['cv_review', 'phone_screening', 'technical_interview', 'cultural_fit', 'final_decision'];
                const currentIndex = phases.indexOf(selectedCandidate.currentPhase);
                if (currentIndex < phases.length - 1) {
                  setMoveDialog({
                    candidate: selectedCandidate,
                    fromPhase: selectedCandidate.currentPhase,
                    toPhase: phases[currentIndex + 1]
                  });
                }
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
              }}
              disabled={selectedCandidate.currentPhase === 'final_decision'}
            >
              <ArrowForwardIcon sx={{ mr: 1 }} />
              Sposta alla Prossima Fase
            </MenuItem>

            {/* Management Actions */}
            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('✏️ Modalità modifica candidato...', { icon: '✏️' });
              }}
            >
              <EditIcon sx={{ mr: 1 }} />
              Modifica Info
            </MenuItem>

            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('🚩 Aggiunta segnalazione candidato...', { icon: '🚩' });
              }}
            >
              <FlagIcon sx={{ mr: 1 }} />
              Aggiungi Segnalazione
            </MenuItem>

            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('📄 Download CV in corso...', { icon: '📄' });
              }}
            >
              <DownloadIcon sx={{ mr: 1 }} />
              Scarica CV
            </MenuItem>

            <MenuItem 
              onClick={() => {
                setCandidateMenuAnchor(null);
                setSelectedCandidate(null);
                toast('🔗 Apertura profilo LinkedIn...', { icon: '🔗' });
              }}
            >
              <LinkIcon sx={{ mr: 1 }} />
              Profilo LinkedIn
            </MenuItem>

            {/* Negative Actions */}
            {selectedCandidate.status === 'active' && (
              <MenuItem 
                onClick={() => {
                  setCandidateMenuAnchor(null);
                  setSelectedCandidate(null);
                  toast('⏸️ Candidato messo in sospensione', { icon: '⏸️' });
                }}
                sx={{ color: 'warning.main' }}
              >
                <BlockIcon sx={{ mr: 1 }} />
                Sospendi Candidato
              </MenuItem>
            )}

            {selectedCandidate.status !== 'rejected' && (
              <MenuItem 
                onClick={() => {
                  setCandidateMenuAnchor(null);
                  setSelectedCandidate(null);
                  toast.error('❌ Candidato rifiutato dal processo');
                }}
                sx={{ color: 'error.main' }}
              >
                <BlockIcon sx={{ mr: 1 }} />
                Rifiuta Candidato
              </MenuItem>
            )}
          </>
        )}
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
      
      {/* Step 4.2: Candidate Details Modal */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        scroll="body"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              {candidateDetails && (
                <>
                  <Avatar sx={{ width: 48, height: 48 }}>
                    {candidateDetails.avatar ? (
                      <img src={candidateDetails.avatar} alt={candidateDetails.name} />
                    ) : (
                      candidateDetails.name.charAt(0)
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{candidateDetails.name}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      {candidateDetails.position}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {candidateDetails && (
                <>
                  <Chip
                    size="small"
                    label={candidateDetails.status}
                    color={candidateDetails.status === 'active' ? 'success' : 'default'}
                  />
                  <Chip
                    size="small"
                    label={`Priority: ${candidateDetails.priority}`}
                    color={getPriorityColor(candidateDetails.priority) as any}
                  />
                </>
              )}
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {candidateDetails && (
            <Box>
              {/* Contact Info */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  📧 Informazioni Contatto
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EmailIcon fontSize="small" />
                  <Typography>{candidateDetails.email}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Fase corrente: <strong>{candidateDetails.currentPhase}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Giorni in fase: <strong>{candidateDetails.daysInPhase}</strong>
                </Typography>
              </Box>

              {/* AI Score */}
              {candidateDetails.aiScore && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    🤖 Valutazione AI
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress 
                      variant="determinate" 
                      value={candidateDetails.aiScore} 
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      color={candidateDetails.aiScore >= 85 ? 'success' : candidateDetails.aiScore >= 70 ? 'warning' : 'error'}
                    />
                    <Typography variant="h6" color="primary">
                      {candidateDetails.aiScore}/100
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Score basato su CV, skills match e interviste precedenti
                  </Typography>
                </Box>
              )}

              {/* Flags */}
              {candidateDetails.flags.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    🚩 Segnalazioni
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {candidateDetails.flags.map((flag, index) => (
                      <Alert 
                        key={index}
                        severity={flag.severity}
                        sx={{ mb: 1 }}
                        icon={getFlagIcon(flag.type)}
                      >
                        <Typography variant="body2" component="span">
                          <strong>{flag.type.replace('_', ' ').toUpperCase()}</strong>: {flag.message}
                        </Typography>
                        <Typography variant="caption" component="span" display="block" color="text.secondary">
                          {new Date(flag.createdAt).toLocaleDateString('it-IT')}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Next Action */}
              {candidateDetails.nextAction && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    📋 Prossima Azione
                  </Typography>
                  <Alert 
                    severity="info" 
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" component="span">
                      <strong>{candidateDetails.nextAction.type.replace('_', ' ').toUpperCase()}</strong>
                    </Typography>
                    <Typography variant="body2" component="span" gutterBottom>
                      {candidateDetails.nextAction.description}
                    </Typography>
                    {candidateDetails.nextAction.dueDate && (
                      <Typography variant="caption" component="span" color="text.secondary">
                        Scadenza: {new Date(candidateDetails.nextAction.dueDate).toLocaleDateString('it-IT')}
                      </Typography>
                    )}
                    {candidateDetails.nextAction.assignedTo && (
                      <Typography variant="caption" component="span" display="block" color="text.secondary">
                        Assegnato a: {candidateDetails.nextAction.assignedTo}
                      </Typography>
                    )}
                    {candidateDetails.nextAction.automated && (
                      <Chip size="small" label="🤖 Automatizzato" color="info" sx={{ mt: 1 }} />
                    )}
                  </Alert>
                </Box>
              )}

              {/* Timeline */}
              {candidateDetails.timeline && candidateDetails.timeline.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    📈 Timeline Colloqui
                  </Typography>
                  <Box>
                    {candidateDetails.timeline.map((entry, index) => (
                      <Box 
                        key={index}
                        display="flex" 
                        alignItems="center" 
                        gap={2} 
                        mb={2}
                        p={2}
                        border="1px solid"
                        borderColor="divider"
                        borderRadius={1}
                      >
                        <Box
                          width={12}
                          height={12}
                          borderRadius="50%"
                          bgcolor={
                            entry.decision === 'passed' ? 'success.main' :
                            entry.decision === 'failed' ? 'error.main' :
                            entry.decision === 'pending' ? 'warning.main' :
                            'grey.500'
                          }
                        />
                        <Box flexGrow={1}>
                          <Typography variant="subtitle2">
                            {entry.phaseName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Entrato: {new Date(entry.enteredAt).toLocaleDateString('it-IT')}
                            {entry.exitedAt && ` • Uscito: ${new Date(entry.exitedAt).toLocaleDateString('it-IT')}`}
                          </Typography>
                          {entry.score && (
                            <Typography variant="body2">
                              Score: <strong>{entry.score}</strong>
                            </Typography>
                          )}
                          {entry.notes && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              "{entry.notes}"
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          size="small"
                          label={entry.decision}
                          color={
                            entry.decision === 'passed' ? 'success' :
                            entry.decision === 'failed' ? 'error' :
                            entry.decision === 'pending' ? 'warning' :
                            'default'
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>
            Chiudi
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EmailIcon />}
            onClick={() => {
              // TODO: Implement email action
              toast('Funzione email in sviluppo', { icon: '📧' });
            }}
          >
            Invia Email
          </Button>
          <Button 
            variant="contained"
            startIcon={<ArrowForwardIcon />}
            onClick={() => {
              if (candidateDetails) {
                const phases = ['cv_review', 'phone_screening', 'technical_interview', 'cultural_fit', 'final_decision'];
                const currentIndex = phases.indexOf(candidateDetails.currentPhase);
                if (currentIndex < phases.length - 1) {
                  setMoveDialog({
                    candidate: candidateDetails,
                    fromPhase: candidateDetails.currentPhase,
                    toPhase: phases[currentIndex + 1]
                  });
                  handleCloseDetailsDialog();
                }
              }
            }}
            disabled={candidateDetails?.currentPhase === 'final_decision'}
          >
            Sposta alla Prossima Fase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedCandidate ? (
          <Card sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
            {candidateCardContent(draggedCandidate)}
          </Card>
        ) : null}
      </DragOverlay>
    </Box>
    </DndContext>
  );
};

export default SimpleKanbanBoard;