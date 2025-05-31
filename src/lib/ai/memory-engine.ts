/**
 * Supreme-AI Memory Engine
 * ========================
 * Long-term memory and context management for ChatGPT-like continuity
 * 
 * Features:
 * 🧠 Conversation memory
 * 👤 Customer interaction history  
 * 📊 Campaign outcome tracking
 * 🎯 Contextual recommendations
 * 🔄 Memory consolidation
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '@/lib/logger';

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'campaign' | 'customer' | 'insight';
  timestamp: Date;
  userId: string;
  content: string;
  metadata: Record<string, any>;
  importance: number; // 0-1 scale
  tags: string[];
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  summary: string;
  lastActive: Date;
}

export interface CustomerMemory {
  customerId: string;
  interactions: Array<{
    type: 'email' | 'sms' | 'whatsapp' | 'campaign' | 'support';
    content: string;
    timestamp: Date;
    outcome?: string;
    sentiment?: number;
  }>;
  preferences: Record<string, any>;
  lastUpdate: Date;
}

export class MemoryEngine {
  private memories: MemoryEntry[] = [];
  private conversations: Map<string, ConversationContext> = new Map();
  private customerMemories: Map<string, CustomerMemory> = new Map();
  private memoryPath: string;

  constructor() {
    this.memoryPath = join(process.cwd(), '.supreme', 'memory');
  }

  // Initialize memory system
  async initialize() {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      await this.loadMemories();
      await this.loadConversations();
      await this.loadCustomerMemories();
    } catch (error) {
      logger.error('Memory engine initialization failed', error);
    }
  }

  // Store new memory entry
  async storeMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory: MemoryEntry = {
      ...entry,
      id,
      timestamp: new Date()
    };

    this.memories.push(memory);
    await this.saveMemories();

    logger.info('Memory stored', { id, type: entry.type, importance: entry.importance });
    return id;
  }

  // Retrieve relevant memories for context
  async getRelevantMemories(query: string, userId: string, limit = 5): Promise<MemoryEntry[]> {
    const userMemories = this.memories.filter(m => m.userId === userId);
    
    // Simple relevance scoring based on keyword matching and importance
    const scored = userMemories.map(memory => {
      const contentWords = memory.content.toLowerCase().split(/\s+/);
      const queryWords = query.toLowerCase().split(/\s+/);
      
      let relevanceScore = 0;
      queryWords.forEach(qWord => {
        if (contentWords.some(cWord => cWord.includes(qWord) || qWord.includes(cWord))) {
          relevanceScore += 1;
        }
      });
      
      // Factor in importance and recency
      const recencyFactor = Math.max(0, 1 - (Date.now() - memory.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000)); // 1 week decay
      const finalScore = relevanceScore * memory.importance * (0.7 + 0.3 * recencyFactor);
      
      return { memory, score: finalScore };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
  }

  // Conversation management
  async startConversation(sessionId: string, userId: string): Promise<ConversationContext> {
    const context: ConversationContext = {
      sessionId,
      userId,
      messages: [],
      summary: '',
      lastActive: new Date()
    };

    this.conversations.set(sessionId, context);
    return context;
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error(`Conversation ${sessionId} not found`);
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
      metadata
    });

    conversation.lastActive = new Date();

    // Auto-summarize if conversation gets long
    if (conversation.messages.length > 20) {
      await this.summarizeConversation(sessionId);
    }

    await this.saveConversations();
  }

  async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    return this.conversations.get(sessionId) || null;
  }

  // Summarize long conversations to maintain context efficiency
  private async summarizeConversation(sessionId: string) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return;

    const recentMessages = conversation.messages.slice(-10);
    const olderMessages = conversation.messages.slice(0, -10);

    // Simple summarization - extract key topics and outcomes
    const topics = new Set<string>();
    const outcomes = new Set<string>();

    olderMessages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !['said', 'told', 'asked', 'replied'].includes(word)) {
          topics.add(word);
        }
      });

      if (msg.metadata?.outcome) {
        outcomes.add(msg.metadata.outcome);
      }
    });

    const summary = `Previous discussion covered: ${Array.from(topics).slice(0, 5).join(', ')}. Outcomes: ${Array.from(outcomes).join(', ')}.`;
    
    conversation.summary = summary;
    conversation.messages = recentMessages;

    // Store the summarized portion as a memory
    await this.storeMemory({
      type: 'conversation',
      userId: conversation.userId,
      content: `Conversation summary: ${summary}`,
      metadata: { sessionId, messageCount: olderMessages.length },
      importance: 0.6,
      tags: ['conversation', 'summary']
    });
  }

  // Customer memory management
  async updateCustomerMemory(customerId: string, interaction: CustomerMemory['interactions'][0]) {
    let memory = this.customerMemories.get(customerId);
    
    if (!memory) {
      memory = {
        customerId,
        interactions: [],
        preferences: {},
        lastUpdate: new Date()
      };
      this.customerMemories.set(customerId, memory);
    }

    memory.interactions.push(interaction);
    memory.lastUpdate = new Date();

    // Keep only last 50 interactions per customer
    if (memory.interactions.length > 50) {
      memory.interactions = memory.interactions.slice(-50);
    }

    await this.saveCustomerMemories();

    // Create a memory entry for important interactions
    if (interaction.outcome === 'converted' || interaction.sentiment && Math.abs(interaction.sentiment) > 0.7) {
      await this.storeMemory({
        type: 'customer',
        userId: customerId,
        content: `Customer interaction: ${interaction.type} - ${interaction.content}`,
        metadata: { 
          customerId, 
          outcome: interaction.outcome, 
          sentiment: interaction.sentiment 
        },
        importance: interaction.outcome === 'converted' ? 0.9 : 0.7,
        tags: ['customer', interaction.type, interaction.outcome || 'interaction']
      });
    }
  }

  async getCustomerMemory(customerId: string): Promise<CustomerMemory | null> {
    return this.customerMemories.get(customerId) || null;
  }

  // Context-aware response generation
  async getContextForResponse(userId: string, query: string): Promise<{
    relevantMemories: MemoryEntry[];
    conversationHistory: ConversationContext | null;
    customerInsights: CustomerMemory | null;
    contextSummary: string;
  }> {
    const [relevantMemories, conversationHistory, customerInsights] = await Promise.all([
      this.getRelevantMemories(query, userId, 3),
      this.getConversationContext(userId), // Using userId as sessionId for simplicity
      this.getCustomerMemory(userId)
    ]);

    // Build context summary
    const memoryContext = relevantMemories.map(m => m.content).join(' ');
    const conversationContext = conversationHistory?.summary || '';
    const customerContext = customerInsights?.interactions.slice(-3).map(i => `${i.type}: ${i.content}`).join(' ') || '';

    const contextSummary = `Recent context: ${conversationContext} Related memories: ${memoryContext} Customer history: ${customerContext}`.slice(0, 500);

    return {
      relevantMemories,
      conversationHistory,
      customerInsights,
      contextSummary
    };
  }

  // Memory consolidation - run periodically to optimize memory storage
  async consolidateMemories() {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    let removedCount = 0;
    let consolidatedCount = 0;

    // Remove low-importance old memories
    this.memories = this.memories.filter(memory => {
      const age = now - memory.timestamp.getTime();
      if (age > oneMonth && memory.importance < 0.3) {
        removedCount++;
        return false;
      }
      if (age > oneWeek && memory.importance < 0.1) {
        removedCount++;
        return false;
      }
      return true;
    });

    // Consolidate similar memories
    const consolidatedMemories: MemoryEntry[] = [];
    const processedIds = new Set<string>();

    this.memories.forEach(memory => {
      if (processedIds.has(memory.id)) return;

      const similar = this.memories.filter(m => 
        m.id !== memory.id && 
        !processedIds.has(m.id) &&
        m.type === memory.type &&
        m.userId === memory.userId &&
        this.calculateSimilarity(memory.content, m.content) > 0.8
      );

      if (similar.length > 0) {
        // Consolidate similar memories
        const allMemories = [memory, ...similar];
        const consolidatedContent = allMemories.map(m => m.content).join(' ');
        const avgImportance = allMemories.reduce((sum, m) => sum + m.importance, 0) / allMemories.length;
        const allTags = [...new Set(allMemories.flatMap(m => m.tags))];

        consolidatedMemories.push({
          ...memory,
          content: consolidatedContent.slice(0, 500), // Truncate if too long
          importance: Math.min(0.9, avgImportance * 1.1), // Slight boost for consolidated
          tags: allTags,
          metadata: { ...memory.metadata, consolidatedFrom: allMemories.length }
        });

        allMemories.forEach(m => processedIds.add(m.id));
        consolidatedCount++;
      } else {
        consolidatedMemories.push(memory);
        processedIds.add(memory.id);
      }
    });

    this.memories = consolidatedMemories;
    await this.saveMemories();

    logger.info('Memory consolidation complete', {
      removedCount,
      consolidatedCount,
      totalMemories: this.memories.length
    });
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  // Persistence methods
  private async saveMemories() {
    try {
      await fs.writeFile(
        join(this.memoryPath, 'memories.json'),
        JSON.stringify(this.memories, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save memories', error);
    }
  }

  private async loadMemories() {
    try {
      const data = await fs.readFile(join(this.memoryPath, 'memories.json'), 'utf8');
      this.memories = JSON.parse(data).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch {
      this.memories = [];
    }
  }

  private async saveConversations() {
    try {
      const data = Object.fromEntries(
        Array.from(this.conversations.entries()).map(([k, v]) => [k, v])
      );
      await fs.writeFile(
        join(this.memoryPath, 'conversations.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save conversations', error);
    }
  }

  private async loadConversations() {
    try {
      const data = await fs.readFile(join(this.memoryPath, 'conversations.json'), 'utf8');
      const parsed = JSON.parse(data);
      this.conversations = new Map(
        Object.entries(parsed).map(([k, v]: [string, any]) => [
          k,
          {
            ...v,
            lastActive: new Date(v.lastActive),
            messages: v.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }
        ])
      );
    } catch {
      this.conversations = new Map();
    }
  }

  private async saveCustomerMemories() {
    try {
      const data = Object.fromEntries(this.customerMemories.entries());
      await fs.writeFile(
        join(this.memoryPath, 'customers.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save customer memories', error);
    }
  }

  private async loadCustomerMemories() {
    try {
      const data = await fs.readFile(join(this.memoryPath, 'customers.json'), 'utf8');
      const parsed = JSON.parse(data);
      this.customerMemories = new Map(
        Object.entries(parsed).map(([k, v]: [string, any]) => [
          k,
          {
            ...v,
            lastUpdate: new Date(v.lastUpdate),
            interactions: v.interactions.map((i: any) => ({
              ...i,
              timestamp: new Date(i.timestamp)
            }))
          }
        ])
      );
    } catch {
      this.customerMemories = new Map();
    }
  }
}

// Export singleton memory engine
export const supremeMemory = new MemoryEngine(); 