import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | 'broadcast'; // 'broadcast' for all agents
  content: string;
  type: 'request' | 'response' | 'notification' | 'data';
  timestamp: Date;
  metadata?: {
    requestId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    requiresResponse?: boolean;
  };
  read: boolean;
}

export interface SharedMemory {
  key: string;
  value: any;
  agentId: string;
  timestamp: Date;
  expiresAt?: Date;
  permissions: {
    read: string[]; // Agent IDs that can read
    write: string[]; // Agent IDs that can write
  };
}

export class AgentCommunication extends EventEmitter {
  private store: Store;
  private messages: Map<string, AgentMessage>;
  private sharedMemory: Map<string, SharedMemory>;
  private messageQueues: Map<string, AgentMessage[]>; // agentId -> messages

  constructor() {
    super();
    this.store = new Store({ name: 'agent-communication' });
    this.messages = new Map();
    this.sharedMemory = new Map();
    this.messageQueues = new Map();
    this.loadData();
  }

  private loadData(): void {
    const savedMessages = this.store.get('messages', []) as AgentMessage[];
    savedMessages.forEach(msg => {
      this.messages.set(msg.id, msg);
      this.addToQueue(msg);
    });

    const savedMemory = this.store.get('sharedMemory', []) as SharedMemory[];
    savedMemory.forEach(mem => {
      this.sharedMemory.set(mem.key, mem);
    });
  }

  private saveMessages(): void {
    this.store.set('messages', Array.from(this.messages.values()));
  }

  private saveMemory(): void {
    this.store.set('sharedMemory', Array.from(this.sharedMemory.values()));
  }

  private addToQueue(message: AgentMessage): void {
    if (message.toAgentId === 'broadcast') {
      // Add to all agent queues except sender
      return;
    }
    
    if (!this.messageQueues.has(message.toAgentId)) {
      this.messageQueues.set(message.toAgentId, []);
    }
    this.messageQueues.get(message.toAgentId)!.push(message);
  }

  // Send a message from one agent to another
  sendMessage(
    fromAgentId: string,
    toAgentId: string | 'broadcast',
    content: string,
    type: AgentMessage['type'] = 'notification',
    metadata?: AgentMessage['metadata']
  ): AgentMessage {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAgentId,
      toAgentId,
      content,
      type,
      timestamp: new Date(),
      metadata,
      read: false
    };

    this.messages.set(message.id, message);
    this.addToQueue(message);
    this.saveMessages();
    this.emit('message:sent', message);

    return message;
  }

  // Get messages for a specific agent
  getMessages(agentId: string, includeRead: boolean = false): AgentMessage[] {
    const queue = this.messageQueues.get(agentId) || [];
    const broadcasts = Array.from(this.messages.values()).filter(
      msg => msg.toAgentId === 'broadcast' && msg.fromAgentId !== agentId
    );

    const allMessages = [...queue, ...broadcasts];
    
    if (includeRead) {
      return allMessages;
    }
    
    return allMessages.filter(msg => !msg.read);
  }

  // Mark message as read
  markAsRead(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) {
      return false;
    }

    message.read = true;
    this.saveMessages();
    this.emit('message:read', message);
    return true;
  }

  // Get conversation between two agents
  getConversation(agentId1: string, agentId2: string): AgentMessage[] {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.fromAgentId === agentId1 && msg.toAgentId === agentId2) ||
        (msg.fromAgentId === agentId2 && msg.toAgentId === agentId1)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Shared Memory Operations
  setSharedData(
    key: string,
    value: any,
    agentId: string,
    permissions?: SharedMemory['permissions'],
    expiresIn?: number // milliseconds
  ): boolean {
    const existing = this.sharedMemory.get(key);
    
    // Check write permission
    if (existing && !existing.permissions.write.includes(agentId)) {
      return false;
    }

    const memory: SharedMemory = {
      key,
      value,
      agentId,
      timestamp: new Date(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
      permissions: permissions || {
        read: ['*'], // All agents can read by default
        write: [agentId] // Only creator can write
      }
    };

    this.sharedMemory.set(key, memory);
    this.saveMemory();
    this.emit('memory:updated', memory);
    return true;
  }

  getSharedData(key: string, agentId: string): any | null {
    const memory = this.sharedMemory.get(key);
    if (!memory) {
      return null;
    }

    // Check expiration
    if (memory.expiresAt && new Date() > memory.expiresAt) {
      this.sharedMemory.delete(key);
      this.saveMemory();
      return null;
    }

    // Check read permission
    if (!memory.permissions.read.includes('*') && !memory.permissions.read.includes(agentId)) {
      return null;
    }

    return memory.value;
  }

  listSharedKeys(agentId: string): string[] {
    return Array.from(this.sharedMemory.values())
      .filter(mem => 
        mem.permissions.read.includes('*') || mem.permissions.read.includes(agentId)
      )
      .map(mem => mem.key);
  }

  deleteSharedData(key: string, agentId: string): boolean {
    const memory = this.sharedMemory.get(key);
    if (!memory) {
      return false;
    }

    // Check write permission
    if (!memory.permissions.write.includes(agentId)) {
      return false;
    }

    this.sharedMemory.delete(key);
    this.saveMemory();
    this.emit('memory:deleted', key);
    return true;
  }

  // Clean up expired data
  cleanup(): void {
    const now = new Date();
    
    // Clean expired memory
    for (const [key, memory] of this.sharedMemory.entries()) {
      if (memory.expiresAt && now > memory.expiresAt) {
        this.sharedMemory.delete(key);
      }
    }

    // Clean old messages (older than 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (const [id, message] of this.messages.entries()) {
      if (new Date(message.timestamp) < weekAgo) {
        this.messages.delete(id);
        
        // Remove from queues
        if (message.toAgentId !== 'broadcast') {
          const queue = this.messageQueues.get(message.toAgentId);
          if (queue) {
            const index = queue.findIndex(m => m.id === id);
            if (index !== -1) {
              queue.splice(index, 1);
            }
          }
        }
      }
    }

    this.saveMessages();
    this.saveMemory();
  }

  // Get all agents that have sent or received messages
  getActiveAgents(): string[] {
    const agents = new Set<string>();
    for (const message of this.messages.values()) {
      agents.add(message.fromAgentId);
      if (message.toAgentId !== 'broadcast') {
        agents.add(message.toAgentId);
      }
    }
    return Array.from(agents);
  }

  // Clear all messages for an agent
  clearMessages(agentId: string): void {
    this.messageQueues.delete(agentId);
    
    // Remove messages to/from this agent
    for (const [id, message] of this.messages.entries()) {
      if (message.fromAgentId === agentId || message.toAgentId === agentId) {
        this.messages.delete(id);
      }
    }
    
    this.saveMessages();
  }
}
