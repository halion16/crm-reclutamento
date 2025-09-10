import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { smartSMSService, SmartSMSOptions } from './smartSMSService';

const prisma = new PrismaClient();

interface SMSData {
  to: string;
  message: string;
}

interface WindowsPhoneAPIResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private windowsPhoneApiUrl: string;
  private apiKey: string;

  constructor() {
    this.windowsPhoneApiUrl = process.env.WINDOWS_PHONE_API_ENDPOINT || '';
    this.apiKey = process.env.WINDOWS_PHONE_API_KEY || '';
  }

  async sendSMS(data: SMSData, candidateId: number, interviewId?: number, userId = 1, urgency: 'high' | 'medium' | 'low' = 'medium', messageType: 'personal' | 'automated' | 'reminder' = 'automated') {
    try {
      console.log(`[SMSService] Invio SMS via Smart Service a ${data.to}`);

      // Utilizza il nuovo Smart SMS Service per routing intelligente
      const smartOptions: SmartSMSOptions = {
        phoneNumber: data.to,
        message: data.message,
        urgency,
        messageType,
        candidateId,
        interviewId,
        userId
      };

      const result = await smartSMSService.sendSMS(smartOptions);

      // Log attività con informazioni aggiuntive sul metodo utilizzato
      await prisma.activityLog.create({
        data: {
          candidateId,
          interviewId,
          activityType: 'SMS_SENT',
          description: `SMS inviato a ${data.to} via ${result.method}${result.fallbackUsed ? ' (fallback)' : ''}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
          performedById: userId
        }
      });

      return {
        success: result.success,
        messageId: result.messageId,
        method: result.method,
        cost: result.cost,
        executionTime: result.executionTime,
        reasoning: result.reasoning,
        data: result
      };

    } catch (error) {
      console.error('Error sending SMS via Smart Service:', error);
      
      // Log errore nel database
      await prisma.communication.create({
        data: {
          candidateId,
          interviewId,
          communicationType: 'SMS',
          direction: 'OUTBOUND',
          messageContent: data.message,
          deliveryStatus: 'FAILED',
          createdById: userId
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTemplateSMS(
    templateId: number,
    candidateId: number,
    variables: Record<string, string>,
    interviewId?: number,
    userId = 1
  ) {
    try {
      // Recupera template SMS
      const template = await prisma.communicationTemplate.findUnique({
        where: { 
          id: templateId, 
          isActive: true,
          templateType: 'SMS'
        }
      });

      if (!template) {
        throw new Error('SMS template not found or inactive');
      }

      // Recupera dati candidato
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate || !candidate.mobile) {
        throw new Error('Candidate not found or mobile number missing');
      }

      // Sostituisce variabili nel template
      let message = template.messageTemplate;

      // Aggiunge variabili predefinite
      const allVariables = {
        ...variables,
        candidate_name: `${candidate.firstName} ${candidate.lastName}`,
        candidate_first_name: candidate.firstName,
        candidate_last_name: candidate.lastName
      };

      // Sostituisce tutte le variabili
      for (const [key, value] of Object.entries(allVariables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        message = message.replace(regex, value);
      }

      // Invia SMS
      return await this.sendSMS({
        to: candidate.mobile,
        message
      }, candidateId, interviewId, userId);

    } catch (error) {
      console.error('Error sending template SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendInterviewReminderSMS(interviewId: number, userId = 1) {
    try {
      // Recupera dati colloquio
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: { candidate: true }
      });

      if (!interview || !interview.candidate) {
        throw new Error('Interview or candidate not found');
      }

      if (!interview.candidate.mobile) {
        throw new Error('Candidate mobile number not available');
      }

      // Cerca template SMS per reminder
      const template = await prisma.communicationTemplate.findFirst({
        where: {
          usageContext: 'REMINDER',
          templateType: 'SMS',
          isActive: true
        }
      });

      if (!template) {
        throw new Error('SMS reminder template not found');
      }

      // Prepara variabili
      const variables = {
        interview_time: interview.scheduledTime
          ? new Date(interview.scheduledTime).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : 'Da definire',
        meeting_url: interview.meetingUrl || 'Link sarà fornito'
      };

      return await this.sendTemplateSMS(
        template.id,
        interview.candidateId,
        variables,
        interviewId,
        userId
      );

    } catch (error) {
      console.error('Error sending interview reminder SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendQuickSMS(candidateId: number, message: string, userId = 1) {
    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate || !candidate.mobile) {
        throw new Error('Candidate not found or mobile number missing');
      }

      return await this.sendSMS({
        to: candidate.mobile,
        message
      }, candidateId, undefined, userId);

    } catch (error) {
      console.error('Error sending quick SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Funzione per testare la connessione con Windows Phone API
  async testConnection() {
    try {
      if (!this.windowsPhoneApiUrl || !this.apiKey) {
        return {
          success: false,
          error: 'Windows Phone API not configured'
        };
      }

      const response = await axios.get(
        `${this.windowsPhoneApiUrl}/health`,
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

export const smsService = new SMSService();
export default SMSService;