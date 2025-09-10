import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Data Encryption Middleware per protezione dati sensibili

// Configurazione encryption
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'crm-encryption-key-2024-very-secret-key-32chars';
const IV_LENGTH = 12; // Per AES-GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

// Tipi per dati crittografati
export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
}

export interface FieldEncryptionConfig {
  field: string;
  encrypt: boolean;
  saltPerField?: boolean; // Se true, usa salt diverso per ogni campo
}

// Campi sensibili che richiedono crittografia
const SENSITIVE_FIELDS = [
  'ssn', 'fiscalCode', 'dateOfBirth', 'bankAccount', 
  'creditCard', 'passport', 'drivingLicense',
  'personalNotes', 'medicalInfo', 'backgroundCheck'
];

// Classe per gestione crittografia
class EncryptionService {
  private key: Buffer;

  constructor() {
    // Deriva chiave crittografica dal secret
    this.key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  }

  // Crittografia singolo valore
  encrypt(plaintext: string, salt?: string): EncryptedData {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext for encryption');
      }

      const iv = crypto.randomBytes(IV_LENGTH);
      const usedSalt = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
      
      // Deriva chiave specifica per questo valore
      const derivedKey = crypto.scryptSync(this.key, usedSalt, 32);
      
      const cipher = crypto.createCipher('aes-256-gcm');
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: usedSalt.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrittografia singolo valore
  decrypt(encryptedData: EncryptedData): string {
    try {
      const { encrypted, iv, tag, salt } = encryptedData;
      
      if (!encrypted || !iv || !tag) {
        throw new Error('Invalid encrypted data structure');
      }

      const usedSalt = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
      const derivedKey = crypto.scryptSync(this.key, usedSalt, 32);
      
      const decipher = crypto.createDecipher('aes-256-gcm');
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Crittografia oggetto con campi specificati
  encryptObject(obj: any, fieldsConfig: FieldEncryptionConfig[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const config of fieldsConfig) {
      if (config.encrypt && result.hasOwnProperty(config.field)) {
        const value = result[config.field];
        
        if (value !== null && value !== undefined) {
          try {
            const salt = config.saltPerField ? crypto.randomBytes(SALT_LENGTH).toString('hex') : undefined;
            result[config.field] = this.encrypt(String(value), salt);
            
            // Aggiunge metadata per identificare campo crittografato
            result[`${config.field}_encrypted`] = true;
          } catch (error) {
            console.error(`Failed to encrypt field ${config.field}:`, error);
            // Mantiene valore originale in caso di errore
          }
        }
      }
    }

    return result;
  }

  // Decrittografia oggetto
  decryptObject(obj: any, fieldsConfig: FieldEncryptionConfig[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const config of fieldsConfig) {
      if (config.encrypt && result.hasOwnProperty(config.field)) {
        const value = result[config.field];
        const isEncrypted = result[`${config.field}_encrypted`];
        
        if (isEncrypted && value && typeof value === 'object') {
          try {
            result[config.field] = this.decrypt(value as EncryptedData);
            delete result[`${config.field}_encrypted`];
          } catch (error) {
            console.error(`Failed to decrypt field ${config.field}:`, error);
            // Mantiene valore crittografato in caso di errore
          }
        }
      }
    }

    return result;
  }

  // Hash sicuro per password e dati sensibili
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.scryptSync(data, usedSalt, 64).toString('hex');
    
    return { hash, salt: usedSalt };
  }

  // Verifica hash
  verifyHash(data: string, hash: string, salt: string): boolean {
    try {
      const hashedData = crypto.scryptSync(data, salt, 64).toString('hex');
      return hashedData === hash;
    } catch (error) {
      return false;
    }
  }

  // Genera token sicuro
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Maschera parziale per display (non crittografia)
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 0);
    }
    
    const visible = data.substring(0, visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return visible + masked;
  }
}

// Singleton instance
const encryptionService = new EncryptionService();

// Middleware per crittografia automatica dei dati in ingresso
export const encryptSensitiveFields = (fieldsConfig?: FieldEncryptionConfig[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return next();
      }

      // Usa configurazione fornita o default per campi sensibili
      const config = fieldsConfig || SENSITIVE_FIELDS.map(field => ({
        field,
        encrypt: true,
        saltPerField: true
      }));

      // Crittografa i campi sensibili nel body
      req.body = encryptionService.encryptObject(req.body, config);
      
      next();
    } catch (error) {
      console.error('Field encryption middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore crittografia dati',
        code: 'ENCRYPTION_ERROR'
      });
    }
  };
};

// Middleware per decrittografia automatica dei dati in uscita
export const decryptSensitiveFields = (fieldsConfig?: FieldEncryptionConfig[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      try {
        if (data && typeof data === 'object') {
          const config = fieldsConfig || SENSITIVE_FIELDS.map(field => ({
            field,
            encrypt: true,
            saltPerField: true
          }));

          // Decrittografa i dati prima dell'invio
          const decryptedData = Array.isArray(data) 
            ? data.map(item => encryptionService.decryptObject(item, config))
            : encryptionService.decryptObject(data, config);

          return originalSend.call(this, decryptedData);
        }
      } catch (error) {
        console.error('Field decryption middleware error:', error);
        // In caso di errore, invia i dati così come sono
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware per hash delle password
export const hashPasswords = (passwordFields: string[] = ['password', 'newPassword']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return next();
      }

      for (const field of passwordFields) {
        if (req.body[field]) {
          const { hash, salt } = encryptionService.hash(req.body[field]);
          req.body[field] = hash;
          req.body[`${field}Salt`] = salt;
        }
      }
      
      next();
    } catch (error) {
      console.error('Password hashing middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore hashing password',
        code: 'HASHING_ERROR'
      });
    }
  };
};

// Middleware per validazione sicurezza password
export const validatePasswordSecurity = (passwordField: string = 'password') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const password = req.body[passwordField];
      
      if (!password) {
        return next(); // Skip se no password nel body
      }

      const validationResult = validatePassword(password);
      
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password non sicura',
          code: 'WEAK_PASSWORD',
          requirements: validationResult.failedRequirements
        });
      }
      
      next();
    } catch (error) {
      console.error('Password validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore validazione password',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

// Middleware per masking automatico dei dati sensibili nel log
export const logSensitiveDataMasking = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Override console.log temporaneo per questa request
    const originalConsoleLog = console.log;
    
    console.log = (...args: any[]) => {
      const maskedArgs = args.map(arg => {
        if (typeof arg === 'string') {
          // Maschera pattern comuni di dati sensibili
          return arg
            .replace(/password["\s]*:?\s*["'][^"']*["']/gi, 'password: "***"')
            .replace(/token["\s]*:?\s*["'][^"']*["']/gi, 'token: "***"')
            .replace(/ssn["\s]*:?\s*["'][^"']*["']/gi, 'ssn: "***"')
            .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****'); // Credit card
        }
        
        if (typeof arg === 'object' && arg !== null) {
          return maskObjectForLogging(arg);
        }
        
        return arg;
      });
      
      originalConsoleLog.apply(console, maskedArgs);
    };
    
    // Ripristina console.log dopo la response
    res.on('finish', () => {
      console.log = originalConsoleLog;
    });
    
    next();
  };
};

// Utilities
function validatePassword(password: string): { isValid: boolean; failedRequirements: string[] } {
  const requirements = [
    { test: (p: string) => p.length >= 8, message: 'Almeno 8 caratteri' },
    { test: (p: string) => /[A-Z]/.test(p), message: 'Almeno una maiuscola' },
    { test: (p: string) => /[a-z]/.test(p), message: 'Almeno una minuscola' },
    { test: (p: string) => /\d/.test(p), message: 'Almeno un numero' },
    { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'Almeno un carattere speciale' },
    { test: (p: string) => !/(.)\1{2,}/.test(p), message: 'Non più di 2 caratteri consecutivi uguali' },
    { test: (p: string) => !/^(password|123456|qwerty)/i.test(p), message: 'Non usare password comuni' }
  ];

  const failedRequirements = requirements
    .filter(req => !req.test(password))
    .map(req => req.message);

  return {
    isValid: failedRequirements.length === 0,
    failedRequirements
  };
}

function maskObjectForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskObjectForLogging(item));
  }

  const masked = { ...obj };
  
  // Campi da mascherare nei log
  const fieldsToMask = [
    'password', 'token', 'secret', 'key', 'ssn', 'fiscalCode', 
    'creditCard', 'bankAccount', 'email', 'phone'
  ];

  for (const field of fieldsToMask) {
    if (masked.hasOwnProperty(field)) {
      masked[field] = '***MASKED***';
    }
  }

  return masked;
}

// Esporta servizio per uso diretto
export { encryptionService };

// Helper per configurazioni comuni
export const encryptionConfigs = {
  candidatePersonalData: [
    { field: 'ssn', encrypt: true, saltPerField: true },
    { field: 'fiscalCode', encrypt: true, saltPerField: true },
    { field: 'dateOfBirth', encrypt: true, saltPerField: false },
    { field: 'personalNotes', encrypt: true, saltPerField: true }
  ],
  
  communicationData: [
    { field: 'phoneNumber', encrypt: true, saltPerField: false },
    { field: 'personalEmail', encrypt: true, saltPerField: false },
    { field: 'emergencyContact', encrypt: true, saltPerField: true }
  ],
  
  sensitiveDocuments: [
    { field: 'backgroundCheck', encrypt: true, saltPerField: true },
    { field: 'medicalCertificate', encrypt: true, saltPerField: true },
    { field: 'references', encrypt: true, saltPerField: true }
  ]
};