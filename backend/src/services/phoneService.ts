import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface PhoneCallData {
  to: string;
  duration?: number;
  outcome?: string;
  notes?: string;
}

interface WindowsPhoneCallResponse {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
}

class PhoneService {
  private windowsPhoneApiUrl: string;
  private apiKey: string;

  constructor() {
    this.windowsPhoneApiUrl = process.env.WINDOWS_PHONE_API_ENDPOINT || '';
    this.apiKey = process.env.WINDOWS_PHONE_API_KEY || '';
  }

  async initiateCall(candidateId: number, phoneNumber: string, userId = 1) {
    try {
      let callResult: WindowsPhoneCallResponse;

      if (this.windowsPhoneApiUrl && this.apiKey) {
        // Chiamata API reale per avviare chiamata tramite Windows Phone
        const response = await axios.post(
          `${this.windowsPhoneApiUrl}/call/initiate`,
          {
            to: phoneNumber,
            from: 'system' // Può essere l'interno dell'utente HR
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        callResult = response.data;
      } else {
        // Modalità demo/sviluppo - simula avvio chiamata
        console.log(`[CALL DEMO] Initiating call to: ${phoneNumber} for candidate: ${candidateId}`);
        callResult = {
          success: true,
          callId: `demo_call_${Date.now()}`,
          status: 'INITIATED'
        };
      }

      // Log comunicazione nel database
      const communication = await prisma.communication.create({
        data: {
          candidateId,
          communicationType: 'PHONE_CALL',
          direction: 'OUTBOUND',
          messageContent: `Chiamata avviata a ${phoneNumber}`,
          deliveryStatus: callResult.success ? 'SENT' : 'FAILED',
          createdById: userId
        }
      });

      // Log attività
      await prisma.activityLog.create({
        data: {
          candidateId,
          activityType: 'CALL_INITIATED',
          description: `Chiamata avviata verso ${phoneNumber}`,
          performedById: userId
        }
      });

      return {
        success: callResult.success,
        callId: callResult.callId,
        communicationId: communication.id,
        data: callResult
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async recordCallOutcome(
    communicationId: number, 
    data: PhoneCallData, 
    userId = 1
  ) {
    try {
      // Aggiorna la comunicazione con i dettagli della chiamata
      const communication = await prisma.communication.update({
        where: { id: communicationId },
        data: {
          callDurationSeconds: data.duration,
          callOutcome: data.outcome,
          messageContent: data.notes || `Chiamata completata - Esito: ${data.outcome}`,
          deliveryStatus: 'DELIVERED'
        }
      });

      // Log attività
      await prisma.activityLog.create({
        data: {
          candidateId: communication.candidateId,
          activityType: 'CALL_COMPLETED',
          description: `Chiamata completata - Durata: ${data.duration}s - Esito: ${data.outcome}`,
          performedById: userId
        }
      });

      return {
        success: true,
        data: communication
      };
    } catch (error) {
      console.error('Error recording call outcome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async callCandidate(candidateId: number, phoneType: 'mobile' | 'phone' = 'mobile', userId = 1) {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const phoneNumber = phoneType === 'mobile' ? candidate.mobile : candidate.phone;
      
      if (!phoneNumber) {
        throw new Error(`Candidate ${phoneType} number not available`);
      }

      return await this.initiateCall(candidateId, phoneNumber, userId);
    } catch (error) {
      console.error('Error calling candidate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCallHistory(candidateId: number) {
    try {
      const calls = await prisma.communication.findMany({
        where: {
          candidateId,
          communicationType: 'PHONE_CALL'
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
        }
      });

      return {
        success: true,
        data: calls
      };
    } catch (error) {
      console.error('Error getting call history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Funzione per testare la connessione con Windows Phone API
  async testPhoneConnection() {
    try {
      if (!this.windowsPhoneApiUrl || !this.apiKey) {
        return {
          success: false,
          error: 'Windows Phone API not configured'
        };
      }

      const response = await axios.get(
        `${this.windowsPhoneApiUrl}/phone/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Funzione per ottenere i telefoni aziendali disponibili
  async getAvailablePhones() {
    try {
      if (!this.windowsPhoneApiUrl || !this.apiKey) {
        return {
          success: false,
          error: 'Windows Phone API not configured'
        };
      }

      const response = await axios.get(
        `${this.windowsPhoneApiUrl}/phones/available`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Funzione per controllare i crediti SMS rimanenti
  async getCreditsStatus() {
    try {
      if (!this.windowsPhoneApiUrl || !this.apiKey) {
        return {
          success: false,
          error: 'Windows Phone API not configured'
        };
      }

      const response = await axios.get(
        `${this.windowsPhoneApiUrl}/credits/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const phoneService = new PhoneService();
export default PhoneService;