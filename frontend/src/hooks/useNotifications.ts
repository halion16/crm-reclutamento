import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationPermission {
  permission: NotificationPermission | 'default' | 'granted' | 'denied';
  supported: boolean;
}

export interface PushNotificationData {
  type: 'interview_reminder' | 'candidate_status' | 'urgent_task' | 'deadline_alert' | 'general';
  title: string;
  body: string;
  candidateId?: string;
  candidateName?: string;
  interviewId?: string;
  interviewDate?: string;
  priority?: 'low' | 'medium' | 'high';
  url?: string;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  interviewReminders: boolean;
  candidateUpdates: boolean;
  urgentTasks: boolean;
  deadlineAlerts: boolean;
  generalNotifications: boolean;
  reminderMinutes: number; // Anticipo reminder in minuti
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
}

const defaultSettings: NotificationSettings = {
  interviewReminders: true,
  candidateUpdates: true,
  urgentTasks: true,
  deadlineAlerts: true,
  generalNotifications: false,
  reminderMinutes: 30,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>({
    permission: 'default',
    supported: false
  });
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const serviceWorkerReg = useRef<ServiceWorkerRegistration | null>(null);

  // Inizializzazione
  useEffect(() => {
    checkNotificationSupport();
    loadSettings();
    registerServiceWorker();
  }, []);

  // Verifica supporto notifiche
  const checkNotificationSupport = useCallback(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    const currentPermission = supported ? Notification.permission : 'denied';

    setPermission({
      permission: currentPermission,
      supported
    });
  }, []);

  // Carica impostazioni dal localStorage
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem('crm-notification-settings');
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  // Salva impostazioni nel localStorage
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    try {
      localStorage.setItem('crm-notification-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, []);

  // Registra Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      serviceWorkerReg.current = registration;

      // Controlla se abbiamo una push subscription
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, []);

  // Richiedi permesso notifiche
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!permission.supported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(prev => ({ ...prev, permission: result }));
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permission.supported]);

  // Sottoscrivi notifiche push
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!serviceWorkerReg.current || permission.permission !== 'granted') {
      return false;
    }

    setIsLoading(true);

    try {
      // Chiave VAPID pubblica (corrisponde a quella del backend)
      const vapidPublicKey = 'BIiyHmAzazTkF6IlWJnSRfY5mNAkwpk3djySfdEgt7O289kShn5WCiGsWxjTgJGwZkp2KO8EvZP84vCUQDfYiy8';
      
      const subscription = await serviceWorkerReg.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Invia subscription al server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          settings
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setIsLoading(false);
    }

    return false;
  }, [permission.permission, settings]);

  // Disiscriviti da notifiche push
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!serviceWorkerReg.current) return false;

    setIsLoading(true);

    try {
      const subscription = await serviceWorkerReg.current.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notifica il server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription })
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Invia notifica locale (per test)
  const showLocalNotification = useCallback((data: PushNotificationData) => {
    if (permission.permission !== 'granted') return;

    // Verifica ore silenziose
    if (settings.quietHoursEnabled && isQuietHours()) {
      console.log('Notification blocked: quiet hours active');
      return;
    }

    // Verifica impostazioni tipo notifica
    if (!shouldShowNotification(data.type)) return;

    const notification = new Notification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      tag: `local-${data.type}-${Date.now()}`,
      data: data.data,
      requireInteraction: data.priority === 'high'
    });

    notification.onclick = () => {
      if (data.url) {
        window.open(data.url, '_self');
      }
      notification.close();
    };

    // Auto-close dopo 5 secondi (eccetto high priority)
    if (data.priority !== 'high') {
      setTimeout(() => notification.close(), 5000);
    }
  }, [permission.permission, settings]);

  // Verifica se siamo in ore silenziose
  const isQuietHours = useCallback((): boolean => {
    if (!settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Stesso giorno (es. 22:00 - 08:00 del giorno dopo)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Attraversa mezzanotte (es. 22:00 - 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings.quietHoursEnabled, settings.quietHoursStart, settings.quietHoursEnd]);

  // Verifica se mostrare notifica per tipo
  const shouldShowNotification = useCallback((type: PushNotificationData['type']): boolean => {
    switch (type) {
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
  }, [settings]);

  // Test notifica
  const testNotification = useCallback(() => {
    showLocalNotification({
      type: 'general',
      title: '🧪 Test Notifica CRM',
      body: 'Questa è una notifica di test. Il sistema funziona correttamente!',
      priority: 'medium',
      url: '/dashboard'
    });
  }, [showLocalNotification]);

  // Pulisci tutte le notifiche
  const clearAllNotifications = useCallback(() => {
    if (serviceWorkerReg.current) {
      serviceWorkerReg.current.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }, []);

  return {
    // Stati
    permission,
    settings,
    isSubscribed,
    isLoading,
    
    // Azioni
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    saveSettings,
    showLocalNotification,
    testNotification,
    clearAllNotifications,
    
    // Utilità
    isQuietHours,
    shouldShowNotification
  };
};

// Utility function per convertire VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default useNotifications;