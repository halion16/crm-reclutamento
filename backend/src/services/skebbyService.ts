import axios from 'axios';

interface SkebbyConfig {
  username: string;
  password: string;
  apiUrl: string;
  sender?: string;
}

interface SkebbyResponse {
  success: boolean;
  messageId?: string;
  cost?: number;
  credits?: number;
  error?: string;
  details?: any;
}

interface SMSData {
  to: string;
  message: string;
  sender?: string;
}

class SkebbyService {
  private config: SkebbyConfig;
  private isTestMode: boolean;

  constructor() {
    this.config = {
      username: process.env.SKEBBY_USERNAME || '',
      password: process.env.SKEBBY_PASSWORD || '',
      apiUrl: process.env.SKEBBY_API_URL || 'https://api.skebby.it/API/v1.0/REST',
      sender: process.env.SKEBBY_SENDER || 'CRM-HR'
    };
    
    this.isTestMode = process.env.NODE_ENV !== 'production' || !this.config.username || !this.config.password;
    
    if (this.isTestMode) {
      console.log('[SkebbyService] Modalità TEST attiva - SMS non verranno inviati realmente');
    }
  }

  /**
   * Invia SMS tramite API Skebby
   */
  async sendSMS(data: SMSData): Promise<SkebbyResponse> {
    try {
      console.log(`[SkebbyService] Invio SMS a ${data.to}`);
      
      // Modalità test - simula invio senza chiamare API reale
      if (this.isTestMode) {
        console.log(`[SkebbyService] TEST MODE - SMS: "${data.message.substring(0, 50)}..."`);
        return {
          success: true,
          messageId: `test_skebby_${Date.now()}`,
          cost: 0.045,
          credits: 999
        };
      }

      // Validazione input
      if (!this.isConfigured()) {
        throw new Error('Configurazione Skebby mancante (username/password)');
      }

      const validation = this.validateSMSData(data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Prepara payload per API Skebby
      const payload = {
        message_type: 'GP', // Tipo messaggio: GP = Generic Push (standard SMS)
        message: data.message,
        recipient: [data.to],
        sender: data.sender || this.config.sender,
        scheduled_delivery_time: null, // Invio immediato
        order_id: null, // ID ordine opzionale
        returnCredits: true, // Ritorna crediti rimanenti
        allowInvalidRecipients: false // Non permettere destinatari non validi
      };

      // Chiamata API Skebby
      const response = await axios.post(
        `${this.config.apiUrl}/sms`,
        payload,
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CRM-Reclutamento/1.0'
          },
          timeout: 15000 // Timeout 15 secondi
        }
      );

      // Parse response Skebby
      const result = this.parseSkebbyResponse(response.data);
      
      if (result.success) {
        console.log(`[SkebbyService] ✅ SMS inviato con successo. ID: ${result.messageId}, Costo: €${result.cost}`);
      } else {
        console.log(`[SkebbyService] ❌ Invio SMS fallito: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('[SkebbyService] Errore invio SMS:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto Skebby API'
      };
    }
  }

  /**
   * Controlla i crediti SMS rimanenti
   */
  async getCredits(): Promise<{ success: boolean; credits?: number; error?: string }> {
    try {
      if (this.isTestMode) {
        return { success: true, credits: 999 };
      }

      if (!this.isConfigured()) {
        return { success: false, error: 'Configurazione Skebby mancante' };
      }

      const response = await axios.get(
        `${this.config.apiUrl}/user/credit`,
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        credits: response.data.credit || 0
      };

    } catch (error) {
      console.error('[SkebbyService] Errore controllo crediti:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore controllo crediti'
      };
    }
  }

  /**
   * Test connessione API Skebby
   */
  async testConnection(): Promise<{ success: boolean; error?: string; credits?: number }> {
    try {
      if (this.isTestMode) {
        return { success: true, credits: 999 };
      }

      const creditsResult = await this.getCredits();
      
      if (creditsResult.success) {
        console.log(`[SkebbyService] ✅ Connessione OK. Crediti: ${creditsResult.credits}`);
        return {
          success: true,
          credits: creditsResult.credits
        };
      } else {
        return {
          success: false,
          error: creditsResult.error
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test connessione fallito'
      };
    }
  }

  /**
   * Ottiene statistiche SMS del giorno
   */
  async getDailyStats(): Promise<{
    success: boolean;
    sent?: number;
    failed?: number;
    cost?: number;
    error?: string;
  }> {
    try {
      if (this.isTestMode) {
        return {
          success: true,
          sent: 12,
          failed: 1,
          cost: 0.585
        };
      }

      // Skebby non ha endpoint specifico per stats giornaliere
      // Questa implementazione può essere espansa con database locale per tracking
      
      return {
        success: true,
        sent: 0,
        failed: 0,
        cost: 0
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore recupero statistiche'
      };
    }
  }

  /**
   * Calcola il costo stimato per un SMS
   */
  calculateCost(message: string): number {
    // Skebby pricing: €0.045 per SMS standard (160 caratteri)
    const baseCost = 0.045;
    const smsLength = 160;
    
    // Calcola numero di SMS necessari
    const smsCount = Math.ceil(message.length / smsLength);
    
    return baseCost * smsCount;
  }

  // ==================== METODI PRIVATI ====================

  private isConfigured(): boolean {
    return !!(this.config.username && this.config.password);
  }

  private validateSMSData(data: SMSData): { isValid: boolean; error?: string } {
    if (!data.to || data.to.trim().length === 0) {
      return { isValid: false, error: 'Numero destinatario richiesto' };
    }

    if (!data.message || data.message.trim().length === 0) {
      return { isValid: false, error: 'Messaggio richiesto' };
    }

    // Validazione formato numero italiano/internazionale
    const phoneRegex = /^(\+39|0039|39)?[0-9]{8,11}$/;
    const cleanedPhone = data.to.replace(/[\s\-\(\)\.]/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      return { isValid: false, error: 'Formato numero di telefono non valido' };
    }

    // Limite caratteri SMS (concatenati fino a 1530 caratteri - 10 SMS)
    if (data.message.length > 1530) {
      return { isValid: false, error: 'Messaggio troppo lungo (max 1530 caratteri)' };
    }

    return { isValid: true };
  }

  private parseSkebbyResponse(responseData: any): SkebbyResponse {
    try {
      // Formato standard risposta Skebby
      if (responseData.result === 'OK') {
        return {
          success: true,
          messageId: responseData.order_id || `skebby_${Date.now()}`,
          cost: this.calculateCost(responseData.message || ''),
          credits: responseData.remaining_credits,
          details: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.result || 'Errore API Skebby',
          details: responseData
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Errore parsing risposta Skebby API'
      };
    }
  }

  // ==================== METODI STATICI ====================

  /**
   * Factory method
   */
  static create(): SkebbyService {
    return new SkebbyService();
  }

  /**
   * Test rapido disponibilità servizio
   */
  static async quickTest(): Promise<boolean> {
    try {
      const service = new SkebbyService();
      const result = await service.testConnection();
      return result.success;
    } catch {
      return false;
    }
  }
}

// Esporta servizio singleton
export const skebbyService = SkebbyService.create();
export default SkebbyService;

// Export tipi
export type { SkebbyConfig, SkebbyResponse, SMSData };