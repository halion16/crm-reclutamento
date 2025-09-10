// 🔥 STEP 3.3: Frontend WebSocket Client
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to WebSocket server');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');
    
    this.socket = io('http://localhost:3004', {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      autoConnect: true,
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Global update listeners
    this.socket.on('global_update', (event) => {
      console.log('🌍 Global update received:', event);
      this.emit('global_update', event);
    });

    // Workflow updates
    this.socket.on('workflow_update', (event) => {
      console.log('📋 Workflow update received:', event);
      this.emit('workflow_update', event);
    });

    // Candidate updates
    this.socket.on('candidate_update', (event) => {
      console.log('👤 Candidate update received:', event);
      this.emit('candidate_update', event);
    });

    // Interview outcome updates
    this.socket.on('interview_outcome_updated', (event) => {
      console.log('🎯 Interview outcome update received:', event);
      this.emit('interview_outcome_updated', event);
    });
  }

  disconnect(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
      console.log('🔌 WebSocket disconnected');
    }
  }

  // Join specific rooms for targeted updates
  joinWorkflow(workflowId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-workflow', workflowId);
      console.log(`👥 Joined workflow room: ${workflowId}`);
    }
  }

  joinCandidate(candidateId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-candidate', candidateId);
      console.log(`👤 Joined candidate room: ${candidateId}`);
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit to local listeners
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const socketService = new SocketService();

// Auto-connect on import (optional - can be called manually)
if (typeof window !== 'undefined') {
  // Only connect in browser environment
  console.log('🌐 Browser environment detected, initializing WebSocket connection...');
  
  // Try to connect immediately
  socketService.connect();
  
  // Also retry every 5 seconds if not connected
  const retryInterval = setInterval(() => {
    if (!socketService.isConnected()) {
      console.log('🔄 Retrying WebSocket connection...');
      socketService.connect();
    } else {
      clearInterval(retryInterval);
    }
  }, 5000);
  
  // Clear retry after 30 seconds
  setTimeout(() => {
    clearInterval(retryInterval);
  }, 30000);
}

export default socketService;