import express from 'express';
import { authService } from '../services/authService';
import { 
  validateLogin, 
  validateRegistration, 
  handleValidationErrors,
  validateIdParam
} from '../middleware/validation';
import { 
  authRateLimit, 
  securityLogger
} from '../middleware/security';
import { logSensitiveDataMasking } from '../middleware/encryption';
import { 
  authenticateToken, 
  requireRole,
  auditLog 
} from '../middleware/auth';
import { UserRole } from '../types/auth';

const router = express.Router();

// Applica middleware di sicurezza a tutte le route auth
router.use(authRateLimit);
router.use(securityLogger);
// TEMP DISABLED: router.use(logSensitiveDataMasking());

// POST /auth/login - Login utente
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      device: extractDevice(req.get('User-Agent') || ''),
      browser: extractBrowser(req.get('User-Agent') || ''),
      os: extractOS(req.get('User-Agent') || '')
    };

    const result = await authService.login(
      { email, password, rememberMe },
      deviceInfo
    );

    if (result.success) {
      // Set secure HTTP-only cookie se rememberMe è true
      if (rememberMe) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
        });
      }

      res.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        message: result.message
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
        code: 'INVALID_CREDENTIALS'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /auth/register - Registrazione nuovo utente
router.post('/register', 
  validateRegistration,
  authenticateToken, // Solo utenti autenticati possono creare altri utenti
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const registrationData = req.body;
      const createdByUserId = req.user?.userId;

      const result = await authService.register(registrationData, createdByUserId);

      if (result.success) {
        res.status(201).json({
          success: true,
          user: result.user,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          code: 'REGISTRATION_FAILED'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la registrazione',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token richiesto',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (result.success) {
      res.json({
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        message: result.message
      });
    } else {
      // Rimuovi cookie se refresh token non valido
      res.clearCookie('refreshToken');
      
      res.status(401).json({
        success: false,
        message: result.message,
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il refresh del token',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /auth/logout - Logout utente
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.user?.sessionId;
    const userId = req.user?.userId;

    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Sessione non valida',
        code: 'INVALID_SESSION'
      });
    }

    const deviceInfo = {
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      device: extractDevice(req.get('User-Agent') || ''),
      browser: extractBrowser(req.get('User-Agent') || ''),
      os: extractOS(req.get('User-Agent') || '')
    };

    const result = await authService.logout(sessionId, userId, deviceInfo);

    // Rimuovi refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il logout',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /auth/me - Informazioni utente corrente
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido',
        code: 'INVALID_TOKEN'
      });
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user,
      permissions: req.user?.permissions || []
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle informazioni utente',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /auth/profile - Aggiorna profilo utente corrente
router.put('/profile', 
  authenticateToken,
  auditLog('UPDATE', 'user_profile'),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const allowedUpdates = ['firstName', 'lastName', 'preferences', 'avatar'];
      
      // Filtra solo i campi che l'utente può modificare
      const updates: any = {};
      for (const field of allowedUpdates) {
        if (req.body.hasOwnProperty(field)) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nessun campo valido da aggiornare',
          code: 'NO_VALID_UPDATES'
        });
      }

      const result = await authService.updateUser(userId!, updates, userId!);

      if (result.success) {
        const updatedUser = await authService.getUserById(userId!);
        
        res.json({
          success: true,
          user: updatedUser,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          code: 'UPDATE_FAILED'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'aggiornamento del profilo',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// GET /auth/sessions - Lista sessioni attive utente corrente
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const sessions = await authService.getActiveSessions(userId);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        isCurrentSession: session.id === req.user?.sessionId
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle sessioni',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /auth/sessions/:sessionId - Termina sessione specifica
router.delete('/sessions/:sessionId', 
  authenticateToken,
  validateIdParam,
  auditLog('DELETE', 'user_session'),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      // Verifica che la sessione appartenga all'utente
      const sessions = await authService.getActiveSessions(userId);
      const targetSession = sessions.find(s => s.id === sessionId);

      if (!targetSession) {
        return res.status(404).json({
          success: false,
          message: 'Sessione non trovata',
          code: 'SESSION_NOT_FOUND'
        });
      }

      const deviceInfo = {
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        device: extractDevice(req.get('User-Agent') || ''),
        browser: extractBrowser(req.get('User-Agent') || ''),
        os: extractOS(req.get('User-Agent') || '')
      };

      const result = await authService.logout(sessionId, userId!, deviceInfo);

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('Session delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la chiusura della sessione',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// GET /auth/audit - Audit logs (solo admin)
router.get('/audit',
  authenticateToken,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const auditLogs = await authService.getAuditLogs(limit);

      res.json({
        success: true,
        auditLogs,
        total: auditLogs.length
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dei log di audit',
        code: 'SERVER_ERROR'
      });
    }
  }
);

// Utilities per parsing User Agent (duplicate da auth middleware per completezza)
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

export default router;