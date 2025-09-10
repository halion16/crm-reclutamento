import express from 'express';
import { PrismaClient } from '@prisma/client';
import { CandidateCreateRequest, ApiResponse, PaginatedResponse, Candidate } from '../types';
import { workflowService } from '../services/workflowService';

const router = express.Router();
const prisma = new PrismaClient();

// Demo data storage (in-memory for demo mode)
let demoCandidatesStorage = [
  {
    id: 1,
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco.rossi@email.com',
    phone: '+39 335 1234567',
    mobile: '+39 335 1234567',
    address: 'Via Roma 123',
    city: 'Milano',
    postalCode: '20121',
    province: 'MI',
    birthDate: '1990-05-15',
    positionApplied: 'Frontend Developer',
    experienceYears: 5,
    educationLevel: 'Laurea Magistrale',
    linkedinProfile: 'https://linkedin.com/in/marcorossi',
    sourceChannel: 'LinkedIn',
    applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'IN_PROCESS',
    notes: 'Candidato molto promettente con esperienza in React e TypeScript',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [
      { id: 1, interviewPhase: 1, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, interviewPhase: 2, status: 'SCHEDULED', outcome: null, scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    ],
    nextInterviewPhase: 3,
    canScheduleInterview: false
  },
  {
    id: 2,
    firstName: 'Sara',
    lastName: 'Colombo',
    email: 'sara.colombo@email.com',
    phone: '+39 340 9876543',
    mobile: '+39 340 9876543',
    address: 'Corso Buenos Aires 45',
    city: 'Milano',
    postalCode: '20124',
    province: 'MI',
    birthDate: '1988-12-03',
    positionApplied: 'UX Designer',
    experienceYears: 7,
    educationLevel: 'Laurea Magistrale',
    linkedinProfile: 'https://linkedin.com/in/saracolombo',
    sourceChannel: 'Website',
    applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'NEW',
    notes: 'Portfolio eccellente, esperienza in design systems',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [
      { id: 3, interviewPhase: 1, status: 'SCHEDULED', outcome: null, scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    nextInterviewPhase: 1,
    canScheduleInterview: false
  },
  {
    id: 3,
    firstName: 'Andrea',
    lastName: 'Ferrari',
    email: 'andrea.ferrari@email.com',
    phone: '+39 347 5555555',
    mobile: '+39 347 5555555',
    address: 'Via Torino 78',
    city: 'Roma',
    postalCode: '00184',
    province: 'RM',
    birthDate: '1992-08-20',
    positionApplied: 'Backend Developer',
    experienceYears: 4,
    educationLevel: 'Laurea Triennale',
    linkedinProfile: 'https://linkedin.com/in/andreaferrari',
    sourceChannel: 'Referral',
    referralPerson: 'Mario Rossi',
    applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'HIRED',
    notes: 'Assunto! Ottima conoscenza Node.js e PostgreSQL',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    interviews: [
      { id: 4, interviewPhase: 1, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 5, interviewPhase: 2, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 6, interviewPhase: 3, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    nextInterviewPhase: null,
    canScheduleInterview: false
  },
  {
    id: 4,
    firstName: 'Elena',
    lastName: 'Ricci',
    email: 'elena.ricci@email.com',
    phone: '+39 338 7777777',
    mobile: '+39 338 7777777',
    address: 'Via Nazionale 234',
    city: 'Napoli',
    postalCode: '80143',
    province: 'NA',
    birthDate: '1985-11-10',
    positionApplied: 'Project Manager',
    experienceYears: 8,
    educationLevel: 'Master',
    linkedinProfile: 'https://linkedin.com/in/elenaricci',
    sourceChannel: 'Job Board',
    applicationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'REJECTED',
    notes: 'Non in linea con i requisiti richiesti',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    interviews: [
      { id: 7, interviewPhase: 1, status: 'COMPLETED', outcome: 'NEGATIVE', scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    nextInterviewPhase: null,
    canScheduleInterview: false
  },
  {
    id: 5,
    firstName: 'Paolo',
    lastName: 'Neri',
    email: 'paolo.neri@email.com',
    phone: '+39 333 9999999',
    mobile: '+39 333 9999999',
    address: 'Piazza Duomo 1',
    city: 'Firenze',
    postalCode: '50122',
    province: 'FI',
    birthDate: '1993-02-28',
    positionApplied: 'DevOps Engineer',
    experienceYears: 3,
    educationLevel: 'Laurea Magistrale',
    linkedinProfile: 'https://linkedin.com/in/paoloneri',
    sourceChannel: 'LinkedIn',
    applicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'NEW',
    notes: 'Da valutare competenze Docker e Kubernetes',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [],
    nextInterviewPhase: 1,
    canScheduleInterview: true
  },
  {
    id: 6,
    firstName: 'Lucia',
    lastName: 'Bianchi',
    email: 'lucia.bianchi@email.com',
    phone: '+39 345 1122334',
    mobile: '+39 345 1122334',
    address: 'Via Garibaldi 56',
    city: 'Bologna',
    postalCode: '40121',
    province: 'BO',
    birthDate: '1991-07-15',
    positionApplied: 'Data Analyst',
    experienceYears: 2,
    educationLevel: 'Laurea Magistrale',
    linkedinProfile: 'https://linkedin.com/in/luciabianchi',
    sourceChannel: 'LinkedIn',
    applicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentStatus: 'IN_PROCESS',
    notes: 'Ottima preparazione in Python e SQL',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: [
      { id: 8, interviewPhase: 1, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    nextInterviewPhase: 2,
    canScheduleInterview: true
  }
];

// GET /api/candidates - Lista candidati con paginazione e filtri (DEMO MODE)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    
    // Use in-memory storage
    let filteredCandidates = demoCandidatesStorage;
    
    if (status) {
      filteredCandidates = filteredCandidates.filter(c => c.currentStatus === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCandidates = filteredCandidates.filter(c => 
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.positionApplied?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const total = filteredCandidates.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);
    
    const response: PaginatedResponse<any> = {
      success: true,
      data: paginatedCandidates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching candidates' 
    });
  }
});

// GET /api/candidates/eligible-for-interview - Candidati eligibili per programmazione colloqui
router.get('/eligible-for-interview', async (req, res) => {
  try {
    // Filtra candidati eleggibili dallo storage in memoria
    const eligibleCandidates = demoCandidatesStorage
      .filter(candidate => candidate.canScheduleInterview)
      .map(candidate => ({
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        positionApplied: candidate.positionApplied,
        currentStatus: candidate.currentStatus,
        nextInterviewPhase: candidate.nextInterviewPhase,
        canScheduleInterview: candidate.canScheduleInterview,
        interviewProgress: candidate.nextInterviewPhase === 1 
          ? 'Nessun colloquio programmato' 
          : `Fase ${candidate.nextInterviewPhase - 1} completata con esito positivo`
      }));

    const response: any = {
      success: true,
      data: eligibleCandidates
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching eligible candidates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching eligible candidates' 
    });
  }
});

// GET /api/candidates/:id - Dettaglio candidato (DEMO MODE)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Demo candidate data
    const demoCandidates = [
      {
        id: 1,
        firstName: 'Marco',
        lastName: 'Rossi',
        email: 'marco.rossi@email.com',
        phone: '+39 335 1234567',
        mobile: '+39 335 1234567',
        address: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20121',
        province: 'MI',
        birthDate: '1990-05-15',
        positionApplied: 'Frontend Developer',
        experienceYears: 5,
        educationLevel: 'Laurea Magistrale',
        linkedinProfile: 'https://linkedin.com/in/marcorossi',
        sourceChannel: 'LinkedIn',
        applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        currentStatus: 'IN_PROCESS',
        notes: 'Candidato molto promettente con esperienza in React e TypeScript',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        interviews: [
          { id: 1, interviewPhase: 1, status: 'COMPLETED', outcome: 'POSITIVE', scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { id: 2, interviewPhase: 2, status: 'SCHEDULED', outcome: null, scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
        ],
        communications: [],
        documents: [],
        activityLogs: []
      }
    ];
    
    const candidate = demoCandidates.find(c => c.id === id);
    
    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        error: 'Candidate not found' 
      });
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: candidate
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching candidate' 
    });
  }
});

// POST /api/candidates - Crea nuovo candidato (DEMO MODE)
router.post('/', async (req, res) => {
  try {
    const data: any = req.body;
    
    // In modalità demo, crea un nuovo candidato e lo aggiunge allo storage
    const newId = Math.max(...demoCandidatesStorage.map(c => c.id)) + 1;
    const newCandidate = {
      id: newId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      mobile: data.mobile || null,
      address: data.address || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      province: data.province || null,
      birthDate: data.birthDate || null,
      positionApplied: data.positionApplied || null,
      experienceYears: data.experienceYears || null,
      educationLevel: data.educationLevel || null,
      linkedinProfile: data.linkedinProfile || null,
      sourceChannel: data.sourceChannel || null,
      referralPerson: data.referralPerson || null,
      notes: data.notes || null,
      applicationDate: new Date().toISOString(),
      currentStatus: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interviews: [],
      nextInterviewPhase: 1,
      canScheduleInterview: true
    };
    
    // Aggiungi alla storage in memoria
    demoCandidatesStorage.push(newCandidate);
    
    // 🔥 STEP 2.1: Sincronizza automaticamente con workflow quando candidato viene creato
    try {
      console.log(`🚀 Auto-syncing new candidate ${newId} with workflow system`);
      await workflowService.syncCandidateFromCandidatesAPI(newId.toString());
      console.log(`✅ Candidate ${newId} successfully added to workflow`);
    } catch (workflowError) {
      console.error(`❌ Failed to sync candidate ${newId} with workflow:`, workflowError);
      // Non fermare la creazione del candidato se il workflow fallisce
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: newCandidate,
      message: 'Candidate created successfully (Demo Mode)'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating candidate' 
    });
  }
});

// PUT /api/candidates/:id - Aggiorna candidato (DEMO MODE)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data: any = req.body;
    
    // Trova il candidato nello storage
    const candidateIndex = demoCandidatesStorage.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    // Aggiorna il candidato mantenendo i dati esistenti
    const existingCandidate = demoCandidatesStorage[candidateIndex];
    const updatedCandidate = {
      ...existingCandidate,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      mobile: data.mobile || null,
      address: data.address || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      province: data.province || null,
      birthDate: data.birthDate || null,
      positionApplied: data.positionApplied || null,
      experienceYears: data.experienceYears || null,
      educationLevel: data.educationLevel || null,
      linkedinProfile: data.linkedinProfile || null,
      sourceChannel: data.sourceChannel || null,
      referralPerson: data.referralPerson || null,
      notes: data.notes || null,
      updatedAt: new Date().toISOString()
    };
    
    // Aggiorna nello storage
    demoCandidatesStorage[candidateIndex] = updatedCandidate;
    
    // 🔥 STEP 2.1: Sincronizza automaticamente con workflow quando candidato viene aggiornato
    try {
      console.log(`🚀 Auto-syncing updated candidate ${id} with workflow system`);
      await workflowService.syncCandidateFromCandidatesAPI(id.toString());
      console.log(`✅ Candidate ${id} workflow updated successfully`);
    } catch (workflowError) {
      console.error(`❌ Failed to sync updated candidate ${id} with workflow:`, workflowError);
      // Non fermare l'aggiornamento del candidato se il workflow fallisce
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: updatedCandidate,
      message: 'Candidate updated successfully (Demo Mode)'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating candidate' 
    });
  }
});

// PATCH /api/candidates/:id/status - Aggiorna status candidato (DEMO MODE)
router.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    // In modalità demo, simula l'aggiornamento dello status
    const updatedCandidate = {
      id: id,
      currentStatus: status,
      updatedAt: new Date().toISOString()
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: updatedCandidate,
      message: 'Candidate status updated successfully (Demo Mode)'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating candidate status' 
    });
  }
});

// DELETE /api/candidates/:id - Elimina candidato (DEMO MODE)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Trova e rimuovi il candidato dallo storage
    const candidateIndex = demoCandidatesStorage.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }
    
    // Rimuovi dallo storage
    demoCandidatesStorage.splice(candidateIndex, 1);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Candidate deleted successfully (Demo Mode)'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error deleting candidate' 
    });
  }
});

export default router;