import { Router } from 'express';
import { smartSMSService, SmartSMSOptions } from '../services/smartSMSService';
import { windowsPhoneService } from '../services/windowsPhoneService';
import { skebbyService } from '../services/skebbyService';
import { smsService } from '../services/smsService';

const router = Router();

/**
 * POST /api/communications/sms/smart
 * Invia SMS utilizzando la logica smart di routing
 */
router.post('/smart', async (req, res) => {
  try {
    const {
      candidateId,
      message,
      urgency = 'medium',
      messageType = 'automated',
      forceMethod
    } = req.body;

    if (!candidateId || !message) {
      return res.status(400).json({
        success: false,
        error: 'candidateId e message sono richiesti'
      });
    }

    // Recupera numero telefono candidato
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) }
    });

    if (!candidate || !candidate.mobile) {
      return res.status(404).json({
        success: false,
        error: 'Candidato non trovato o numero mobile mancante'
      });
    }

    const smartOptions: SmartSMSOptions = {
      phoneNumber: candidate.mobile,
      message,
      urgency,
      messageType,
      candidateId: parseInt(candidateId),
      userId: (req as any).user?.id || 1,
      forceMethod
    };

    const result = await smartSMSService.sendSMS(smartOptions);

    res.json({
      success: result.success,
      method: result.method,
      messageId: result.messageId,
      cost: result.cost,
      executionTime: result.executionTime,
      reasoning: result.reasoning,
      fallbackUsed: result.fallbackUsed,
      error: result.error
    });

  } catch (error) {
    console.error('Errore invio Smart SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * GET /api/communications/sms/status
 * Ottiene lo stato dei servizi SMS
 */
router.get('/status', async (req, res) => {
  try {
    const status = await smartSMSService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Errore controllo stato SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * POST /api/communications/sms/config
 * Aggiorna la configurazione Smart SMS
 */
router.post('/config', async (req, res) => {
  try {
    const {
      primaryMethod,
      fallbackEnabled,
      dailyBudget,
      officeHoursStart,
      officeHoursEnd
    } = req.body;

    const newConfig = {
      primaryMethod,
      fallbackEnabled,
      dailyBudget: parseFloat(dailyBudget),
      officeHours: {
        start: officeHoursStart,
        end: officeHoursEnd,
        timezone: 'Europe/Rome'
      }
    };

    const success = await smartSMSService.updateConfiguration(newConfig);

    if (success) {
      res.json({
        success: true,
        message: 'Configurazione aggiornata con successo'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Errore aggiornamento configurazione'
      });
    }

  } catch (error) {
    console.error('Errore aggiornamento configurazione SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * GET /api/communications/sms/preview
 * Genera preview dell'SMS con metodo suggerito
 */
router.post('/preview', async (req, res) => {
  try {
    const {
      candidateId,
      message,
      urgency = 'medium',
      messageType = 'automated',
      forceMethod
    } = req.body;

    // Mock preview logic - in produzione utilizzare smartSMSService
    const now = new Date();
    const currentHour = now.getHours();
    const isOfficeHours = currentHour >= 9 && currentHour <= 18;
    
    let suggestedMethod: 'windows_phone' | 'cloud' = 'windows_phone';
    let reasoning = 'Configurazione di default';
    let cost = 0;

    if (forceMethod) {
      suggestedMethod = forceMethod;
      reasoning = `Metodo forzato: ${forceMethod}`;
      cost = forceMethod === 'cloud' ? 0.045 : 0;
    } else {
      if (urgency === 'high') {
        suggestedMethod = 'windows_phone';
        reasoning = 'Alta urgenza - telefono aziendale (più affidabile)';
        cost = 0;
      } else if (messageType === 'automated' && !isOfficeHours) {
        suggestedMethod = 'cloud';
        reasoning = 'Messaggio automatico fuori orario - SMS cloud';
        cost = 0.045;
      } else if (messageType === 'personal' && isOfficeHours) {
        suggestedMethod = 'windows_phone';
        reasoning = 'Messaggio personale in orario ufficio - telefono aziendale';
        cost = 0;
      } else {
        // Logica automatica
        suggestedMethod = 'windows_phone';
        reasoning = 'Configurazione automatica - telefono aziendale preferito';
        cost = 0;
      }
    }

    // Verifica disponibilità servizi
    const [windowsAvailable, cloudAvailable] = await Promise.all([
      windowsPhoneService.isAvailable().catch(() => false),
      skebbyService.testConnection().then(r => r.success).catch(() => false)
    ]);

    if (suggestedMethod === 'windows_phone' && !windowsAvailable) {
      if (cloudAvailable) {
        suggestedMethod = 'cloud';
        reasoning += ' + Fallback SMS cloud (telefono non disponibile)';
        cost = 0.045;
      }
    } else if (suggestedMethod === 'cloud' && !cloudAvailable) {
      if (windowsAvailable) {
        suggestedMethod = 'windows_phone';
        reasoning += ' + Fallback telefono aziendale (cloud non disponibile)';
        cost = 0;
      }
    }

    res.json({
      success: true,
      preview: {
        method: suggestedMethod,
        cost,
        reasoning,
        availability: {
          windowsPhone: windowsAvailable,
          cloud: cloudAvailable
        },
        messageLength: message?.length || 0,
        estimatedSMSCount: Math.ceil((message?.length || 0) / 160)
      }
    });

  } catch (error) {
    console.error('Errore generazione preview SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * GET /api/communications/sms/stats
 * Ottiene statistiche SMS per dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    // Mock stats - in produzione recuperare da database
    const mockStats = {
      today: {
        total: 28,
        windowsPhone: 15,
        cloud: 13,
        cost: 12.45,
        avgCost: 0.44,
        success: 27,
        failed: 1
      },
      week: {
        total: 156,
        windowsPhone: 89,
        cloud: 67,
        cost: 67.20,
        trend: 8.5
      },
      month: {
        total: 547,
        windowsPhone: 312,
        cloud: 235,
        cost: 245.80,
        trend: -2.1
      }
    };

    res.json({
      success: true,
      stats: mockStats[period as keyof typeof mockStats] || mockStats.today,
      period
    });

  } catch (error) {
    console.error('Errore recupero statistiche SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * GET /api/communications/sms/recent/:candidateId
 * Ottiene gli SMS recenti per un candidato
 */
router.get('/recent/:candidateId', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    
    if (isNaN(candidateId)) {
      return res.status(400).json({
        success: false,
        error: 'candidateId deve essere un numero valido'
      });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const recentCommunications = await prisma.communication.findMany({
      where: {
        candidateId,
        communicationType: 'SMS'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const formattedSMS = recentCommunications.map((comm: any) => ({
      id: comm.id.toString(),
      message: comm.messageContent,
      method: comm.notes?.includes('windows_phone') ? 'windows_phone' : 'cloud',
      cost: comm.smsCost || 0,
      timestamp: comm.sentAt || comm.createdAt,
      success: comm.deliveryStatus === 'SENT',
      sender: comm.createdBy ? `${comm.createdBy.firstName} ${comm.createdBy.lastName}` : 'Sistema'
    }));

    res.json({
      success: true,
      data: formattedSMS
    });

  } catch (error) {
    console.error('Errore recupero SMS recenti:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

/**
 * POST /api/communications/sms/test-connection
 * Testa la connessione con entrambi i servizi SMS
 */
router.post('/test-connection', async (req, res) => {
  try {
    const [windowsTest, cloudTest] = await Promise.all([
      windowsPhoneService.testConnection().catch(err => ({ success: false, error: err.message })),
      skebbyService.testConnection().catch(err => ({ success: false, error: err.message }))
    ]);

    res.json({
      success: true,
      tests: {
        windowsPhone: windowsTest,
        cloud: cloudTest
      },
      overall: {
        available: windowsTest.success || cloudTest.success,
        recommended: windowsTest.success ? 'windows_phone' : 'cloud'
      }
    });

  } catch (error) {
    console.error('Errore test connessione SMS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore server'
    });
  }
});

export default router;