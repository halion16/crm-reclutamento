import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';

// Input Validation & Sanitization Middleware

// Middleware per gestire risultati validazione
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    return res.status(400).json({
      success: false,
      message: 'Dati di input non validi',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  
  next();
};

// Validazioni per candidati
export const validateCandidate = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Nome può contenere solo lettere, spazi, apostrofi e trattini'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cognome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Cognome può contenere solo lettere, spazi, apostrofi e trattini'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email troppo lunga'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[(]?[\d\s\-\(\)]{6,20}$/)
    .withMessage('Numero di telefono non valido'),
    
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Data di nascita non valida (formato YYYY-MM-DD)')
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - birthDate.getFullYear();
        
        if (age < 16 || age > 100) {
          throw new Error('Età deve essere tra 16 e 100 anni');
        }
      }
      return true;
    }),
    
  body('position')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Posizione deve essere tra 2 e 100 caratteri'),
    
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Esperienza deve essere un numero tra 0 e 50 anni'),
    
  body('skills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Skills deve essere un array con massimo 20 elementi')
    .custom((skills) => {
      if (Array.isArray(skills)) {
        return skills.every(skill => 
          typeof skill === 'string' && 
          skill.trim().length >= 2 && 
          skill.trim().length <= 50
        );
      }
      return true;
    })
    .withMessage('Ogni skill deve essere una stringa tra 2 e 50 caratteri'),
    
  body('source')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Fonte candidatura troppo lunga'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Note non possono superare 1000 caratteri'),
    
  handleValidationErrors
];

// Validazioni per colloqui
export const validateInterview = [
  body('candidateId')
    .isUUID()
    .withMessage('ID candidato non valido'),
    
  body('interviewerId')
    .isUUID()
    .withMessage('ID intervistatore non valido'),
    
  body('scheduledAt')
    .isISO8601()
    .withMessage('Data e ora colloquio non valida')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      
      if (scheduledDate <= now) {
        throw new Error('Data colloquio deve essere futura');
      }
      
      // Verifica orari lavorativi (8-18, lun-ven)
      const hour = scheduledDate.getHours();
      const day = scheduledDate.getDay();
      
      if (day === 0 || day === 6) { // Domenica = 0, Sabato = 6
        throw new Error('Colloqui possono essere programmati solo nei giorni lavorativi');
      }
      
      if (hour < 8 || hour >= 18) {
        throw new Error('Colloqui possono essere programmati solo dalle 8:00 alle 18:00');
      }
      
      return true;
    }),
    
  body('duration')
    .isInt({ min: 15, max: 180 })
    .withMessage('Durata deve essere tra 15 e 180 minuti'),
    
  body('phase')
    .isIn(['phone_screening', 'technical_interview', 'hr_interview', 'final_interview'])
    .withMessage('Fase colloquio non valida'),
    
  body('type')
    .isIn(['phone', 'video', 'in_person'])
    .withMessage('Tipo colloquio non valido'),
    
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location troppo lunga'),
    
  body('meetingUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('URL meeting non valido'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Note non possono superare 1000 caratteri'),
    
  handleValidationErrors
];

// Validazioni per utenti
export const validateUser = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
    
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Nome può contenere solo lettere'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cognome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Cognome può contenere solo lettere'),
    
  body('role')
    .isIn(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'VIEWER'])
    .withMessage('Ruolo non valido'),
    
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dipartimento troppo lungo'),
    
  handleValidationErrors
];

// Validazioni per login
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password richiesta'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me deve essere boolean'),
    
  handleValidationErrors
];

// Validazioni per registrazione
export const validateRegistration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password deve essere tra 8 e 128 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password deve contenere almeno: una minuscola, una maiuscola, un numero e un carattere speciale'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Le password non coincidono');
      }
      return true;
    }),
    
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve essere tra 2 e 50 caratteri'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cognome deve essere tra 2 e 50 caratteri'),
    
  handleValidationErrors
];

// Validazioni per parametri URL
export const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('ID non valido'),
    
  handleValidationErrors
];

// Validazioni per query parameters
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Numero pagina deve essere tra 1 e 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve essere tra 1 e 100'),
    
  query('sortBy')
    .optional()
    .isAlphanumeric('en-US', { ignore: '_' })
    .withMessage('Campo ordinamento non valido'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordine deve essere asc o desc'),
    
  handleValidationErrors
];

// Validazioni per filtri di ricerca
export const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Termine di ricerca deve essere tra 2 e 100 caratteri')
    .matches(/^[a-zA-Z0-9\s@.-]+$/)
    .withMessage('Termine di ricerca contiene caratteri non validi'),
    
  query('status')
    .optional()
    .isIn(['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
    .withMessage('Status non valido'),
    
  query('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Posizione troppo lunga'),
    
  handleValidationErrors
];

// Validazioni per comunicazioni
export const validateCommunication = [
  body('candidateId')
    .isUUID()
    .withMessage('ID candidato non valido'),
    
  body('type')
    .isIn(['email', 'sms', 'phone_call'])
    .withMessage('Tipo comunicazione non valido'),
    
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Oggetto deve essere tra 1 e 200 caratteri'),
    
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Contenuto deve essere tra 1 e 5000 caratteri'),
    
  body('template')
    .optional()
    .isAlphanumeric('en-US', { ignore: '_' })
    .withMessage('Template non valido'),
    
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Data programmazione non valida')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Data programmazione deve essere futura');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Sanitizzazione generica per prevenire XSS
export const sanitizeHtml = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObjectValues(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObjectValues(req.query);
    }
    
    next();
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore sanitizzazione input',
      code: 'SANITIZATION_ERROR'
    });
  }
};

// Validazione file upload
export const validateFileUpload = (allowedMimes: string[], maxSize: number = 5 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(); // No file, continua
      }
      
      // Verifica tipo MIME
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Tipo file non supportato. Tipi consentiti: ${allowedMimes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
      }
      
      // Verifica dimensione
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File troppo grande. Dimensione massima: ${Math.round(maxSize / (1024 * 1024))}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
      
      // Verifica nome file
      if (!/^[a-zA-Z0-9._-]+$/.test(req.file.originalname)) {
        return res.status(400).json({
          success: false,
          message: 'Nome file contiene caratteri non validi',
          code: 'INVALID_FILENAME'
        });
      }
      
      next();
    } catch (error) {
      console.error('File validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore validazione file',
        code: 'FILE_VALIDATION_ERROR'
      });
    }
  };
};

// Utilities
function sanitizeObjectValues(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return sanitizeValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectValues(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitizza anche le chiavi
    const cleanKey = sanitizeValue(key);
    sanitized[cleanKey] = sanitizeObjectValues(value);
  }
  
  return sanitized;
}

function sanitizeValue(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Rimuove tag HTML e script
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload/gi, '')
    .replace(/onerror/gi, '')
    .replace(/onclick/gi, '')
    .trim();
}

// Validazioni personalizzate per campi specifici
export const customValidators = {
  // Validatore per codice fiscale italiano
  validateCodiceFiscale: (value: string): boolean => {
    const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
    return cfRegex.test(value?.toUpperCase() || '');
  },
  
  // Validatore per partita IVA italiana
  validatePartitaIva: (value: string): boolean => {
    const piRegex = /^[0-9]{11}$/;
    if (!piRegex.test(value || '')) return false;
    
    // Algoritmo di controllo P.IVA
    const digits = value.split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < 10; i++) {
      let digit = digits[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit = digit - 9;
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[10];
  },
  
  // Validatore per IBAN
  validateIban: (value: string): boolean => {
    const iban = value?.replace(/\s/g, '').toUpperCase() || '';
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    
    if (!ibanRegex.test(iban) || iban.length !== 27) return false;
    
    // Algoritmo modulo 97
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (char) => 
      (char.charCodeAt(0) - 55).toString()
    );
    
    // Calcolo modulo 97 per stringhe lunghe
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    
    return remainder === 1;
  }
};

// Export configurazioni comuni
export const validationConfigs = {
  pdfUpload: validateFileUpload(['application/pdf'], 10 * 1024 * 1024), // 10MB
  imageUpload: validateFileUpload(['image/jpeg', 'image/png', 'image/gif'], 5 * 1024 * 1024), // 5MB
  documentUpload: validateFileUpload([
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ], 15 * 1024 * 1024) // 15MB
};