// Service Worker per notifiche push - CRM Reclutamento
const CACHE_NAME = 'crm-notifications-v1';

// Eventi del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestione notifiche push
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received:', event);

  let notificationData = {
    title: 'CRM Reclutamento',
    body: 'Nuova notifica',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  // Parse dati push
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      notificationData.body = event.data.text() || 'Nuova notifica';
    }
  }

  // Personalizzazione notifica per tipo
  const { type, candidateName, interviewDate, priority } = notificationData.data || {};
  
  switch (type) {
    case 'interview_reminder':
      notificationData.title = '🗓️ Reminder Colloquio';
      notificationData.body = `Colloquio con ${candidateName} tra 30 minuti`;
      notificationData.tag = 'interview-reminder';
      notificationData.requireInteraction = true;
      notificationData.actions = [
        { action: 'view', title: 'Visualizza', icon: '/icons/view.png' },
        { action: 'reschedule', title: 'Riprogramma', icon: '/icons/calendar.png' }
      ];
      break;

    case 'candidate_status':
      notificationData.title = '👤 Aggiornamento Candidato';
      notificationData.body = `Stato candidato ${candidateName} aggiornato`;
      notificationData.tag = 'candidate-update';
      break;

    case 'urgent_task':
      notificationData.title = '⚠️ Azione Urgente';
      notificationData.requireInteraction = true;
      notificationData.actions = [
        { action: 'handle', title: 'Gestisci Ora', icon: '/icons/urgent.png' },
        { action: 'snooze', title: 'Posticipa', icon: '/icons/snooze.png' }
      ];
      break;

    case 'deadline_alert':
      notificationData.title = '⏰ Scadenza Imminente';
      notificationData.requireInteraction = true;
      break;

    default:
      // Mantieni configurazione di default
      break;
  }

  // Mostra notifica
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag || 'crm-notification',
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    timestamp: Date.now(),
    silent: false,
    vibrate: priority === 'high' ? [200, 100, 200, 100, 200] : [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestione click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event);

  event.notification.close();

  const { action } = event;
  const { type, candidateId, interviewId, url } = event.notification.data || {};

  let targetUrl = '/';

  // Azioni specifiche
  if (action === 'view' || !action) {
    switch (type) {
      case 'interview_reminder':
        targetUrl = `/interviews/${interviewId}`;
        break;
      case 'candidate_status':
        targetUrl = `/candidates/${candidateId}`;
        break;
      case 'urgent_task':
        targetUrl = '/dashboard?filter=urgent';
        break;
      default:
        targetUrl = url || '/dashboard';
        break;
    }
  } else if (action === 'reschedule' && interviewId) {
    targetUrl = `/interviews/${interviewId}/reschedule`;
  } else if (action === 'snooze') {
    // Invia richiesta per posticipare
    fetch('/api/notifications/snooze', {
      method: 'POST',
      body: JSON.stringify({ notificationId: event.notification.tag }),
      headers: { 'Content-Type': 'application/json' }
    });
    return;
  } else if (action === 'handle') {
    targetUrl = '/dashboard?filter=urgent';
  }

  // Apri finestra browser
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Cerca finestra esistente
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'notification_click',
            url: targetUrl,
            data: event.notification.data
          });
          return client.focus();
        }
      }

      // Apri nuova finestra
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Gestione chiusura notifiche
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.data);
  
  // Invia analytics
  if (event.notification.data) {
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      body: JSON.stringify({
        type: event.notification.data.type,
        timestamp: Date.now()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Gestione messaggi dal client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
      break;
  }
});

// Sync background per reminder
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

// Funzione per controllare reminder
async function checkReminders() {
  try {
    const response = await fetch('/api/notifications/pending-reminders');
    const reminders = await response.json();
    
    reminders.forEach(reminder => {
      self.registration.showNotification(reminder.title, {
        body: reminder.body,
        data: reminder.data,
        tag: `reminder-${reminder.id}`,
        requireInteraction: reminder.priority === 'high'
      });
    });
  } catch (error) {
    console.error('[SW] Error checking reminders:', error);
  }
}