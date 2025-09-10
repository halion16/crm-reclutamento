// Enterprise Security & Compliance Middleware
// Esportazioni centrali per tutti i middleware di sicurezza

// Authentication & Authorization
export {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnership,
  rateLimit,
  auditLog,
  adminOnly,
  hrManagerOrAbove,
  recruiterOrAbove,
  authenticatedOnly
} from './auth';

// GDPR Compliance
export {
  requireConsent,
  dataMinimization,
  pseudonymizeData,
  auditPersonalDataAccess,
  enforceRetentionPolicy,
  gdprService,
  ConsentType,
  LegalBasis
} from './gdpr';

// Data Encryption
export {
  encryptSensitiveFields,
  decryptSensitiveFields,
  hashPasswords,
  validatePasswordSecurity,
  logSensitiveDataMasking,
  encryptionService,
  encryptionConfigs
} from './encryption';

// Input Validation
export {
  handleValidationErrors,
  validateCandidate,
  validateInterview,
  validateUser,
  validateLogin,
  validateRegistration,
  validateIdParam,
  validatePaginationQuery,
  validateSearchQuery,
  validateCommunication,
  sanitizeHtml,
  validateFileUpload,
  customValidators,
  validationConfigs
} from './validation';

// General Security
export {
  corsConfig,
  helmetConfig,
  generalRateLimit,
  authRateLimit,
  sensitiveApiRateLimit,
  validateUserAgent,
  csrfProtection,
  securityLogger,
  blockSuspiciousIPs,
  preventPathTraversal,
  sanitizeHeaders,
  requestTimeout,
  fullSecurityMiddleware,
  sensitiveApiSecurity,
  authSecurity,
  securityUtils,
  securityConfigs
} from './security';

// Configurazioni middleware preconfigurate per scenari comuni

// Middleware per API pubbliche (senza autenticazione)
export const publicApiMiddleware = [
  sanitizeHtml
];

// Middleware per API protette (con autenticazione)
export const protectedApiMiddleware = [
  authenticateToken,
  sensitiveApiRateLimit,
  auditPersonalDataAccess('api'),
  enforceRetentionPolicy('api_access')
];

// Middleware per operazioni CRUD sui candidati
export const candidateApiMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('candidates', 'read'),
  validatePaginationQuery,
  validateSearchQuery
];

// Middleware per creazione candidati
export const createCandidateMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('candidates', 'create'),
  requireConsent(ConsentType.DATA_PROCESSING, 'candidates'),
  validateCandidate,
  encryptSensitiveFields(encryptionConfigs.candidatePersonalData),
  dataMinimization([
    'firstName', 'lastName', 'email', 'phone', 'position',
    'experience', 'skills', 'source', 'notes', 'cv'
  ])
];

// Middleware per aggiornamento candidati
export const updateCandidateMiddleware = [
  ...protectedApiMiddleware,
  validateIdParam,
  requirePermission('candidates', 'update'),
  requireOwnership('candidateId', []),
  validateCandidate,
  encryptSensitiveFields(encryptionConfigs.candidatePersonalData),
  auditLog('UPDATE', 'candidates')
];

// Middleware per eliminazione candidati (GDPR compliant)
export const deleteCandidateMiddleware = [
  ...protectedApiMiddleware,
  validateIdParam,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']),
  requirePermission('candidates', 'delete'),
  auditLog('DELETE', 'candidates')
];

// Middleware per colloqui
export const interviewApiMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('interviews', 'read')
];

export const createInterviewMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('interviews', 'create'),
  validateInterview,
  auditLog('CREATE', 'interviews')
];

export const updateInterviewMiddleware = [
  ...protectedApiMiddleware,
  validateIdParam,
  requirePermission('interviews', 'update'),
  validateInterview,
  auditLog('UPDATE', 'interviews')
];

// Middleware per comunicazioni
export const communicationMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('communications', 'create'),
  requireConsent(ConsentType.MARKETING, 'communications'),
  validateCommunication,
  encryptSensitiveFields(encryptionConfigs.communicationData),
  auditLog('CREATE', 'communications')
];

// Middleware per amministrazione utenti
export const userAdminMiddleware = [
  ...protectedApiMiddleware,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  requirePermission('users', 'manage')
];

export const createUserMiddleware = [
  ...userAdminMiddleware,
  validateUser,
  validatePasswordSecurity(),
  hashPasswords(),
  auditLog('CREATE', 'users')
];

export const updateUserMiddleware = [
  ...userAdminMiddleware,
  validateIdParam,
  validateUser,
  auditLog('UPDATE', 'users')
];

// Middleware per export dati (GDPR compliant)
export const dataExportMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('reports', 'export'),
  pseudonymizeData(['email', 'phone', 'firstName', 'lastName']),
  auditLog('EXPORT', 'data'),
  sensitiveApiRateLimit
];

// Middleware per report e analytics
export const reportingMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('reports', 'read'),
  pseudonymizeData(['email', 'phone'])
];

// Middleware per operazioni AI/ML
export const aiOperationsMiddleware = [
  ...protectedApiMiddleware,
  requirePermission('ai_features', 'read'),
  requireConsent(ConsentType.PROFILING, 'ai_analysis'),
  sensitiveApiRateLimit,
  auditLog('AI_ANALYSIS', 'candidates')
];

// Middleware per backup/restore (super admin only)
export const backupMiddleware = [
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  sensitiveApiRateLimit,
  auditLog('BACKUP', 'system')
];

// Middleware per audit logs (admin only)
export const auditLogMiddleware = [
  ...protectedApiMiddleware,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  requirePermission('admin', 'read'),
  validatePaginationQuery
];

// Middleware per health check (pubblico ma limitato)
export const healthCheckMiddleware = [
  generalRateLimit,
  securityLogger
];

// Middleware per upload file
export const fileUploadMiddleware = [
  ...protectedApiMiddleware,
  validationConfigs.documentUpload,
  auditLog('UPLOAD', 'files')
];

// Configurazioni per diversi ambienti
export const environmentConfigs = {
  development: {
    security: false, // Disabilita alcune protezioni per development
    encryption: false, // Disabilita encryption per test più facili
    rateLimit: false, // Rate limiting rilassato
    logging: 'verbose'
  },
  
  staging: {
    security: true,
    encryption: true,
    rateLimit: true,
    logging: 'normal'
  },
  
  production: {
    security: true,
    encryption: true,
    rateLimit: true,
    logging: 'minimal',
    strictMode: true
  }
};

// Helper per configurare middleware dinamicamente
export const configureMiddleware = (config: typeof environmentConfigs.production) => {
  const middleware = [];
  
  if (config.security) {
    middleware.push(...fullSecurityMiddleware);
  }
  
  if (config.rateLimit) {
    middleware.push(generalRateLimit);
  }
  
  return middleware;
};

// Export default per uso semplificato
export default {
  auth: protectedApiMiddleware,
  public: publicApiMiddleware,
  candidates: candidateApiMiddleware,
  interviews: interviewApiMiddleware,
  communications: communicationMiddleware,
  admin: userAdminMiddleware,
  reports: reportingMiddleware
};