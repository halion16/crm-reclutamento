// Authentication & Authorization Types

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
  password?: string;
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

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN', 
  HR_MANAGER = 'HR_MANAGER',
  RECRUITER = 'RECRUITER',
  INTERVIEWER = 'INTERVIEWER',
  VIEWER = 'VIEWER'
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Authentication DTOs
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: UserRole;
}

export interface RegisterResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Session Management
export interface UserSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Audit Trail
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE'
}

// Password Policy
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // Prevent reusing last N passwords
  maxAge: number; // Password expires after N days
  lockoutAttempts: number; // Lock account after N failed attempts
  lockoutDuration: number; // Lockout duration in minutes
}

// Account Lockout
export interface AccountLockout {
  userId: string;
  attempts: number;
  lockedAt?: Date;
  lockedUntil?: Date;
  isLocked: boolean;
}

// Default Permissions per Resource
export const RESOURCES = {
  CANDIDATES: 'candidates',
  INTERVIEWS: 'interviews', 
  COMMUNICATIONS: 'communications',
  REPORTS: 'reports',
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

// Default Role Permissions
export const DEFAULT_PERMISSIONS: Record<UserRole, Array<{resource: string, actions: string[]}>> = {
  [UserRole.SUPER_ADMIN]: [
    { resource: '*', actions: ['*'] } // All permissions
  ],
  [UserRole.ADMIN]: [
    { resource: RESOURCES.CANDIDATES, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.EXPORT] },
    { resource: RESOURCES.INTERVIEWS, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE] },
    { resource: RESOURCES.COMMUNICATIONS, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.REPORTS, actions: [ACTIONS.READ, ACTIONS.EXPORT] },
    { resource: RESOURCES.USERS, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.WORKFLOW, actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.MANAGE] },
    { resource: RESOURCES.AI_FEATURES, actions: [ACTIONS.READ, ACTIONS.UPDATE] }
  ],
  [UserRole.HR_MANAGER]: [
    { resource: RESOURCES.CANDIDATES, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.EXPORT] },
    { resource: RESOURCES.INTERVIEWS, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.COMMUNICATIONS, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.REPORTS, actions: [ACTIONS.READ, ACTIONS.EXPORT] },
    { resource: RESOURCES.WORKFLOW, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.AI_FEATURES, actions: [ACTIONS.READ] }
  ],
  [UserRole.RECRUITER]: [
    { resource: RESOURCES.CANDIDATES, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.INTERVIEWS, actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.COMMUNICATIONS, actions: [ACTIONS.CREATE, ACTIONS.READ] },
    { resource: RESOURCES.WORKFLOW, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.AI_FEATURES, actions: [ACTIONS.READ] }
  ],
  [UserRole.INTERVIEWER]: [
    { resource: RESOURCES.CANDIDATES, actions: [ACTIONS.READ] },
    { resource: RESOURCES.INTERVIEWS, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.COMMUNICATIONS, actions: [ACTIONS.READ] },
    { resource: RESOURCES.WORKFLOW, actions: [ACTIONS.READ] }
  ],
  [UserRole.VIEWER]: [
    { resource: RESOURCES.CANDIDATES, actions: [ACTIONS.READ] },
    { resource: RESOURCES.INTERVIEWS, actions: [ACTIONS.READ] },
    { resource: RESOURCES.REPORTS, actions: [ACTIONS.READ] }
  ]
};

// Default Password Policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 5,
  maxAge: 90, // 90 days
  lockoutAttempts: 5,
  lockoutDuration: 15 // 15 minutes
};