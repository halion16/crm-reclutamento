// Types per il Frontend CRM Reclutamento

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  birthDate?: string;
  
  positionApplied?: string;
  experienceYears?: number;
  educationLevel?: string;
  cvFilePath?: string;
  linkedinProfile?: string;
  
  sourceChannel?: string;
  referralPerson?: string;
  applicationDate: string;
  currentStatus: CandidateStatus;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Interview eligibility
  nextInterviewPhase?: number | null;
  canScheduleInterview?: boolean;
  interviewProgress?: string;
  
  // Relations per vista dettaglio
  interviews?: Interview[];
  communications?: Communication[];
  documents?: Document[];
  activityLogs?: ActivityLog[];
}

export interface Interview {
  id: number;
  candidateId: number;
  interviewPhase: 1 | 2 | 3;
  
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  interviewType: InterviewType;
  
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  location?: string;
  
  primaryInterviewerId?: number;
  secondaryInterviewerId?: number;
  
  status: InterviewStatus;
  outcome?: InterviewOutcome;
  
  interviewerNotes?: string;
  technicalRating?: number;
  softSkillsRating?: number;
  overallRating?: number;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations
  candidate?: Pick<Candidate, 'id' | 'firstName' | 'lastName' | 'email' | 'positionApplied' | 'currentStatus'>;
  primaryInterviewer?: HrUser;
  secondaryInterviewer?: HrUser;
}

export interface HrUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: HrRole;
  isActive: boolean;
  phoneExtension?: string;
  createdAt: string;
}

export interface Communication {
  id: number;
  candidateId: number;
  interviewId?: number;
  
  communicationType: CommunicationType;
  direction: 'OUTBOUND' | 'INBOUND';
  
  subject?: string;
  messageContent?: string;
  
  sentAt?: string;
  deliveryStatus: DeliveryStatus;
  
  callDurationSeconds?: number;
  callOutcome?: string;
  
  createdAt: string;
  createdBy?: HrUser;
}

export interface Document {
  id: number;
  candidateId: number;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSizeKb?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy?: HrUser;
}

export interface ActivityLog {
  id: number;
  candidateId?: number;
  interviewId?: number;
  activityType: string;
  description: string;
  performedAt: string;
  performedBy?: HrUser;
}

// Enums
export type CandidateStatus = 'NEW' | 'IN_PROCESS' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

export type InterviewType = 'VIDEO_CALL' | 'IN_PERSON' | 'PHONE';

export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export type InterviewOutcome = 'POSITIVE' | 'NEGATIVE' | 'CANDIDATE_DECLINED' | 'TO_RESCHEDULE' | 'PENDING';

export type HrRole = 'HR_MANAGER' | 'HR_ASSISTANT' | 'INTERVIEWER';

export type CommunicationType = 'EMAIL' | 'SMS' | 'PHONE_CALL';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type DocumentType = 'CV' | 'COVER_LETTER' | 'PORTFOLIO' | 'CONTRACT';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface CandidateForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  birthDate: string;
  positionApplied: string;
  experienceYears: number | null;
  educationLevel: string;
  linkedinProfile: string;
  sourceChannel: string;
  referralPerson: string;
  notes: string;
}

export interface InterviewForm {
  candidateId: number;
  interviewPhase: 1 | 2 | 3;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  interviewType: InterviewType;
  location: string;
  primaryInterviewerId: number | null;
  secondaryInterviewerId: number | null;
}

export interface InterviewOutcomeForm {
  outcome: InterviewOutcome;
  interviewerNotes: string;
  technicalRating: number | null;
  softSkillsRating: number | null;
  overallRating: number | null;
}

// Filter Types
export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus;
  sourceChannel?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InterviewFilters {
  status?: InterviewStatus;
  candidateId?: number;
  interviewerId?: number;
  dateFrom?: string;
  dateTo?: string;
  phase?: 1 | 2 | 3;
}

// Dashboard Types
export interface DashboardStats {
  totalCandidates: number;
  activeCandidates: number;
  scheduledInterviews: number;
  completedInterviewsToday: number;
  candidatesByStatus: Record<CandidateStatus, number>;
  interviewsByPhase: Record<string, number>;
  recentActivity: ActivityLog[];
}

// Constants
export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  NEW: 'Nuovo',
  IN_PROCESS: 'In Processo',
  HIRED: 'Assunto',
  REJECTED: 'Scartato',
  WITHDRAWN: 'Ritirato'
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: 'Programmato',
  IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completato',
  CANCELLED: 'Cancellato',
  RESCHEDULED: 'Riprogrammato'
};

export const INTERVIEW_OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  POSITIVE: 'Positivo',
  NEGATIVE: 'Negativo',
  CANDIDATE_DECLINED: 'Candidato Declinato',
  TO_RESCHEDULE: 'Da Riprogrammare',
  PENDING: 'In Attesa'
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  VIDEO_CALL: 'Videochiamata',
  IN_PERSON: 'In Presenza',
  PHONE: 'Telefonico'
};

export const HR_ROLE_LABELS: Record<HrRole, string> = {
  HR_MANAGER: 'Manager HR',
  HR_ASSISTANT: 'Assistente HR',
  INTERVIEWER: 'Intervistatore'
};