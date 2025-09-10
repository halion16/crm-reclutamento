// Common Types per CRM Reclutamento

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
  birthDate?: Date;
  
  positionApplied?: string;
  experienceYears?: number;
  educationLevel?: string;
  cvFilePath?: string;
  linkedinProfile?: string;
  
  sourceChannel?: string;
  referralPerson?: string;
  applicationDate: Date;
  currentStatus: CandidateStatus;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: number;
  updatedById?: number;
}

export interface Interview {
  id: number;
  candidateId: number;
  interviewPhase: 1 | 2 | 3;
  
  scheduledDate?: Date;
  scheduledTime?: Date;
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
  
  createdAt: Date;
  updatedAt: Date;
  createdById?: number;
  updatedById?: number;
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
  createdAt: Date;
}

export interface Communication {
  id: number;
  candidateId: number;
  interviewId?: number;
  
  communicationType: CommunicationType;
  direction: 'OUTBOUND' | 'INBOUND';
  
  subject?: string;
  messageContent?: string;
  
  sentAt?: Date;
  deliveryStatus: DeliveryStatus;
  
  callDurationSeconds?: number;
  callOutcome?: string;
  
  createdAt: Date;
  createdById: number;
}

export interface CommunicationTemplate {
  id: number;
  templateName: string;
  templateType: 'EMAIL' | 'SMS';
  subjectTemplate?: string;
  messageTemplate: string;
  usageContext?: string;
  isActive: boolean;
  createdAt: Date;
  createdById: number;
}

export interface Document {
  id: number;
  candidateId: number;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSizeKb?: number;
  mimeType?: string;
  uploadedAt: Date;
  uploadedById: number;
}

export interface ActivityLog {
  id: number;
  candidateId?: number;
  interviewId?: number;
  activityType: string;
  description: string;
  performedAt: Date;
  performedById: number;
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

// Request/Response Types
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

export interface CandidateCreateRequest {
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
  linkedinProfile?: string;
  sourceChannel?: string;
  referralPerson?: string;
  notes?: string;
}

export interface InterviewCreateRequest {
  candidateId: number;
  interviewPhase: 1 | 2 | 3;
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  interviewType: InterviewType;
  location?: string;
  primaryInterviewerId?: number;
  secondaryInterviewerId?: number;
}

export interface InterviewUpdateRequest {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  interviewType?: InterviewType;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  location?: string;
  primaryInterviewerId?: number;
  secondaryInterviewerId?: number;
  status?: InterviewStatus;
  outcome?: InterviewOutcome;
  interviewerNotes?: string;
  technicalRating?: number;
  softSkillsRating?: number;
  overallRating?: number;
}