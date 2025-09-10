import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hr-users - Lista utenti HR
router.get('/', async (req, res) => {
  try {
    const isActive = req.query.active === 'true' ? true : undefined;
    const role = req.query.role as string;
    
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (role) where.role = role;
    
    const users = await prisma.hrUser.findMany({
      where,
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneExtension: true,
        createdAt: true
      }
    });
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: users
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching HR users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching HR users' 
    });
  }
});

// GET /api/hr-users/interviewers - Lista solo intervistatori
router.get('/interviewers', async (req, res) => {
  try {
    const interviewers = await prisma.hrUser.findMany({
      where: {
        isActive: true,
        role: { in: ['HR_MANAGER', 'INTERVIEWER'] }
      },
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phoneExtension: true
      }
    });
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: interviewers
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching interviewers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching interviewers' 
    });
  }
});

// GET /api/hr-users/:id - Dettaglio utente HR
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const user = await prisma.hrUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneExtension: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'HR user not found' 
      });
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: user
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching HR user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching HR user' 
    });
  }
});

export default router;