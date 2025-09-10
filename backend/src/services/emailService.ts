import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(data: EmailData, candidateId: number, interviewId?: number, userId = 1) {
    try {
      // Invia email
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html
      });

      // Log comunicazione nel database
      await prisma.communication.create({
        data: {
          candidateId,
          interviewId,
          communicationType: 'EMAIL',
          direction: 'OUTBOUND',
          subject: data.subject,
          messageContent: data.html,
          sentAt: new Date(),
          deliveryStatus: 'SENT',
          createdById: userId
        }
      });

      // Log attività
      await prisma.activityLog.create({
        data: {
          candidateId,
          interviewId,
          activityType: 'EMAIL_SENT',
          description: `Email inviata: ${data.subject}`,
          performedById: userId
        }
      });

      return {
        success: true,
        messageId: info.messageId,
        data: info
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log errore nel database
      await prisma.communication.create({
        data: {
          candidateId,
          interviewId,
          communicationType: 'EMAIL',
          direction: 'OUTBOUND',
          subject: data.subject,
          messageContent: data.html,
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

  async sendTemplateEmail(
    templateId: number,
    candidateId: number,
    variables: Record<string, string>,
    interviewId?: number,
    userId = 1
  ) {
    try {
      // Recupera template
      const template = await prisma.communicationTemplate.findUnique({
        where: { id: templateId, isActive: true }
      });

      if (!template) {
        throw new Error('Template not found or inactive');
      }

      // Recupera dati candidato
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Sostituisce variabili nel template
      let subject = template.subjectTemplate || '';
      let message = template.messageTemplate;

      // Aggiunge variabili predefinite
      const allVariables = {
        ...variables,
        candidate_name: `${candidate.firstName} ${candidate.lastName}`,
        candidate_first_name: candidate.firstName,
        candidate_last_name: candidate.lastName,
        candidate_email: candidate.email,
        position_applied: candidate.positionApplied || 'Non specificata'
      };

      // Sostituisce tutte le variabili
      for (const [key, value] of Object.entries(allVariables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        subject = subject.replace(regex, value);
        message = message.replace(regex, value);
      }

      // Invia email
      return await this.sendEmail({
        to: candidate.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      }, candidateId, interviewId, userId);

    } catch (error) {
      console.error('Error sending template email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendInterviewConfirmation(interviewId: number, userId = 1) {
    try {
      // Recupera dati colloquio
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          candidate: true,
          primaryInterviewer: true
        }
      });

      if (!interview || !interview.candidate) {
        throw new Error('Interview or candidate not found');
      }

      // Cerca template per conferma colloquio
      const template = await prisma.communicationTemplate.findFirst({
        where: {
          usageContext: 'INTERVIEW_CONFIRMATION',
          templateType: 'EMAIL',
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Interview confirmation template not found');
      }

      // Prepara variabili
      const variables = {
        interview_date: interview.scheduledDate 
          ? new Date(interview.scheduledDate).toLocaleDateString('it-IT')
          : 'Da definire',
        interview_time: interview.scheduledTime
          ? new Date(interview.scheduledTime).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : 'Da definire',
        interview_phase: interview.interviewPhase.toString(),
        meeting_url: interview.meetingUrl || 'Link sarà fornito',
        interviewer_name: interview.primaryInterviewer
          ? `${interview.primaryInterviewer.firstName} ${interview.primaryInterviewer.lastName}`
          : 'Da definire',
        interview_type: interview.interviewType === 'VIDEO_CALL' 
          ? 'Videochiamata'
          : interview.interviewType === 'IN_PERSON'
          ? 'In presenza'
          : 'Telefonico',
        location: interview.location || 'Non specificata'
      };

      return await this.sendTemplateEmail(
        template.id,
        interview.candidateId,
        variables,
        interviewId,
        userId
      );

    } catch (error) {
      console.error('Error sending interview confirmation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendInterviewReminder(interviewId: number, userId = 1) {
    try {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: { candidate: true }
      });

      if (!interview || !interview.candidate) {
        throw new Error('Interview or candidate not found');
      }

      const template = await prisma.communicationTemplate.findFirst({
        where: {
          usageContext: 'REMINDER',
          templateType: 'EMAIL',
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Reminder template not found');
      }

      const variables = {
        interview_date: interview.scheduledDate 
          ? new Date(interview.scheduledDate).toLocaleDateString('it-IT')
          : 'Da definire',
        interview_time: interview.scheduledTime
          ? new Date(interview.scheduledTime).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : 'Da definire',
        meeting_url: interview.meetingUrl || 'Link sarà fornito'
      };

      return await this.sendTemplateEmail(
        template.id,
        interview.candidateId,
        variables,
        interviewId,
        userId
      );

    } catch (error) {
      console.error('Error sending interview reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendInterviewOutcome(interviewId: number, userId = 1) {
    try {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: { candidate: true }
      });

      if (!interview || !interview.candidate || !interview.outcome) {
        throw new Error('Interview, candidate or outcome not found');
      }

      const usageContext = interview.outcome === 'POSITIVE' 
        ? 'OUTCOME_POSITIVE' 
        : 'OUTCOME_NEGATIVE';

      const template = await prisma.communicationTemplate.findFirst({
        where: {
          usageContext,
          templateType: 'EMAIL',
          isActive: true
        }
      });

      if (!template) {
        throw new Error(`Outcome template (${usageContext}) not found`);
      }

      const variables = {
        interview_phase: interview.interviewPhase.toString(),
        outcome: interview.outcome === 'POSITIVE' ? 'positivo' : 'negativo'
      };

      return await this.sendTemplateEmail(
        template.id,
        interview.candidateId,
        variables,
        interviewId,
        userId
      );

    } catch (error) {
      console.error('Error sending interview outcome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailService = new EmailService();
export default EmailService;