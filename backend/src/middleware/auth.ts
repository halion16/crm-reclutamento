import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { UserRole } from '../types/auth';

// Estende l'interfaccia Request per includere user e session
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        permissions: string[];
        sessionId: string;
      };
      deviceInfo?: {
        ip: string;
        userAgent: string;
        device: string;
        browser: string;
        os: string;
      };
    }
  }
}

// Middleware per autenticazione JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token di accesso richiesto',
        code: 'NO_TOKEN'
      });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido o scaduto',
        code: 'INVALID_TOKEN'
      });
    }

    // Aggiunge le informazioni utente alla request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      sessionId: decoded.sessionId
    };

    // Estrae informazioni dispositivo per audit
    req.deviceInfo = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      device: extractDevice(req.get('User-Agent') || ''),
      browser: extractBrowser(req.get('User-Agent') || ''),
      os: extractOS(req.get('User-Agent') || '')
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware per autorizzazione basata su ruoli
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Ruolo insufficiente.',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware per autorizzazione basata su permessi
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Verifica se l'utente ha il permesso specifico
    if (!authService.hasPermission(req.user.role, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `Accesso negato. Permesso richiesto: ${resource}:${action}`,
        code: 'INSUFFICIENT_PERMISSION',
        required: `${resource}:${action}`,
        permissions: req.user.permissions
      });
    }

    next();
  };
};

// Middleware per validare ownership di risorse
export const requireOwnership = (resourceIdParam: string = 'id', allowedRoles: UserRole[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Super admin e ruoli specificati saltano il controllo di ownership
    if (req.user.role === UserRole.SUPER_ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.userId;

    // Qui dovresti implementare la logica specifica per verificare 
    // se l'utente è owner della risorsa (ad es. candidato creato da lui)
    // Per ora accettiamo tutti gli utenti autenticati
    
    next();
  };
};

// Middleware per rate limiting (prevenzione attacchi bruteforce)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const userAttempts = rateLimitMap.get(key);
    
    // Reset window se necessario
    if (!userAttempts || now > userAttempts.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    // Incrementa tentativi
    userAttempts.count++;
    rateLimitMap.set(key, userAttempts);
    
    if (userAttempts.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Troppi tentativi. Riprova più tardi.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
    }
    
    // Aggiunge header informativi
    res.set({
      'X-RateLimit-Limit': maxAttempts.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxAttempts - userAttempts.count).toString(),
      'X-RateLimit-Reset': Math.ceil(userAttempts.resetTime / 1000).toString()
    });
    
    next();
  };
};

// Middleware per audit logging automatico
export const auditLog = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log audit dopo la risposta
      if (req.user && req.deviceInfo) {
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        // Non attendiamo il risultato per non rallentare la response
        setImmediate(async () => {
          try {
            await authService.createAuditLog({
              userId: req.user!.userId,
              action,
              resource,
              resourceId: req.params.id,
              ip: req.deviceInfo!.ip,
              userAgent: req.deviceInfo!.userAgent,
              success,
              errorMessage: success ? undefined : 'Request failed'
            });
          } catch (error) {
            console.error('Audit log error:', error);
          }
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Utilities per parsing User Agent
function extractDevice(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
  if (/Tablet/.test(userAgent)) return 'tablet';
  return 'desktop';
}

function extractBrowser(userAgent: string): string {
  if (/Chrome/.test(userAgent)) return 'Chrome';
  if (/Firefox/.test(userAgent)) return 'Firefox';
  if (/Safari/.test(userAgent)) return 'Safari';
  if (/Edge/.test(userAgent)) return 'Edge';
  if (/Opera/.test(userAgent)) return 'Opera';
  return 'Unknown';
}

function extractOS(userAgent: string): string {
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac OS/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iOS/.test(userAgent)) return 'iOS';
  return 'Unknown';
}

// Middleware helper per combinazioni comuni
export const adminOnly = [
  authenticateToken,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN])
];

export const hrManagerOrAbove = [
  authenticateToken, 
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER])
];

export const recruiterOrAbove = [
  authenticateToken,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.RECRUITER])
];

export const authenticatedOnly = [authenticateToken];