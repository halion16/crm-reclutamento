import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats - Statistiche generali (DEMO MODE)
router.get('/stats', async (req, res) => {
  try {
    // In modalità demo, restituisce dati fittizi
    const demoStats = {
      totalCandidates: 156,
      activeCandidates: 23,
      scheduledInterviews: 8,
      completedInterviewsToday: 3,
      candidatesByStatus: {
        'NEW': 45,
        'IN_PROCESS': 23,
        'HIRED': 67,
        'REJECTED': 18,
        'WITHDRAWN': 3
      },
      interviewsByPhase: {
        'phase_1': 15,
        'phase_2': 8,
        'phase_3': 5
      },
      interviewsByStatus: {
        'SCHEDULED': 8,
        'COMPLETED': 45,
        'CANCELLED': 3,
        'IN_PROGRESS': 2
      },
      recentActivity: [
        {
          id: 1,
          activityType: 'CANDIDATE_CREATED',
          description: 'Nuovo candidato inserito: Marco Rossi per posizione Frontend Developer',
          performedAt: new Date().toISOString(),
          candidate: { firstName: 'Marco', lastName: 'Rossi', positionApplied: 'Frontend Developer' },
          performedBy: { firstName: 'Giulia', lastName: 'Bianchi' }
        },
        {
          id: 2,
          activityType: 'INTERVIEW_SCHEDULED',
          description: 'Programmato colloquio fase 1 per il 24/08/2024',
          performedAt: new Date(Date.now() - 3600000).toISOString(),
          candidate: { firstName: 'Sara', lastName: 'Colombo', positionApplied: 'UX Designer' },
          interview: { interviewPhase: 1 },
          performedBy: { firstName: 'Mario', lastName: 'Rossi' }
        },
        {
          id: 3,
          activityType: 'OUTCOME_RECORDED',
          description: 'Registrato esito positivo per colloquio fase 2',
          performedAt: new Date(Date.now() - 7200000).toISOString(),
          candidate: { firstName: 'Andrea', lastName: 'Ferrari', positionApplied: 'Backend Developer' },
          interview: { interviewPhase: 2 },
          performedBy: { firstName: 'Luca', lastName: 'Verdi' }
        },
        {
          id: 4,
          activityType: 'EMAIL_SENT',
          description: 'Email inviata: Conferma appuntamento colloquio',
          performedAt: new Date(Date.now() - 10800000).toISOString(),
          candidate: { firstName: 'Elena', lastName: 'Ricci', positionApplied: 'Project Manager' },
          performedBy: { firstName: 'Giulia', lastName: 'Bianchi' }
        },
        {
          id: 5,
          activityType: 'SMS_SENT',
          description: 'SMS inviato a 333123456: Reminder colloquio domani',
          performedAt: new Date(Date.now() - 14400000).toISOString(),
          candidate: { firstName: 'Paolo', lastName: 'Neri', positionApplied: 'DevOps Engineer' },
          performedBy: { firstName: 'Mario', lastName: 'Rossi' }
        }
      ]
    };

    const response: ApiResponse<any> = {
      success: true,
      data: demoStats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching dashboard stats' 
    });
  }
});

// GET /api/dashboard/trends - Tendenze temporali (DEMO MODE)
router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Genera dati demo per le tendenze
    const demoTrends = {
      candidatesTrend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 2
      })),
      interviewsTrend: Array.from({ length: 7 }, (_, i) => [
        {
          date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 1,
          outcome: 'POSITIVE'
        },
        {
          date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 3) + 1,
          outcome: 'NEGATIVE'
        }
      ]).flat(),
      communicationsTrend: Array.from({ length: 7 }, (_, i) => [
        {
          date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          communication_type: 'EMAIL',
          count: Math.floor(Math.random() * 15) + 5
        },
        {
          date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          communication_type: 'SMS',
          count: Math.floor(Math.random() * 8) + 2
        }
      ]).flat(),
      period: {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        days
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: demoTrends
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching dashboard trends' 
    });
  }
});

// GET /api/dashboard/performance - Performance team HR (DEMO MODE)
router.get('/performance', async (req, res) => {
  try {
    const demoPerformance = [
      {
        id: 1,
        name: 'Mario Rossi',
        role: 'HR_MANAGER',
        stats: {
          candidatesCreated: 45,
          interviewsConducted: 32,
          interviewsCompleted: 30,
          positiveOutcomes: 22,
          communicationsSent: 156,
          communicationsSuccessful: 148,
          successRate: 73,
          communicationSuccessRate: 95
        }
      },
      {
        id: 2,
        name: 'Giulia Bianchi',
        role: 'HR_ASSISTANT',
        stats: {
          candidatesCreated: 38,
          interviewsConducted: 25,
          interviewsCompleted: 24,
          positiveOutcomes: 16,
          communicationsSent: 134,
          communicationsSuccessful: 129,
          successRate: 67,
          communicationSuccessRate: 96
        }
      },
      {
        id: 3,
        name: 'Luca Verdi',
        role: 'INTERVIEWER',
        stats: {
          candidatesCreated: 12,
          interviewsConducted: 45,
          interviewsCompleted: 43,
          positiveOutcomes: 31,
          communicationsSent: 89,
          communicationsSuccessful: 85,
          successRate: 72,
          communicationSuccessRate: 96
        }
      }
    ];

    const response: ApiResponse<any> = {
      success: true,
      data: demoPerformance
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching performance stats' 
    });
  }
});

// GET /api/dashboard/upcoming - Prossimi appuntamenti (DEMO MODE)
router.get('/upcoming', async (req, res) => {
  try {
    const demoUpcoming = [
      {
        id: 1,
        candidateId: 1,
        interviewPhase: 1,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        interviewType: 'VIDEO_CALL',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        status: 'SCHEDULED',
        candidate: {
          id: 1,
          firstName: 'Marco',
          lastName: 'Rossi',
          email: 'marco.rossi@email.com',
          mobile: '3331234567',
          positionApplied: 'Frontend Developer'
        },
        primaryInterviewer: {
          id: 1,
          firstName: 'Mario',
          lastName: 'Rossi',
          email: 'mario.rossi@azienda.it'
        }
      },
      {
        id: 2,
        candidateId: 2,
        interviewPhase: 2,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        interviewType: 'VIDEO_CALL',
        meetingUrl: 'https://meet.google.com/klm-nopq-rst',
        status: 'SCHEDULED',
        candidate: {
          id: 2,
          firstName: 'Sara',
          lastName: 'Colombo',
          email: 'sara.colombo@email.com',
          mobile: '3331234568',
          positionApplied: 'UX Designer'
        },
        primaryInterviewer: {
          id: 2,
          firstName: 'Giulia',
          lastName: 'Bianchi',
          email: 'giulia.bianchi@azienda.it'
        }
      },
      {
        id: 3,
        candidateId: 3,
        interviewPhase: 3,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        interviewType: 'IN_PERSON',
        location: 'Sala Riunioni A',
        status: 'SCHEDULED',
        candidate: {
          id: 3,
          firstName: 'Andrea',
          lastName: 'Ferrari',
          email: 'andrea.ferrari@email.com',
          mobile: '3331234569',
          positionApplied: 'Backend Developer'
        },
        primaryInterviewer: {
          id: 3,
          firstName: 'Luca',
          lastName: 'Verdi',
          email: 'luca.verdi@azienda.it'
        }
      }
    ];

    const response: ApiResponse<any> = {
      success: true,
      data: demoUpcoming
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching upcoming interviews' 
    });
  }
});

// GET /api/dashboard/alerts - Alert e notifiche (DEMO MODE)
router.get('/alerts', async (req, res) => {
  try {
    const demoAlerts = [
      {
        type: 'warning',
        title: 'Colloqui senza esito',
        message: '3 colloqui completati senza esito registrato',
        count: 3,
        action: 'review_interviews'
      },
      {
        type: 'info',
        title: 'Candidati inattivi',
        message: '7 candidati senza aggiornamenti da 7+ giorni',
        count: 7,
        action: 'review_candidates'
      },
      {
        type: 'error',
        title: 'Comunicazioni fallite',
        message: '2 comunicazioni non consegnate oggi',
        count: 2,
        action: 'review_communications'
      }
    ];

    const response: ApiResponse<any> = {
      success: true,
      data: demoAlerts
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching alerts' 
    });
  }
});

export default router;