import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Communication Types
export interface Communication {
  id: number;
  candidateId: number;
  interviewId?: number;
  communicationType: 'EMAIL' | 'SMS' | 'PHONE_CALL';
  direction: 'OUTBOUND' | 'INBOUND';
  subject?: string;
  messageContent?: string;
  sentAt?: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  callDurationSeconds?: number;
  callOutcome?: string;
  createdAt: string;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CommunicationTemplate {
  id: number;
  templateName: string;
  templateType: 'EMAIL' | 'SMS';
  subjectTemplate?: string;
  messageTemplate: string;
  usageContext?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmailRequest {
  candidateId: number;
  interviewId?: number;
  to: string;
  subject: string;
  message: string;
}

export interface TemplateEmailRequest {
  templateId: number;
  candidateId: number;
  interviewId?: number;
  variables?: Record<string, string>;
}

export interface SMSRequest {
  candidateId: number;
  interviewId?: number;
  message: string;
}

export interface CallRequest {
  candidateId: number;
  phoneType?: 'mobile' | 'phone';
}

export interface CallOutcomeRequest {
  communicationId: number;
  duration?: number;
  outcome: string;
  notes?: string;
}

// Communications API
export const communicationAPI = {
  // GET /api/communications - Lista comunicazioni
  getAll: async (params: {
    candidateId?: number;
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Communication>> => {
    const response: AxiosResponse<PaginatedResponse<Communication>> = await api.get('/communications', { params });
    return response.data;
  },

  // GET /api/communications/templates - Lista template
  getTemplates: async (params: {
    type?: 'EMAIL' | 'SMS';
    context?: string;
  } = {}): Promise<ApiResponse<CommunicationTemplate[]>> => {
    const response: AxiosResponse<ApiResponse<CommunicationTemplate[]>> = await api.get('/communications/templates', { params });
    return response.data;
  },

  // POST /api/communications/email/send - Invia email
  sendEmail: async (data: EmailRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/email/send', data);
    return response.data;
  },

  // POST /api/communications/email/template - Invia email da template
  sendTemplateEmail: async (data: TemplateEmailRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/email/template', data);
    return response.data;
  },

  // POST /api/communications/email/interview-confirmation - Invia conferma colloquio
  sendInterviewConfirmation: async (interviewId: number): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/email/interview-confirmation', { interviewId });
    return response.data;
  },

  // POST /api/communications/sms/send - Invia SMS
  sendSMS: async (data: SMSRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/sms/send', data);
    return response.data;
  },

  // POST /api/communications/sms/template - Invia SMS da template
  sendTemplateSMS: async (data: TemplateEmailRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/sms/template', data);
    return response.data;
  },

  // POST /api/communications/sms/interview-reminder - Invia reminder SMS
  sendInterviewReminderSMS: async (interviewId: number): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/sms/interview-reminder', { interviewId });
    return response.data;
  },

  // POST /api/communications/call/initiate - Avvia chiamata
  initiateCall: async (data: CallRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/call/initiate', data);
    return response.data;
  },

  // POST /api/communications/call/record-outcome - Registra esito chiamata
  recordCallOutcome: async (data: CallOutcomeRequest): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/call/record-outcome', data);
    return response.data;
  },

  // GET /api/communications/call/history/:candidateId - Storico chiamate
  getCallHistory: async (candidateId: number): Promise<ApiResponse<Communication[]>> => {
    const response: AxiosResponse<ApiResponse<Communication[]>> = await api.get(`/communications/call/history/${candidateId}`);
    return response.data;
  },

  // GET /api/communications/windows-phone/status - Status integrazione Windows Phone
  getWindowsPhoneStatus: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/communications/windows-phone/status');
    return response.data;
  }
};

// Utility function per gestire errori API
export const handleCommunicationApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Si è verificato un errore inaspettato';
};

export default communicationAPI;