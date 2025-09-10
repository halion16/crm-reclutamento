import express from 'express';
import { PrismaClient } from '@prisma/client';
import { InterviewCreateRequest, InterviewUpdateRequest, ApiResponse, PaginatedResponse } from '../types';
import { workflowService } from '../services/workflowService';

const router = express.Router();
const prisma = new PrismaClient();

// Demo data storage (in-memory for demo mode)
let demoInterviewsStorage = [
  {
    id: 1,
    candidateId: 1,
    interviewPhase: 1,
    scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    interviewType: 'VIDEO_CALL',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    status: 'COMPLETED',
    outcome: 'POSITIVE',
    interviewerNotes: 'Candidato preparato, buona conoscenza di React e TypeScript',
    technicalRating: 8,
    softSkillsRating: 9,
    overallRating: 8,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 1,
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@email.com',
      positionApplied: 'Frontend Developer',
      currentStatus: 'IN_PROCESS'
    },
    primaryInterviewer: {
      id: 1,
      firstName: 'Mario',
      lastName: 'Rossi'
    }
  },
  {
    id: 2,
    candidateId: 1,
    interviewPhase: 2,
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    interviewType: 'VIDEO_CALL',
    meetingUrl: 'https://meet.google.com/klm-nopq-rst',
    status: 'SCHEDULED',
    outcome: null,
    interviewerNotes: null,
    technicalRating: null,
    softSkillsRating: null,
    overallRating: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 1,
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@email.com',
      positionApplied: 'Frontend Developer',
      currentStatus: 'IN_PROCESS'
    },
    primaryInterviewer: {
      id: 2,
      firstName: 'Giulia',
      lastName: 'Bianchi'
    }
  },
  {
    id: 3,
    candidateId: 2,
    interviewPhase: 1,
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    interviewType: 'IN_PERSON',
    location: 'Sala Riunioni A',
    status: 'SCHEDULED',
    outcome: null,
    interviewerNotes: null,
    technicalRating: null,
    softSkillsRating: null,
    overallRating: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 2,
      firstName: 'Sara',
      lastName: 'Colombo',
      email: 'sara.colombo@email.com',
      positionApplied: 'UX Designer',
      currentStatus: 'NEW'
    },
    primaryInterviewer: {
      id: 3,
      firstName: 'Luca',
      lastName: 'Verdi'
    }
  },
  // Andrea Ferrari interviews (3 interviews - hired)
  {
    id: 4,
    candidateId: 3,
    interviewPhase: 1,
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    interviewType: 'VIDEO_CALL',
    meetingUrl: 'https://meet.google.com/abc-123-def',
    status: 'COMPLETED',
    outcome: 'POSITIVE',
    interviewerNotes: 'Ottima conoscenza Node.js e PostgreSQL',
    technicalRating: 9,
    softSkillsRating: 8,
    overallRating: 9,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 3,
      firstName: 'Andrea',
      lastName: 'Ferrari',
      email: 'andrea.ferrari@email.com',
      positionApplied: 'Backend Developer',
      currentStatus: 'HIRED'
    },
    primaryInterviewer: {
      id: 1,
      firstName: 'Mario',
      lastName: 'Rossi'
    }
  },
  {
    id: 5,
    candidateId: 3,
    interviewPhase: 2,
    scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    interviewType: 'IN_PERSON',
    location: 'Sala Riunioni B',
    status: 'COMPLETED',
    outcome: 'POSITIVE',
    interviewerNotes: 'Eccellenti competenze di system design e architettura',
    technicalRating: 10,
    softSkillsRating: 9,
    overallRating: 10,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 3,
      firstName: 'Andrea',
      lastName: 'Ferrari',
      email: 'andrea.ferrari@email.com',
      positionApplied: 'Backend Developer',
      currentStatus: 'HIRED'
    },
    primaryInterviewer: {
      id: 2,
      firstName: 'Giulia',
      lastName: 'Bianchi'
    }
  },
  {
    id: 6,
    candidateId: 3,
    interviewPhase: 3,
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 120,
    interviewType: 'IN_PERSON',
    location: 'Sala Direzione',
    status: 'COMPLETED',
    outcome: 'POSITIVE',
    interviewerNotes: 'Candidato eccezionale, perfetto per il team. Leadership naturale.',
    technicalRating: 10,
    softSkillsRating: 10,
    overallRating: 10,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 3,
      firstName: 'Andrea',
      lastName: 'Ferrari',
      email: 'andrea.ferrari@email.com',
      positionApplied: 'Backend Developer',
      currentStatus: 'HIRED'
    },
    primaryInterviewer: {
      id: 1,
      firstName: 'Mario',
      lastName: 'Rossi'
    }
  },
  // Elena Ricci interview (1 interview - rejected)
  {
    id: 7,
    candidateId: 4,
    interviewPhase: 1,
    scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    interviewType: 'VIDEO_CALL',
    meetingUrl: 'https://meet.google.com/xyz-789-abc',
    status: 'COMPLETED',
    outcome: 'NEGATIVE',
    interviewerNotes: 'Competenze tecniche non in linea con i requisiti richiesti per la posizione.',
    technicalRating: 4,
    softSkillsRating: 6,
    overallRating: 4,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 4,
      firstName: 'Elena',
      lastName: 'Ricci',
      email: 'elena.ricci@email.com',
      positionApplied: 'Data Analyst',
      currentStatus: 'REJECTED'
    },
    primaryInterviewer: {
      id: 3,
      firstName: 'Luca',
      lastName: 'Verdi'
    }
  }
];

// GET /api/interviews - Lista colloqui con filtri (DEMO MODE)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const interviewerId = req.query.interviewerId ? parseInt(req.query.interviewerId as string) : undefined;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;
    if (interviewerId) {
      where.OR = [
        { primaryInterviewerId: interviewerId },
        { secondaryInterviewerId: interviewerId }
      ];
    }
    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
      if (dateTo) where.scheduledDate.lte = new Date(dateTo);
    }
    
    // Use in-memory storage
    let filteredInterviews = demoInterviewsStorage;
    
    if (status) {
      filteredInterviews = filteredInterviews.filter(i => i.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInterviews = filteredInterviews.filter(i => 
        (i.candidate?.firstName?.toLowerCase() || '').includes(searchLower) ||
        (i.candidate?.lastName?.toLowerCase() || '').includes(searchLower) ||
        (i.candidate?.email?.toLowerCase() || '').includes(searchLower) ||
        (i.candidate?.positionApplied?.toLowerCase() || '').includes(searchLower)
      );
    }
    
    if (candidateId) {
      filteredInterviews = filteredInterviews.filter(i => i.candidateId === candidateId);
    }
    
    // Apply pagination
    const total = filteredInterviews.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const interviews = filteredInterviews.slice(startIndex, endIndex);
    
    const response: PaginatedResponse<any> = {
      success: true,
      data: interviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching interviews' 
    });
  }
});

// GET /api/interviews/candidate/:candidateId - Colloqui per candidato (DEMO MODE)
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    
    console.log(`🔍 Fetching interviews for candidate ${candidateId}`);
    
    // Filter interviews from demoInterviewsStorage by candidateId
    const interviews = demoInterviewsStorage.filter(interview => 
      interview.candidateId === candidateId
    );
    
    console.log(`📋 Found ${interviews.length} interviews for candidate ${candidateId}:`, 
      interviews.map(i => `ID=${i.id}, Phase=${i.interviewPhase}, Status=${i.status}, Outcome=${i.outcome}`));
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: interviews
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching candidate interviews' 
    });
  }
});

// GET /api/interviews/:id - Dettaglio colloquio (DEMO MODE)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Demo interview data
    const interview = {
      id: id,
      candidateId: 1,
      interviewPhase: 1,
      scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      interviewType: 'VIDEO_CALL',
      meetingUrl: 'https://meet.google.com/demo-link',
      location: null,
      status: 'SCHEDULED',
      outcome: null,
      interviewerNotes: null,
      technicalRating: null,
      softSkillsRating: null,
      overallRating: null,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      candidate: {
        id: 1,
        firstName: 'Marco',
        lastName: 'Rossi',
        email: 'marco.rossi@email.com',
        positionApplied: 'Frontend Developer',
        currentStatus: 'IN_PROCESS'
      },
      primaryInterviewer: {
        id: 1,
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'mario.rossi@company.com'
      },
      secondaryInterviewer: null,
      communications: []
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: interview
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching interview' 
    });
  }
});

// POST /api/interviews - Programma nuovo colloquio (DEMO MODE)
router.post('/', async (req, res) => {
  try {
    const data: any = req.body;
    
    // Genera nuovo ID incrementale
    const newId = Math.max(...demoInterviewsStorage.map(i => i.id)) + 1;
    
    // Simulazione di ottenimento dati candidato - in un'app reale dovremmo fare una query
    const candidateData = {
      id: data.candidateId,
      firstName: `Candidato ${data.candidateId}`,
      lastName: 'Demo',
      email: `candidato${data.candidateId}@demo.com`,
      positionApplied: 'Posizione Demo',
      currentStatus: 'IN_PROCESS'
    };
    
    // In modalità demo, crea un nuovo colloquio e lo aggiunge allo storage
    const newInterview = {
      id: newId,
      candidateId: data.candidateId,
      interviewPhase: data.interviewPhase,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      durationMinutes: data.durationMinutes || 60,
      interviewType: data.interviewType,
      meetingUrl: data.interviewType === 'VIDEO_CALL' ? `https://meet.google.com/demo-${newId}` : null,
      location: data.location || null,
      status: 'SCHEDULED',
      outcome: null,
      interviewerNotes: null,
      technicalRating: null,
      softSkillsRating: null,
      overallRating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidate: candidateData,
      primaryInterviewer: {
        id: 1,
        firstName: 'Demo',
        lastName: 'Interviewer'
      }
    };
    
    // Aggiungi allo storage in memoria
    demoInterviewsStorage.push(newInterview);
    
    // 🔥 STEP 2.2: Sincronizza automaticamente con workflow quando colloquio programmato
    try {
      const candidateId = data.candidateId.toString();
      console.log(`🚀 Auto-syncing new interview for candidate ${candidateId} with workflow`);
      await workflowService.syncCandidateFromCandidatesAPI(candidateId);
      console.log(`✅ Candidate ${candidateId} workflow updated after interview scheduling`);
    } catch (workflowError) {
      console.error(`❌ Failed to sync new interview with workflow:`, workflowError);
      // Non fermare la creazione del colloquio se il workflow fallisce
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: newInterview,
      message: 'Interview scheduled successfully (Demo Mode)'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating interview' 
    });
  }
});

// PUT /api/interviews/:id - Aggiorna colloquio (DEMO MODE)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data: any = req.body;
    
    // In modalità demo, simula l'aggiornamento del colloquio
    const updatedInterview = {
      id: id,
      candidateId: data.candidateId || 1,
      interviewPhase: data.interviewPhase || 1,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      durationMinutes: data.durationMinutes || 60,
      interviewType: data.interviewType || 'VIDEO_CALL',
      meetingUrl: data.meetingUrl,
      location: data.location,
      status: data.status || 'SCHEDULED',
      outcome: data.outcome,
      interviewerNotes: data.interviewerNotes,
      technicalRating: data.technicalRating,
      softSkillsRating: data.softSkillsRating,
      overallRating: data.overallRating,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidate: {
        id: data.candidateId || 1,
        firstName: 'Demo',
        lastName: 'Candidate',
        positionApplied: 'Demo Position'
      },
      primaryInterviewer: {
        id: 1,
        firstName: 'Demo',
        lastName: 'Interviewer'
      }
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: updatedInterview,
      message: 'Interview updated successfully (Demo Mode)'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating interview' 
    });
  }
});

// PATCH /api/interviews/:id/outcome - Registra esito colloquio (DEMO MODE)
router.patch('/:id/outcome', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { outcome, interviewerNotes, technicalRating, softSkillsRating, overallRating } = req.body;
    
    console.log(`🎯 Recording outcome for interview ${id}:`, { outcome, interviewerNotes, technicalRating, softSkillsRating, overallRating });
    
    // Modalità DEMO: aggiorna l'interview nello storage in-memory
    const interviewIndex = demoInterviewsStorage.findIndex(i => i.id === id);
    
    if (interviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Aggiorna l'interview con i nuovi dati
    demoInterviewsStorage[interviewIndex] = {
      ...demoInterviewsStorage[interviewIndex],
      status: 'COMPLETED',
      outcome,
      interviewerNotes: interviewerNotes || '',
      technicalRating,
      softSkillsRating,
      overallRating,
      updatedAt: new Date().toISOString()
    };
    
    const updatedInterview = demoInterviewsStorage[interviewIndex];
    
    console.log(`✅ Interview ${id} outcome updated successfully:`, updatedInterview);
    
    // 🔥 STEP 2.2 & 2.3: Integrazione automatica con workflow quando colloquio completato
    try {
      const candidateId = updatedInterview.candidateId.toString();
      console.log(`🚀 Auto-processing interview completion for candidate ${candidateId}`);
      
      // Sincronizza candidato con workflow (aggiorna fase basata su colloqui completati)
      await workflowService.syncCandidateFromCandidatesAPI(candidateId);
      
      // Se outcome positivo, valuta avanzamento automatico
      if (outcome === 'POSITIVE') {
        console.log(`✅ Positive outcome - candidate ${candidateId} may advance in workflow`);
        
        // Opzionalmente, logica per avanzamento automatico basata su regole
        // Questo potrebbe essere configurabile per posizione/workflow type
        
      } else if (outcome === 'NEGATIVE') {
        console.log(`❌ Negative outcome - candidate ${candidateId} may be rejected`);
        
        // Opzionalmente, logica per rejection automatico
        // Anche questo configurabile
      }
      
      console.log(`✅ Workflow integration completed for candidate ${candidateId}`);
    } catch (workflowError) {
      console.error(`❌ Failed to integrate interview outcome with workflow:`, workflowError);
      // Non fermare il salvataggio dell'outcome se il workflow fallisce
    }

    // 🔥 STEP 3.2: Emit real-time interview outcome update
    try {
      if (typeof global !== 'undefined' && global.io) {
        const eventData = {
          interviewId: id,
          candidateId: updatedInterview.candidateId,
          candidateName: `${updatedInterview.candidate?.firstName || 'Unknown'} ${updatedInterview.candidate?.lastName || 'Candidate'}`,
          interviewPhase: updatedInterview.interviewPhase,
          outcome,
          technicalRating,
          softSkillsRating,
          overallRating,
          timestamp: new Date()
        };
        
        console.log(`📡 Emitting interview outcome update for candidate ${updatedInterview.candidateId}`);
        
        // Emit to candidate room
        global.io.to(`candidate-${updatedInterview.candidateId}`).emit('interview_outcome_updated', {
          type: 'interview_outcome_updated',
          data: eventData
        });
        
        // Emit to all clients for global notifications
        global.io.emit('global_update', {
          type: 'interview_completed',
          data: eventData
        });
        
        console.log(`✅ Interview outcome real-time event emitted`);
      }
    } catch (socketError) {
      console.error(`❌ Failed to emit interview outcome real-time event:`, socketError);
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: updatedInterview,
      message: 'Interview outcome recorded successfully (Demo Mode)'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error recording interview outcome:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error recording interview outcome' 
    });
  }
});

// DELETE /api/interviews/:id - Elimina colloquio
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.interview.delete({
      where: { id }
    });
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Interview deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting interview:', error);
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Interview not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Error deleting interview' 
    });
  }
});

export default router;