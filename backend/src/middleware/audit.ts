import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Audit logger middleware
export const auditLogger = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const startTime = Date.now();

    // Override res.send to capture response
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;

      // Log the action
      const auditData = {
        userId: req.user?.userId || 'anonymous',
        action,
        resource: req.route?.path || req.path,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        details: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          success,
          timestamp: new Date()
        }
      };

      // Create audit log entry
      authService.createAuditLog({
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        ip: auditData.ip,
        userAgent: auditData.userAgent,
        details: auditData.details
      }).catch(err => {
        console.error('Audit logging failed:', err);
      });

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};