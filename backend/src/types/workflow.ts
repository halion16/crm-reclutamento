// Types per Interview Workflow System

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'screening' | 'technical' | 'cultural' | 'final' | 'custom';
  color: string;
  duration: number; // minuti
  requiredDocuments: string[];
  requiredInterviewers: string[];
  autoAdvanceRules?: AutoAdvanceRule[];
  slaHours?: number; // SLA per completare questa fase
  isActive: boolean;
}

export interface AutoAdvanceRule {
  condition: 'ai_score' | 'manual_approval' | 'time_passed' | 'external_trigger';
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  value: number | string | boolean;
  nextPhase: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  isDefault: boolean;
  positionTypes: string[]; // Tipi di posizione che usano questo workflow
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateWorkflowState {
  id: string;
  candidateId: string;
  workflowTemplateId: string;
  currentPhase: string;
  previousPhase?: string;
  status: 'active' | 'completed' | 'rejected' | 'withdrawn' | 'on_hold';
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  phaseHistory: PhaseHistoryEntry[];
  metadata: WorkflowMetadata;
}

export interface PhaseHistoryEntry {
  phaseId: string;
  phaseName: string;
  enteredAt: Date;
  exitedAt?: Date;
  decision: 'passed' | 'failed' | 'pending' | 'skipped';
  score?: number;
  notes?: string;
  interviewerId?: string;
  duration?: number; // tempo effettivo speso in minuti
  automatedTransition: boolean;
  nextPhase?: string;
}

export interface WorkflowMetadata {
  positionId: string;
  positionTitle: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedRecruiter: string;
  expectedCompletionDate?: Date;
  tags: string[];
  customFields: Record<string, any>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  phaseId: string;
  color: string;
  candidates: KanbanCandidate[];
  maxItems?: number;
  slaWarningHours?: number;
}

export interface KanbanCandidate {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  position: string;
  avatar?: string;
  currentPhase: string;
  status: CandidateWorkflowState['status'];
  priority: WorkflowMetadata['priority'];
  aiScore?: number;
  daysInPhase: number;
  nextAction?: NextAction;
  flags: CandidateFlag[];
  timeline: PhaseHistoryEntry[];
}

export interface NextAction {
  type: 'schedule_interview' | 'send_assessment' | 'review_feedback' | 'make_decision' | 'send_offer';
  description: string;
  dueDate?: Date;
  assignedTo?: string;
  automated?: boolean;
}

export interface CandidateFlag {
  type: 'urgent' | 'sla_warning' | 'missing_documents' | 'high_potential' | 'at_risk';
  message: string;
  severity: 'info' | 'warning' | 'error';
  createdAt: Date;
}

export interface WorkflowMetrics {
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

export interface BottleneckAnalysis {
  phaseId: string;
  phaseName: string;
  averageTime: number;
  standardDeviation: number;
  candidatesInPhase: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface SLAMetrics {
  overallCompliance: number; // percentuale
  phaseCompliance: Record<string, number>;
  breachedSLAs: SLABreach[];
}

export interface SLABreach {
  candidateId: string;
  candidateName: string;
  phaseId: string;
  phaseName: string;
  expectedCompletionAt: Date;
  actualTime: number;
  delay: number; // ore di ritardo
  severity: 'minor' | 'major' | 'critical';
}

// Eventi per real-time updates
export interface WorkflowEvent {
  id: string;
  type: 'candidate_moved' | 'phase_completed' | 'sla_warning' | 'bottleneck_detected' | 'workflow_updated';
  candidateId?: string;
  workflowId?: string;
  phaseId?: string;
  data: any;
  timestamp: Date;
  userId: string;
}

// Request/Response types per API
export interface MoveCandidate {
  candidateId: string;
  fromPhase: string;
  toPhase: string;
  decision?: 'passed' | 'failed';
  notes?: string;
  score?: number;
}

export interface BulkMoveCandidate {
  moves: MoveCandidate[];
  reason?: string;
}

export interface CreateWorkflowTemplate {
  name: string;
  description: string;
  phases: Omit<WorkflowPhase, 'id'>[];
  positionTypes: string[];
}

export interface UpdateWorkflowTemplate {
  id: string;
  name?: string;
  description?: string;
  phases?: WorkflowPhase[];
  positionTypes?: string[];
}

// Workflow Actions per automazioni
export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'schedule_interview' | 'create_task' | 'update_field' | 'ai_evaluation';
  trigger: WorkflowTrigger;
  params: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowTrigger {
  event: 'phase_enter' | 'phase_exit' | 'time_elapsed' | 'score_threshold';
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=' | 'contains' | 'in';
  value: any;
}

// Export default workflow phases
export const DEFAULT_WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 'cv_review',
    name: 'CV Review',
    description: 'Screening iniziale del curriculum vitae',
    order: 1,
    type: 'screening',
    color: '#2196F3',
    duration: 15,
    requiredDocuments: ['cv'],
    requiredInterviewers: [],
    slaHours: 24,
    isActive: true
  },
  {
    id: 'phone_screening',
    name: 'Phone Screening',
    description: 'Colloquio telefonico di screening',
    order: 2,
    type: 'screening', 
    color: '#FF9800',
    duration: 30,
    requiredDocuments: ['cv'],
    requiredInterviewers: ['recruiter'],
    slaHours: 72,
    isActive: true
  },
  {
    id: 'technical_interview',
    name: 'Technical Interview',
    description: 'Valutazione delle competenze tecniche',
    order: 3,
    type: 'technical',
    color: '#9C27B0',
    duration: 90,
    requiredDocuments: ['cv', 'technical_assessment'],
    requiredInterviewers: ['tech_lead', 'senior_developer'],
    slaHours: 120,
    isActive: true
  },
  {
    id: 'cultural_fit',
    name: 'Cultural Fit',
    description: 'Valutazione del fit culturale',
    order: 4,
    type: 'cultural',
    color: '#4CAF50',
    duration: 60,
    requiredDocuments: ['cv'],
    requiredInterviewers: ['hr_manager', 'team_lead'],
    slaHours: 96,
    isActive: true
  },
  {
    id: 'final_decision',
    name: 'Final Decision', 
    description: 'Decisione finale e preparazione offerta',
    order: 5,
    type: 'final',
    color: '#E91E63',
    duration: 30,
    requiredDocuments: ['all_feedback'],
    requiredInterviewers: ['hiring_manager'],
    slaHours: 48,
    isActive: true
  }
];

export const DEFAULT_WORKFLOW_TEMPLATE: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Standard Hiring Process',
  description: 'Processo standard di assunzione per posizioni tecniche',
  phases: DEFAULT_WORKFLOW_PHASES,
  isDefault: true,
  positionTypes: ['developer', 'engineer', 'designer']
};