import cron from 'node-cron';
import webpush from 'web-push';

// Tipi per il sistema di notifiche
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  settings: NotificationSettings;
  createdAt: Date;
  lastUsed: Date;
}

export interface NotificationSettings {
  interviewReminders: boolean;
  candidateUpdates: boolean;
  urgentTasks: boolean;
  deadlineAlerts: boolean;
  generalNotifications: boolean;
  reminderMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface NotificationPayload {
  type: 'interview_reminder' | 'candidate_status' | 'urgent_task' | 'deadline_alert' | 'general';
  title: string;
  body: string;
  data?: {
    candidateId?: string;
    candidateName?: string;
    interviewId?: string;
    interviewDate?: string;
    priority?: 'low' | 'medium' | 'high';
    url?: string;
    [key: string]: any;
  };
}

export interface ScheduledReminder {
  id: string;
  type: NotificationPayload['type'];
  scheduledFor: Date;
  payload: NotificationPayload;
  targetUsers: string[];
  recurring?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  sentAt?: Date;
}

export class NotificationService {
  private subscriptions: Map<string, PushSubscription> = new Map();
  private scheduledReminders: Map<string, ScheduledReminder> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeWebPush();
    this.startReminderScheduler();
  }

  // Inizializzazione Web Push
  private initializeWebPush() {
    try {
      // In produzione, questi dovrebbero venire da variabili ambiente
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key';
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key';
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@your-domain.com';

      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.isInitialized = true;
      console.log('✅ Web Push initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Web Push:', error);
    }
  }

  // Registra subscription utente
  async registerSubscription(userId: string, subscription: any, settings: NotificationSettings): Promise<boolean> {
    try {
      const pushSubscription: PushSubscription = {
        id: `${userId}-${Date.now()}`,
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        settings,
        createdAt: new Date(),
        lastUsed: new Date()
      };

      this.subscriptions.set(userId, pushSubscription);
      
      // In produzione, salvare nel database
      console.log(`✅ Push subscription registered for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to register subscription:', error);
      return false;
    }
  }

  // Rimuovi subscription utente
  async unregisterSubscription(userId: string): Promise<boolean> {
    try {
      this.subscriptions.delete(userId);
      console.log(`✅ Push subscription removed for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister subscription:', error);
      return false;
    }
  }

  // Invia notifica push a utente specifico
  async sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('⚠️ Web Push not initialized, skipping notification');
      return false;
    }

    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      console.warn(`⚠️ No subscription found for user: ${userId}`);
      return false;
    }

    // Verifica impostazioni utente
    if (!this.shouldSendNotification(subscription.settings, payload)) {
      console.log(`⏭️ Notification skipped due to user settings: ${userId}`);
      return true; // Non è un errore, semplicemente filtrato
    }

    // Verifica ore silenziose
    if (this.isQuietHours(subscription.settings)) {
      console.log(`🌙 Notification deferred due to quiet hours: ${userId}`);
      // Posticipa la notifica
      await this.scheduleReminder({
        type: payload.type,
        scheduledFor: this.getNextActiveHour(subscription.settings),
        payload,
        targetUsers: [userId]
      });
      return true;
    }

    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      
      // Aggiorna last used
      subscription.lastUsed = new Date();
      
      console.log(`✅ Push notification sent to user: ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send push notification to user ${userId}:`, error);
      
      // Se subscription è invalida, rimuovila
      if (error.statusCode === 410) {
        this.subscriptions.delete(userId);
        console.log(`🗑️ Removed invalid subscription for user: ${userId}`);
      }
      
      return false;
    }
  }

  // Invia notifica a tutti gli utenti
  async broadcastNotification(payload: NotificationPayload, filterFn?: (subscription: PushSubscription) => boolean): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const subscriptions = Array.from(this.subscriptions.values());
    const filteredSubscriptions = filterFn ? subscriptions.filter(filterFn) : subscriptions;

    const promises = filteredSubscriptions.map(async (subscription) => {
      const success = await this.sendPushNotification(subscription.userId, payload);
      if (success) sent++;
      else failed++;
    });

    await Promise.all(promises);

    console.log(`📊 Broadcast complete - Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
  }

  // Programma reminder
  async scheduleReminder(params: {
    type: NotificationPayload['type'];
    scheduledFor: Date;
    payload: NotificationPayload;
    targetUsers: string[];
    recurring?: 'daily' | 'weekly' | 'monthly';
  }): Promise<string> {
    const id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const reminder: ScheduledReminder = {
      id,
      type: params.type,
      scheduledFor: params.scheduledFor,
      payload: params.payload,
      targetUsers: params.targetUsers,
      recurring: params.recurring,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    this.scheduledReminders.set(id, reminder);
    console.log(`📅 Reminder scheduled: ${id} for ${params.scheduledFor.toISOString()}`);
    
    return id;
  }

  // Cancella reminder
  async cancelReminder(reminderId: string): Promise<boolean> {
    const reminder = this.scheduledReminders.get(reminderId);
    if (reminder) {
      reminder.status = 'cancelled';
      console.log(`❌ Reminder cancelled: ${reminderId}`);
      return true;
    }
    return false;
  }

  // Avvia scheduler per reminder automatici
  private startReminderScheduler() {
    // Controllo ogni minuto per reminder in scadenza
    cron.schedule('* * * * *', async () => {
      await this.processScheduledReminders();
    });

    // Controllo giornaliero per reminder colloqui (alle 8:00)
    cron.schedule('0 8 * * *', async () => {
      await this.scheduleInterviewReminders();
    });

    // Controllo settimanale per candidati inattivi (lunedì alle 9:00)
    cron.schedule('0 9 * * 1', async () => {
      await this.checkInactiveCandidates();
    });

    // Cleanup reminder scaduti (ogni giorno alle 3:00)
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupExpiredReminders();
    });

    console.log('⏰ Reminder scheduler started');
  }

  // Processa reminder programmati
  private async processScheduledReminders() {
    const now = new Date();
    const pendingReminders = Array.from(this.scheduledReminders.values())
      .filter(r => r.status === 'pending' && r.scheduledFor <= now);

    for (const reminder of pendingReminders) {
      await this.executeReminder(reminder);
    }
  }

  // Esegui reminder specifico
  private async executeReminder(reminder: ScheduledReminder) {
    reminder.attempts++;

    try {
      let sent = 0;
      let failed = 0;

      // Invia a tutti gli utenti target
      for (const userId of reminder.targetUsers) {
        const success = await this.sendPushNotification(userId, reminder.payload);
        if (success) sent++;
        else failed++;
      }

      if (failed === 0) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
        console.log(`✅ Reminder executed successfully: ${reminder.id}`);
      } else if (reminder.attempts >= reminder.maxAttempts) {
        reminder.status = 'failed';
        console.error(`❌ Reminder failed after ${reminder.attempts} attempts: ${reminder.id}`);
      } else {
        // Riprova tra 5 minuti
        reminder.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
        console.warn(`⏳ Reminder rescheduled for retry: ${reminder.id}`);
      }

      // Gestisci recurring
      if (reminder.status === 'sent' && reminder.recurring) {
        await this.scheduleRecurringReminder(reminder);
      }

    } catch (error) {
      console.error(`❌ Error executing reminder ${reminder.id}:`, error);
      
      if (reminder.attempts >= reminder.maxAttempts) {
        reminder.status = 'failed';
      } else {
        reminder.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
      }
    }
  }

  // Programma reminder ricorrente
  private async scheduleRecurringReminder(originalReminder: ScheduledReminder) {
    if (!originalReminder.recurring) return;

    let nextSchedule = new Date(originalReminder.scheduledFor);

    switch (originalReminder.recurring) {
      case 'daily':
        nextSchedule.setDate(nextSchedule.getDate() + 1);
        break;
      case 'weekly':
        nextSchedule.setDate(nextSchedule.getDate() + 7);
        break;
      case 'monthly':
        nextSchedule.setMonth(nextSchedule.getMonth() + 1);
        break;
    }

    await this.scheduleReminder({
      type: originalReminder.type,
      scheduledFor: nextSchedule,
      payload: originalReminder.payload,
      targetUsers: originalReminder.targetUsers,
      recurring: originalReminder.recurring
    });
  }

  // Programma reminder per colloqui del giorno
  private async scheduleInterviewReminders() {
    try {
      // Mock data - in produzione, query dal database
      const todayInterviews = await this.getTodayInterviews();
      
      for (const interview of todayInterviews) {
        // Calcola orario reminder basato su impostazioni utente
        const reminderTime = new Date(interview.scheduledDate);
        reminderTime.setMinutes(reminderTime.getMinutes() - interview.reminderMinutes);

        // Se il reminder è nel futuro, programmalo
        if (reminderTime > new Date()) {
          await this.scheduleReminder({
            type: 'interview_reminder',
            scheduledFor: reminderTime,
            payload: {
              type: 'interview_reminder',
              title: '🗓️ Reminder Colloquio',
              body: `Colloquio con ${interview.candidateName} tra ${interview.reminderMinutes} minuti`,
              data: {
                candidateId: interview.candidateId,
                candidateName: interview.candidateName,
                interviewId: interview.id,
                interviewDate: interview.scheduledDate.toISOString(),
                priority: 'high',
                url: `/interviews/${interview.id}`
              }
            },
            targetUsers: interview.interviewerIds
          });
        }
      }
      
      console.log(`📅 Scheduled ${todayInterviews.length} interview reminders`);
    } catch (error) {
      console.error('❌ Error scheduling interview reminders:', error);
    }
  }

  // Controllo candidati inattivi
  private async checkInactiveCandidates() {
    try {
      // Mock data - in produzione, query dal database
      const inactiveCandidates = await this.getInactiveCandidates();
      
      if (inactiveCandidates.length > 0) {
        await this.broadcastNotification({
          type: 'urgent_task',
          title: '⚠️ Candidati Inattivi',
          body: `${inactiveCandidates.length} candidati non hanno aggiornamenti da oltre 7 giorni`,
          data: {
            priority: 'medium',
            url: '/candidates?filter=inactive'
          }
        }, (subscription) => subscription.settings.urgentTasks);
      }
    } catch (error) {
      console.error('❌ Error checking inactive candidates:', error);
    }
  }

  // Pulizia reminder scaduti
  private async cleanupExpiredReminders() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Rimuovi reminder di oltre 7 giorni

    let cleaned = 0;
    for (const [id, reminder] of this.scheduledReminders) {
      if (reminder.createdAt < cutoffDate && ['sent', 'failed', 'cancelled'].includes(reminder.status)) {
        this.scheduledReminders.delete(id);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned up ${cleaned} expired reminders`);
  }

  // Utility: Verifica se inviare notifica
  private shouldSendNotification(settings: NotificationSettings, payload: NotificationPayload): boolean {
    switch (payload.type) {
      case 'interview_reminder':
        return settings.interviewReminders;
      case 'candidate_status':
        return settings.candidateUpdates;
      case 'urgent_task':
        return settings.urgentTasks;
      case 'deadline_alert':
        return settings.deadlineAlerts;
      case 'general':
        return settings.generalNotifications;
      default:
        return true;
    }
  }

  // Utility: Verifica ore silenziose
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Utility: Calcola prossima ora attiva
  private getNextActiveHour(settings: NotificationSettings): Date {
    if (!settings.quietHoursEnabled) return new Date();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
    
    const nextActive = new Date(now);
    nextActive.setHours(endHour, endMin, 0, 0);

    // Se l'ora di fine è già passata oggi, programma per domani
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }

    return nextActive;
  }

  // Mock data functions (in produzione sostituire con query database reali)
  private async getTodayInterviews() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: 'int-1',
        candidateId: 'cand-1',
        candidateName: 'Marco Rossi',
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // Tra 2 ore
        interviewerIds: ['user-1', 'user-2'],
        reminderMinutes: 30
      },
      {
        id: 'int-2',
        candidateId: 'cand-2',
        candidateName: 'Sara Colombo',
        scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // Tra 4 ore
        interviewerIds: ['user-1'],
        reminderMinutes: 15
      }
    ];
  }

  private async getInactiveCandidates() {
    // Mock data - candidati inattivi da oltre 7 giorni
    return [
      { id: 'cand-3', name: 'Luigi Verdi', lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { id: 'cand-4', name: 'Anna Bianchi', lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
    ];
  }

  // Metodi pubblici per API endpoints
  async getSubscriptionStats(): Promise<any> {
    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: Array.from(this.subscriptions.values())
        .filter(s => (Date.now() - s.lastUsed.getTime()) < 7 * 24 * 60 * 60 * 1000).length,
      scheduledReminders: this.scheduledReminders.size,
      pendingReminders: Array.from(this.scheduledReminders.values())
        .filter(r => r.status === 'pending').length
    };
  }

  async getPendingReminders(userId?: string): Promise<ScheduledReminder[]> {
    const reminders = Array.from(this.scheduledReminders.values())
      .filter(r => r.status === 'pending');
    
    if (userId) {
      return reminders.filter(r => r.targetUsers.includes(userId));
    }
    
    return reminders;
  }

  async snoozeReminder(reminderId: string, minutes: number = 15): Promise<boolean> {
    const reminder = this.scheduledReminders.get(reminderId);
    if (reminder && reminder.status === 'pending') {
      reminder.scheduledFor = new Date(Date.now() + minutes * 60 * 1000);
      console.log(`😴 Reminder snoozed for ${minutes} minutes: ${reminderId}`);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const notificationService = new NotificationService();