import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { 
  Candidate, 
  Interview, 
  HrUser, 
  ApiResponse, 
  PaginatedResponse,
  CandidateForm,
  InterviewForm,
  InterviewOutcomeForm,
  CandidateFilters,
  InterviewFilters
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor per aggiungere token JWT quando disponibile
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.reload(); // Ricarica per attivare il sistema di login
    }
    return Promise.reject(error);
  }
);

// Candidates API
export const candidatesAPI = {
  // GET /api/candidates
  getAll: async (params: CandidateFilters & { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Candidate>> => {
    const response: AxiosResponse<PaginatedResponse<Candidate>> = await api.get('/candidates', { params });
    return response.data;
  },

  // GET /api/candidates/:id
  getById: async (id: number): Promise<ApiResponse<Candidate>> => {
    const response: AxiosResponse<ApiResponse<Candidate>> = await api.get(`/candidates/${id}`);
    return response.data;
  },

  // POST /api/candidates
  create: async (data: CandidateForm): Promise<ApiResponse<Candidate>> => {
    const response: AxiosResponse<ApiResponse<Candidate>> = await api.post('/candidates', data);
    return response.data;
  },

  // PUT /api/candidates/:id
  update: async (id: number, data: Partial<CandidateForm>): Promise<ApiResponse<Candidate>> => {
    const response: AxiosResponse<ApiResponse<Candidate>> = await api.put(`/candidates/${id}`, data);
    return response.data;
  },

  // PATCH /api/candidates/:id/status
  updateStatus: async (id: number, status: string): Promise<ApiResponse<Candidate>> => {
    const response: AxiosResponse<ApiResponse<Candidate>> = await api.patch(`/candidates/${id}/status`, { status });
    return response.data;
  },

  // DELETE /api/candidates/:id
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete(`/candidates/${id}`);
    return response.data;
  },

  // GET /api/candidates/eligible-for-interview
  getEligibleForInterview: async (): Promise<ApiResponse<Candidate[]>> => {
    const response: AxiosResponse<ApiResponse<Candidate[]>> = await api.get('/candidates/eligible-for-interview');
    return response.data;
  },
};

// Interviews API
export const interviewsAPI = {
  // GET /api/interviews
  getAll: async (params: InterviewFilters & { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Interview>> => {
    const response: AxiosResponse<PaginatedResponse<Interview>> = await api.get('/interviews', { params });
    return response.data;
  },

  // GET /api/interviews/candidate/:candidateId
  getByCandidate: async (candidateId: number): Promise<ApiResponse<Interview[]>> => {
    const response: AxiosResponse<ApiResponse<Interview[]>> = await api.get(`/interviews/candidate/${candidateId}`);
    return response.data;
  },

  // GET /api/interviews/:id
  getById: async (id: number): Promise<ApiResponse<Interview>> => {
    const response: AxiosResponse<ApiResponse<Interview>> = await api.get(`/interviews/${id}`);
    return response.data;
  },

  // POST /api/interviews
  create: async (data: InterviewForm): Promise<ApiResponse<Interview>> => {
    const response: AxiosResponse<ApiResponse<Interview>> = await api.post('/interviews', data);
    return response.data;
  },

  // PUT /api/interviews/:id
  update: async (id: number, data: Partial<InterviewForm>): Promise<ApiResponse<Interview>> => {
    const response: AxiosResponse<ApiResponse<Interview>> = await api.put(`/interviews/${id}`, data);
    return response.data;
  },

  // PATCH /api/interviews/:id/outcome
  recordOutcome: async (id: number, data: InterviewOutcomeForm): Promise<ApiResponse<Interview>> => {
    const response: AxiosResponse<ApiResponse<Interview>> = await api.patch(`/interviews/${id}/outcome`, data);
    return response.data;
  },

  // DELETE /api/interviews/:id
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete(`/interviews/${id}`);
    return response.data;
  },
};

// Communications API
export const communicationsAPI = {
  // GET /api/communications
  getAll: async (params: { page?: number; limit?: number; candidateId?: number; type?: string } = {}): Promise<PaginatedResponse<any>> => {
    const response: AxiosResponse<PaginatedResponse<any>> = await api.get('/communications', { params });
    return response.data;
  },

  // GET /api/communications/templates
  getTemplates: async (params: { type?: string; context?: string } = {}): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/communications/templates', { params });
    return response.data;
  },

  // POST /api/communications/email/send
  sendEmail: async (data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/email/send', data);
    return response.data;
  },

  // POST /api/communications/sms/send
  sendSMS: async (data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/sms/send', data);
    return response.data;
  },

  // POST /api/communications/call/initiate
  initiateCall: async (data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/communications/call/initiate', data);
    return response.data;
  },

  // GET /api/communications/call/history/:candidateId
  getCallHistory: async (candidateId: number): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/communications/call/history/${candidateId}`);
    return response.data;
  },

  // GET /api/communications/windows-phone/status
  getWindowsPhoneStatus: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/communications/windows-phone/status');
    return response.data;
  },
};

// HR Users API
export const hrUsersAPI = {
  // GET /api/hr-users
  getAll: async (params: { active?: boolean; role?: string } = {}): Promise<ApiResponse<HrUser[]>> => {
    const response: AxiosResponse<ApiResponse<HrUser[]>> = await api.get('/hr-users', { params });
    return response.data;
  },

  // GET /api/hr-users/interviewers
  getInterviewers: async (): Promise<ApiResponse<HrUser[]>> => {
    const response: AxiosResponse<ApiResponse<HrUser[]>> = await api.get('/hr-users/interviewers');
    return response.data;
  },

  // GET /api/hr-users/:id
  getById: async (id: number): Promise<ApiResponse<HrUser>> => {
    const response: AxiosResponse<ApiResponse<HrUser>> = await api.get(`/hr-users/${id}`);
    return response.data;
  },
};

// Utility function per gestire errori API
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Si è verificato un errore inaspettato';
};

export default api;