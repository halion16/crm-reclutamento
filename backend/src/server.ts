import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import routes from './routes';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5196', 'http://localhost:3000'];

// 🔥 STEP 3.1: Setup WebSocket Server
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigins,
    credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true'
  }
});

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: corsOrigins,
  credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Authentication routes (no additional middleware needed as they have their own)
app.use('/api/auth', authRoutes);

// User management routes  
app.use('/api/users', usersRoutes);

// API Routes (protected routes will use authentication middleware)
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: {
      authentication: 'JWT + Refresh Tokens',
      encryption: 'AES-256-GCM',
      gdprCompliance: true,
      auditLogging: true
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'CRM Reclutamento API Server - Enterprise Security & Compliance',
    version: '1.0.0',
    security: {
      phase: 'Phase 5: Enterprise Security & Compliance',
      features: [
        '🔐 JWT + Refresh Token Authentication',
        '👥 Role-Based Access Control (RBAC)', 
        '🛡️ GDPR Compliance Framework',
        '🔍 Complete Audit Trail System',
        '🔒 AES-256-GCM Data Encryption',
        '🚫 Advanced Rate Limiting',
        '🔒 Input Validation & Sanitization',
        '🛡️ Security Headers (Helmet)',
        '📊 Security Monitoring & Logging'
      ]
    },
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        refresh: 'POST /api/auth/refresh', 
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/me',
        sessions: 'GET /api/auth/sessions',
        audit: 'GET /api/auth/audit'
      },
      candidates: '/api/candidates',
      interviews: '/api/interviews', 
      hrUsers: '/api/hr-users',
      workflow: '/api/workflow',
      communications: '/api/communications'
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// 🔥 STEP 3.1: WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Join workflow room for real-time updates
  socket.on('join-workflow', (workflowId) => {
    socket.join(`workflow-${workflowId}`);
    console.log(`👥 Client ${socket.id} joined workflow-${workflowId}`);
  });
  
  // Join candidate room for real-time updates
  socket.on('join-candidate', (candidateId) => {
    socket.join(`candidate-${candidateId}`);
    console.log(`👤 Client ${socket.id} joined candidate-${candidateId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize Chat WebSocket Service
import { chatWebSocketService } from './services/chatWebSocketService';

// Make io available globally for other services
declare global {
  var io: SocketIOServer;
}
global.io = io;

// Initialize chat WebSocket service
chatWebSocketService.initialize(io);

server.listen(PORT, () => {
  console.log(`🚀 CRM Reclutamento API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔌 WebSocket Server ready for real-time connections`);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('🔄 Starting graceful shutdown...');
  
  // Shutdown chat WebSocket service
  chatWebSocketService.shutdown();
  
  // Import and shutdown security middleware
  import('./middleware/security').then(({ shutdownSecurityMiddleware }) => {
    shutdownSecurityMiddleware();
  });
  
  // Close server
  server.close(() => {
    console.log('✅ Server shutdown completed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}