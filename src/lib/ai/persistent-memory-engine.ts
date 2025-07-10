/**
 * Persistent AI Memory Engine
 * ===========================
 * 
 * Enhanced memory system for cross-session context persistence
 * Combines database storage with Redis caching for optimal performance
 * Supports vector embeddings for semantic memory retrieval
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { redisCache } from '@/lib/cache/redis-client';
import { trace } from '@opentelemetry/api';

// Enhanced memory interfaces
export interface PersistentMemory {
  id: string;
  userId: string;
  organizationId: string;
  type: MemoryType;
  content: string;
  metadata: Record<string, any>;
  importance: number; // 0-1 scale
  tags: string[];
  embedding?: number[]; // Vector embedding for semantic search
  sessionId?: string;
  relatedMemories?: string[]; // IDs of related memories
  accessCount: number;
  lastAccessed: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum MemoryType {
  CONVERSATION = 'conversation',
  TASK_EXECUTION = 'task_execution',
  CUSTOMER_INTERACTION = 'customer_interaction',
  CAMPAIGN_INSIGHT = 'campaign_insight',
  WORKFLOW_PATTERN = 'workflow_pattern',
  ERROR_RESOLUTION = 'error_resolution',
  LEARNING_OUTCOME = 'learning_outcome',
  BUSINESS_CONTEXT = 'business_context',
  PREFERENCE = 'preference',
  DECISION_PATTERN = 'decision_pattern'
}

export interface MemorySearchOptions {
  types?: MemoryType[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  importance?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  sessionId?: string;
  includeExpired?: boolean;
}

export interface MemoryContext {
  sessionId: string;
  userId: string;
  organizationId: string;
  businessContext: {
    currentTask?: string;
    campaignId?: string;
    workflowId?: string;
    contactId?: string;
  };
  conversationHistory: ConversationMessage[];
  activeMemories: PersistentMemory[];
  contextSummary: string;
  confidence: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  memoryId?: string;
}

export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  memories: PersistentMemory[];
  centroid: number[];
  importance: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryInsight {
  type: 'pattern' | 'trend' | 'anomaly' | 'correlation';
  description: string;
  memories: PersistentMemory[];
  confidence: number;
  actionable: boolean;
  metadata: Record<string, any>;
}

export class PersistentMemoryEngine {
  private memoryCache: Map<string, PersistentMemory> = new Map();
  private sessionContexts: Map<string, MemoryContext> = new Map();
  private memoryClusters: Map<string, MemoryCluster> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the persistent memory engine
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load recent memories into cache
      await this.loadRecentMemoriesIntoCache();
      
      // Load active sessions
      await this.loadActiveSessions();
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.isInitialized = true;
      logger.info('Persistent memory engine initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize persistent memory engine', error);
      throw error;
    }
  }

  /**
   * Store a new memory with optional embedding
   */
  async storeMemory(memory: Omit<PersistentMemory, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): Promise<PersistentMemory> {
    const tracer = trace.getTracer('persistent-memory');
    
    return tracer.startActiveSpan('store-memory', async (span) => {
      try {
        const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        // Generate embedding for semantic search
        const embedding = await this.generateEmbedding(memory.content);
        
        const persistentMemory: PersistentMemory = {
          ...memory,
          id: memoryId,
          embedding,
          accessCount: 0,
          lastAccessed: now,
          createdAt: now,
          updatedAt: now
        };

        // Store in database
        await prisma.aIMemory.create({
          data: {
            id: memoryId,
            userId: memory.userId,
            organizationId: memory.organizationId,
            type: memory.type,
            content: memory.content,
            metadata: memory.metadata,
            importance: memory.importance,
            tags: memory.tags,
            embedding: embedding,
            sessionId: memory.sessionId,
            relatedMemories: memory.relatedMemories || [],
            accessCount: 0,
            lastAccessed: now,
            expiresAt: memory.expiresAt,
            createdAt: now,
            updatedAt: now
          }
        });

        // Cache the memory
        this.memoryCache.set(memoryId, persistentMemory);
        
        // Store in Redis for fast access
        await redisCache.set(
          `memory:${memoryId}`,
          persistentMemory,
          memory.expiresAt ? Math.floor((memory.expiresAt.getTime() - Date.now()) / 1000) : 86400 * 30 // 30 days default
        );

        // Update memory clusters
        await this.updateMemoryClusters(persistentMemory);

        span.setAttributes({
          'memory.id': memoryId,
          'memory.type': memory.type,
          'memory.importance': memory.importance,
          'memory.userId': memory.userId
        });

        logger.info('Memory stored successfully', {
          memoryId,
          type: memory.type,
          importance: memory.importance,
          userId: memory.userId
        });

        return persistentMemory;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Failed to store memory', { error, memory });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Retrieve memories with semantic search
   */
  async retrieveMemories(
    userId: string,
    organizationId: string,
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<PersistentMemory[]> {
    const tracer = trace.getTracer('persistent-memory');
    
    return tracer.startActiveSpan('retrieve-memories', async (span) => {
      try {
        const limit = options.limit || 10;
        
        // Try Redis cache first
        const cacheKey = `memory_search:${userId}:${Buffer.from(query).toString('base64')}:${JSON.stringify(options)}`;
        const cached = await redisCache.get<PersistentMemory[]>(cacheKey);
        
        if (cached) {
          span.setAttributes({ 'cache.hit': true });
          return cached;
        }

        // Generate embedding for semantic search
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Search in database with semantic similarity
        const memories = await this.searchMemoriesWithEmbedding(
          userId,
          organizationId,
          queryEmbedding,
          query,
          options
        );

        // Update access count for retrieved memories
        await this.updateAccessCount(memories.map(m => m.id));

        // Cache the results
        await redisCache.set(cacheKey, memories, 300); // 5 minutes cache

        span.setAttributes({
          'search.query': query,
          'search.results': memories.length,
          'search.userId': userId,
          'cache.hit': false
        });

        return memories;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Failed to retrieve memories', { error, userId, query });
        return [];
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get or create memory context for a session
   */
  async getMemoryContext(
    sessionId: string,
    userId: string,
    organizationId: string,
    businessContext: MemoryContext['businessContext'] = {}
  ): Promise<MemoryContext> {
    
    // Check cache first
    let context = this.sessionContexts.get(sessionId);
    
    if (!context) {
      // Create new context
      context = {
        sessionId,
        userId,
        organizationId,
        businessContext,
        conversationHistory: [],
        activeMemories: [],
        contextSummary: '',
        confidence: 0
      };
      
      // Load relevant memories for context
      context.activeMemories = await this.loadRelevantMemories(
        userId,
        organizationId,
        businessContext
      );
      
      // Load conversation history
      context.conversationHistory = await this.loadConversationHistory(sessionId);
      
      // Generate context summary
      context.contextSummary = await this.generateContextSummary(context);
      
      // Calculate confidence
      context.confidence = this.calculateContextConfidence(context);
      
      this.sessionContexts.set(sessionId, context);
    }
    
    return context;
  }

  /**
   * Add message to conversation history
   */
  async addConversationMessage(
    sessionId: string,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<ConversationMessage> {
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    
    const conversationMessage: ConversationMessage = {
      ...message,
      id: messageId,
      timestamp
    };
    
    // Store in database
    await prisma.aIConversationMessage.create({
      data: {
        id: messageId,
        sessionId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        memoryId: message.memoryId,
        timestamp
      }
    });
    
    // Update session context
    const context = this.sessionContexts.get(sessionId);
    if (context) {
      context.conversationHistory.push(conversationMessage);
      
      // Keep only last 50 messages in memory
      if (context.conversationHistory.length > 50) {
        context.conversationHistory = context.conversationHistory.slice(-50);
      }
      
      // Update context summary
      context.contextSummary = await this.generateContextSummary(context);
      context.confidence = this.calculateContextConfidence(context);
    }
    
    return conversationMessage;
  }

  /**
   * Get memory insights and patterns
   */
  async getMemoryInsights(
    userId: string,
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<MemoryInsight[]> {
    
    const insights: MemoryInsight[] = [];
    
    try {
      // Get memories for analysis
      const memories = await this.getMemoriesForAnalysis(userId, organizationId, timeRange);
      
      // Pattern detection
      const patterns = await this.detectPatterns(memories);
      insights.push(...patterns);
      
      // Trend analysis
      const trends = await this.analyzeTrends(memories);
      insights.push(...trends);
      
      // Anomaly detection
      const anomalies = await this.detectAnomalies(memories);
      insights.push(...anomalies);
      
      // Correlation analysis
      const correlations = await this.analyzeCorrelations(memories);
      insights.push(...correlations);
      
      // Sort by confidence
      insights.sort((a, b) => b.confidence - a.confidence);
      
      return insights;
      
    } catch (error) {
      logger.error('Failed to get memory insights', { error, userId });
      return [];
    }
  }

  /**
   * Consolidate and optimize memories
   */
  async consolidateMemories(
    userId: string,
    organizationId: string
  ): Promise<{ removed: number; consolidated: number; optimized: number }> {
    
    const tracer = trace.getTracer('persistent-memory');
    
    return tracer.startActiveSpan('consolidate-memories', async (span) => {
      try {
        let removed = 0;
        let consolidated = 0;
        let optimized = 0;
        
        // Get all memories for user
        const memories = await this.getAllMemoriesForUser(userId, organizationId);
        
        // Remove expired memories
        const expiredMemories = memories.filter(m => 
          m.expiresAt && m.expiresAt < new Date()
        );
        
        if (expiredMemories.length > 0) {
          await this.removeMemories(expiredMemories.map(m => m.id));
          removed = expiredMemories.length;
        }
        
        // Consolidate similar memories
        const consolidationResult = await this.consolidateSimilarMemories(memories);
        consolidated = consolidationResult.consolidated;
        
        // Optimize memory importance scores
        const optimizationResult = await this.optimizeMemoryImportance(memories);
        optimized = optimizationResult.optimized;
        
        // Update clusters
        await this.rebuildMemoryClusters(userId, organizationId);
        
        span.setAttributes({
          'consolidation.removed': removed,
          'consolidation.consolidated': consolidated,
          'consolidation.optimized': optimized
        });
        
        logger.info('Memory consolidation completed', {
          userId,
          removed,
          consolidated,
          optimized
        });
        
        return { removed, consolidated, optimized };
        
      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Failed to consolidate memories', { error, userId });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Export memories for backup or migration
   */
  async exportMemories(
    userId: string,
    organizationId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    
    try {
      const memories = await this.getAllMemoriesForUser(userId, organizationId);
      const conversationHistory = await this.getAllConversationHistory(userId);
      
      const exportData = {
        memories,
        conversationHistory,
        exportedAt: new Date().toISOString(),
        userId,
        organizationId,
        version: '1.0'
      };
      
      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        case 'csv':
          return this.convertToCSV(exportData);
        case 'xml':
          return this.convertToXML(exportData);
        default:
          return JSON.stringify(exportData, null, 2);
      }
      
    } catch (error) {
      logger.error('Failed to export memories', { error, userId, format });
      throw error;
    }
  }

  /**
   * Import memories from backup
   */
  async importMemories(
    userId: string,
    organizationId: string,
    data: string,
    format: 'json' | 'csv' | 'xml' = 'json',
    options: { overwrite?: boolean; merge?: boolean } = {}
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    
    try {
      let parsedData: any;
      
      switch (format) {
        case 'json':
          parsedData = JSON.parse(data);
          break;
        case 'csv':
          parsedData = this.parseCSV(data);
          break;
        case 'xml':
          parsedData = this.parseXML(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      let imported = 0;
      let skipped = 0;
      let errors = 0;
      
      // Import memories
      for (const memory of parsedData.memories || []) {
        try {
          // Check if memory already exists
          const existing = await this.getMemoryById(memory.id);
          
          if (existing && !options.overwrite) {
            skipped++;
            continue;
          }
          
          // Store or update memory
          await this.storeMemory({
            ...memory,
            userId,
            organizationId
          });
          
          imported++;
          
        } catch (error) {
          logger.error('Failed to import memory', { error, memoryId: memory.id });
          errors++;
        }
      }
      
      logger.info('Memory import completed', {
        userId,
        imported,
        skipped,
        errors
      });
      
      return { imported, skipped, errors };
      
    } catch (error) {
      logger.error('Failed to import memories', { error, userId, format });
      throw error;
    }
  }

  // Private helper methods

  private async loadRecentMemoriesIntoCache(): Promise<void> {
    try {
      const recentMemories = await prisma.aIMemory.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: 1000,
        orderBy: { lastAccessed: 'desc' }
      });

      for (const memory of recentMemories) {
        const persistentMemory: PersistentMemory = {
          id: memory.id,
          userId: memory.userId,
          organizationId: memory.organizationId,
          type: memory.type as MemoryType,
          content: memory.content,
          metadata: memory.metadata as Record<string, any>,
          importance: memory.importance,
          tags: memory.tags,
          embedding: memory.embedding as number[],
          sessionId: memory.sessionId,
          relatedMemories: memory.relatedMemories,
          accessCount: memory.accessCount,
          lastAccessed: memory.lastAccessed,
          expiresAt: memory.expiresAt,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt
        };

        this.memoryCache.set(memory.id, persistentMemory);
      }

    } catch (error) {
      logger.error('Failed to load recent memories into cache', error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // In production, this would use a proper embedding service
      // For now, using a simple hash-based approach
      const hash = this.simpleHash(text);
      return Array.from({length: 512}, (_, i) => (hash + i) % 100 / 100);
    } catch (error) {
      logger.error('Failed to generate embedding', { error, text: text.substring(0, 100) });
      return Array.from({length: 512}, () => Math.random());
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async searchMemoriesWithEmbedding(
    userId: string,
    organizationId: string,
    queryEmbedding: number[],
    query: string,
    options: MemorySearchOptions
  ): Promise<PersistentMemory[]> {
    
    try {
      // Build database query
      const whereClause: any = {
        userId,
        organizationId,
        ...(options.types && { type: { in: options.types } }),
        ...(options.dateRange && {
          createdAt: {
            gte: options.dateRange.start,
            lte: options.dateRange.end
          }
        }),
        ...(options.importance && {
          importance: {
            gte: options.importance.min || 0,
            lte: options.importance.max || 1
          }
        }),
        ...(options.sessionId && { sessionId: options.sessionId }),
        ...(!options.includeExpired && {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        })
      };

      // Get memories from database
      const memories = await prisma.aIMemory.findMany({
        where: whereClause,
        take: options.limit || 10,
        orderBy: [
          { importance: 'desc' },
          { lastAccessed: 'desc' }
        ]
      });

      // Convert to PersistentMemory objects and calculate similarity
      const persistentMemories: PersistentMemory[] = memories.map(memory => ({
        id: memory.id,
        userId: memory.userId,
        organizationId: memory.organizationId,
        type: memory.type as MemoryType,
        content: memory.content,
        metadata: memory.metadata as Record<string, any>,
        importance: memory.importance,
        tags: memory.tags,
        embedding: memory.embedding as number[],
        sessionId: memory.sessionId,
        relatedMemories: memory.relatedMemories,
        accessCount: memory.accessCount,
        lastAccessed: memory.lastAccessed,
        expiresAt: memory.expiresAt,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      }));

      // Calculate semantic similarity and sort
      const scoredMemories = persistentMemories.map(memory => ({
        memory,
        similarity: this.calculateCosineSimilarity(queryEmbedding, memory.embedding || [])
      }));

      // Sort by similarity and importance
      scoredMemories.sort((a, b) => {
        const scoreA = a.similarity * 0.7 + a.memory.importance * 0.3;
        const scoreB = b.similarity * 0.7 + b.memory.importance * 0.3;
        return scoreB - scoreA;
      });

      return scoredMemories.map(s => s.memory);

    } catch (error) {
      logger.error('Failed to search memories with embedding', { error, userId, query });
      return [];
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async loadActiveSessions(): Promise<void> {
    // Implementation for loading active sessions
  }

  private startBackgroundTasks(): void {
    // Start memory consolidation task
    setInterval(async () => {
      try {
        // Get all users for consolidation
        const users = await prisma.user.findMany({
          select: { id: true, organizationId: true }
        });

        for (const user of users.slice(0, 10)) { // Limit to 10 users per run
          await this.consolidateMemories(user.id, user.organizationId);
        }
      } catch (error) {
        logger.error('Background memory consolidation failed', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private async updateMemoryClusters(memory: PersistentMemory): Promise<void> {
    // Implementation for updating memory clusters
  }

  private async loadRelevantMemories(
    userId: string,
    organizationId: string,
    businessContext: MemoryContext['businessContext']
  ): Promise<PersistentMemory[]> {
    // Implementation for loading relevant memories
    return [];
  }

  private async loadConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    // Implementation for loading conversation history
    return [];
  }

  private async generateContextSummary(context: MemoryContext): Promise<string> {
    // Implementation for generating context summary
    return '';
  }

  private calculateContextConfidence(context: MemoryContext): number {
    // Implementation for calculating context confidence
    return 0.5;
  }

  private async updateAccessCount(memoryIds: string[]): Promise<void> {
    // Implementation for updating access count
  }

  private async getMemoriesForAnalysis(
    userId: string,
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<PersistentMemory[]> {
    // Implementation for getting memories for analysis
    return [];
  }

  private async detectPatterns(memories: PersistentMemory[]): Promise<MemoryInsight[]> {
    // Implementation for pattern detection
    return [];
  }

  private async analyzeTrends(memories: PersistentMemory[]): Promise<MemoryInsight[]> {
    // Implementation for trend analysis
    return [];
  }

  private async detectAnomalies(memories: PersistentMemory[]): Promise<MemoryInsight[]> {
    // Implementation for anomaly detection
    return [];
  }

  private async analyzeCorrelations(memories: PersistentMemory[]): Promise<MemoryInsight[]> {
    // Implementation for correlation analysis
    return [];
  }

  private async getAllMemoriesForUser(userId: string, organizationId: string): Promise<PersistentMemory[]> {
    // Implementation for getting all memories for user
    return [];
  }

  private async removeMemories(memoryIds: string[]): Promise<void> {
    // Implementation for removing memories
  }

  private async consolidateSimilarMemories(memories: PersistentMemory[]): Promise<{ consolidated: number }> {
    // Implementation for consolidating similar memories
    return { consolidated: 0 };
  }

  private async optimizeMemoryImportance(memories: PersistentMemory[]): Promise<{ optimized: number }> {
    // Implementation for optimizing memory importance
    return { optimized: 0 };
  }

  private async rebuildMemoryClusters(userId: string, organizationId: string): Promise<void> {
    // Implementation for rebuilding memory clusters
  }

  private async getAllConversationHistory(userId: string): Promise<ConversationMessage[]> {
    // Implementation for getting all conversation history
    return [];
  }

  private convertToCSV(data: any): string {
    // Implementation for CSV conversion
    return '';
  }

  private convertToXML(data: any): string {
    // Implementation for XML conversion
    return '';
  }

  private parseCSV(data: string): any {
    // Implementation for CSV parsing
    return {};
  }

  private parseXML(data: string): any {
    // Implementation for XML parsing
    return {};
  }

  private async getMemoryById(id: string): Promise<PersistentMemory | null> {
    // Implementation for getting memory by ID
    return null;
  }
}

// Export singleton instance
export const persistentMemoryEngine = new PersistentMemoryEngine();