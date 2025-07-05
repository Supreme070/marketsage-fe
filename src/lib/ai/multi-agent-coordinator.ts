/**
 * Multi-Agent AI Coordination System
 * =================================
 * Enables autonomous AI agents to collaborate, communicate, and coordinate tasks
 * Builds upon existing AI engines by converting them into collaborative agents
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { EventEmitter } from 'events';

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  specialization: string[];
  currentTasks: AgentTask[];
  performance: AgentPerformance;
  communicationChannels: string[];
  collaborationPreferences: CollaborationPreference;
  lastHeartbeat: Date;
  createdAt: Date;
}

export enum AgentType {
  ANALYTICS = 'analytics',           // Data analysis and insights
  EXECUTION = 'execution',          // Task execution and automation
  STRATEGY = 'strategy',            // Strategic planning and decisions
  LEARNING = 'learning',            // ML training and optimization
  COMMUNICATION = 'communication',   // User interaction and coordination
  INTEGRATION = 'integration',      // System integration and monitoring
  CONTENT = 'content',              // Content generation and analysis
  PREDICTIVE = 'predictive'         // Forecasting and prediction
}

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',
  COLLABORATING = 'collaborating'
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'delegated';
  assignedBy: string;
  collaborators: string[];
  startedAt: Date;
  deadline?: Date;
  dependencies: string[];
  results?: any;
  error?: string;
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksSuccessful: number;
  averageResponseTime: number;
  collaborationScore: number; // 0-1
  specialtyEfficiency: number; // 0-1
  lastUpdate: Date;
}

export interface CollaborationPreference {
  preferredPartners: string[];
  communicationStyle: 'direct' | 'consensus' | 'hierarchical';
  conflictResolution: 'negotiate' | 'escalate' | 'compromise';
  knowledgeSharing: boolean;
  autonomyLevel: 'low' | 'medium' | 'high';
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: MessageType;
  content: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  requiresResponse: boolean;
  responseDeadline?: Date;
  conversationId?: string;
}

export enum MessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  COLLABORATION_INVITE = 'collaboration_invite',
  KNOWLEDGE_SHARE = 'knowledge_share',
  STATUS_UPDATE = 'status_update',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  COORDINATION_REQUEST = 'coordination_request',
  HEARTBEAT = 'heartbeat',
  EMERGENCY = 'emergency'
}

export interface CollaborationSession {
  id: string;
  participants: string[];
  coordinator: string;
  objective: string;
  type: 'consensus' | 'delegation' | 'parallel' | 'sequential';
  status: 'planning' | 'active' | 'completed' | 'failed';
  tasks: AgentTask[];
  decisions: CollaborativeDecision[];
  startedAt: Date;
  completedAt?: Date;
  results?: any;
}

export interface CollaborativeDecision {
  id: string;
  sessionId: string;
  question: string;
  options: Array<{
    id: string;
    description: string;
    proposedBy: string;
    votes: string[];
    score: number;
  }>;
  consensus: string | null;
  decisionMethod: 'majority' | 'unanimous' | 'weighted' | 'expert';
  timestamp: Date;
  rationale?: string;
}

class MultiAgentCoordinator extends EventEmitter {
  private agents = new Map<string, AIAgent>();
  private messageQueue: AgentMessage[] = [];
  private activeSessions = new Map<string, CollaborationSession>();
  private messageHistory = new Map<string, AgentMessage[]>();
  private agentConnections = new Map<string, Set<string>>();

  constructor() {
    super();
    this.initializeAgentNetwork();
    this.startCoordinationServices();
  }

  /**
   * Initialize the multi-agent network by converting existing AI engines
   */
  private initializeAgentNetwork(): void {
    const coreAgents: Partial<AIAgent>[] = [
      {
        name: 'Supreme Analytics Agent',
        type: AgentType.ANALYTICS,
        capabilities: ['data_analysis', 'insights_generation', 'pattern_recognition', 'statistical_analysis'],
        specialization: ['customer_analytics', 'campaign_performance', 'market_intelligence'],
        collaborationPreferences: {
          preferredPartners: ['strategy', 'predictive'],
          communicationStyle: 'consensus',
          conflictResolution: 'negotiate',
          knowledgeSharing: true,
          autonomyLevel: 'high'
        }
      },
      {
        name: 'Intelligent Execution Agent',
        type: AgentType.EXECUTION,
        capabilities: ['task_execution', 'workflow_automation', 'system_integration', 'api_orchestration'],
        specialization: ['campaign_execution', 'contact_management', 'workflow_processing'],
        collaborationPreferences: {
          preferredPartners: ['strategy', 'communication'],
          communicationStyle: 'hierarchical',
          conflictResolution: 'escalate',
          knowledgeSharing: true,
          autonomyLevel: 'medium'
        }
      },
      {
        name: 'Strategic Planning Agent',
        type: AgentType.STRATEGY,
        capabilities: ['strategic_planning', 'decision_support', 'goal_optimization', 'resource_allocation'],
        specialization: ['business_strategy', 'market_expansion', 'growth_planning'],
        collaborationPreferences: {
          preferredPartners: ['analytics', 'predictive', 'execution'],
          communicationStyle: 'consensus',
          conflictResolution: 'compromise',
          knowledgeSharing: true,
          autonomyLevel: 'high'
        }
      },
      {
        name: 'ML Learning Agent',
        type: AgentType.LEARNING,
        capabilities: ['model_training', 'hyperparameter_tuning', 'feature_engineering', 'model_optimization'],
        specialization: ['predictive_models', 'behavioral_analysis', 'automation_optimization'],
        collaborationPreferences: {
          preferredPartners: ['analytics', 'predictive'],
          communicationStyle: 'direct',
          conflictResolution: 'negotiate',
          knowledgeSharing: true,
          autonomyLevel: 'high'
        }
      },
      {
        name: 'Communication Coordinator Agent',
        type: AgentType.COMMUNICATION,
        capabilities: ['user_interaction', 'intent_analysis', 'response_generation', 'conversation_management'],
        specialization: ['natural_language', 'user_support', 'system_coordination'],
        collaborationPreferences: {
          preferredPartners: ['execution', 'strategy'],
          communicationStyle: 'direct',
          conflictResolution: 'compromise',
          knowledgeSharing: true,
          autonomyLevel: 'medium'
        }
      },
      {
        name: 'Integration Monitoring Agent',
        type: AgentType.INTEGRATION,
        capabilities: ['system_monitoring', 'health_checking', 'integration_testing', 'self_healing'],
        specialization: ['system_health', 'integration_management', 'failure_recovery'],
        collaborationPreferences: {
          preferredPartners: ['execution', 'learning'],
          communicationStyle: 'direct',
          conflictResolution: 'escalate',
          knowledgeSharing: true,
          autonomyLevel: 'medium'
        }
      },
      {
        name: 'Content Intelligence Agent',
        type: AgentType.CONTENT,
        capabilities: ['content_analysis', 'sentiment_analysis', 'content_generation', 'optimization'],
        specialization: ['marketing_content', 'cultural_intelligence', 'personalization'],
        collaborationPreferences: {
          preferredPartners: ['analytics', 'communication'],
          communicationStyle: 'consensus',
          conflictResolution: 'compromise',
          knowledgeSharing: true,
          autonomyLevel: 'medium'
        }
      },
      {
        name: 'Predictive Forecasting Agent',
        type: AgentType.PREDICTIVE,
        capabilities: ['forecasting', 'trend_analysis', 'risk_assessment', 'scenario_planning'],
        specialization: ['market_forecasting', 'customer_behavior', 'business_metrics'],
        collaborationPreferences: {
          preferredPartners: ['analytics', 'strategy', 'learning'],
          communicationStyle: 'consensus',
          conflictResolution: 'negotiate',
          knowledgeSharing: true,
          autonomyLevel: 'high'
        }
      }
    ];

    coreAgents.forEach(agentData => {
      const agent: AIAgent = {
        id: `agent_${agentData.type}_${Date.now()}`,
        status: AgentStatus.ACTIVE,
        currentTasks: [],
        performance: {
          tasksCompleted: 0,
          tasksSuccessful: 0,
          averageResponseTime: 0,
          collaborationScore: 0.8,
          specialtyEfficiency: 0.9,
          lastUpdate: new Date()
        },
        communicationChannels: ['direct_message', 'broadcast', 'collaboration_session'],
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        ...agentData
      } as AIAgent;

      this.agents.set(agent.id, agent);
      this.agentConnections.set(agent.id, new Set());
    });

    logger.info('Multi-agent network initialized', {
      agentsCount: this.agents.size,
      agentTypes: Array.from(new Set(Array.from(this.agents.values()).map(a => a.type)))
    });
  }

  /**
   * Start coordination services for agent communication and collaboration
   */
  private startCoordinationServices(): void {
    // Message processing service
    setInterval(() => {
      this.processMessageQueue();
    }, 1000); // Process messages every second

    // Agent health monitoring
    setInterval(() => {
      this.monitorAgentHealth();
    }, 30000); // Check health every 30 seconds

    // Collaboration session management
    setInterval(() => {
      this.manageCollaborationSessions();
    }, 5000); // Manage sessions every 5 seconds

    // Performance optimization
    setInterval(() => {
      this.optimizeAgentPerformance();
    }, 60000); // Optimize every minute

    logger.info('Multi-agent coordination services started');
  }

  /**
   * Create a collaborative task that requires multiple agents
   */
  async createCollaborativeTask(params: {
    objective: string;
    requiredCapabilities: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline?: Date;
    coordinatorId?: string;
    collaborationType: 'consensus' | 'delegation' | 'parallel' | 'sequential';
  }): Promise<CollaborationSession> {
    const tracer = trace.getTracer('multi-agent-coordination');
    
    return tracer.startActiveSpan('create-collaborative-task', async (span) => {
      try {
        span.setAttributes({
          'collaboration.objective': params.objective,
          'collaboration.type': params.collaborationType,
          'collaboration.priority': params.priority,
          'collaboration.capabilities': params.requiredCapabilities.join(',')
        });

        // Select appropriate agents based on capabilities
        const selectedAgents = this.selectAgentsForTask(params.requiredCapabilities);
        
        if (selectedAgents.length === 0) {
          throw new Error('No suitable agents found for the required capabilities');
        }

        // Determine coordinator
        const coordinator = params.coordinatorId || 
          this.selectCoordinator(selectedAgents, params.collaborationType);

        // Create collaboration session
        const session: CollaborationSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          participants: selectedAgents.map(a => a.id),
          coordinator,
          objective: params.objective,
          type: params.collaborationType,
          status: 'planning',
          tasks: [],
          decisions: [],
          startedAt: new Date()
        };

        this.activeSessions.set(session.id, session);

        // Notify participating agents
        await this.initiateCollaboration(session, selectedAgents);

        span.setAttributes({
          'collaboration.session.id': session.id,
          'collaboration.participants.count': selectedAgents.length,
          'collaboration.coordinator': coordinator
        });

        logger.info('Collaborative task created', {
          sessionId: session.id,
          objective: params.objective,
          participantsCount: selectedAgents.length,
          collaborationType: params.collaborationType
        });

        return session;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Select agents based on required capabilities
   */
  private selectAgentsForTask(requiredCapabilities: string[]): AIAgent[] {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AgentStatus.ACTIVE || agent.status === AgentStatus.IDLE);

    const selectedAgents: AIAgent[] = [];
    const requiredCaps = new Set(requiredCapabilities);

    // Find agents that match required capabilities
    for (const agent of availableAgents) {
      const agentCaps = new Set([...agent.capabilities, ...agent.specialization]);
      const matchedCaps = [...requiredCaps].filter(cap => agentCaps.has(cap));
      
      if (matchedCaps.length > 0) {
        selectedAgents.push(agent);
        // Remove matched capabilities from required set
        matchedCaps.forEach(cap => requiredCaps.delete(cap));
      }

      // If all capabilities are covered, we can stop
      if (requiredCaps.size === 0) break;
    }

    return selectedAgents;
  }

  /**
   * Select coordinator for collaboration session
   */
  private selectCoordinator(agents: AIAgent[], collaborationType: string): string {
    switch (collaborationType) {
      case 'consensus':
        // Select agent with highest collaboration score
        return agents.reduce((best, current) => 
          current.performance.collaborationScore > best.performance.collaborationScore ? current : best
        ).id;
      
      case 'hierarchical':
      case 'delegation':
        // Prefer strategy or communication agents for coordination
        const coordinatorTypes = [AgentType.STRATEGY, AgentType.COMMUNICATION, AgentType.EXECUTION];
        for (const type of coordinatorTypes) {
          const coordinator = agents.find(a => a.type === type);
          if (coordinator) return coordinator.id;
        }
        return agents[0].id;
      
      default:
        return agents[0].id;
    }
  }

  /**
   * Initiate collaboration between agents
   */
  private async initiateCollaboration(session: CollaborationSession, agents: AIAgent[]): Promise<void> {
    // Send collaboration invitation to all participants
    for (const agent of agents) {
      const message: AgentMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: 'coordinator',
        to: agent.id,
        type: MessageType.COLLABORATION_INVITE,
        content: {
          sessionId: session.id,
          objective: session.objective,
          participants: session.participants,
          type: session.type,
          role: agent.id === session.coordinator ? 'coordinator' : 'participant'
        },
        priority: 'high',
        timestamp: new Date(),
        requiresResponse: true,
        responseDeadline: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      };

      await this.sendMessage(message);
    }

    // Update agent statuses
    agents.forEach(agent => {
      agent.status = AgentStatus.COLLABORATING;
    });
  }

  /**
   * Send message between agents
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    
    // Store in conversation history
    const conversationKey = message.conversationId || `${message.from}_${message.to}`;
    if (!this.messageHistory.has(conversationKey)) {
      this.messageHistory.set(conversationKey, []);
    }
    this.messageHistory.get(conversationKey)!.push(message);

    // Emit event for real-time processing
    this.emit('message', message);

    logger.debug('Message queued for delivery', {
      messageId: message.id,
      from: message.from,
      to: message.to,
      type: message.type
    });
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      try {
        await this.deliverMessage(message);
      } catch (error) {
        logger.error('Message delivery failed', {
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Deliver message to target agent
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    if (message.to === 'broadcast') {
      // Broadcast to all active agents
      for (const agent of this.agents.values()) {
        if (agent.status !== AgentStatus.OFFLINE) {
          await this.processAgentMessage(agent, message);
        }
      }
    } else {
      // Direct message to specific agent
      const targetAgent = this.agents.get(message.to);
      if (targetAgent) {
        await this.processAgentMessage(targetAgent, message);
      }
    }
  }

  /**
   * Process message for specific agent
   */
  private async processAgentMessage(agent: AIAgent, message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        await this.handleTaskRequest(agent, message);
        break;
      
      case MessageType.COLLABORATION_INVITE:
        await this.handleCollaborationInvite(agent, message);
        break;
      
      case MessageType.KNOWLEDGE_SHARE:
        await this.handleKnowledgeShare(agent, message);
        break;
      
      case MessageType.STATUS_UPDATE:
        await this.handleStatusUpdate(agent, message);
        break;
      
      default:
        logger.debug('Unhandled message type', {
          agentId: agent.id,
          messageType: message.type
        });
    }
  }

  /**
   * Handle task request message
   */
  private async handleTaskRequest(agent: AIAgent, message: AgentMessage): Promise<void> {
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.content.taskType,
      description: message.content.description,
      priority: message.content.priority || 'medium',
      status: 'pending',
      assignedBy: message.from,
      collaborators: [],
      startedAt: new Date(),
      deadline: message.content.deadline ? new Date(message.content.deadline) : undefined,
      dependencies: message.content.dependencies || []
    };

    agent.currentTasks.push(task);

    // Send response
    await this.sendMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: agent.id,
      to: message.from,
      type: MessageType.TASK_RESPONSE,
      content: {
        taskId: task.id,
        accepted: true,
        estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      },
      priority: message.priority,
      timestamp: new Date(),
      requiresResponse: false,
      conversationId: message.conversationId
    });
  }

  /**
   * Handle collaboration invitation
   */
  private async handleCollaborationInvite(agent: AIAgent, message: AgentMessage): Promise<void> {
    const sessionId = message.content.sessionId;
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      // Agent accepts collaboration
      agent.status = AgentStatus.COLLABORATING;
      
      // Send acceptance response
      await this.sendMessage({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: agent.id,
        to: message.from,
        type: MessageType.TASK_RESPONSE,
        content: {
          sessionId,
          accepted: true,
          capabilities: agent.capabilities,
          availability: 'immediate'
        },
        priority: 'high',
        timestamp: new Date(),
        requiresResponse: false,
        conversationId: message.conversationId
      });
    }
  }

  /**
   * Handle knowledge sharing
   */
  private async handleKnowledgeShare(agent: AIAgent, message: AgentMessage): Promise<void> {
    // Process shared knowledge and update agent's knowledge base
    logger.info('Knowledge shared between agents', {
      fromAgent: message.from,
      toAgent: agent.id,
      knowledgeType: message.content.type
    });
  }

  /**
   * Handle status updates
   */
  private async handleStatusUpdate(agent: AIAgent, message: AgentMessage): Promise<void> {
    const update = message.content;
    
    if (update.status) {
      agent.status = update.status;
    }
    
    if (update.performance) {
      Object.assign(agent.performance, update.performance);
    }

    agent.lastHeartbeat = new Date();
  }

  /**
   * Monitor agent health and connectivity
   */
  private monitorAgentHealth(): void {
    const now = new Date();
    const healthThreshold = 60000; // 1 minute

    for (const agent of this.agents.values()) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > healthThreshold && agent.status !== AgentStatus.OFFLINE) {
        logger.warn('Agent appears to be offline', {
          agentId: agent.id,
          agentName: agent.name,
          timeSinceHeartbeat
        });
        
        agent.status = AgentStatus.OFFLINE;
        this.emit('agentOffline', agent);
      }
    }
  }

  /**
   * Manage active collaboration sessions
   */
  private manageCollaborationSessions(): void {
    for (const session of this.activeSessions.values()) {
      if (session.status === 'active') {
        // Check if session should be completed
        const allTasksCompleted = session.tasks.every(task => 
          task.status === 'completed' || task.status === 'failed'
        );
        
        if (allTasksCompleted) {
          session.status = 'completed';
          session.completedAt = new Date();
          
          // Notify participants
          this.notifySessionCompletion(session);
        }
      }
    }
  }

  /**
   * Notify agents of session completion
   */
  private async notifySessionCompletion(session: CollaborationSession): Promise<void> {
    for (const participantId of session.participants) {
      const agent = this.agents.get(participantId);
      if (agent) {
        agent.status = AgentStatus.ACTIVE;
        
        await this.sendMessage({
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: 'coordinator',
          to: participantId,
          type: MessageType.STATUS_UPDATE,
          content: {
            sessionId: session.id,
            status: 'completed',
            results: session.results
          },
          priority: 'medium',
          timestamp: new Date(),
          requiresResponse: false
        });
      }
    }
  }

  /**
   * Optimize agent performance based on collaboration history
   */
  private optimizeAgentPerformance(): void {
    for (const agent of this.agents.values()) {
      // Update collaboration score based on recent performance
      const recentTasks = agent.currentTasks.filter(task => 
        task.startedAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      
      if (recentTasks.length > 0) {
        const successRate = recentTasks.filter(task => task.status === 'completed').length / recentTasks.length;
        agent.performance.collaborationScore = (agent.performance.collaborationScore * 0.8) + (successRate * 0.2);
        agent.performance.tasksCompleted += recentTasks.filter(task => task.status === 'completed').length;
        agent.performance.lastUpdate = new Date();
      }
    }
  }

  /**
   * Public API methods
   */
  async requestAgentCollaboration(params: {
    requiredCapabilities: string[];
    objective: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    requesterId: string;
  }): Promise<CollaborationSession> {
    return this.createCollaborativeTask({
      objective: params.objective,
      requiredCapabilities: params.requiredCapabilities,
      priority: params.priority,
      collaborationType: 'consensus'
    });
  }

  async getAgentStatus(agentId?: string): Promise<AIAgent | AIAgent[]> {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (!agent) throw new Error(`Agent not found: ${agentId}`);
      return agent;
    }
    
    return Array.from(this.agents.values());
  }

  async getActiveCollaborations(): Promise<CollaborationSession[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.status === 'active' || session.status === 'planning');
  }

  async getAgentPerformance(): Promise<Record<string, AgentPerformance>> {
    const performance: Record<string, AgentPerformance> = {};
    
    for (const [id, agent] of this.agents.entries()) {
      performance[agent.name] = agent.performance;
    }
    
    return performance;
  }

  async delegateTaskToAgents(params: {
    task: string;
    requiredCapabilities: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline?: Date;
  }): Promise<string> {
    const session = await this.createCollaborativeTask({
      objective: params.task,
      requiredCapabilities: params.requiredCapabilities,
      priority: params.priority,
      deadline: params.deadline,
      collaborationType: 'delegation'
    });

    return session.id;
  }
}

// Export singleton instance
export const multiAgentCoordinator = new MultiAgentCoordinator();

// Convenience functions
export async function createAgentCollaboration(params: {
  objective: string;
  capabilities: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}): Promise<CollaborationSession> {
  return multiAgentCoordinator.requestAgentCollaboration({
    requiredCapabilities: params.capabilities,
    objective: params.objective,
    priority: params.priority || 'medium',
    requesterId: 'system'
  });
}

export async function getMultiAgentStatus(): Promise<{
  agents: AIAgent[];
  activeCollaborations: CollaborationSession[];
  performance: Record<string, AgentPerformance>;
}> {
  const [agents, collaborations, performance] = await Promise.all([
    multiAgentCoordinator.getAgentStatus() as Promise<AIAgent[]>,
    multiAgentCoordinator.getActiveCollaborations(),
    multiAgentCoordinator.getAgentPerformance()
  ]);

  return { agents, activeCollaborations: collaborations, performance };
}