import { 
  WorkflowTemplate, 
  CandidateWorkflowState, 
  WorkflowPhase, 
  PhaseHistoryEntry,
  KanbanColumn,
  KanbanCandidate,
  WorkflowMetrics,
  MoveCandidate,
  WorkflowEvent,
  NextAction,
  CandidateFlag,
  DEFAULT_WORKFLOW_PHASES,
  DEFAULT_WORKFLOW_TEMPLATE,
  BottleneckAnalysis,
  SLAMetrics
} from '../types/workflow';
import { aiService } from './aiService';

export class WorkflowService {
  private workflows: Map<string, WorkflowTemplate> = new Map();
  private candidateStates: Map<string, CandidateWorkflowState> = new Map();
  private eventHandlers: Set<(event: WorkflowEvent) => void> = new Set();

  constructor() {
    this.initializeDefaultWorkflow();
    this.loadMockData();
    // Sincronizzazione automatica al startup (in produzione fare solo se necessario)
    this.initializeWithRealData();
  }

  // Inizializza con dati reali dal sistema candidati
  private async initializeWithRealData() {
    try {
      console.log('🚀 Initializing workflow with real candidate data...');
      await this.syncAllCandidatesFromAPI();
      console.log('✅ Workflow initialized with real data');
      
      // Test Step 2 integration after 5 seconds
      setTimeout(() => this.testStep2Integration().catch(console.error), 5000);
    } catch (error) {
      console.error('❌ Error initializing with real data:', error);
      console.log('📝 Continuing with mock data');
    }
  }

  // Test Step 2 integration - Verifica che eventi automatici funzionino
  private async testStep2Integration() {
    try {
      console.log('🧪 Testing Step 2 integration...');
      
      // Test scenario: Marco Rossi avanza da cultural_fit a final_decision
      console.log('📋 Test scenario: Moving Marco Rossi to final_decision');
      
      await this.moveCandidate({
        candidateId: '1',
        fromPhase: 'cultural_fit',
        toPhase: 'final_decision',
        decision: 'passed',
        score: 85,
        notes: 'Ottimo cultural fit, pronto per decisione finale'
      });
      
      console.log('✅ Step 2 integration test completed successfully');
      
      // 🔥 STEP 3.5: Wait for WebSocket connections and test real-time
      setTimeout(() => this.testStep3RealTime(), 10000);
    } catch (error) {
      console.error('❌ Step 2 integration test failed:', error);
    }
  }

  // Test Step 3 real-time integration
  private async testStep3RealTime() {
    try {
      console.log('🧪 Testing Step 3 real-time WebSocket integration...');
      
      // Check if WebSocket server is available
      if (typeof global !== 'undefined' && global.io) {
        console.log('📊 Connected clients:', global.io.engine.clientsCount);
        
        // Test scenario: Move Sara Colombo to next phase
        console.log('📋 Test real-time scenario: Moving Sara Colombo to cultural_fit');
        
        await this.moveCandidate({
          candidateId: '2',
          fromPhase: 'phone_screening',
          toPhase: 'cultural_fit',
          decision: 'passed',
          score: 78,
          notes: 'Test real-time WebSocket notification'
        });
        
        console.log('✅ Step 3 real-time test completed - check frontend for notifications');
      } else {
        console.log('❌ WebSocket server not available for real-time testing');
      }
    } catch (error) {
      console.error('❌ Step 3 real-time test failed:', error);
    }
  }

  // Inizializzazione workflow di default
  private initializeDefaultWorkflow() {
    const defaultWorkflow: WorkflowTemplate = {
      id: 'default-workflow',
      ...DEFAULT_WORKFLOW_TEMPLATE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(defaultWorkflow.id, defaultWorkflow);
    console.log('✅ Default workflow initialized');
  }

  // Carica dati mock per demo - Sincronizzato con candidati reali
  private loadMockData() {
    const mockCandidateStates: CandidateWorkflowState[] = [
      // Marco Rossi - ID 1 - Ha 2 colloqui completati positivi
      {
        id: 'cs-1',
        candidateId: '1',
        workflowTemplateId: 'default-workflow',
        currentPhase: 'final_decision', // Dopo 2 colloqui positivi
        status: 'active',
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        phaseHistory: [
          {
            phaseId: 'cv_review',
            phaseName: 'CV Review',
            enteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            automatedTransition: false
          },
          {
            phaseId: 'phone_screening',
            phaseName: 'Phone Screening',
            enteredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            automatedTransition: false
          },
          {
            phaseId: 'technical_interview',
            phaseName: 'Technical Interview',
            enteredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            automatedTransition: false
          },
          {
            phaseId: 'final_decision',
            phaseName: 'Final Decision',
            enteredAt: new Date(),
            decision: 'pending',
            automatedTransition: false
          }
        ],
        metadata: {
          positionId: 'pos-1',
          positionTitle: 'Frontend Developer',
          priority: 'high',
          assignedRecruiter: 'recruiter-1',
          expectedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          tags: ['senior', 'react', 'typescript'],
          customFields: {}
        }
      },
      // Sara Colombo - ID 2 - Ha 1 colloquio programmato
      {
        id: 'cs-2',
        candidateId: '2',
        workflowTemplateId: 'default-workflow',
        currentPhase: 'technical_interview', // Prima del colloquio programmato
        status: 'active',
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        phaseHistory: [
          {
            phaseId: 'cv_review',
            phaseName: 'CV Review',
            enteredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 85,
            automatedTransition: false,
            nextPhase: 'phone_screening'
          },
          {
            phaseId: 'phone_screening',
            phaseName: 'Phone Screening',
            enteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 78,
            automatedTransition: false,
            nextPhase: 'technical_interview'
          },
          {
            phaseId: 'technical_interview',
            phaseName: 'Technical Interview',
            enteredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            decision: 'pending',
            automatedTransition: false
          }
        ],
        metadata: {
          positionId: 'pos-2',
          positionTitle: 'UX Designer',
          priority: 'medium',
          assignedRecruiter: 'recruiter-2',
          expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          tags: ['design', 'portfolio'],
          customFields: {}
        }
      },
      // Andrea Ferrari - ID 3 - HIRED (3 colloqui completati positivi)
      {
        id: 'cs-3',
        candidateId: '3',
        workflowTemplateId: 'default-workflow',
        currentPhase: 'hired',
        status: 'completed',
        startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        phaseHistory: [
          {
            phaseId: 'cv_review',
            phaseName: 'CV Review',
            enteredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 78,
            automatedTransition: true,
            nextPhase: 'phone_screening'
          },
          {
            phaseId: 'phone_screening',
            phaseName: 'Phone Screening',
            enteredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 82,
            duration: 35,
            interviewerId: 'recruiter-1',
            automatedTransition: false,
            nextPhase: 'technical_interview'
          },
          {
            phaseId: 'technical_interview',
            phaseName: 'Technical Interview',
            enteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 95,
            duration: 120,
            automatedTransition: false,
            nextPhase: 'final_decision'
          },
          {
            phaseId: 'final_decision',
            phaseName: 'Final Decision',
            enteredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 98,
            automatedTransition: false,
            nextPhase: 'hired'
          },
          {
            phaseId: 'hired',
            phaseName: 'Hired',
            enteredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            automatedTransition: false
          }
        ],
        metadata: {
          positionId: 'pos-3',
          positionTitle: 'Backend Developer',
          priority: 'high',
          assignedRecruiter: 'recruiter-1',
          expectedCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          tags: ['hired', 'backend', 'nodejs'],
          customFields: {}
        }
      },
      // Elena Ricci - ID 4 - REJECTED (1 colloquio negativo)
      {
        id: 'cs-4',
        candidateId: '4',
        workflowTemplateId: 'default-workflow',
        currentPhase: 'rejected',
        status: 'rejected',
        startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        phaseHistory: [
          {
            phaseId: 'cv_review',
            phaseName: 'CV Review',
            enteredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            decision: 'passed',
            score: 70,
            duration: 48,
            automatedTransition: false,
            nextPhase: 'phone_screening'
          },
          {
            phaseId: 'phone_screening',
            phaseName: 'Phone Screening',
            enteredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            exitedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            decision: 'failed',
            score: 45,
            duration: 25,
            automatedTransition: false,
            nextPhase: 'rejected'
          },
          {
            phaseId: 'rejected',
            phaseName: 'Rejected',
            enteredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            decision: 'failed',
            automatedTransition: false
          }
        ],
        metadata: {
          positionId: 'pos-4',
          positionTitle: 'Data Analyst',
          priority: 'medium',
          assignedRecruiter: 'recruiter-2',
          expectedCompletionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          tags: ['rejected', 'data-analysis'],
          customFields: {}
        }
      }
    ];

    mockCandidateStates.forEach(state => {
      this.candidateStates.set(state.candidateId, state);
    });

    console.log('✅ Mock workflow data loaded');
  }

  // Ottieni Kanban Board data
  async getKanbanBoard(workflowId: string = 'default-workflow'): Promise<KanbanColumn[]> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Costruisci colonne kanban dalle fasi
    const columns: KanbanColumn[] = workflow.phases
      .sort((a, b) => a.order - b.order)
      .map(phase => ({
        id: phase.id,
        title: phase.name,
        phaseId: phase.id,
        color: phase.color,
        candidates: [],
        slaWarningHours: phase.slaHours ? phase.slaHours * 0.8 : undefined
      }));

    // Aggiungi candidati alle rispettive colonne
    const candidateStates = Array.from(this.candidateStates.values())
      .filter(state => state.workflowTemplateId === workflowId && state.status === 'active');

    for (const state of candidateStates) {
      const columnIndex = columns.findIndex(col => col.phaseId === state.currentPhase);
      if (columnIndex !== -1) {
        const kanbanCandidate = await this.buildKanbanCandidate(state);
        columns[columnIndex].candidates.push(kanbanCandidate);
      }
    }

    return columns;
  }

  // Costruisci KanbanCandidate da CandidateWorkflowState
  private async buildKanbanCandidate(state: CandidateWorkflowState): Promise<KanbanCandidate> {
    const currentPhaseHistory = state.phaseHistory.find(h => h.phaseId === state.currentPhase);
    const daysInPhase = currentPhaseHistory ? 
      Math.floor((Date.now() - currentPhaseHistory.enteredAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;

    // Mock candidate data - in produzione recuperare dal database
    const candidateData = this.getMockCandidateData(state.candidateId);

    const flags = this.generateCandidateFlags(state, daysInPhase);
    const nextAction = this.determineNextAction(state);

    return {
      id: state.id,
      candidateId: state.candidateId,
      name: candidateData.name,
      email: candidateData.email,
      position: state.metadata.positionTitle,
      avatar: candidateData.avatar,
      currentPhase: state.currentPhase,
      status: state.status,
      priority: state.metadata.priority,
      aiScore: this.calculateAIScore(state),
      daysInPhase,
      nextAction,
      flags,
      timeline: state.phaseHistory
    };
  }

  // Genera flags per candidato
  private generateCandidateFlags(state: CandidateWorkflowState, daysInPhase: number): CandidateFlag[] {
    const flags: CandidateFlag[] = [];
    const workflow = this.workflows.get(state.workflowTemplateId);
    const currentPhase = workflow?.phases.find(p => p.id === state.currentPhase);

    // SLA Warning
    if (currentPhase?.slaHours && daysInPhase * 24 > currentPhase.slaHours * 0.8) {
      flags.push({
        type: 'sla_warning',
        message: `Vicino al SLA (${currentPhase.slaHours}h)`,
        severity: 'warning',
        createdAt: new Date()
      });
    }

    // High Priority
    if (state.metadata.priority === 'high' || state.metadata.priority === 'urgent') {
      flags.push({
        type: 'urgent',
        message: 'Candidato prioritario',
        severity: 'info',
        createdAt: new Date()
      });
    }

    // High AI Score
    const aiScore = this.calculateAIScore(state);
    if (aiScore && aiScore >= 85) {
      flags.push({
        type: 'high_potential',
        message: `Score AI elevato (${aiScore})`,
        severity: 'info',
        createdAt: new Date()
      });
    }

    return flags;
  }

  // Determina prossima azione
  private determineNextAction(state: CandidateWorkflowState): NextAction | undefined {
    const workflow = this.workflows.get(state.workflowTemplateId);
    const currentPhase = workflow?.phases.find(p => p.id === state.currentPhase);
    
    if (!currentPhase) return undefined;

    switch (state.currentPhase) {
      case 'cv_review':
        return {
          type: 'review_feedback',
          description: 'Rivedi CV e prendi decisione',
          assignedTo: state.metadata.assignedRecruiter
        };
      
      case 'phone_screening':
        return {
          type: 'schedule_interview',
          description: 'Programma screening telefonico',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          assignedTo: state.metadata.assignedRecruiter
        };
      
      case 'technical_interview':
        return {
          type: 'schedule_interview',
          description: 'Programma colloquio tecnico',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assignedTo: currentPhase.requiredInterviewers[0]
        };
      
      case 'cultural_fit':
        return {
          type: 'schedule_interview',
          description: 'Programma colloquio culturale',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          assignedTo: 'hr_manager'
        };
      
      case 'final_decision':
        return {
          type: 'make_decision',
          description: 'Prendi decisione finale',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          assignedTo: 'hiring_manager'
        };
      
      default:
        return undefined;
    }
  }

  // Calcola score AI per candidato
  private calculateAIScore(state: CandidateWorkflowState): number | undefined {
    // Prendi l'ultimo score dalle history entries
    const scoresInHistory = state.phaseHistory
      .filter(h => h.score !== undefined)
      .map(h => h.score!);
    
    if (scoresInHistory.length === 0) {
      // Se non ci sono score storici, calcola usando AI
      return this.generateAIScore(state);
    }
    
    // Media pesata (le fasi più avanzate pesano di più)
    const totalWeight = scoresInHistory.length * (scoresInHistory.length + 1) / 2;
    const weightedSum = scoresInHistory.reduce((sum, score, index) => {
      return sum + score * (index + 1);
    }, 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  // Genera score AI basato su analisi del profilo candidato
  private generateAIScore(state: CandidateWorkflowState): number {
    // Mock AI score based on position and metadata
    const baseScore = 70;
    let adjustments = 0;

    // Priority adjustment
    switch (state.metadata.priority) {
      case 'urgent':
        adjustments += 15;
        break;
      case 'high':
        adjustments += 10;
        break;
      case 'medium':
        adjustments += 5;
        break;
      case 'low':
        adjustments += 0;
        break;
    }

    // Position type adjustment
    const positionTitle = state.metadata.positionTitle.toLowerCase();
    if (positionTitle.includes('senior') || positionTitle.includes('lead')) {
      adjustments += 8;
    }
    if (positionTitle.includes('full stack') || positionTitle.includes('fullstack')) {
      adjustments += 5;
    }

    // Days in process penalty (encourages faster processing)
    const daysInProcess = Math.floor(
      (Date.now() - state.startedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysInProcess > 14) {
      adjustments -= 5;
    } else if (daysInProcess > 7) {
      adjustments -= 2;
    }

    return Math.max(0, Math.min(100, baseScore + adjustments + Math.random() * 10 - 5));
  }

  // Sincronizza stato candidato quando workflow cambia fase - STEP 2.4
  private async syncCandidateStatusFromWorkflow(candidateId: string, workflowPhase: string, decision?: string): Promise<void> {
    try {
      console.log(`🔄 Syncing candidate ${candidateId} status from workflow phase: ${workflowPhase}`);
      
      const newCandidateStatus = this.mapWorkflowPhaseToCandidateStatus(workflowPhase);
      
      // In produzione, qui faresti una chiamata API al servizio candidati per aggiornare lo stato
      // Per ora facciamo un mock dell'aggiornamento
      console.log(`📝 Would update candidate ${candidateId} status to: ${newCandidateStatus}`);
      
      // Mock: logica per determinare se notificare altri sistemi
      if (newCandidateStatus === 'HIRED') {
        console.log(`🎉 Candidate ${candidateId} hired! Would notify HR and send congratulations email`);
      } else if (newCandidateStatus === 'REJECTED') {
        console.log(`❌ Candidate ${candidateId} rejected. Would notify candidate and archive profile`);
      }
      
      console.log(`✅ Candidate ${candidateId} status sync completed`);
    } catch (error) {
      console.error(`❌ Failed to sync candidate status from workflow:`, error);
    }
  }

  // Sposta candidato tra fasi
  async moveCandidate(move: MoveCandidate): Promise<CandidateWorkflowState> {
    const state = this.candidateStates.get(move.candidateId);
    if (!state) {
      throw new Error(`Candidate workflow state not found: ${move.candidateId}`);
    }

    // Validazione transizione
    const workflow = this.workflows.get(state.workflowTemplateId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${state.workflowTemplateId}`);
    }

    const fromPhase = workflow.phases.find(p => p.id === move.fromPhase);
    const toPhase = workflow.phases.find(p => p.id === move.toPhase);

    if (!fromPhase || !toPhase) {
      throw new Error('Invalid phase transition');
    }

    // Aggiorna history della fase corrente
    const currentPhaseHistoryIndex = state.phaseHistory.findIndex(
      h => h.phaseId === move.fromPhase && !h.exitedAt
    );

    if (currentPhaseHistoryIndex !== -1) {
      state.phaseHistory[currentPhaseHistoryIndex].exitedAt = new Date();
      state.phaseHistory[currentPhaseHistoryIndex].decision = move.decision || 'passed';
      state.phaseHistory[currentPhaseHistoryIndex].notes = move.notes;
      state.phaseHistory[currentPhaseHistoryIndex].score = move.score;
      state.phaseHistory[currentPhaseHistoryIndex].nextPhase = move.toPhase;
    }

    // Aggiungi nuova entry per la fase di destinazione
    const newPhaseEntry: PhaseHistoryEntry = {
      phaseId: move.toPhase,
      phaseName: toPhase.name,
      enteredAt: new Date(),
      decision: 'pending',
      automatedTransition: false
    };

    state.phaseHistory.push(newPhaseEntry);

    // Aggiorna stato corrente
    state.previousPhase = state.currentPhase;
    state.currentPhase = move.toPhase;
    state.updatedAt = new Date();

    // Se è la fase finale, marca come completato
    if (toPhase.type === 'final' && move.decision === 'passed') {
      state.status = 'completed';
      state.completedAt = new Date();
    } else if (move.decision === 'failed') {
      state.status = 'rejected';
      state.completedAt = new Date();
    }

    // 🔥 STEP 2.4: Sincronizza stato candidato quando workflow cambia fase
    await this.syncCandidateStatusFromWorkflow(move.candidateId, move.toPhase, move.decision);

    // Emetti evento
    this.emitEvent({
      id: `event-${Date.now()}`,
      type: 'candidate_moved',
      candidateId: move.candidateId,
      workflowId: state.workflowTemplateId,
      phaseId: move.toPhase,
      data: { fromPhase: move.fromPhase, toPhase: move.toPhase, decision: move.decision },
      timestamp: new Date(),
      userId: 'current-user' // In produzione, ottenerlo dal token JWT
    });

    // 🔥 STEP 3.2: Emit real-time WebSocket events
    this.emitRealTimeUpdate('candidate_moved', {
      candidateId: move.candidateId,
      workflowId: state.workflowTemplateId,
      fromPhase: move.fromPhase,
      toPhase: move.toPhase,
      decision: move.decision,
      candidateData: this.getMockCandidateData(move.candidateId),
      timestamp: new Date()
    });

    console.log(`✅ Candidate ${move.candidateId} moved from ${move.fromPhase} to ${move.toPhase}`);

    return state;
  }

  // Ottieni metriche workflow
  async getWorkflowMetrics(workflowId: string = 'default-workflow'): Promise<WorkflowMetrics> {
    const candidateStates = Array.from(this.candidateStates.values())
      .filter(state => state.workflowTemplateId === workflowId);

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Candidati per fase
    const candidatesByPhase: Record<string, number> = {};
    workflow.phases.forEach(phase => {
      candidatesByPhase[phase.id] = candidateStates.filter(s => s.currentPhase === phase.id).length;
    });

    // Tempo medio per fase
    const averageTimePerPhase: Record<string, number> = {};
    workflow.phases.forEach(phase => {
      const completedPhases = candidateStates.flatMap(s => s.phaseHistory)
        .filter(h => h.phaseId === phase.id && h.exitedAt);
      
      if (completedPhases.length > 0) {
        const totalTime = completedPhases.reduce((sum, h) => {
          return sum + (h.exitedAt!.getTime() - h.enteredAt.getTime());
        }, 0);
        averageTimePerPhase[phase.id] = totalTime / completedPhases.length / (60 * 60 * 1000); // in ore
      } else {
        averageTimePerPhase[phase.id] = 0;
      }
    });

    // Conversion rates
    const conversionRates: Record<string, number> = {};
    for (let i = 0; i < workflow.phases.length - 1; i++) {
      const currentPhase = workflow.phases[i];
      const nextPhase = workflow.phases[i + 1];
      
      const enteredCurrent = candidateStates.filter(s => 
        s.phaseHistory.some(h => h.phaseId === currentPhase.id)
      ).length;
      
      const enteredNext = candidateStates.filter(s => 
        s.phaseHistory.some(h => h.phaseId === nextPhase.id)
      ).length;
      
      conversionRates[`${currentPhase.id}_to_${nextPhase.id}`] = 
        enteredCurrent > 0 ? (enteredNext / enteredCurrent) * 100 : 0;
    }

    // Time to hire
    const completedCandidates = candidateStates.filter(s => s.status === 'completed' && s.completedAt);
    const hireTimes = completedCandidates.map(s => 
      s.completedAt!.getTime() - s.startedAt.getTime()
    ).map(time => time / (24 * 60 * 60 * 1000)); // in giorni

    const timeToHire = {
      average: hireTimes.length > 0 ? hireTimes.reduce((a, b) => a + b, 0) / hireTimes.length : 0,
      median: this.calculateMedian(hireTimes),
      p90: this.calculatePercentile(hireTimes, 90)
    };

    // Bottlenecks (semplificato)
    const bottlenecks: BottleneckAnalysis[] = workflow.phases
      .filter(phase => averageTimePerPhase[phase.id] > (phase.slaHours || 48))
      .map(phase => ({
        phaseId: phase.id,
        phaseName: phase.name,
        averageTime: averageTimePerPhase[phase.id],
        standardDeviation: 0, // Calcolo semplificato
        candidatesInPhase: candidatesByPhase[phase.id],
        riskLevel: averageTimePerPhase[phase.id] > (phase.slaHours || 48) * 1.5 ? 'high' : 'medium',
        suggestions: [`Ottimizza processo ${phase.name}`, 'Aumenta risorse dedicate']
      }));

    // SLA Metrics (semplificato)
    const slaMetrics: SLAMetrics = {
      overallCompliance: 85, // Mock
      phaseCompliance: Object.fromEntries(workflow.phases.map(p => [p.id, 80])),
      breachedSLAs: [] // Mock
    };

    return {
      totalCandidates: candidateStates.length,
      candidatesByPhase,
      averageTimePerPhase,
      conversionRates,
      bottlenecks,
      slaCompliance: slaMetrics,
      timeToHire
    };
  }

  // Utility per eventi real-time
  private emitEvent(event: WorkflowEvent) {
    this.eventHandlers.forEach(handler => handler(event));
  }

  // 🔥 STEP 3.2: Emit real-time WebSocket updates
  private emitRealTimeUpdate(eventType: string, data: any) {
    try {
      // Controlla se io è disponibile (WebSocket server)
      if (typeof global !== 'undefined' && global.io) {
        console.log(`📡 Emitting real-time event: ${eventType}`, { candidateId: data.candidateId, workflowId: data.workflowId });
        
        // Emit to workflow room (per la Kanban board)
        global.io.to(`workflow-${data.workflowId}`).emit('workflow_update', {
          type: eventType,
          data
        });
        
        // Emit to candidate room (per dettagli candidato)
        global.io.to(`candidate-${data.candidateId}`).emit('candidate_update', {
          type: eventType,
          data
        });
        
        // Emit to all clients (per notifiche globali)
        global.io.emit('global_update', {
          type: eventType,
          data: {
            candidateId: data.candidateId,
            candidateName: data.candidateData?.name,
            fromPhase: data.fromPhase,
            toPhase: data.toPhase,
            decision: data.decision,
            timestamp: data.timestamp
          }
        });
        
        console.log(`✅ Real-time event ${eventType} emitted successfully`);
      } else {
        console.log(`⚠️ WebSocket server not available, skipping real-time event: ${eventType}`);
      }
    } catch (error) {
      console.error(`❌ Failed to emit real-time event ${eventType}:`, error);
    }
  }

  public addEventListener(handler: (event: WorkflowEvent) => void) {
    this.eventHandlers.add(handler);
  }

  public removeEventListener(handler: (event: WorkflowEvent) => void) {
    this.eventHandlers.delete(handler);
  }

  // Utility functions
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  // Mappa stati candidati del sistema alle fasi workflow
  private mapCandidateStatusToWorkflowPhase(candidateStatus: string, interviewsCompleted: number = 0): string {
    switch (candidateStatus) {
      case 'NEW':
        return 'cv_review';
      
      case 'IN_PROCESS':
        // Determina fase basata sui colloqui completati
        if (interviewsCompleted === 0) return 'phone_screening';
        if (interviewsCompleted === 1) return 'technical_interview';
        if (interviewsCompleted === 2) return 'cultural_fit';
        if (interviewsCompleted >= 3) return 'final_decision';
        return 'phone_screening';
      
      case 'HIRED':
        return 'hired';
      
      case 'REJECTED':
        return 'rejected';
      
      default:
        return 'cv_review';
    }
  }

  // Mappa fase workflow allo stato candidato del sistema
  private mapWorkflowPhaseToCandidateStatus(workflowPhase: string): string {
    switch (workflowPhase) {
      case 'cv_review':
        return 'NEW';
      
      case 'phone_screening':
      case 'technical_interview':
      case 'cultural_fit':
      case 'final_decision':
        return 'IN_PROCESS';
      
      case 'hired':
        return 'HIRED';
      
      case 'rejected':
        return 'REJECTED';
      
      default:
        return 'NEW';
    }
  }

  // Recupera dati candidato reali - Integrato con sistema candidati
  private getMockCandidateData(candidateId: string) {
    // Dati sincronizzati con il sistema candidati reale (backend\src\routes\candidates.ts)
    const realCandidatesData: Record<string, { name: string; email: string; avatar?: string }> = {
      '1': {
        name: 'Marco Rossi',
        email: 'marco.rossi@email.com',
        avatar: undefined
      },
      '2': {
        name: 'Sara Colombo',
        email: 'sara.colombo@email.com',
        avatar: undefined
      },
      '3': {
        name: 'Andrea Ferrari',
        email: 'andrea.ferrari@email.com',
        avatar: undefined
      },
      '4': {
        name: 'Elena Ricci',
        email: 'elena.ricci@email.com',
        avatar: undefined
      },
      '5': {
        name: 'Francesco Bianchi',
        email: 'francesco.bianchi@email.com',
        avatar: undefined
      },
      '6': {
        name: 'Giulia Verdi',
        email: 'giulia.verdi@email.com',
        avatar: undefined
      }
    };

    return realCandidatesData[candidateId] || {
      name: 'Candidato Sconosciuto',
      email: 'unknown@example.com',
      avatar: undefined
    };
  }

  // Sincronizza candidato dal sistema candidati al workflow
  async syncCandidateFromCandidatesAPI(candidateId: string): Promise<CandidateWorkflowState | null> {
    try {
      // In produzione, fare chiamata API al servizio candidati
      // Per ora usiamo i dati mock sincronizzati
      console.log(`🔄 Syncing candidate ${candidateId} from candidates system`);
      
      // Mock data che simula la risposta dall'API candidati
      const candidateData = await this.fetchCandidateFromAPI(candidateId);
      if (!candidateData) return null;

      // Determina la fase workflow corretta basata sullo stato del candidato
      const workflowPhase = this.mapCandidateStatusToWorkflowPhase(
        candidateData.currentStatus, 
        candidateData.completedInterviews || 0
      );

      // Crea o aggiorna lo stato workflow
      let workflowState = this.candidateStates.get(candidateId);
      
      if (!workflowState) {
        // Crea nuovo stato workflow
        workflowState = this.createWorkflowStateForCandidate(candidateId, candidateData, workflowPhase);
        this.candidateStates.set(candidateId, workflowState);
      } else {
        // Aggiorna stato esistente
        this.updateWorkflowStateFromCandidate(workflowState, candidateData, workflowPhase);
      }

      console.log(`✅ Candidate ${candidateId} synced to workflow phase: ${workflowPhase}`);
      
      // 🔥 STEP 3.2: Emit real-time sync event
      this.emitRealTimeUpdate('candidate_synced', {
        candidateId,
        workflowId: 'default-workflow',
        phase: workflowPhase,
        candidateData: this.getMockCandidateData(candidateId),
        timestamp: new Date()
      });
      
      return workflowState;
    } catch (error) {
      console.error(`❌ Error syncing candidate ${candidateId}:`, error);
      return null;
    }
  }

  // Simula fetch dal sistema candidati - in produzione fare chiamata HTTP
  private async fetchCandidateFromAPI(candidateId: string): Promise<any> {
    // Mock data che replica la struttura del sistema candidati
    const mockCandidatesAPI: Record<string, any> = {
      '1': {
        id: 1,
        firstName: 'Marco',
        lastName: 'Rossi',
        email: 'marco.rossi@email.com',
        positionApplied: 'Frontend Developer',
        currentStatus: 'IN_PROCESS',
        completedInterviews: 2,
        applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      '2': {
        id: 2,
        firstName: 'Sara',
        lastName: 'Colombo',
        email: 'sara.colombo@email.com',
        positionApplied: 'UX Designer',
        currentStatus: 'IN_PROCESS',
        completedInterviews: 0,
        applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      '3': {
        id: 3,
        firstName: 'Andrea',
        lastName: 'Ferrari',
        email: 'andrea.ferrari@email.com',
        positionApplied: 'Backend Developer',
        currentStatus: 'HIRED',
        completedInterviews: 3,
        applicationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      '4': {
        id: 4,
        firstName: 'Elena',
        lastName: 'Ricci',
        email: 'elena.ricci@email.com',
        positionApplied: 'Data Analyst',
        currentStatus: 'REJECTED',
        completedInterviews: 1,
        applicationDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      }
    };

    return mockCandidatesAPI[candidateId] || null;
  }

  // Crea nuovo stato workflow per candidato
  private createWorkflowStateForCandidate(
    candidateId: string, 
    candidateData: any, 
    initialPhase: string
  ): CandidateWorkflowState {
    const state: CandidateWorkflowState = {
      id: `cs-${candidateId}`,
      candidateId,
      workflowTemplateId: 'default-workflow',
      currentPhase: initialPhase,
      status: candidateData.currentStatus === 'HIRED' ? 'completed' : 
              candidateData.currentStatus === 'REJECTED' ? 'rejected' : 'active',
      startedAt: candidateData.applicationDate || new Date(),
      updatedAt: new Date(),
      phaseHistory: [{
        phaseId: initialPhase,
        phaseName: this.getPhaseNameById(initialPhase),
        enteredAt: candidateData.applicationDate || new Date(),
        decision: 'pending',
        automatedTransition: false
      }],
      metadata: {
        positionId: `pos-${candidateId}`,
        positionTitle: candidateData.positionApplied || 'Posizione Non Specificata',
        priority: 'medium',
        assignedRecruiter: 'recruiter-1',
        tags: [],
        customFields: {}
      }
    };

    // Se il candidato è già assunto o rifiutato, completa la timeline
    if (candidateData.currentStatus === 'HIRED' || candidateData.currentStatus === 'REJECTED') {
      state.completedAt = new Date();
      state.phaseHistory[0].exitedAt = new Date();
      state.phaseHistory[0].decision = candidateData.currentStatus === 'HIRED' ? 'passed' : 'failed';
    }

    return state;
  }

  // Aggiorna stato workflow esistente
  private updateWorkflowStateFromCandidate(
    workflowState: CandidateWorkflowState,
    candidateData: any,
    targetPhase: string
  ): void {
    // Aggiorna metadati
    workflowState.metadata.positionTitle = candidateData.positionApplied || workflowState.metadata.positionTitle;
    workflowState.updatedAt = new Date();

    // Se la fase è cambiata, aggiorna
    if (workflowState.currentPhase !== targetPhase) {
      workflowState.previousPhase = workflowState.currentPhase;
      workflowState.currentPhase = targetPhase;

      // Aggiungi entry nella timeline
      workflowState.phaseHistory.push({
        phaseId: targetPhase,
        phaseName: this.getPhaseNameById(targetPhase),
        enteredAt: new Date(),
        decision: 'pending',
        automatedTransition: true
      });
    }

    // Aggiorna stato generale
    if (candidateData.currentStatus === 'HIRED') {
      workflowState.status = 'completed';
      workflowState.completedAt = new Date();
    } else if (candidateData.currentStatus === 'REJECTED') {
      workflowState.status = 'rejected';
      workflowState.completedAt = new Date();
    }
  }

  // Utility per ottenere il nome della fase dall'ID
  private getPhaseNameById(phaseId: string): string {
    const phaseNames: Record<string, string> = {
      'cv_review': 'CV Review',
      'phone_screening': 'Phone Screening',
      'technical_interview': 'Technical Interview',
      'cultural_fit': 'Cultural Fit',
      'final_decision': 'Final Decision',
      'hired': 'Hired',
      'rejected': 'Rejected'
    };
    return phaseNames[phaseId] || phaseId;
  }

  // Sincronizza tutti i candidati dal sistema candidati
  async syncAllCandidatesFromAPI(): Promise<void> {
    console.log('🔄 Starting full sync of all candidates from candidates API');
    
    // In produzione, fare chiamata per ottenere tutti i candidati
    const candidateIds = ['1', '2', '3', '4', '5', '6'];
    
    for (const candidateId of candidateIds) {
      await this.syncCandidateFromCandidatesAPI(candidateId);
    }
    
    console.log('✅ Full sync completed');
  }

  // AI Integration Methods

  // Analisi automatica CV quando candidato entra nella prima fase
  async processNewCandidate(candidateId: string, cvFile?: Express.Multer.File): Promise<void> {
    try {
      const state = this.candidateStates.get(candidateId);
      if (!state) return;

      console.log(`🤖 Starting AI analysis for candidate ${candidateId}`);

      // Se c'è un CV, analizzalo
      if (cvFile) {
        const cvAnalysis = await aiService.analyzeCVFromFile(cvFile);
        
        // Aggiorna score basato sull'analisi AI
        const aiScore = cvAnalysis.aiInsights.overallScore;
        
        // Aggiorna la fase corrente con il score AI
        const currentPhaseIndex = state.phaseHistory.findIndex(
          h => h.phaseId === state.currentPhase && !h.exitedAt
        );
        
        if (currentPhaseIndex !== -1) {
          state.phaseHistory[currentPhaseIndex].score = aiScore;
          state.phaseHistory[currentPhaseIndex].notes = 
            `AI Analysis: ${cvAnalysis.aiInsights.summaryAI}`;
        }

        // Determina se il candidato può avanzare automaticamente
        if (this.shouldAutoAdvance(state, aiScore)) {
          await this.autoAdvanceCandidate(candidateId, aiScore);
        }
      }

      console.log(`✅ AI analysis completed for candidate ${candidateId}`);
    } catch (error) {
      console.error(`❌ Error processing candidate ${candidateId}:`, error);
    }
  }

  // Determina se il candidato può avanzare automaticamente
  private shouldAutoAdvance(state: CandidateWorkflowState, aiScore: number): boolean {
    const workflow = this.workflows.get(state.workflowTemplateId);
    if (!workflow) return false;

    const currentPhase = workflow.phases.find(p => p.id === state.currentPhase);
    if (!currentPhase?.autoAdvanceRules) return false;

    // Controlla le regole di avanzamento automatico
    return currentPhase.autoAdvanceRules.some(rule => {
      if (rule.condition === 'ai_score') {
        switch (rule.operator) {
          case '>':
            return aiScore > Number(rule.value);
          case '>=':
            return aiScore >= Number(rule.value);
          case '<':
            return aiScore < Number(rule.value);
          case '<=':
            return aiScore <= Number(rule.value);
          case '==':
            return aiScore === Number(rule.value);
          default:
            return false;
        }
      }
      return false;
    });
  }

  // Avanzamento automatico del candidato
  private async autoAdvanceCandidate(candidateId: string, aiScore: number): Promise<void> {
    const state = this.candidateStates.get(candidateId);
    if (!state) return;

    const workflow = this.workflows.get(state.workflowTemplateId);
    if (!workflow) return;

    const currentPhaseIndex = workflow.phases.findIndex(p => p.id === state.currentPhase);
    if (currentPhaseIndex === -1 || currentPhaseIndex >= workflow.phases.length - 1) return;

    const nextPhase = workflow.phases[currentPhaseIndex + 1];

    console.log(`🚀 Auto-advancing candidate ${candidateId} to ${nextPhase.id}`);

    // Sposta automaticamente alla prossima fase
    await this.moveCandidate({
      candidateId,
      fromPhase: state.currentPhase,
      toPhase: nextPhase.id,
      decision: 'passed',
      score: aiScore,
      notes: `Avanzamento automatico basato su AI Score: ${aiScore}`
    });
  }

  // Genera suggerimenti domande per colloquio
  async generateInterviewQuestions(candidateId: string): Promise<string[]> {
    try {
      const state = this.candidateStates.get(candidateId);
      if (!state) return [];

      const position = {
        title: state.metadata.positionTitle,
        level: this.extractLevelFromTitle(state.metadata.positionTitle)
      };

      const questions = await aiService.generateInterviewQuestions(position, state.currentPhase);
      return questions.questions;
    } catch (error) {
      console.error('Error generating interview questions:', error);
      return [];
    }
  }

  // Analisi sentiment feedback colloquio
  async analyzeFeedback(candidateId: string, feedback: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    keyPoints: string[];
  }> {
    try {
      const analysis = await aiService.analyzeFeedbackSentiment({
        candidateId,
        interviewerFeedback: feedback,
        phase: 'interview'
      });

      return {
        sentiment: analysis.overallSentiment,
        score: analysis.sentimentScore,
        keyPoints: analysis.keyInsights
      };
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return {
        sentiment: 'neutral',
        score: 50,
        keyPoints: []
      };
    }
  }

  // Predictive scoring per il candidato
  async updatePredictiveScore(candidateId: string): Promise<number> {
    try {
      const state = this.candidateStates.get(candidateId);
      if (!state) return 0;

      const candidateProfile = {
        id: candidateId,
        name: this.getMockCandidateData(candidateId).name,
        currentPhase: state.currentPhase,
        phaseHistory: state.phaseHistory.map(h => ({
          phase: h.phaseId,
          score: h.score || 0,
          duration: h.duration || 0
        })),
        position: state.metadata.positionTitle,
        priority: state.metadata.priority
      };

      const prediction = await aiService.predictCandidateSuccess(candidateProfile);
      return prediction.successProbability;
    } catch (error) {
      console.error('Error updating predictive score:', error);
      return 0;
    }
  }

  // Utility per estrarre il livello dalla posizione
  private extractLevelFromTitle(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('sr')) return 'senior';
    if (titleLower.includes('junior') || titleLower.includes('jr')) return 'junior';
    if (titleLower.includes('lead') || titleLower.includes('principal')) return 'lead';
    return 'mid';
  }

  // Matching automatico candidato-posizione
  async findBestPositionMatch(candidateId: string): Promise<{
    positionId: string;
    matchScore: number;
    reasons: string[];
  } | null> {
    try {
      // Mock implementation - in produzione recuperare posizioni dal database
      const mockPositions = [
        {
          id: 'pos-1',
          title: 'Frontend Developer',
          requiredSkills: ['React', 'TypeScript', 'CSS'],
          experience: 'mid'
        },
        {
          id: 'pos-2',
          title: 'Backend Developer', 
          requiredSkills: ['Node.js', 'TypeScript', 'MongoDB'],
          experience: 'senior'
        }
      ];

      const candidateData = this.getMockCandidateData(candidateId);
      
      // Simulazione matching AI
      const bestMatch = mockPositions[0];
      return {
        positionId: bestMatch.id,
        matchScore: Math.random() * 30 + 70, // 70-100
        reasons: [
          'Competenze tecniche allineate',
          'Esperienza appropriata per il livello',
          'Background compatibile'
        ]
      };
    } catch (error) {
      console.error('Error finding position match:', error);
      return null;
    }
  }
}

// Singleton instance
export const workflowService = new WorkflowService();