import { Router } from 'express';
import { workflowService } from '../services/workflowService';
import { 
  MoveCandidate, 
  BulkMoveCandidate,
  CreateWorkflowTemplate,
  UpdateWorkflowTemplate 
} from '../types/workflow';

const router = Router();

// GET /api/workflow/kanban - Ottieni board Kanban
router.get('/kanban', async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string || 'default-workflow';
    const kanbanData = await workflowService.getKanbanBoard(workflowId);
    
    res.json(kanbanData);
  } catch (error) {
    console.error('Error fetching kanban board:', error);
    res.status(500).json({ 
      error: 'Failed to fetch kanban board',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/metrics - Ottieni metriche workflow
router.get('/metrics', async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string || 'default-workflow';
    const metrics = await workflowService.getWorkflowMetrics(workflowId);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflow metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflow/move-candidate - Sposta candidato tra fasi
router.post('/move-candidate', async (req, res) => {
  try {
    const moveData: MoveCandidate = req.body;
    
    // Validazione input
    if (!moveData.candidateId || !moveData.fromPhase || !moveData.toPhase) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['candidateId', 'fromPhase', 'toPhase']
      });
    }

    const updatedState = await workflowService.moveCandidate(moveData);
    
    res.json({
      success: true,
      candidateState: updatedState,
      message: `Candidate moved from ${moveData.fromPhase} to ${moveData.toPhase}`
    });
  } catch (error) {
    console.error('Error moving candidate:', error);
    res.status(500).json({ 
      error: 'Failed to move candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflow/bulk-move - Sposta più candidati
router.post('/bulk-move', async (req, res) => {
  try {
    const bulkMoveData: BulkMoveCandidate = req.body;
    
    if (!bulkMoveData.moves || !Array.isArray(bulkMoveData.moves)) {
      return res.status(400).json({
        error: 'Invalid bulk move data',
        expected: 'moves array required'
      });
    }

    const results = [];
    const errors = [];

    for (const move of bulkMoveData.moves) {
      try {
        const updatedState = await workflowService.moveCandidate(move);
        results.push({
          candidateId: move.candidateId,
          success: true,
          state: updatedState
        });
      } catch (error) {
        errors.push({
          candidateId: move.candidateId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: bulkMoveData.moves.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error in bulk move:', error);
    res.status(500).json({ 
      error: 'Failed to process bulk move',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/templates - Lista workflow templates
router.get('/templates', async (req, res) => {
  try {
    // Mock implementation - in produzione recuperare dal database
    const templates = [
      {
        id: 'default-workflow',
        name: 'Standard Hiring Process',
        description: 'Processo standard di assunzione per posizioni tecniche',
        isDefault: true,
        positionTypes: ['developer', 'engineer', 'designer'],
        phases: [
          { id: 'cv_review', name: 'CV Review', order: 1 },
          { id: 'phone_screening', name: 'Phone Screening', order: 2 },
          { id: 'technical_interview', name: 'Technical Interview', order: 3 },
          { id: 'cultural_fit', name: 'Cultural Fit', order: 4 },
          { id: 'final_decision', name: 'Final Decision', order: 5 }
        ]
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflow templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflow/templates - Crea nuovo workflow template
router.post('/templates', async (req, res) => {
  try {
    const templateData: CreateWorkflowTemplate = req.body;
    
    // Validazione input
    if (!templateData.name || !templateData.phases || templateData.phases.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'phases']
      });
    }

    // Mock implementation - in produzione salvare nel database
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      template: newTemplate,
      message: 'Workflow template created successfully'
    });
  } catch (error) {
    console.error('Error creating workflow template:', error);
    res.status(500).json({ 
      error: 'Failed to create workflow template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/workflow/templates/:id - Aggiorna workflow template
router.put('/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const updateData: UpdateWorkflowTemplate = req.body;
    
    if (updateData.id && updateData.id !== templateId) {
      return res.status(400).json({
        error: 'Template ID mismatch'
      });
    }

    // Mock implementation - in produzione aggiornare nel database
    const updatedTemplate = {
      id: templateId,
      ...updateData,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      template: updatedTemplate,
      message: 'Workflow template updated successfully'
    });
  } catch (error) {
    console.error('Error updating workflow template:', error);
    res.status(500).json({ 
      error: 'Failed to update workflow template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/workflow/templates/:id - Elimina workflow template
router.delete('/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    
    if (templateId === 'default-workflow') {
      return res.status(400).json({
        error: 'Cannot delete default workflow template'
      });
    }

    // Mock implementation - in produzione eliminare dal database
    res.json({
      success: true,
      message: 'Workflow template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow template:', error);
    res.status(500).json({ 
      error: 'Failed to delete workflow template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/candidate/:candidateId - Ottieni stato workflow candidato
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    
    // Mock implementation - in produzione recuperare dal database
    res.json({
      candidateId,
      workflowTemplateId: 'default-workflow',
      currentPhase: 'cv_review',
      status: 'active',
      timeline: []
    });
  } catch (error) {
    console.error('Error fetching candidate workflow state:', error);
    res.status(500).json({ 
      error: 'Failed to fetch candidate workflow state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflow/candidate/:candidateId/start - Avvia workflow per candidato
router.post('/candidate/:candidateId/start', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const { workflowTemplateId = 'default-workflow', positionId, priority = 'medium' } = req.body;
    
    // Mock implementation - in produzione creare nel database
    const candidateWorkflowState = {
      id: `cs-${Date.now()}`,
      candidateId,
      workflowTemplateId,
      currentPhase: 'cv_review',
      status: 'active',
      startedAt: new Date(),
      updatedAt: new Date(),
      phaseHistory: [{
        phaseId: 'cv_review',
        phaseName: 'CV Review',
        enteredAt: new Date(),
        decision: 'pending',
        automatedTransition: false
      }],
      metadata: {
        positionId: positionId || 'pos-1',
        positionTitle: 'Position Title',
        priority,
        assignedRecruiter: 'recruiter-1',
        tags: [],
        customFields: {}
      }
    };
    
    res.status(201).json({
      success: true,
      workflowState: candidateWorkflowState,
      message: 'Workflow started for candidate'
    });
  } catch (error) {
    console.error('Error starting workflow for candidate:', error);
    res.status(500).json({ 
      error: 'Failed to start workflow for candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/events - Server-Sent Events per real-time updates
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Invia evento iniziale
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

  // Aggiungi listener per eventi workflow
  const eventHandler = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  workflowService.addEventListener(eventHandler);

  // Cleanup quando client disconnette
  req.on('close', () => {
    workflowService.removeEventListener(eventHandler);
  });

  // Keep-alive ping ogni 30 secondi
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// POST /api/workflow/ai/process-candidate - Avvia analisi AI per candidato
router.post('/ai/process-candidate', async (req, res) => {
  try {
    const { candidateId } = req.body;
    const cvFile = req.file;

    if (!candidateId) {
      return res.status(400).json({
        error: 'Candidate ID required'
      });
    }

    await workflowService.processNewCandidate(candidateId, cvFile);

    res.json({
      success: true,
      message: 'AI processing started for candidate'
    });
  } catch (error) {
    console.error('Error processing candidate with AI:', error);
    res.status(500).json({ 
      error: 'Failed to process candidate with AI',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/ai/interview-questions/:candidateId - Genera domande per colloquio
router.get('/ai/interview-questions/:candidateId', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const questions = await workflowService.generateInterviewQuestions(candidateId);

    res.json({
      success: true,
      candidateId,
      questions
    });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate interview questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflow/ai/analyze-feedback - Analizza feedback colloquio
router.post('/ai/analyze-feedback', async (req, res) => {
  try {
    const { candidateId, feedback } = req.body;

    if (!candidateId || !feedback) {
      return res.status(400).json({
        error: 'Candidate ID and feedback required'
      });
    }

    const analysis = await workflowService.analyzeFeedback(candidateId, feedback);

    res.json({
      success: true,
      candidateId,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ 
      error: 'Failed to analyze feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/ai/predictive-score/:candidateId - Calcola score predittivo
router.get('/ai/predictive-score/:candidateId', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const score = await workflowService.updatePredictiveScore(candidateId);

    res.json({
      success: true,
      candidateId,
      predictiveScore: score
    });
  } catch (error) {
    console.error('Error calculating predictive score:', error);
    res.status(500).json({ 
      error: 'Failed to calculate predictive score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/ai/position-match/:candidateId - Trova migliore posizione
router.get('/ai/position-match/:candidateId', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const match = await workflowService.findBestPositionMatch(candidateId);

    if (!match) {
      return res.status(404).json({
        error: 'No suitable position match found'
      });
    }

    res.json({
      success: true,
      candidateId,
      match
    });
  } catch (error) {
    console.error('Error finding position match:', error);
    res.status(500).json({ 
      error: 'Failed to find position match',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflow/health - Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'workflow-service',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

export default router;