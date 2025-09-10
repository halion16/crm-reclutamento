import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard Types
export interface DashboardStats {
  totalCandidates: number;
  activeCandidates: number;
  scheduledInterviews: number;
  completedInterviewsToday: number;
  candidatesByStatus: Record<string, number>;
  interviewsByPhase: Record<string, number>;
  interviewsByStatus: Record<string, number>;
  recentActivity: ActivityLogItem[];
}

export interface ActivityLogItem {
  id: number;
  activityType: string;
  description: string;
  performedAt: string;
  candidate?: {
    firstName: string;
    lastName: string;
    positionApplied?: string;
  };
  interview?: {
    interviewPhase: number;
  };
  performedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface TrendData {
  candidatesTrend: Array<{
    date: string;
    count: number;
  }>;
  interviewsTrend: Array<{
    date: string;
    count: number;
    outcome: string;
  }>;
  communicationsTrend: Array<{
    date: string;
    communication_type: string;
    count: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export interface HRPerformance {
  id: number;
  name: string;
  role: string;
  stats: {
    candidatesCreated: number;
    interviewsConducted: number;
    interviewsCompleted: number;
    positiveOutcomes: number;
    communicationsSent: number;
    communicationsSuccessful: number;
    successRate: number;
    communicationSuccessRate: number;
  };
}

export interface UpcomingInterview {
  id: number;
  candidateId: number;
  interviewPhase: number;
  scheduledDate: string;
  scheduledTime: string;
  interviewType: string;
  meetingUrl?: string;
  status: string;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    positionApplied?: string;
  };
  primaryInterviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  secondaryInterviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DashboardAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  count: number;
  action: string;
}

// Dashboard API
export const dashboardAPI = {
  // GET /api/dashboard/stats - Statistiche generali
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await api.get('/dashboard/stats');
    return response.data;
  },

  // GET /api/dashboard/trends - Tendenze temporali
  getTrends: async (days: number = 30): Promise<ApiResponse<TrendData>> => {
    const response: AxiosResponse<ApiResponse<TrendData>> = await api.get('/dashboard/trends', {
      params: { days }
    });
    return response.data;
  },

  // GET /api/dashboard/performance - Performance team HR
  getPerformance: async (): Promise<ApiResponse<HRPerformance[]>> => {
    const response: AxiosResponse<ApiResponse<HRPerformance[]>> = await api.get('/dashboard/performance');
    return response.data;
  },

  // GET /api/dashboard/upcoming - Prossimi appuntamenti
  getUpcomingInterviews: async (): Promise<ApiResponse<UpcomingInterview[]>> => {
    const response: AxiosResponse<ApiResponse<UpcomingInterview[]>> = await api.get('/dashboard/upcoming');
    return response.data;
  },

  // GET /api/dashboard/alerts - Alert e notifiche
  getAlerts: async (): Promise<ApiResponse<DashboardAlert[]>> => {
    const response: AxiosResponse<ApiResponse<DashboardAlert[]>> = await api.get('/dashboard/alerts');
    return response.data;
  }
};

// Utility functions
export const formatActivityDescription = (activity: ActivityLogItem): string => {
  const candidateName = activity.candidate 
    ? `${activity.candidate.firstName} ${activity.candidate.lastName}`
    : 'Candidato';

  return activity.description.replace(/candidato/i, candidateName);
};

export const getActivityIcon = (activityType: string): string => {
  const iconMap: Record<string, string> = {
    'CANDIDATE_CREATED': '👤',
    'INTERVIEW_SCHEDULED': '📅',
    'OUTCOME_RECORDED': '✅',
    'STATUS_CHANGED': '🔄',
    'EMAIL_SENT': '📧',
    'SMS_SENT': '📱',
    'CALL_INITIATED': '📞',
    'CALL_COMPLETED': '☎️',
    'INTERVIEW_UPDATED': '✏️',
    'CANDIDATE_UPDATED': '👤'
  };

  return iconMap[activityType] || '📋';
};

export const getAlertColor = (type: DashboardAlert['type']): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (type) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    case 'success': return 'success';
    default: return 'default';
  }
};

// Utility function per gestire errori API
export const handleDashboardApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Si è verificato un errore inaspettato';
};

export default dashboardAPI;