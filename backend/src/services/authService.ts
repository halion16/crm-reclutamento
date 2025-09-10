import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  AuditAction,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_PERMISSIONS
} from '../types/auth';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  JWTPayload,
  UserSession,
  AuditLog,
  AccountLockout,
  PasswordPolicy
} from '../types/auth';

export class AuthService {
  private users: Map<string, User & { password: string }> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private auditLogs: AuditLog[] = [];
  private accountLockouts: Map<string, AccountLockout> = new Map();
  private refreshTokens: Map<string, { userId: string; sessionId: string; expiresAt: Date }> = new Map();

  private readonly JWT_SECRET = process.env.JWT_SECRET || 'crm-reclutamento-secret-key-2024';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'crm-refresh-secret-key-2024';
  private readonly ACCESS_TOKEN_EXPIRES = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRES = '7d'; // 7 days

  constructor() {
    this.initializeDefaultUsers();
  }

  // Inizializza utenti di default
  private async initializeDefaultUsers() {
    const defaultUsers = [
      {
        email: 'admin@crm.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'System',
        role: UserRole.SUPER_ADMIN,
        department: 'IT'
      },
      {
        email: 'hr@crm.com', 
        password: 'HrManager123!',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        department: 'Human Resources'
      },
      {
        email: 'recruiter@crm.com',
        password: 'Recruiter123!',
        firstName: 'John',
        lastName: 'Recruiter',
        role: UserRole.RECRUITER,
        department: 'Talent Acquisition'
      }
    ];

    for (const userData of defaultUsers) {
      if (!this.findUserByEmail(userData.email)) {
        // Hash password per utenti default
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await this.createUser({
          ...userData,
          password: hashedPassword
        });
      }
    }

    console.log('✅ Default users initialized');
  }

  // Registrazione nuovo utente
  async register(data: RegisterRequest, createdByUserId?: string): Promise<RegisterResponse> {
    try {
      // Validazione dati
      this.validateRegistrationData(data);

      // Verifica se utente già esiste
      if (this.findUserByEmail(data.email)) {
        return {
          success: false,
          user: null as any,
          message: 'Email già registrata'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Crea nuovo utente
      const user = await this.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.RECRUITER,
        department: data.department
      });

      // Audit log
      await this.createAuditLog({
        userId: createdByUserId || user.id,
        action: AuditAction.CREATE,
        resource: 'users',
        resourceId: user.id,
        newValues: { email: data.email, role: data.role },
        ip: '0.0.0.0',
        userAgent: 'system'
      });

      return {
        success: true,
        user: this.sanitizeUser(user),
        message: 'Utente creato con successo'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        user: null as any,
        message: error instanceof Error ? error.message : 'Errore durante la registrazione'
      };
    }
  }

  // Login utente
  async login(data: LoginRequest, deviceInfo: any): Promise<LoginResponse> {
    try {
      const user = this.findUserByEmail(data.email);
      
      if (!user) {
        await this.handleFailedLogin(data.email, deviceInfo);
        return {
          success: false,
          user: null as any,
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          message: 'Credenziali non valide'
        };
      }

      // Verifica account lockout
      if (this.isAccountLocked(user.id)) {
        return {
          success: false,
          user: null as any,
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          message: 'Account temporaneamente bloccato. Riprova più tardi.'
        };
      }

      // Verifica password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      
      if (!isPasswordValid) {
        await this.handleFailedLogin(data.email, deviceInfo);
        return {
          success: false,
          user: null as any,
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          message: 'Credenziali non valide'
        };
      }

      // Reset failed attempts
      this.accountLockouts.delete(user.id);

      // Genera tokens
      const session = await this.createUserSession(user, deviceInfo);
      const { accessToken, refreshToken } = await this.generateTokens(user, session.id);

      // Aggiorna ultima login
      user.lastLogin = new Date();
      this.users.set(user.id, user);

      // Audit log
      await this.createAuditLog({
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: 'auth',
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent
      });

      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        message: 'Login effettuato con successo'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        user: null as any,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        message: 'Errore durante il login'
      };
    }
  }

  // Logout utente
  async logout(sessionId: string, userId: string, deviceInfo: any): Promise<{ success: boolean; message: string }> {
    try {
      // Rimuovi sessione
      this.sessions.delete(sessionId);
      
      // Rimuovi refresh token associati
      for (const [token, data] of this.refreshTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.refreshTokens.delete(token);
        }
      }

      // Audit log
      await this.createAuditLog({
        userId,
        action: AuditAction.LOGOUT,
        resource: 'auth',
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent
      });

      return {
        success: true,
        message: 'Logout effettuato con successo'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Errore durante il logout'
      };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; expiresIn?: number; message: string }> {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      
      if (!tokenData || tokenData.expiresAt < new Date()) {
        this.refreshTokens.delete(refreshToken);
        return {
          success: false,
          message: 'Refresh token non valido o scaduto'
        };
      }

      const user = this.users.get(tokenData.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Utente non trovato o disattivato'
        };
      }

      // Genera nuovo access token
      const accessToken = this.generateAccessToken(user, tokenData.sessionId);

      return {
        success: true,
        accessToken,
        expiresIn: 15 * 60, // 15 minutes
        message: 'Token aggiornato con successo'
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Errore durante l\'aggiornamento del token'
      };
    }
  }

  // Verifica token JWT
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // Verifica che la sessione sia ancora attiva
      const session = this.sessions.get(decoded.sessionId);
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      // Aggiorna ultima attività
      session.lastActivity = new Date();
      this.sessions.set(session.id, session);

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Verifica permessi utente
  hasPermission(userRole: UserRole, resource: string, action: string): boolean {
    const rolePermissions = DEFAULT_PERMISSIONS[userRole];
    
    // Super admin ha tutti i permessi
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    return rolePermissions.some(perm => {
      return (perm.resource === '*' || perm.resource === resource) &&
             (perm.actions.includes('*') || perm.actions.includes(action));
    });
  }

  // Utilities private
  private async createUser(userData: any): Promise<User & { password: string }> {
    const user = {
      id: uuidv4(),
      email: userData.email.toLowerCase(),
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      department: userData.department,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'light' as const,
        language: 'it',
        timezone: 'Europe/Rome',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    };

    this.users.set(user.id, user);
    return user;
  }

  private findUserByEmail(email: string): (User & { password: string }) | undefined {
    return Array.from(this.users.values()).find(user => user.email === email.toLowerCase());
  }

  private async createUserSession(user: User, deviceInfo: any): Promise<UserSession> {
    const session: UserSession = {
      id: uuidv4(),
      userId: user.id,
      accessToken: '',
      refreshToken: '',
      deviceInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private async generateTokens(user: User, sessionId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const permissions = this.getUserPermissions(user.role);
    
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      sessionId
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.ACCESS_TOKEN_EXPIRES });
    const refreshToken = crypto.randomBytes(64).toString('hex');

    // Salva refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      sessionId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { accessToken, refreshToken };
  }

  private generateAccessToken(user: User, sessionId: string): string {
    const permissions = this.getUserPermissions(user.role);
    
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      sessionId
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.ACCESS_TOKEN_EXPIRES });
  }

  private getUserPermissions(role: UserRole): string[] {
    const rolePermissions = DEFAULT_PERMISSIONS[role];
    const permissions: string[] = [];

    rolePermissions.forEach(perm => {
      perm.actions.forEach(action => {
        permissions.push(`${perm.resource}:${action}`);
      });
    });

    return permissions;
  }

  private validateRegistrationData(data: RegisterRequest): void {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Email non valida');
    }

    if (!this.isPasswordValid(data.password)) {
      throw new Error('Password non valida. Deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Le password non coincidono');
    }

    if (!data.firstName || data.firstName.length < 2) {
      throw new Error('Nome deve essere di almeno 2 caratteri');
    }

    if (!data.lastName || data.lastName.length < 2) {
      throw new Error('Cognome deve essere di almeno 2 caratteri');
    }
  }

  private isPasswordValid(password: string): boolean {
    const policy = DEFAULT_PASSWORD_POLICY;
    
    if (password.length < policy.minLength || password.length > policy.maxLength) {
      return false;
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return false;
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }

    return true;
  }

  private async handleFailedLogin(email: string, deviceInfo: any): Promise<void> {
    const user = this.findUserByEmail(email);
    if (!user) return;

    let lockout = this.accountLockouts.get(user.id) || {
      userId: user.id,
      attempts: 0,
      isLocked: false
    };

    lockout.attempts += 1;

    if (lockout.attempts >= DEFAULT_PASSWORD_POLICY.lockoutAttempts) {
      lockout.isLocked = true;
      lockout.lockedAt = new Date();
      lockout.lockedUntil = new Date(Date.now() + DEFAULT_PASSWORD_POLICY.lockoutDuration * 60 * 1000);
    }

    this.accountLockouts.set(user.id, lockout);

    // Audit log
    await this.createAuditLog({
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: 'auth',
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      success: false,
      errorMessage: 'Invalid credentials'
    });
  }

  private isAccountLocked(userId: string): boolean {
    const lockout = this.accountLockouts.get(userId);
    if (!lockout || !lockout.isLocked) return false;

    // Verifica se il lockout è scaduto
    if (lockout.lockedUntil && lockout.lockedUntil < new Date()) {
      lockout.isLocked = false;
      lockout.attempts = 0;
      this.accountLockouts.set(userId, lockout);
      return false;
    }

    return true;
  }

  private sanitizeUser(user: User & { password?: string }): User {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async createAuditLog(data: Partial<AuditLog>): Promise<void> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      userId: data.userId || '',
      action: data.action || AuditAction.VIEW,
      resource: data.resource || '',
      resourceId: data.resourceId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ip: data.ip || '0.0.0.0',
      userAgent: data.userAgent || 'unknown',
      timestamp: new Date(),
      success: data.success !== undefined ? data.success : true,
      errorMessage: data.errorMessage
    };

    this.auditLogs.push(auditLog);
    
    // Mantieni solo gli ultimi 10000 log per evitare memory overflow
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  // Metodi pubblici per gestione utenti (per admin)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).map(user => this.sanitizeUser(user));
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? this.sanitizeUser(user) : null;
  }

  async updateUser(id: string, updates: Partial<User>, updatedByUserId: string): Promise<{ success: boolean; message: string }> {
    const user = this.users.get(id);
    if (!user) {
      return { success: false, message: 'Utente non trovato' };
    }

    const oldValues = { ...user };
    Object.assign(user, updates, { updatedAt: new Date() });
    this.users.set(id, user);

    // Audit log
    await this.createAuditLog({
      userId: updatedByUserId,
      action: AuditAction.UPDATE,
      resource: 'users',
      resourceId: id,
      oldValues,
      newValues: updates,
      ip: '0.0.0.0',
      userAgent: 'system'
    });

    return { success: true, message: 'Utente aggiornato con successo' };
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getActiveSessions(userId?: string): Promise<UserSession[]> {
    const sessions = Array.from(this.sessions.values())
      .filter(session => session.isActive && session.expiresAt > new Date());

    return userId ? sessions.filter(session => session.userId === userId) : sessions;
  }

  // === USER MANAGEMENT METHODS ===
  async getUsers(filters: any = {}, pagination: any = {}): Promise<User[]> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      users = users.filter(user => 
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }

    if (filters.department) {
      users = users.filter(user => user.department === filters.department);
    }

    if (filters.isActive !== undefined) {
      users = users.filter(user => user.isActive === filters.isActive);
    }

    // Apply pagination
    const { page = 1, limit = 20 } = pagination;
    const start = (page - 1) * limit;
    return users.slice(start, start + limit);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    // Update fields
    Object.assign(user, {
      ...updates,
      updatedAt: new Date()
    });

    this.users.set(userId, user);
    return user;
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    // Store custom permissions (in a real app, this would be in a separate table)
    if (!user.customPermissions) {
      user.customPermissions = [];
    }
    user.customPermissions = permissions;
    user.updatedAt = new Date();

    this.users.set(userId, user);
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async bulkUpdateUsers(action: string, userIds: string[], data?: any): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        const user = this.users.get(userId);
        if (!user) {
          errors.push(`User ${userId} not found`);
          continue;
        }

        switch (action) {
          case 'activate':
            user.isActive = true;
            break;
          case 'deactivate':
            user.isActive = false;
            break;
          case 'delete':
            user.isActive = false;
            break;
          case 'update_role':
            if (data?.role) {
              user.role = data.role;
            }
            break;
        }

        user.updatedAt = new Date();
        this.users.set(userId, user);
        updated++;
      } catch (error) {
        errors.push(`Error updating ${userId}: ${error}`);
      }
    }

    return { updated, errors };
  }
}

// Singleton instance
export const authService = new AuthService();