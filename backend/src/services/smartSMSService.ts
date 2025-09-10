import { windowsPhoneService, WindowsPhoneResult } from './windowsPhoneService';
import { skebbyService, SkebbyResponse } from './skebbyService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SmartSMSConfig {
  primaryMethod: 'windows_phone' | 'cloud' | 'auto';
  fallbackEnabled: boolean;
  maxWindowsPhoneRetries: number;
  dailyBudget: number;
  urgencyLevels: {
    high: 'windows_phone' | 'cloud';
    medium: 'auto';
    low: 'cloud';
  };
  officeHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
    timezone: string; // "Europe/Rome"
  };
  costThreshold: {
    daily: number;
    monthly: number;
  };
}

interface SmartSMSOptions {
  phoneNumber: string;
  message: string;
  urgency?: 'high' | 'medium' | 'low';
  messageType?: 'personal' | 'automated' | 'reminder';
  candidateId?: number;
  interviewId?: number;
  userId?: number;
  forceMethod?: 'windows_phone' | 'cloud';
}

interface SmartSMSResult {
  success: boolean;
  method: 'windows_phone' | 'cloud';
  messageId?: string;
  cost?: number;
  error?: string;
  fallbackUsed?: boolean;
  executionTime?: number;
  reasoning?: string;
}

interface CostTracker {
  dailyCost: number;
  monthlyCost: number;
  dailyCount: number;
  monthlyCount: number;
  lastReset: Date;
}

class SmartSMSService {
  private config: SmartSMSConfig;
  private costTracker: CostTracker;

  constructor() {
    this.config = this.loadConfiguration();
    this.costTracker = {
      dailyCost: 0,
      monthlyCost: 0,
      dailyCount: 0,
      monthlyCount: 0,
      lastReset: new Date()
    };
    
    console.log('[SmartSMSService] Inizializzato con configurazione:', {
      primaryMethod: this.config.primaryMethod,
      fallbackEnabled: this.config.fallbackEnabled,
      dailyBudget: this.config.dailyBudget
    });
  }

  /**
   * Invia SMS utilizzando la logica smart di routing
   */
  async sendSMS(options: SmartSMSOptions): Promise<SmartSMSResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[SmartSMSService] Invio SMS a ${options.phoneNumber}, urgenza: ${options.urgency || 'medium'}`);
      
      // Determina il metodo ottimale
      const chosenMethod = await this.determineOptimalMethod(options);
      const reasoning = this.explainMethodChoice(chosenMethod, options);
      
      console.log(`[SmartSMSService] Metodo scelto: ${chosenMethod} - ${reasoning}`);

      let result: SmartSMSResult;

      // Tentativo con metodo primario
      if (chosenMethod === 'windows_phone') {
        result = await this.sendViaWindowsPhone(options);
      } else {
        result = await this.sendViaCloud(options);
      }

      // Fallback se il metodo primario fallisce
      if (!result.success && this.config.fallbackEnabled && !options.forceMethod) {
        console.log(`[SmartSMSService] Tentativo fallback...`);
        
        const fallbackMethod = chosenMethod === 'windows_phone' ? 'cloud' : 'windows_phone';
        let fallbackResult: SmartSMSResult;
        
        if (fallbackMethod === 'windows_phone') {
          fallbackResult = await this.sendViaWindowsPhone(options);
        } else {
          fallbackResult = await this.sendViaCloud(options);
        }
        
        if (fallbackResult.success) {
          result = {
            ...fallbackResult,
            fallbackUsed: true,
            reasoning: `${reasoning} + Fallback utilizzato`
          };
          console.log(`[SmartSMSService] ✅ Fallback riuscito con ${fallbackMethod}`);
        }
      }

      // Aggiorna tracking costi
      if (result.success && result.cost) {
        await this.updateCostTracking(result.cost, result.method);
      }

      // Log nel database
      await this.logCommunication(options, result);

      result.executionTime = Date.now() - startTime;
      result.reasoning = reasoning;

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('[SmartSMSService] Errore invio SMS:', error);
      
      return {
        success: false,
        method: 'cloud', // Default per errori
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        executionTime,
        reasoning: 'Errore durante l\'esecuzione'
      };
    }
  }

  /**
   * Ottiene statistiche e stato del servizio
   */
  async getServiceStatus(): Promise<{
    windowsPhoneAvailable: boolean;
    cloudAvailable: boolean;
    dailyCosts: CostTracker;
    recommendations: string[];
  }> {
    try {
      const [windowsPhoneStatus, cloudStatus] = await Promise.all([
        windowsPhoneService.isAvailable(),
        skebbyService.testConnection().then(r => r.success).catch(() => false)
      ]);

      const recommendations: string[] = [];
      
      // Reset giornaliero/mensile se necessario
      await this.resetCostTrackingIfNeeded();

      // Analizza e fornisce raccomandazioni
      if (this.costTracker.dailyCost >= this.config.costThreshold.daily) {
        recommendations.push('⚠️ Budget giornaliero SMS quasi esaurito - privilegiare telefono aziendale');
      }

      if (!windowsPhoneStatus && cloudStatus) {
        recommendations.push('📱 Telefono aziendale non disponibile - utilizzando solo SMS cloud');
      } else if (windowsPhoneStatus && !cloudStatus) {
        recommendations.push('☁️ SMS cloud non disponibile - utilizzando solo telefono aziendale');
      }

      const isOfficeHours = this.isWithinOfficeHours();
      if (!isOfficeHours) {
        recommendations.push('🌙 Fuori orario ufficio - SMS automatici via cloud');
      }

      return {
        windowsPhoneAvailable: windowsPhoneStatus,
        cloudAvailable: cloudStatus,
        dailyCosts: this.costTracker,
        recommendations
      };

    } catch (error) {
      console.error('[SmartSMSService] Errore controllo stato:', error);
      return {
        windowsPhoneAvailable: false,
        cloudAvailable: false,
        dailyCosts: this.costTracker,
        recommendations: ['❌ Errore controllo stato servizi SMS']
      };
    }
  }

  /**
   * Configura le impostazioni del servizio smart
   */
  async updateConfiguration(newConfig: Partial<SmartSMSConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Salva configurazione (in futuro può essere salvata in database)
      console.log('[SmartSMSService] Configurazione aggiornata:', newConfig);
      
      return true;
    } catch (error) {
      console.error('[SmartSMSService] Errore aggiornamento configurazione:', error);
      return false;
    }
  }

  // ==================== METODI PRIVATI ====================

  private async determineOptimalMethod(options: SmartSMSOptions): Promise<'windows_phone' | 'cloud'> {
    // Metodo forzato
    if (options.forceMethod) {
      return options.forceMethod;
    }

    // Verifica disponibilità servizi
    const [windowsAvailable, cloudAvailable] = await Promise.all([
      windowsPhoneService.isAvailable(),
      skebbyService.quickTest()
    ]);

    // Se solo uno è disponibile
    if (windowsAvailable && !cloudAvailable) return 'windows_phone';
    if (!windowsAvailable && cloudAvailable) return 'cloud';
    if (!windowsAvailable && !cloudAvailable) return 'cloud'; // Default, genererà errore

    // Logica basata su configurazione e contesto
    const urgency = options.urgency || 'medium';
    const messageType = options.messageType || 'automated';
    const isOfficeHours = this.isWithinOfficeHours();

    // Reset tracking se necessario
    await this.resetCostTrackingIfNeeded();

    // Regole di routing intelligente
    switch (this.config.primaryMethod) {
      case 'windows_phone':
        // Usa sempre telefono se disponibile, tranne casi specifici
        if (messageType === 'automated' && !isOfficeHours) {
          return 'cloud'; // Automatici fuori orario via cloud
        }
        if (this.costTracker.dailyCost >= this.config.costThreshold.daily) {
          return 'windows_phone'; // Risparmia quando budget quasi finito
        }
        return 'windows_phone';

      case 'cloud':
        // Usa sempre cloud
        return 'cloud';

      case 'auto':
      default:
        // Logica automatica avanzata
        
        // Urgenza alta = telefono aziendale (più affidabile)
        if (urgency === 'high') {
          return this.config.urgencyLevels.high;
        }

        // Messaggi personali in orario ufficio = telefono aziendale
        if (messageType === 'personal' && isOfficeHours) {
          return 'windows_phone';
        }

        // Messaggi automatici fuori orario = cloud
        if (messageType === 'automated' && !isOfficeHours) {
          return 'cloud';
        }

        // Se budget giornaliero quasi finito = telefono
        if (this.costTracker.dailyCost >= this.config.costThreshold.daily * 0.8) {
          return 'windows_phone';
        }

        // Default per urgenza media
        return urgency === 'low' ? 'cloud' : 'windows_phone';
    }
  }

  private explainMethodChoice(method: 'windows_phone' | 'cloud', options: SmartSMSOptions): string {
    const urgency = options.urgency || 'medium';
    const messageType = options.messageType || 'automated';
    const isOfficeHours = this.isWithinOfficeHours();
    
    if (options.forceMethod) {
      return `Metodo forzato: ${method}`;
    }

    const reasons: string[] = [];
    
    if (method === 'windows_phone') {
      if (urgency === 'high') reasons.push('alta urgenza');
      if (messageType === 'personal') reasons.push('messaggio personale');
      if (isOfficeHours) reasons.push('orario ufficio');
      if (this.costTracker.dailyCost >= this.config.costThreshold.daily * 0.8) reasons.push('budget SMS quasi esaurito');
      if (reasons.length === 0) reasons.push('configurazione primaria');
    } else {
      if (urgency === 'low') reasons.push('bassa urgenza');
      if (messageType === 'automated') reasons.push('messaggio automatico');
      if (!isOfficeHours) reasons.push('fuori orario ufficio');
      if (reasons.length === 0) reasons.push('configurazione cloud');
    }

    return `${method} (${reasons.join(', ')})`;
  }

  private async sendViaWindowsPhone(options: SmartSMSOptions): Promise<SmartSMSResult> {
    try {
      const result = await windowsPhoneService.sendSMS({
        phoneNumber: options.phoneNumber,
        message: options.message,
        timeout: 30000
      });

      return {
        success: result.success,
        method: 'windows_phone',
        messageId: result.messageId,
        cost: 0, // Gratis con telefono aziendale
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        method: 'windows_phone',
        error: error instanceof Error ? error.message : 'Errore Windows Phone'
      };
    }
  }

  private async sendViaCloud(options: SmartSMSOptions): Promise<SmartSMSResult> {
    try {
      const result = await skebbyService.sendSMS({
        to: options.phoneNumber,
        message: options.message
      });

      return {
        success: result.success,
        method: 'cloud',
        messageId: result.messageId,
        cost: result.cost || 0.045,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        method: 'cloud',
        error: error instanceof Error ? error.message : 'Errore SMS Cloud'
      };
    }
  }

  private async updateCostTracking(cost: number, method: 'windows_phone' | 'cloud'): Promise<void> {
    if (method === 'cloud' && cost > 0) {
      this.costTracker.dailyCost += cost;
      this.costTracker.monthlyCost += cost;
      this.costTracker.dailyCount += 1;
      this.costTracker.monthlyCount += 1;
    }
  }

  private async resetCostTrackingIfNeeded(): Promise<void> {
    const now = new Date();
    const lastReset = this.costTracker.lastReset;
    
    // Reset giornaliero
    if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
      this.costTracker.dailyCost = 0;
      this.costTracker.dailyCount = 0;
      console.log('[SmartSMSService] Reset costi giornalieri');
    }
    
    // Reset mensile
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      this.costTracker.monthlyCost = 0;
      this.costTracker.monthlyCount = 0;
      console.log('[SmartSMSService] Reset costi mensili');
    }
    
    this.costTracker.lastReset = now;
  }

  private isWithinOfficeHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const startHour = parseInt(this.config.officeHours.start.split(':')[0]);
    const endHour = parseInt(this.config.officeHours.end.split(':')[0]);
    
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60;
    const endTime = endHour * 60;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  private async logCommunication(options: SmartSMSOptions, result: SmartSMSResult): Promise<void> {
    try {
      if (options.candidateId) {
        await prisma.communication.create({
          data: {
            candidateId: options.candidateId,
            interviewId: options.interviewId,
            communicationType: 'SMS',
            direction: 'OUTBOUND',
            messageContent: options.message,
            deliveryStatus: result.success ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            smsCost: result.cost || 0,
            createdById: options.userId || 1,
            notes: `Metodo: ${result.method}${result.fallbackUsed ? ' (fallback)' : ''}`
          }
        });
      }
    } catch (error) {
      console.error('[SmartSMSService] Errore logging comunicazione:', error);
    }
  }

  private loadConfiguration(): SmartSMSConfig {
    // Configurazione di default - in futuro può essere caricata da database
    return {
      primaryMethod: (process.env.SMS_PRIMARY_METHOD as any) || 'auto',
      fallbackEnabled: process.env.SMS_FALLBACK_ENABLED !== 'false',
      maxWindowsPhoneRetries: parseInt(process.env.SMS_WINDOWS_RETRIES || '2'),
      dailyBudget: parseFloat(process.env.SMS_DAILY_BUDGET || '50'),
      urgencyLevels: {
        high: 'windows_phone',
        medium: 'auto',
        low: 'cloud'
      },
      officeHours: {
        start: process.env.OFFICE_HOURS_START || '09:00',
        end: process.env.OFFICE_HOURS_END || '18:00',
        timezone: process.env.OFFICE_TIMEZONE || 'Europe/Rome'
      },
      costThreshold: {
        daily: parseFloat(process.env.SMS_DAILY_BUDGET || '50'),
        monthly: parseFloat(process.env.SMS_MONTHLY_BUDGET || '1500')
      }
    };
  }
}

// Singleton export
export const smartSMSService = new SmartSMSService();
export default SmartSMSService;

// Export types
export type { SmartSMSConfig, SmartSMSOptions, SmartSMSResult, CostTracker };