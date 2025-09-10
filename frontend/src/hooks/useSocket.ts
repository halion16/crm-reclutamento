// 🔥 STEP 3.3: React Hook for WebSocket Integration
import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';

interface UseSocketOptions {
  // Auto-join rooms
  workflowId?: string;
  candidateId?: string;
  
  // Event handlers
  onGlobalUpdate?: (event: any) => void;
  onWorkflowUpdate?: (event: any) => void;
  onCandidateUpdate?: (event: any) => void;
  onInterviewOutcomeUpdated?: (event: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    workflowId,
    candidateId,
    onGlobalUpdate,
    onWorkflowUpdate,
    onCandidateUpdate,
    onInterviewOutcomeUpdated
  } = options;

  // Use refs to store the latest callbacks to avoid stale closures
  const globalUpdateRef = useRef(onGlobalUpdate);
  const workflowUpdateRef = useRef(onWorkflowUpdate);
  const candidateUpdateRef = useRef(onCandidateUpdate);
  const interviewOutcomeRef = useRef(onInterviewOutcomeUpdated);

  // Update refs when callbacks change
  useEffect(() => {
    globalUpdateRef.current = onGlobalUpdate;
  }, [onGlobalUpdate]);

  useEffect(() => {
    workflowUpdateRef.current = onWorkflowUpdate;
  }, [onWorkflowUpdate]);

  useEffect(() => {
    candidateUpdateRef.current = onCandidateUpdate;
  }, [onCandidateUpdate]);

  useEffect(() => {
    interviewOutcomeRef.current = onInterviewOutcomeUpdated;
  }, [onInterviewOutcomeUpdated]);

  // Stable callback functions that use refs
  const handleGlobalUpdate = useCallback((event: any) => {
    globalUpdateRef.current?.(event);
  }, []);

  const handleWorkflowUpdate = useCallback((event: any) => {
    workflowUpdateRef.current?.(event);
  }, []);

  const handleCandidateUpdate = useCallback((event: any) => {
    candidateUpdateRef.current?.(event);
  }, []);

  const handleInterviewOutcome = useCallback((event: any) => {
    interviewOutcomeRef.current?.(event);
  }, []);

  // Setup socket connection and listeners
  useEffect(() => {
    // Ensure connection
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Join rooms if specified
    if (workflowId) {
      socketService.joinWorkflow(workflowId);
    }
    if (candidateId) {
      socketService.joinCandidate(candidateId);
    }

    // Register event listeners
    if (onGlobalUpdate) {
      socketService.on('global_update', handleGlobalUpdate);
    }
    if (onWorkflowUpdate) {
      socketService.on('workflow_update', handleWorkflowUpdate);
    }
    if (onCandidateUpdate) {
      socketService.on('candidate_update', handleCandidateUpdate);
    }
    if (onInterviewOutcomeUpdated) {
      socketService.on('interview_outcome_updated', handleInterviewOutcome);
    }

    // Cleanup on unmount
    return () => {
      if (onGlobalUpdate) {
        socketService.off('global_update', handleGlobalUpdate);
      }
      if (onWorkflowUpdate) {
        socketService.off('workflow_update', handleWorkflowUpdate);
      }
      if (onCandidateUpdate) {
        socketService.off('candidate_update', handleCandidateUpdate);
      }
      if (onInterviewOutcomeUpdated) {
        socketService.off('interview_outcome_updated', handleInterviewOutcome);
      }
    };
  }, [
    workflowId,
    candidateId,
    handleGlobalUpdate,
    handleWorkflowUpdate,
    handleCandidateUpdate,
    handleInterviewOutcome
  ]);

  // Return socket utilities
  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getId(),
    joinWorkflow: socketService.joinWorkflow.bind(socketService),
    joinCandidate: socketService.joinCandidate.bind(socketService)
  };
};

export default useSocket;