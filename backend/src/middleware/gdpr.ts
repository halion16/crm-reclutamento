import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// GDPR Compliance Middleware per la gestione dei dati personali

// Tipi per GDPR
export interface GDPRConsent {
  id: string;
  userId: string;
  candidateId?: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  retentionPeriod: number; // in giorni
  version: string;
}

export enum ConsentType {
  DATA_PROCESSING = 'DATA_PROCESSING',
  MARKETING = 'MARKETING',
  PROFILING = 'PROFILING',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  COOKIES = 'COOKIES',
  AUTOMATED_DECISION_MAKING = 'AUTOMATED_DECISION_MAKING'
}

export enum LegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTERESTS = 'VITAL_INTERESTS',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS'
}

export interface DataRetentionPolicy {
  resource: string;
  purpose: string;
  retentionPeriod: number; // giorni
  autoDelete: boolean;
  deleteAfterDays?: number;
}

export interface PersonalDataField {
  field: string;
  category: 'basic' | 'sensitive' | 'special';
  required: boolean;
  purpose: string;
}

// Storage in-memory per demo (in produzione usare database)
const consents = new Map<string, GDPRConsent[]>();
const dataRetentionPolicies: DataRetentionPolicy[] = [
  {
    resource: 'candidates',
    purpose: 'recruitment_process',
    retentionPeriod: 365, // 1 anno
    autoDelete: true,
    deleteAfterDays: 730 // 2 anni se non assunto
  },
  {
    resource: 'interviews', 
    purpose: 'assessment_records',
    retentionPeriod: 180, // 6 mesi
    autoDelete: false
  },
  {
    resource: 'communications',
    purpose: 'recruitment_communication', 
    retentionPeriod: 90, // 3 mesi
    autoDelete: true
  }
];

// Campi dati personali per candidati
const personalDataFields: PersonalDataField[] = [
  { field: 'firstName', category: 'basic', required: true, purpose: 'identification' },
  { field: 'lastName', category: 'basic', required: true, purpose: 'identification' },
  { field: 'email', category: 'basic', required: true, purpose: 'communication' },
  { field: 'phone', category: 'basic', required: false, purpose: 'communication' },
  { field: 'dateOfBirth', category: 'sensitive', required: false, purpose: 'age_verification' },
  { field: 'address', category: 'basic', required: false, purpose: 'location_assessment' },
  { field: 'cv', category: 'basic', required: true, purpose: 'skills_assessment' },
  { field: 'coverLetter', category: 'basic', required: false, purpose: 'motivation_assessment' },
  { field: 'socialProfiles', category: 'basic', required: false, purpose: 'professional_background' }
];

// Middleware per verificare consenso GDPR
export const requireConsent = (consentType: ConsentType, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const candidateId = req.params.candidateId || req.body.candidateId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Autenticazione richiesta per verifica consenso',
          code: 'GDPR_AUTH_REQUIRED'
        });
      }

      // Verifica consenso esistente
      const userConsents = consents.get(candidateId || userId) || [];
      const relevantConsent = userConsents.find(c => 
        c.consentType === consentType && 
        c.granted && 
        !c.revokedAt
      );

      if (!relevantConsent) {
        return res.status(403).json({
          success: false,
          message: `Consenso GDPR richiesto per: ${consentType}`,
          code: 'GDPR_CONSENT_REQUIRED',
          consentRequired: {
            type: consentType,
            resource,
            purpose: getConsentPurpose(consentType)
          }
        });
      }

      // Verifica se il consenso è ancora valido (non scaduto)
      const isExpired = isConsentExpired(relevantConsent);
      if (isExpired) {
        return res.status(403).json({
          success: false,
          message: 'Consenso GDPR scaduto. Rinnovo richiesto.',
          code: 'GDPR_CONSENT_EXPIRED',
          expiredAt: relevantConsent.grantedAt,
          consentRequired: {
            type: consentType,
            resource,
            purpose: getConsentPurpose(consentType)
          }
        });
      }

      // Aggiunge informazioni consenso alla request
      req.gdprConsent = relevantConsent;
      
      next();
    } catch (error) {
      console.error('GDPR consent verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore verifica consenso GDPR',
        code: 'GDPR_ERROR'
      });
    }
  };
};

// Middleware per data minimization
export const dataMinimization = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Filtra i campi nel body della request
      if (req.body && typeof req.body === 'object') {
        const filteredBody: any = {};
        
        for (const field of allowedFields) {
          if (req.body.hasOwnProperty(field)) {
            filteredBody[field] = req.body[field];
          }
        }
        
        // Aggiunge metadati sui campi filtrati
        const removedFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        if (removedFields.length > 0) {
          console.log(`GDPR Data minimization: removed fields [${removedFields.join(', ')}] from request`);
        }
        
        req.body = filteredBody;
      }
      
      next();
    } catch (error) {
      console.error('Data minimization error:', error);
      next(); // Continua anche in caso di errore per non bloccare l'applicazione
    }
  };
};

// Middleware per pseudonimizzazione automatica
export const pseudonymizeData = (fieldsToMask: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      try {
        // Pseudonimizza la response se contiene dati personali
        if (data && typeof data === 'object') {
          const maskedData = pseudonymizeObject(data, fieldsToMask);
          return originalSend.call(this, maskedData);
        }
      } catch (error) {
        console.error('Pseudonymization error:', error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware per audit dei dati personali
export const auditPersonalDataAccess = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        // Log accesso ai dati personali
        const auditEntry = {
          timestamp: new Date(),
          userId: req.user.userId,
          action: req.method,
          resource,
          url: req.originalUrl,
          ip: req.deviceInfo?.ip || 'unknown',
          userAgent: req.deviceInfo?.userAgent || 'unknown',
          dataAccessed: extractPersonalDataFields(req.body)
        };
        
        console.log('Personal data access audit:', JSON.stringify(auditEntry, null, 2));
        
        // In produzione salvare in audit log dedicato
      }
      
      next();
    } catch (error) {
      console.error('Personal data audit error:', error);
      next();
    }
  };
};

// Middleware per controllo retention policy
export const enforceRetentionPolicy = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const policy = dataRetentionPolicies.find(p => p.resource === resource);
      
      if (policy) {
        // Aggiunge header informativi sulla retention
        res.set({
          'X-Data-Retention-Period': policy.retentionPeriod.toString(),
          'X-Data-Purpose': policy.purpose,
          'X-Auto-Delete': policy.autoDelete.toString()
        });
        
        // In produzione qui si implementerebbe la logica di controllo
        // delle date di creazione/modifica dei record
      }
      
      next();
    } catch (error) {
      console.error('Retention policy error:', error);
      next();
    }
  };
};

// Utilities
function getConsentPurpose(consentType: ConsentType): string {
  const purposes = {
    [ConsentType.DATA_PROCESSING]: 'Elaborazione dati personali per processo di selezione',
    [ConsentType.MARKETING]: 'Invio comunicazioni marketing e promozionali',
    [ConsentType.PROFILING]: 'Profilazione automatica e analisi competenze',
    [ConsentType.THIRD_PARTY_SHARING]: 'Condivisione dati con fornitori terzi',
    [ConsentType.COOKIES]: 'Utilizzo cookies e tecnologie di tracciamento',
    [ConsentType.AUTOMATED_DECISION_MAKING]: 'Decisioni automatizzate basate su algoritmi'
  };
  
  return purposes[consentType] || 'Scopo non specificato';
}

function isConsentExpired(consent: GDPRConsent): boolean {
  const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 anno in millisecondi
  const now = Date.now();
  const consentAge = now - consent.grantedAt.getTime();
  
  return consentAge > maxAge;
}

function pseudonymizeObject(obj: any, fieldsToMask: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => pseudonymizeObject(item, fieldsToMask));
  }
  
  const masked = { ...obj };
  
  for (const field of fieldsToMask) {
    if (masked.hasOwnProperty(field)) {
      masked[field] = maskValue(masked[field], field);
    }
  }
  
  // Ricorsione per oggetti nested
  for (const [key, value] of Object.entries(masked)) {
    if (typeof value === 'object' && value !== null) {
      masked[key] = pseudonymizeObject(value, fieldsToMask);
    }
  }
  
  return masked;
}

function maskValue(value: any, fieldName: string): string {
  if (!value) return value;
  
  const str = String(value);
  
  if (fieldName.toLowerCase().includes('email')) {
    const [local, domain] = str.split('@');
    if (domain) {
      return `${local.charAt(0)}***@${domain}`;
    }
  }
  
  if (fieldName.toLowerCase().includes('phone')) {
    return str.replace(/\d/g, '*');
  }
  
  if (fieldName.toLowerCase().includes('name')) {
    return str.charAt(0) + '*'.repeat(str.length - 1);
  }
  
  // Default masking
  if (str.length <= 2) return '*'.repeat(str.length);
  return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1);
}

function extractPersonalDataFields(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const personalFields: string[] = [];
  const personalFieldNames = personalDataFields.map(f => f.field);
  
  for (const [key, value] of Object.entries(data)) {
    if (personalFieldNames.includes(key) && value !== null && value !== undefined) {
      personalFields.push(key);
    }
  }
  
  return personalFields;
}

// Funzioni helper per gestire consensi
export const gdprService = {
  // Crea nuovo consenso
  async createConsent(consent: Omit<GDPRConsent, 'id' | 'grantedAt' | 'version'>): Promise<GDPRConsent> {
    const newConsent: GDPRConsent = {
      id: crypto.randomUUID(),
      grantedAt: new Date(),
      version: '1.0',
      ...consent
    };
    
    const key = consent.candidateId || consent.userId;
    const existingConsents = consents.get(key) || [];
    existingConsents.push(newConsent);
    consents.set(key, existingConsents);
    
    return newConsent;
  },
  
  // Revoca consenso
  async revokeConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const userConsents = consents.get(userId) || [];
    const consentIndex = userConsents.findIndex(c => c.consentType === consentType && c.granted && !c.revokedAt);
    
    if (consentIndex >= 0) {
      userConsents[consentIndex].revokedAt = new Date();
      consents.set(userId, userConsents);
      return true;
    }
    
    return false;
  },
  
  // Ottieni consensi utente
  async getUserConsents(userId: string): Promise<GDPRConsent[]> {
    return consents.get(userId) || [];
  },
  
  // Verifica consenso specifico
  async hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const userConsents = consents.get(userId) || [];
    const consent = userConsents.find(c => c.consentType === consentType && c.granted && !c.revokedAt);
    
    return consent ? !isConsentExpired(consent) : false;
  }
};

// Estende Request interface
declare global {
  namespace Express {
    interface Request {
      gdprConsent?: GDPRConsent;
    }
  }
}