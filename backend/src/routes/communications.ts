import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, PaginatedResponse } from '../types';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { phoneService } from '../services/phoneService';
import smartSMSRoutes from './smartSMS';

const router = express.Router();
const prisma = new PrismaClient();

// Demo data storage (in-memory for demo mode)
let demoCommunicationsStorage = [
  {
    id: 1,
    candidateId: 1,
    interviewId: null,
    communicationType: 'EMAIL',
    subject: 'Conferma colloquio programmato',
    messageContent: 'Gentile Marco, la confermiamo che il suo colloquio è programmato per domani alle 09:00.',
    deliveryStatus: 'DELIVERED',
    errorMessage: null,
    callOutcome: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 1,
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@email.com',
      mobile: '+39 335 1234567'
    }
  },
  {
    id: 2,
    candidateId: 2,
    interviewId: null,
    communicationType: 'SMS',
    subject: null,
    messageContent: 'Ciao Sara! Ti ricordiamo il colloquio di domani alle 10:00. A presto!',
    deliveryStatus: 'SENT',
    errorMessage: null,
    callOutcome: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 2,
      firstName: 'Sara',
      lastName: 'Colombo',
      email: 'sara.colombo@email.com',
      mobile: '+39 340 9876543'
    }
  },
  {
    id: 3,
    candidateId: 5,
    interviewId: null,
    communicationType: 'PHONE_CALL',
    subject: null,
    messageContent: null,
    deliveryStatus: 'DELIVERED',
    errorMessage: null,
    callOutcome: 'ANSWERED',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    candidate: {
      id: 5,
      firstName: 'Paolo',
      lastName: 'Neri',
      email: 'paolo.neri@email.com',
      mobile: '+39 333 9999999'
    }
  }
];

// GET /api/communications - Lista comunicazioni
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const type = req.query.type as string;
    
    let filteredCommunications = demoCommunicationsStorage;
    
    if (candidateId) {
      filteredCommunications = filteredCommunications.filter(c => c.candidateId === candidateId);
    }
    if (type) {
      filteredCommunications = filteredCommunications.filter(c => c.communicationType === type);
    }
    
    filteredCommunications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = filteredCommunications.length;
    const skip = (page - 1) * limit;
    const communications = filteredCommunications.slice(skip, skip + limit);
    
    const response: PaginatedResponse<any> = {
      success: true,
      data: communications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching communications' 
    });
  }
});

// POST /api/communications - Endpoint generico per inviare comunicazioni (dal BasicAdvancedPanel)
router.post('/', async (req, res) => {
  try {
    const { candidateId, communicationType, subject, messageContent, templateId } = req.body;
    
    if (!candidateId || !communicationType || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Trova i dati del candidato (demo)
    const demoCandidates = [
      { id: 1, firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@email.com', mobile: '+39 335 1234567' },
      { id: 2, firstName: 'Laura', lastName: 'Bianchi', email: 'laura.bianchi@email.com', mobile: '+39 335 2345678' },
      { id: 3, firstName: 'Giuseppe', lastName: 'Verdi', email: 'giuseppe.verdi@email.com', mobile: '+39 335 3456789' },
      { id: 4, firstName: 'Anna', lastName: 'Neri', email: 'anna.neri@email.com', mobile: '+39 335 4567890' }
    ];
    
    const candidate = demoCandidates.find(c => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Crea nuova comunicazione
    const newCommunication = {
      id: Date.now(), // ID temporaneo
      candidateId,
      interviewId: null,
      communicationType,
      subject: subject || null,
      messageContent,
      deliveryStatus: 'SENT',
      errorMessage: null,
      callOutcome: null,
      createdAt: new Date().toISOString(),
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        mobile: candidate.mobile
      },
      templateId: templateId || null
    };

    // Aggiungi alla storage in-memory
    demoCommunicationsStorage.unshift(newCommunication);

    console.log(`📤 New communication created: ${communicationType} to ${candidate.firstName} ${candidate.lastName}`);
    
    res.json({
      success: true,
      message: 'Communication sent successfully',
      data: newCommunication
    });
    
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating communication' 
    });
  }
});

// GET /api/communications/templates - Lista template
router.get('/templates', async (req, res) => {
  try {
    const type = req.query.type as string;
    const context = req.query.context as string;
    
    const where: any = { isActive: true };
    if (type) where.templateType = type;
    if (context) where.usageContext = context;
    
    const demoTemplates = [
      {
        id: 1,
        templateName: 'Conferma Colloquio',
        templateType: 'EMAIL',
        usageContext: 'INTERVIEW_CONFIRMATION',
        subject: 'Conferma colloquio programmato - {{candidateName}}',
        bodyContent: 'Gentile {{candidateName}}, la confermiamo che il suo colloquio è programmato per il {{interviewDate}} alle {{interviewTime}}.',
        isActive: true,
        createdBy: { id: 1, firstName: 'Admin', lastName: 'User' }
      },
      {
        id: 2,
        templateName: 'Reminder SMS',
        templateType: 'SMS',
        usageContext: 'INTERVIEW_REMINDER',
        subject: null,
        bodyContent: 'Ciao {{candidateName}}! Ti ricordiamo il colloquio di {{interviewDate}} alle {{interviewTime}}. A presto!',
        isActive: true,
        createdBy: { id: 1, firstName: 'Admin', lastName: 'User' }
      }
    ];
    
    let filteredTemplates = demoTemplates.filter(t => t.isActive);
    if (type) filteredTemplates = filteredTemplates.filter(t => t.templateType === type);
    if (context) filteredTemplates = filteredTemplates.filter(t => t.usageContext === context);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: filteredTemplates
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching templates' 
    });
  }
});

// POST /api/communications/email/send - Invia email
router.post('/email/send', async (req, res) => {
  try {
    const { candidateId, interviewId, to, subject, message } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!candidateId || !to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await emailService.sendEmail({
      to,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, '')
    }, candidateId, interviewId, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending email' 
    });
  }
});

// POST /api/communications/email/template - Invia email da template
router.post('/email/template', async (req, res) => {
  try {
    const { templateId, candidateId, interviewId, variables } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!templateId || !candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await emailService.sendTemplateEmail(
      templateId,
      candidateId,
      variables || {},
      interviewId,
      userId
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Template email sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending template email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending template email' 
    });
  }
});

// POST /api/communications/email/interview-confirmation - Invia conferma colloquio
router.post('/email/interview-confirmation', async (req, res) => {
  try {
    const { interviewId } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }
    
    const result = await emailService.sendInterviewConfirmation(interviewId, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Interview confirmation sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending interview confirmation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending interview confirmation' 
    });
  }
});

// POST /api/communications/sms/send - Invia SMS
router.post('/sms/send', async (req, res) => {
  try {
    const { candidateId, interviewId, message } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!candidateId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await smsService.sendQuickSMS(candidateId, message, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending SMS' 
    });
  }
});

// POST /api/communications/sms/template - Invia SMS da template
router.post('/sms/template', async (req, res) => {
  try {
    const { templateId, candidateId, interviewId, variables } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!templateId || !candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await smsService.sendTemplateSMS(
      templateId,
      candidateId,
      variables || {},
      interviewId,
      userId
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Template SMS sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending template SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending template SMS' 
    });
  }
});

// POST /api/communications/sms/interview-reminder - Invia reminder SMS
router.post('/sms/interview-reminder', async (req, res) => {
  try {
    const { interviewId } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }
    
    const result = await smsService.sendInterviewReminderSMS(interviewId, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Interview reminder SMS sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending interview reminder SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error sending interview reminder SMS' 
    });
  }
});

// POST /api/communications/call/initiate - Avvia chiamata
router.post('/call/initiate', async (req, res) => {
  try {
    const { candidateId, phoneType = 'mobile' } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }
    
    const result = await phoneService.callCandidate(candidateId, phoneType, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Call initiated successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error initiating call' 
    });
  }
});

// POST /api/communications/call/record-outcome - Registra esito chiamata
router.post('/call/record-outcome', async (req, res) => {
  try {
    const { communicationId, duration, outcome, notes } = req.body;
    const userId = 1; // TODO: get from JWT token
    
    if (!communicationId || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await phoneService.recordCallOutcome(
      communicationId,
      { duration, outcome, notes },
      userId
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Call outcome recorded successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error recording call outcome:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error recording call outcome' 
    });
  }
});

// GET /api/communications/call/history/:candidateId - Storico chiamate
router.get('/call/history/:candidateId', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    
    const result = await phoneService.getCallHistory(candidateId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error getting call history' 
    });
  }
});

// GET /api/communications/windows-phone/status - Status integrazione Windows Phone
router.get('/windows-phone/status', async (req, res) => {
  try {
    const [smsStatus, phoneStatus, credits] = await Promise.all([
      smsService.testConnection(),
      phoneService.testPhoneConnection(),
      phoneService.getCreditsStatus()
    ]);
    
    res.json({
      success: true,
      data: {
        sms: smsStatus,
        phone: phoneStatus,
        credits: credits
      }
    });
  } catch (error) {
    console.error('Error checking Windows Phone status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error checking Windows Phone status' 
    });
  }
});

// Integra routes Smart SMS
router.use('/sms', smartSMSRoutes);

export default router;