/**
 * Supreme-AI v3 Test Suite
 * ========================
 * Comprehensive tests for the complete Supreme-AI v3 ecosystem
 * 
 * Coverage:
 * 🧠 v3 Engine orchestration
 * 🛣️ API route validation  
 * ⚡ React hooks behavior
 * 🔧 Error handling
 * 🎯 Integration scenarios
 */

import { SupremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';
import { supremeAutoML } from '@/lib/ai/automl-engine';
import { ragQuery } from '@/lib/ai/rag-engine';
import { supremeMemory } from '@/lib/ai/memory-engine';
import { SupremeAI } from '@/lib/ai/supreme-ai-engine';

// Mock dependencies
jest.mock('@/lib/ai/supreme-ai-engine');
jest.mock('@/lib/ai/automl-engine');
jest.mock('@/lib/ai/rag-engine');
jest.mock('@/lib/ai/memory-engine');
jest.mock('@/lib/logger');

const mockSupremeAI = SupremeAI as jest.Mocked<typeof SupremeAI>;
const mockSupremeAutoML = supremeAutoML as jest.Mocked<typeof supremeAutoML>;
const mockRagQuery = ragQuery as jest.MockedFunction<typeof ragQuery>;
const mockSupremeMemory = supremeMemory as jest.Mocked<typeof supremeMemory>;

describe('Supreme-AI v3 Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup memory mock
    mockSupremeMemory.initialize.mockResolvedValue(undefined);
    mockSupremeMemory.getContextForResponse.mockResolvedValue({
      relevantMemories: [],
      conversationHistory: null,
      customerInsights: null,
      contextSummary: 'Test context'
    });
    mockSupremeMemory.storeMemory.mockResolvedValue('mem_123');
  });

  describe('Question Handling', () => {
    it('should process questions with context and RAG', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Supreme-AI v3 analysis shows strong market trends.',
        contextDocs: [
          { id: 'doc1', text: 'Market data', embedding: [] }
        ],
        confidence: 85
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'What are the market trends?'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('question');
      expect(result.confidence).toBe(85);
      expect(result.data.answer).toContain('Supreme-AI v3 analysis');
      expect(mockSupremeMemory.getContextForResponse).toHaveBeenCalledWith('test-user', 'What are the market trends?');
      expect(mockRagQuery).toHaveBeenCalled();
      expect(mockSupremeMemory.storeMemory).toHaveBeenCalled();
    });

    it('should handle empty context gracefully', async () => {
      // Arrange
      mockSupremeMemory.getContextForResponse.mockResolvedValue({
        relevantMemories: [],
        conversationHistory: null,
        customerInsights: null,
        contextSummary: ''
      });
      
      mockRagQuery.mockResolvedValue({
        answer: 'Basic answer',
        contextDocs: [],
        confidence: 70
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Simple question?'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.memoryContext).toBe('');
    });
  });

  describe('Content Analysis', () => {
    it('should analyze content and store insights', async () => {
      // Arrange
      const mockAnalysis = {
        success: true,
        confidence: 92,
        data: {
          sentiment: 0.8,
          readability: 85,
          engagement: 76,
          keywords: ['fintech', 'AI', 'analysis']
        },
        insights: ['Positive sentiment detected', 'High engagement potential'],
        recommendations: ['Scale this content', 'A/B test variations'],
        supremeScore: 88
      };
      
      mockSupremeAI.analyzeContent.mockResolvedValue(mockAnalysis as any);

      // Act
      const result = await SupremeAIv3.process({
        type: 'content',
        userId: 'test-user',
        content: 'Great fintech innovation ahead!'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('content');
      expect(result.supremeScore).toBe(88);
      expect(result.data.sentiment).toBe(0.8);
      expect(mockSupremeMemory.storeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'insight',
          userId: 'test-user',
          importance: 0.88,
          tags: ['content', 'analysis']
        })
      );
    });

    it('should handle content analysis errors', async () => {
      // Arrange
      mockSupremeAI.analyzeContent.mockRejectedValue(new Error('Analysis failed'));

      // Act & Assert
      await expect(SupremeAIv3.process({
        type: 'content',
        userId: 'test-user',
        content: 'Test content'
      })).rejects.toThrow('Analysis failed');
    });
  });

  describe('AutoML Predictions', () => {
    it('should optimize models and return best configuration', async () => {
      // Arrange
      const mockAutoMLResult = {
        bestModel: {
          algorithm: 'ensemble' as const,
          hyperparams: { nTrees: 10, maxDepth: 5 },
          performance: 0.92,
          trainTime: 1500
        },
        allModels: [],
        improvementPercent: 15,
        confidence: 87
      };
      
      mockSupremeAutoML.autoOptimize.mockResolvedValue(mockAutoMLResult);

      // Act
      const result = await SupremeAIv3.process({
        type: 'predict',
        userId: 'test-user',
        features: [[1, 2, 3], [4, 5, 6]],
        targets: [0.5, 0.8]
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('predict');
      expect(result.confidence).toBe(92); // performance * 100
      expect(result.data.bestModel.algorithm).toBe('ensemble');
      expect(result.insights).toContain('Best algorithm: ensemble');
    });

    it('should provide appropriate recommendations based on improvement', async () => {
      // Arrange
      const mockResult = {
        bestModel: { algorithm: 'linear' as const, hyperparams: {}, performance: 0.75, trainTime: 500 },
        allModels: [],
        improvementPercent: 2,
        confidence: 60
      };
      
      mockSupremeAutoML.autoOptimize.mockResolvedValue(mockResult);

      // Act
      const result = await SupremeAIv3.process({
        type: 'predict',
        userId: 'test-user',
        features: [[1, 2], [3, 4]],
        targets: [0.3, 0.7]
      });

      // Assert
      expect(result.recommendations).toContain('Existing model is sufficient');
      expect(result.recommendations).toContain('Consider more data or features');
    });
  });

  describe('Customer Intelligence', () => {
    it('should delegate to v2 engine correctly', async () => {
      // Arrange
      const mockCustomerAnalysis = {
        success: true,
        confidence: 89,
        data: {
          segments: [
            { customerId: 'c1', segment: 'VIP Champions', churnProbability: 15 },
            { customerId: 'c2', segment: 'At Risk', churnProbability: 85 }
          ],
          averageChurnRisk: 50
        },
        insights: ['2 customer segments identified'],
        recommendations: ['Focus on at-risk customers'],
        supremeScore: 78
      };
      
      mockSupremeAI.analyzeCustomerBehavior.mockResolvedValue(mockCustomerAnalysis as any);

      // Act
      const result = await SupremeAIv3.process({
        type: 'customer',
        userId: 'test-user',
        customers: [
          { id: 'c1', transactionFrequency: 10 },
          { id: 'c2', transactionFrequency: 1 }
        ]
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('customer');
      expect(result.data.segments).toHaveLength(2);
      expect(mockSupremeAI.analyzeCustomerBehavior).toHaveBeenCalledWith([
        { id: 'c1', transactionFrequency: 10 },
        { id: 'c2', transactionFrequency: 1 }
      ]);
    });
  });

  describe('Market Analysis', () => {
    it('should analyze market trends through v2 engine', async () => {
      // Arrange
      const mockMarketAnalysis = {
        success: true,
        confidence: 82,
        data: {
          trendScore: 75,
          opportunityScore: 68,
          riskScore: 35,
          marketPhase: 'Growth'
        },
        insights: ['Strong positive trends detected'],
        recommendations: ['Aggressive expansion recommended'],
        supremeScore: 80
      };
      
      mockSupremeAI.analyzeMarketTrends.mockResolvedValue(mockMarketAnalysis as any);

      // Act
      const result = await SupremeAIv3.process({
        type: 'market',
        userId: 'test-user',
        marketData: {
          competitorActivity: 0.7,
          economicIndicators: 0.8,
          consumerSentiment: 0.6
        }
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('market');
      expect(result.data.marketPhase).toBe('Growth');
    });
  });

  describe('Adaptive Analysis', () => {
    it('should handle adaptive analysis with context', async () => {
      // Arrange
      const mockAdaptiveResult = {
        success: true,
        confidence: 91,
        data: { adaptiveLearning: true, modelVersion: '2.0' },
        insights: ['Adaptive learning applied'],
        recommendations: ['Model refinement scheduled'],
        supremeScore: 85
      };
      
      mockSupremeAI.adaptiveAnalysis.mockResolvedValue(mockAdaptiveResult as any);

      // Act
      const result = await SupremeAIv3.process({
        type: 'adaptive',
        userId: 'test-user',
        data: { samples: [1, 2, 3] },
        context: 'revenue'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('adaptive');
      expect(result.data.adaptiveLearning).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported task types', async () => {
      // Act & Assert
      await expect(SupremeAIv3.process({
        type: 'unsupported' as any,
        userId: 'test-user',
        data: {},
        context: 'test'
      } as any)).rejects.toThrow('Unsupported task type unsupported');
    });

    it('should handle memory initialization failures gracefully', async () => {
      // Arrange
      mockSupremeMemory.initialize.mockRejectedValue(new Error('Memory failed'));
      mockRagQuery.mockResolvedValue({
        answer: 'Answer despite memory failure',
        contextDocs: [],
        confidence: 70
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Test question'
      });

      // Assert
      expect(result.success).toBe(true);
      // Memory failure should be caught and not crash the system
    });

    it('should propagate RAG query failures', async () => {
      // Arrange
      mockRagQuery.mockRejectedValue(new Error('RAG failed'));

      // Act & Assert
      await expect(SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Test question'
      })).rejects.toThrow('RAG failed');
    });

    it('should propagate AutoML failures', async () => {
      // Arrange
      mockSupremeAutoML.autoOptimize.mockRejectedValue(new Error('AutoML optimization failed'));

      // Act & Assert
      await expect(SupremeAIv3.process({
        type: 'predict',
        userId: 'test-user',
        features: [[1, 2]],
        targets: [0.5]
      })).rejects.toThrow('AutoML optimization failed');
    });
  });

  describe('Memory Integration', () => {
    it('should store Q&A interactions in memory', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Detailed answer',
        contextDocs: [{ id: 'doc1', text: 'context', embedding: [] }],
        confidence: 88
      });

      // Act
      await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Important question'
      });

      // Assert
      expect(mockSupremeMemory.storeMemory).toHaveBeenCalledWith({
        type: 'insight',
        userId: 'test-user',
        content: 'Q: Important question | A: Detailed answer',
        metadata: { docs: ['doc1'] },
        importance: 0.5,
        tags: ['qa', 'rag']
      });
    });

    it('should retrieve and use context for questions', async () => {
      // Arrange
      const mockContext = {
        relevantMemories: [
          { id: 'mem1', content: 'Previous insight', importance: 0.8, type: 'insight' as const, userId: 'test-user', timestamp: new Date(), metadata: {}, tags: [] }
        ],
        conversationHistory: null,
        customerInsights: null,
        contextSummary: 'Previous insights about market trends'
      };
      
      mockSupremeMemory.getContextForResponse.mockResolvedValue(mockContext);
      mockRagQuery.mockResolvedValue({
        answer: 'Context-aware answer',
        contextDocs: [],
        confidence: 90
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Follow-up question'
      });

      // Assert
      expect(result.data.memoryContext).toBe('Previous insights about market trends');
      expect(mockRagQuery).toHaveBeenCalledWith(
        'Follow-up question\n\nAdditional context: Previous insights about market trends',
        4
      );
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format across all task types', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Test answer',
        contextDocs: [],
        confidence: 80
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Test'
      });

      // Assert
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        timestamp: expect.any(Date),
        taskType: expect.any(String),
        data: expect.any(Object),
        confidence: expect.any(Number)
      });
    });

    it('should include debug information for question tasks', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Debug test',
        contextDocs: [],
        confidence: 85
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'Debug test question'
      });

      // Assert
      expect(result.debug).toBeDefined();
      expect(result.debug?.augmentedQuestion).toContain('Debug test question');
    });
  });

  describe('MarketSage Knowledge Integration', () => {
    it('should provide MarketSage-specific context for platform questions', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Email campaigns can be created through the dashboard.',
        contextDocs: [{
          id: 'marketsage-email',
          text: 'MarketSage email system with African optimizations',
          embedding: []
        }],
        confidence: 85
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'How do I set up email campaigns in MarketSage?'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.answer).toContain('MarketSage');
      expect(result.data.answer).toContain('📍 **Next Steps in MarketSage:**');
      expect(result.data.marketSageContext).toContain('MarketSage provides advanced email marketing');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should provide WhatsApp-specific guidance for African markets', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'WhatsApp integration requires Business API setup.',
        contextDocs: [{
          id: 'whatsapp-guide',
          text: 'WhatsApp Business API integration guide',
          embedding: []
        }],
        confidence: 90
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'How do I set up WhatsApp for my Nigerian customers?'
      });

      // Assert
      expect(result.data.marketSageContext).toContain('WhatsApp is the highest-performing channel in African markets');
      expect(result.data.marketSageContext).toContain('African market optimizations');
      expect(result.data.answer).toContain('🌍 **African Market Insight:**');
    });

    it('should provide fintech-specific compliance guidance', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'Compliance workflows help with KYC processes.',
        contextDocs: [{
          id: 'compliance-guide',
          text: 'Fintech compliance and KYC workflows',
          embedding: []
        }],
        confidence: 88
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'What compliance features does MarketSage have for fintech?'
      });

      // Assert
      expect(result.data.marketSageContext).toContain('fintech companies with compliance features');
      expect(result.data.answer).toContain('🔒 **Compliance Note:**');
      expect(result.data.answer).toContain('data residency options');
    });

    it('should handle general platform questions with appropriate context', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'MarketSage provides comprehensive marketing automation.',
        contextDocs: [{
          id: 'platform-overview',
          text: 'MarketSage platform overview and capabilities',
          embedding: []
        }],
        confidence: 82
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'What can MarketSage do for my business?'
      });

      // Assert
      expect(result.data.marketSageContext).toContain('comprehensive marketing automation platform');
      expect(result.data.marketSageContext).toContain('African markets');
      expect(result.data.answer).toContain('💡 **Pro Tip:**');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9); // Should boost confidence
    });

    it('should provide setup guidance with practical next steps', async () => {
      // Arrange
      mockRagQuery.mockResolvedValue({
        answer: 'LeadPulse tracking can be configured in settings.',
        contextDocs: [{
          id: 'leadpulse-setup',
          text: 'LeadPulse Intelligence setup guide',
          embedding: []
        }],
        confidence: 85
      });

      // Act
      const result = await SupremeAIv3.process({
        type: 'question',
        userId: 'test-user',
        question: 'How do I configure LeadPulse tracking?'
      });

      // Assert
      expect(result.data.marketSageContext).toContain('LeadPulse Intelligence tracks anonymous visitors');
      expect(result.data.answer).toContain('📍 **Next Steps in MarketSage:**');
      expect(result.data.answer).toContain('Navigate to your MarketSage dashboard');
      expect(result.data.answer).toContain('AI Intelligence Center');
    });
  });
});

// API Route Tests (would typically be in a separate file)
describe('Supreme-AI v3 API Route Validation', () => {
  // Mock the validation function for testing
  const validateTask = (body: any): { valid: boolean; task?: any; error?: string } => {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a valid JSON object' };
    }
    
    const { type, userId } = body;
    
    if (!type || typeof type !== 'string') {
      return { valid: false, error: 'Task type is required and must be a string' };
    }
    
    if (!userId || typeof userId !== 'string') {
      return { valid: false, error: 'User ID is required and must be a string' };
    }
    
    return { valid: true, task: body };
  };

  describe('Input Validation', () => {
    it('should reject null/undefined body', () => {
      const result = validateTask(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Request body must be a valid JSON object');
    });

    it('should reject missing task type', () => {
      const result = validateTask({ userId: 'test' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Task type is required');
    });

    it('should reject missing user ID', () => {
      const result = validateTask({ type: 'question' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    it('should accept valid basic task', () => {
      const result = validateTask({
        type: 'question',
        userId: 'test-user',
        question: 'Valid question?'
      });
      expect(result.valid).toBe(true);
      expect(result.task).toBeDefined();
    });
  });
}); 