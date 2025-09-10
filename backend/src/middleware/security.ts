import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Security Middleware per protezione generale dell'applicazione

// Configurazione CORS sicura
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Lista domini autorizzati
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://crm-reclutamento.company.com',
      // Aggiungi altri domini autorizzati qui
    ];

    // Consenti richieste senza origin (mobile apps, Postman, etc) solo in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorizzato da CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-API-Version',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ],
  maxAge: 86400 // 24 ore
});

// Configurazione Helmet per header di sicurezza
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disabilitato per compatibilità
  hsts: {
    maxAge: 31536000, // 1 anno
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Rate limiting configurazione
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 1000, // Limite di 1000 requests per IP per finestra
  message: {
    success: false,
    message: 'Troppe richieste da questo IP, riprova più tardi.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Troppe richieste da questo IP, riprova più tardi.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting strict per autenticazione
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 10, // Solo 10 tentativi di login per IP per finestra
  message: {
    success: false,
    message: 'Troppi tentativi di login, riprova più tardi.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Non conta le richieste riuscite
  standardHeaders: true
});

// Rate limiting per API sensibili
export const sensitiveApiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 50, // 50 richieste per finestra
  message: {
    success: false,
    message: 'Limite API sensibili superato.',
    code: 'SENSITIVE_API_LIMIT_EXCEEDED'
  }
});

// Middleware per validazione User-Agent
export const validateUserAgent = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent || userAgent.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'User-Agent non valido o mancante',
      code: 'INVALID_USER_AGENT'
    });
  }
  
  // Blocca user agent sospetti
  const suspiciousPatterns = [
    /curl/i,
    /wget/i, 
    /scanner/i,
    /bot/i,
    /crawl/i,
    /spider/i
  ];
  
  // Consenti alcuni bot legittimi
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slackbot/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isAllowedBot = allowedBots.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !isAllowedBot && process.env.NODE_ENV === 'production') {
    console.warn(`Suspicious User-Agent blocked: ${userAgent} from IP: ${req.ip}`);
    
    return res.status(403).json({
      success: false,
      message: 'Accesso negato',
      code: 'SUSPICIOUS_USER_AGENT'
    });
  }
  
  next();
};

// Middleware per protezione CSRF
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF per richieste GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.get('X-CSRF-Token') || req.body.csrfToken;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Token CSRF non valido o mancante',
      code: 'INVALID_CSRF_TOKEN'
    });
  }
  
  next();
};

// Middleware per logging di sicurezza
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    xForwardedFor: req.get('X-Forwarded-For'),
    userId: req.user?.userId,
    sessionId: req.user?.sessionId
  };
  
  // Log richieste sospette
  const suspiciousIndicators = [
    req.originalUrl.includes('../'),
    req.originalUrl.includes('..\\'),
    req.originalUrl.includes('<script>'),
    req.originalUrl.includes('SELECT'),
    req.originalUrl.includes('UNION'),
    req.originalUrl.includes('DROP'),
    req.originalUrl.length > 2000
  ];
  
  if (suspiciousIndicators.some(indicator => indicator)) {
    console.warn('🚨 Suspicious request detected:', JSON.stringify(securityInfo, null, 2));
  }
  
  // Log failures
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.warn('🔍 Failed request:', {
        ...securityInfo,
        statusCode: res.statusCode,
        responseSize: res.get('content-length') || '0'
      });
    }
  });
  
  next();
};

// Middleware per blocco IP sospetti
const suspiciousIPs = new Set<string>();
const ipAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const blockSuspiciousIPs = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  
  // Verifica se IP è nella blacklist
  if (suspiciousIPs.has(clientIP)) {
    console.warn(`🚫 Blocked request from suspicious IP: ${clientIP}`);
    
    return res.status(403).json({
      success: false,
      message: 'Accesso negato',
      code: 'IP_BLOCKED'
    });
  }
  
  // Traccia tentativi falliti
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const attempts = ipAttempts.get(clientIP) || { count: 0, lastAttempt: new Date() };
      attempts.count += 1;
      attempts.lastAttempt = new Date();
      
      ipAttempts.set(clientIP, attempts);
      
      // Blocca IP dopo 20 tentativi falliti in 1 ora
      if (attempts.count >= 20) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (attempts.lastAttempt > hourAgo) {
          suspiciousIPs.add(clientIP);
          console.warn(`🚨 IP ${clientIP} added to blacklist after ${attempts.count} failed attempts`);
          
          // Rimuovi dall'ip tracking
          ipAttempts.delete(clientIP);
          
          // Auto-remove dalla blacklist dopo 24 ore
          setTimeout(() => {
            suspiciousIPs.delete(clientIP);
            console.log(`✅ IP ${clientIP} removed from blacklist after 24 hours`);
          }, 24 * 60 * 60 * 1000);
        }
      }
    }
  });
  
  next();
};

// Middleware per protezione contro path traversal
export const preventPathTraversal = (req: Request, res: Response, next: NextFunction) => {
  const url = req.originalUrl;
  
  // Pattern pericolosi
  const dangerousPatterns = [
    /\.\.\//g,     // ../
    /\.\.\\/g,     // ..\
    /\.\.%2F/g,    // ..%2F (encoded /)
    /\.\.%5C/g,    // ..%5C (encoded \)
    /%2e%2e%2f/gi, // URL encoded ../
    /%2e%2e%5c/gi  // URL encoded ..\
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`🚨 Path traversal attempt detected: ${url} from IP: ${req.ip}`);
    
    return res.status(400).json({
      success: false,
      message: 'Richiesta non valida',
      code: 'INVALID_PATH'
    });
  }
  
  next();
};

// Middleware per sanitizzazione header HTTP
export const sanitizeHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Rimuovi header potenzialmente pericolosi
  const dangerousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url'
  ];
  
  dangerousHeaders.forEach(header => {
    delete req.headers[header];
  });
  
  // Valida Content-Type per richieste con body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (contentType && !contentType.startsWith('application/json') && 
        !contentType.startsWith('multipart/form-data') &&
        !contentType.startsWith('application/x-www-form-urlencoded')) {
      
      return res.status(415).json({
        success: false,
        message: 'Content-Type non supportato',
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }
  }
  
  next();
};

// Middleware per timeout richieste
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⏱️ Request timeout for ${req.method} ${req.originalUrl} from ${req.ip}`);
        
        res.status(408).json({
          success: false,
          message: 'Richiesta scaduta',
          code: 'REQUEST_TIMEOUT'
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

// Middleware completo di sicurezza - da usare globalmente
export const fullSecurityMiddleware = [
  helmetConfig,
  corsConfig,
  generalRateLimit,
  validateUserAgent,
  securityLogger,
  blockSuspiciousIPs,
  preventPathTraversal,
  sanitizeHeaders,
  requestTimeout(30000)
];

// Middleware per API sensibili
export const sensitiveApiSecurity = [
  sensitiveApiRateLimit,
  // csrfProtection // Abilita se usi sessioni
];

// Middleware per autenticazione
export const authSecurity = [
  authRateLimit
];

// Utilities per gestione sicurezza
export const securityUtils = {
  // Genera CSRF token
  generateCSRFToken: (): string => {
    return require('crypto').randomBytes(32).toString('hex');
  },
  
  // Verifica se IP è nella whitelist
  isIPWhitelisted: (ip: string): boolean => {
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];
    return whitelist.includes(ip);
  },
  
  // Log evento di sicurezza
  logSecurityEvent: (event: string, details: any): void => {
    console.warn(`🔒 Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  },
  
  // Verifica se richiesta è da bot
  isBot: (userAgent: string): boolean => {
    const botPatterns = [
      /bot/i, /crawl/i, /spider/i, /scraper/i
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent || ''));
  }
};

// Export configurazioni per diverse modalità
export const securityConfigs = {
  development: {
    cors: cors({ origin: true, credentials: true }),
    helmet: helmet({ contentSecurityPolicy: false }),
    rateLimit: rateLimit({ windowMs: 15 * 60 * 1000, max: 10000 })
  },
  
  production: {
    cors: corsConfig,
    helmet: helmetConfig,
    rateLimit: generalRateLimit
  }
};