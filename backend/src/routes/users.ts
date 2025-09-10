import express, { Request, Response } from 'express';
import { authService } from '../services/authService';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';
import { body, param, query, validationResult } from 'express-validator';

// Simple validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dati non validi',
      errors: errors.array()
    });
  }
  next();
};

const router = express.Router();

// Input validation schemas
const createUserSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
  body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'VIEWER']),
  body('department').optional().trim().isLength({ max: 100 }),
];

const updateUserSchema = [
  param('id').isUUID(),
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'VIEWER']),
  body('department').optional().trim().isLength({ max: 100 }),
  body('isActive').optional().isBoolean(),
];

const updatePermissionsSchema = [
  param('id').isUUID(),
  body('permissions').isArray(),
  body('permissions.*').isString().matches(/^[a-z_]+:[a-z_]+$/),
];

// Get all users (Admin only)
router.get('/', 
  authenticateToken,
  requirePermission('users', 'read'),
  auditLogger('users:list'),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const department = req.query.department as string;

      const filters = {
        search,
        role,
        department,
        isActive: req.query.active !== 'false'
      };

      const users = await authService.getUsers(filters, { page, limit });
      
      res.json({
        success: true,
        users: users.map(user => ({
          ...user,
          password: undefined // Never send passwords
        })),
        pagination: {
          page,
          limit,
          total: users.length
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero utenti',
        code: 'GET_USERS_ERROR'
      });
    }
  }
);

// Get single user
router.get('/:id',
  authenticateToken,
  requirePermission('users', 'read'),
  [param('id').isUUID()],
  validateRequest,
  auditLogger('users:read'),
  async (req: Request, res: Response) => {
    try {
      const users = await authService.getUsers();
      const user = users.find(u => u.id === req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        user: {
          ...user,
          password: undefined
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero utente',
        code: 'GET_USER_ERROR'
      });
    }
  }
);

// Create new user (Admin only)
router.post('/',
  authenticateToken,
  requirePermission('users', 'create'),
  createUserSchema,
  validateRequest,
  auditLogger('users:create'),
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role, department } = req.body;

      // Check if user already exists
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Utente con questa email già esistente',
          code: 'USER_EXISTS'
        });
      }

      // Create user
      const newUser = await authService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        department,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Utente creato con successo',
        user: {
          ...newUser,
          password: undefined
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nella creazione utente',
        code: 'CREATE_USER_ERROR'
      });
    }
  }
);

// Update user
router.put('/:id',
  authenticateToken,
  requirePermission('users', 'update'),
  updateUserSchema,
  validateRequest,
  auditLogger('users:update'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updates = req.body;

      // Check if user exists
      const users = await authService.getUsers();
      const existingUser = users.find(u => u.id === userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prevent self-deactivation for admins
      if (updates.isActive === false && req.user?.id === userId && 
          ['SUPER_ADMIN', 'ADMIN'].includes(existingUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Non puoi disattivare il tuo account amministratore',
          code: 'CANNOT_DEACTIVATE_SELF'
        });
      }

      const updatedUser = await authService.updateUser(userId, updates);

      res.json({
        success: true,
        message: 'Utente aggiornato con successo',
        user: {
          ...updatedUser,
          password: undefined
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento utente',
        code: 'UPDATE_USER_ERROR'
      });
    }
  }
);

// Update user permissions (Super Admin only)
router.put('/:id/permissions',
  authenticateToken,
  requirePermission('users', 'manage'),
  updatePermissionsSchema,
  validateRequest,
  auditLogger('users:permissions:update'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { permissions } = req.body;

      // Check if user exists  
      const users = await authService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato',
          code: 'USER_NOT_FOUND'
        });
      }

      // Update permissions
      await authService.updateUserPermissions(userId, permissions);

      res.json({
        success: true,
        message: 'Permessi aggiornati con successo',
        permissions
      });
    } catch (error) {
      console.error('Update permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento permessi',
        code: 'UPDATE_PERMISSIONS_ERROR'
      });
    }
  }
);

// Delete user (Soft delete)
router.delete('/:id',
  authenticateToken,
  requirePermission('users', 'delete'),
  [param('id').isUUID()],
  validateRequest,
  auditLogger('users:delete'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const users = await authService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prevent self-deletion
      if (req.user?.id === userId) {
        return res.status(400).json({
          success: false,
          message: 'Non puoi eliminare il tuo account',
          code: 'CANNOT_DELETE_SELF'
        });
      }

      // Soft delete
      await authService.updateUser(userId, { isActive: false });

      res.json({
        success: true,
        message: 'Utente disattivato con successo'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nella disattivazione utente',
        code: 'DELETE_USER_ERROR'
      });
    }
  }
);

// Get user activity/audit log
router.get('/:id/activity',
  authenticateToken,
  requirePermission('users', 'read'),
  [
    param('id').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  auditLogger('users:activity:read'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const activity = await authService.getUserActivity(userId, limit);

      res.json({
        success: true,
        activity
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero attività utente',
        code: 'GET_ACTIVITY_ERROR'
      });
    }
  }
);

// Bulk operations
router.post('/bulk',
  authenticateToken,
  requirePermission('users', 'manage'),
  [
    body('action').isIn(['activate', 'deactivate', 'delete', 'update_role']),
    body('userIds').isArray().notEmpty(),
    body('userIds.*').isUUID(),
    body('data').optional().isObject()
  ],
  validateRequest,
  auditLogger('users:bulk'),
  async (req: Request, res: Response) => {
    try {
      const { action, userIds, data } = req.body;

      // Prevent bulk operations on self
      if (userIds.includes(req.user?.id)) {
        return res.status(400).json({
          success: false,
          message: 'Non puoi eseguire operazioni bulk su te stesso',
          code: 'CANNOT_BULK_SELF'
        });
      }

      const results = await authService.bulkUpdateUsers(action, userIds, data);

      res.json({
        success: true,
        message: `Operazione ${action} completata su ${results.updated} utenti`,
        results
      });
    } catch (error) {
      console.error('Bulk operation error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'operazione bulk',
        code: 'BULK_OPERATION_ERROR'
      });
    }
  }
);

export default router;