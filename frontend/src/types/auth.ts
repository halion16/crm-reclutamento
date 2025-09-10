// Authentication Types per Frontend

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER', 
  RECRUITER = 'RECRUITER',
  INTERVIEWER = 'INTERVIEWER',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  preferences?: UserPreferences;
  customPermissions?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboardLayout?: any;
}

// Authentication DTOs
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  permissions: string[];
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

// Utility types per controllo permessi
export const RESOURCES = {
  CANDIDATES: 'candidates',
  INTERVIEWS: 'interviews',
  COMMUNICATIONS: 'communications', 
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  USERS: 'users',
  WORKFLOW: 'workflow',
  AI_FEATURES: 'ai_features',
  ADMIN: 'admin'
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read', 
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  APPROVE: 'approve',
  MANAGE: 'manage'
} as const;