import express from 'express';
import { notificationService, NotificationPayload } from '../services/notificationService';

const router = express.Router();

/**
 * @route POST /api/notifications/subscribe
 * @desc Registra subscription push per utente
 * @access Private
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, settings } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Subscription data is required'
      });
    }

    // In produzione, ottenere userId dal JWT token
    const userId = req.headers['user-id'] as string || 'demo-user-1';
    
    const success = await notificationService.registerSubscription(
      userId, 
      subscription, 
      settings
    );

    res.json({
      success,
      message: success ? 'Subscription registered successfully' : 'Failed to register subscription'
    });
  } catch (error) {
    console.error('Error in /subscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/unsubscribe
 * @desc Rimuove subscription push per utente
 * @access Private
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    // In produzione, ottenere userId dal JWT token
    const userId = req.headers['user-id'] as string || 'demo-user-1';
    
    const success = await notificationService.unregisterSubscription(userId);

    res.json({
      success,
      message: success ? 'Subscription removed successfully' : 'Failed to remove subscription'
    });
  } catch (error) {
    console.error('Error in /unsubscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/send
 * @desc Invia notifica push a utente specifico
 * @access Private
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, payload } = req.body;

    if (!userId || !payload) {
      return res.status(400).json({
        success: false,
        error: 'userId and payload are required'
      });
    }

    // Validazione payload
    if (!payload.title || !payload.body || !payload.type) {
      return res.status(400).json({
        success: false,
        error: 'Payload must include title, body, and type'
      });
    }

    const success = await notificationService.sendPushNotification(userId, payload);

    res.json({
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    });
  } catch (error) {
    console.error('Error in /send:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/broadcast
 * @desc Invia notifica a tutti gli utenti (o filtrati)
 * @access Private (Admin)
 */
router.post('/broadcast', async (req, res) => {
  try {
    const { payload, filter } = req.body;

    if (!payload || !payload.title || !payload.body || !payload.type) {
      return res.status(400).json({
        success: false,
        error: 'Valid payload with title, body, and type is required'
      });
    }

    // Funzione di filtro opzionale
    let filterFn;
    if (filter) {
      switch (filter.type) {
        case 'setting':
          filterFn = (subscription: any) => subscription.settings[filter.key] === true;
          break;
        case 'role':
          filterFn = (subscription: any) => subscription.userRole === filter.value;
          break;
        default:
          filterFn = undefined;
      }
    }

    const result = await notificationService.broadcastNotification(payload, filterFn);

    res.json({
      success: true,
      result: {
        sent: result.sent,
        failed: result.failed,
        total: result.sent + result.failed
      }
    });
  } catch (error) {
    console.error('Error in /broadcast:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/schedule
 * @desc Programma reminder per dopo
 * @access Private
 */
router.post('/schedule', async (req, res) => {
  try {
    const { type, scheduledFor, payload, targetUsers, recurring } = req.body;

    if (!type || !scheduledFor || !payload || !targetUsers) {
      return res.status(400).json({
        success: false,
        error: 'type, scheduledFor, payload, and targetUsers are required'
      });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'scheduledFor must be in the future'
      });
    }

    const reminderId = await notificationService.scheduleReminder({
      type,
      scheduledFor: scheduledDate,
      payload,
      targetUsers,
      recurring
    });

    res.json({
      success: true,
      reminderId,
      message: 'Reminder scheduled successfully'
    });
  } catch (error) {
    console.error('Error in /schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/notifications/schedule/:id
 * @desc Cancella reminder programmato
 * @access Private
 */
router.delete('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await notificationService.cancelReminder(id);

    res.json({
      success,
      message: success ? 'Reminder cancelled successfully' : 'Reminder not found'
    });
  } catch (error) {
    console.error('Error in /schedule/:id DELETE:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/snooze
 * @desc Posticipa reminder per X minuti
 * @access Private
 */
router.post('/snooze', async (req, res) => {
  try {
    const { reminderId, minutes = 15 } = req.body;

    if (!reminderId) {
      return res.status(400).json({
        success: false,
        error: 'reminderId is required'
      });
    }

    const success = await notificationService.snoozeReminder(reminderId, minutes);

    res.json({
      success,
      message: success ? `Reminder snoozed for ${minutes} minutes` : 'Reminder not found'
    });
  } catch (error) {
    console.error('Error in /snooze:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/notifications/pending
 * @desc Ottieni reminder in attesa per utente
 * @access Private
 */
router.get('/pending', async (req, res) => {
  try {
    // In produzione, ottenere userId dal JWT token
    const userId = req.headers['user-id'] as string || 'demo-user-1';
    
    const reminders = await notificationService.getPendingReminders(userId);

    res.json({
      success: true,
      reminders: reminders.map(r => ({
        id: r.id,
        type: r.type,
        scheduledFor: r.scheduledFor,
        payload: r.payload,
        attempts: r.attempts,
        maxAttempts: r.maxAttempts
      }))
    });
  } catch (error) {
    console.error('Error in /pending:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/notifications/pending-reminders
 * @desc Ottieni reminder scaduti (per Service Worker background sync)
 * @access Public
 */
router.get('/pending-reminders', async (req, res) => {
  try {
    const now = new Date();
    const reminders = await notificationService.getPendingReminders();
    
    // Filtra solo quelli scaduti
    const dueReminders = reminders
      .filter(r => new Date(r.scheduledFor) <= now)
      .map(r => ({
        id: r.id,
        title: r.payload.title,
        body: r.payload.body,
        data: r.payload.data,
        priority: r.payload.data?.priority || 'medium'
      }));

    res.json(dueReminders);
  } catch (error) {
    console.error('Error in /pending-reminders:', error);
    res.json([]);
  }
});

/**
 * @route GET /api/notifications/stats
 * @desc Statistiche sistema notifiche
 * @access Private (Admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await notificationService.getSubscriptionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in /stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/test
 * @desc Invia notifica di test
 * @access Private
 */
router.post('/test', async (req, res) => {
  try {
    // In produzione, ottenere userId dal JWT token
    const userId = req.headers['user-id'] as string || 'demo-user-1';
    
    const testPayload: NotificationPayload = {
      type: 'general',
      title: '🧪 Test Notifica CRM',
      body: 'Questa è una notifica di test. Il sistema funziona correttamente!',
      data: {
        priority: 'medium',
        url: '/dashboard',
        timestamp: new Date().toISOString()
      }
    };

    const success = await notificationService.sendPushNotification(userId, testPayload);

    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Failed to send test notification'
    });
  } catch (error) {
    console.error('Error in /test:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/notifications/interview-reminder
 * @desc Programma reminder per colloquio
 * @access Private
 */
router.post('/interview-reminder', async (req, res) => {
  try {
    const { 
      interviewId, 
      candidateId, 
      candidateName, 
      interviewDate, 
      interviewerIds, 
      reminderMinutes = 30 
    } = req.body;

    if (!interviewId || !candidateId || !candidateName || !interviewDate || !interviewerIds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const scheduledDate = new Date(interviewDate);
    const reminderDate = new Date(scheduledDate.getTime() - reminderMinutes * 60 * 1000);

    // Solo se il reminder è nel futuro
    if (reminderDate > new Date()) {
      const reminderId = await notificationService.scheduleReminder({
        type: 'interview_reminder',
        scheduledFor: reminderDate,
        payload: {
          type: 'interview_reminder',
          title: '🗓️ Reminder Colloquio',
          body: `Colloquio con ${candidateName} tra ${reminderMinutes} minuti`,
          data: {
            candidateId,
            candidateName,
            interviewId,
            interviewDate: scheduledDate.toISOString(),
            priority: 'high',
            url: `/interviews/${interviewId}`
          }
        },
        targetUsers: interviewerIds
      });

      res.json({
        success: true,
        reminderId,
        message: `Interview reminder scheduled ${reminderMinutes} minutes before interview`
      });
    } else {
      res.json({
        success: false,
        message: 'Interview is too soon to schedule reminder'
      });
    }
  } catch (error) {
    console.error('Error in /interview-reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;