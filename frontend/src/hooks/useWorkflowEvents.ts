import { useState, useEffect, useCallback } from 'react';

export interface WorkflowEvent {
  id: string;
  type: 'candidate_moved' | 'phase_completed' | 'sla_warning' | 'bottleneck_detected' | 'workflow_updated' | 'connected' | 'ping';
  candidateId?: string;
  workflowId?: string;
  phaseId?: string;
  data?: any;
  timestamp: Date;
  userId?: string;
}

interface UseWorkflowEventsOptions {
  onCandidateMoved?: (event: WorkflowEvent) => void;
  onPhaseCompleted?: (event: WorkflowEvent) => void;
  onSlaWarning?: (event: WorkflowEvent) => void;
  onBottleneckDetected?: (event: WorkflowEvent) => void;
  onWorkflowUpdated?: (event: WorkflowEvent) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWorkflowEvents = (options: UseWorkflowEventsOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WorkflowEvent | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const {
    onCandidateMoved,
    onPhaseCompleted,
    onSlaWarning,
    onBottleneckDetected,
    onWorkflowUpdated,
    autoReconnect = true,
    reconnectInterval = 3000
  } = options;

  const connect = useCallback(() => {
    try {
      const es = new EventSource('http://localhost:3004/api/workflow/events');
      
      es.onopen = () => {
        console.log('✅ Workflow events connection established');
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      es.onmessage = (event) => {
        try {
          const workflowEvent: WorkflowEvent = JSON.parse(event.data);
          workflowEvent.timestamp = new Date(workflowEvent.timestamp);
          
          setLastEvent(workflowEvent);

          // Handle different event types
          switch (workflowEvent.type) {
            case 'candidate_moved':
              console.log('📝 Candidate moved:', workflowEvent);
              onCandidateMoved?.(workflowEvent);
              break;
            
            case 'phase_completed':
              console.log('✅ Phase completed:', workflowEvent);
              onPhaseCompleted?.(workflowEvent);
              break;
            
            case 'sla_warning':
              console.log('⚠️ SLA warning:', workflowEvent);
              onSlaWarning?.(workflowEvent);
              break;
            
            case 'bottleneck_detected':
              console.log('🚧 Bottleneck detected:', workflowEvent);
              onBottleneckDetected?.(workflowEvent);
              break;
            
            case 'workflow_updated':
              console.log('🔄 Workflow updated:', workflowEvent);
              onWorkflowUpdated?.(workflowEvent);
              break;
            
            case 'connected':
              console.log('🔗 Connected to workflow events');
              break;
            
            case 'ping':
              // Keep-alive, no action needed
              break;
            
            default:
              console.log('📨 Unknown workflow event:', workflowEvent);
          }
        } catch (error) {
          console.error('Error parsing workflow event:', error);
        }
      };

      es.onerror = (error) => {
        console.error('❌ Workflow events connection error:', error);
        setIsConnected(false);
        es.close();
        
        if (autoReconnect) {
          const attempts = reconnectAttempts + 1;
          setReconnectAttempts(attempts);
          
          if (attempts <= 5) {
            console.log(`🔄 Reconnecting to workflow events (attempt ${attempts}/5)...`);
            setTimeout(connect, reconnectInterval * attempts);
          } else {
            console.error('❌ Max reconnection attempts reached');
          }
        }
      };

      setEventSource(es);
    } catch (error) {
      console.error('Error creating EventSource:', error);
      setIsConnected(false);
    }
  }, [
    onCandidateMoved,
    onPhaseCompleted, 
    onSlaWarning,
    onBottleneckDetected,
    onWorkflowUpdated,
    autoReconnect,
    reconnectInterval,
    reconnectAttempts
  ]);

  const disconnect = useCallback(() => {
    if (eventSource) {
      console.log('🔌 Disconnecting from workflow events');
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
    }
  }, [eventSource]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array for mount/unmount only

  // Cleanup eventSource when it changes
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return {
    isConnected,
    lastEvent,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect
  };
};