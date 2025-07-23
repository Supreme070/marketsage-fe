/**
 * MCP Integration for Supreme-AI v3 Engine
 * 
 * This module provides MCP (Model Context Protocol) integration for the Supreme-AI v3 engine,
 * allowing the AI to access MarketSage data through standardized MCP servers with fallback
 * to direct database access when MCP is disabled or unavailable.
 */

import { MarketSageMCPClient } from '../../mcp/clients/mcp-client';
import { 
  type MCPAuthContext, 
  type MCPClientResponse,
  CustomerQuery,
  type CampaignAnalyticsQuery,
  LeadPulseQuery,
  type SendMessageRequest,
  type MonitoringQuery 
} from '../../mcp/types/mcp-types';

import { logger } from '../logger';
import { prisma } from '../db/prisma';

/**
 * MCP-enhanced AI context for Supreme-AI v3
 */
export interface MCPAIContext {
  userId: string;
  organizationId: string;
  role: string;
  sessionId?: string;
  preferences?: Record<string, any>;
  capabilities?: string[];
}

/**
 * MCP Integration service for Supreme-AI v3
 */
export class SupremeAIMCPIntegration {
  private mcpClient: MarketSageMCPClient;
  private enabled: boolean;

  constructor(authContext?: MCPAuthContext) {
    this.mcpClient = new MarketSageMCPClient(authContext);
    this.enabled = this.mcpClient.isEnabled();
  }

  /**
   * Update authentication context
   */
  updateAuthContext(authContext: MCPAuthContext): void {
    this.mcpClient.setAuthContext(authContext);
  }

  /**
   * Check if MCP is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  // ============================================================================
  // Customer Intelligence Methods
  // ============================================================================

  /**
   * Get customer insights for AI context
   */
  async getCustomerInsights(query: string, options: {
    includeSegments?: boolean;
    includePredictions?: boolean;
    includeEngagement?: boolean;
  } = {}): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting customer insights', { query, options });

      // Search customers first
      const searchResult = await this.mcpClient.searchCustomers(query, {
        limit: 10,
        includeSegments: options.includeSegments || true,
        includePredictions: options.includePredictions || true
      });

      if (searchResult.success && searchResult.data) {
        const customers = Array.isArray(searchResult.data) ? searchResult.data : [searchResult.data];
        
        // Enhance with additional context for AI
        const enhancedInsights = await this.enhanceCustomerInsights(customers, options);
        
        return {
          success: true,
          data: enhancedInsights,
          fromFallback: searchResult.fromFallback
        };
      }

      return searchResult;
    } catch (error) {
      logger.error('MCP Integration: Customer insights failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed customer profile for AI decision making
   */
  async getCustomerProfile(customerId: string, includeFullContext = true): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting customer profile', { customerId });

      const profileResult = await this.mcpClient.getCustomerProfile(customerId, {
        includeSegments: includeFullContext,
        includePredictions: includeFullContext
      });

      if (profileResult.success && profileResult.data) {
        // Add AI-specific context
        const aiContext = await this.buildCustomerAIContext(profileResult.data);
        
        return {
          success: true,
          data: {
            ...profileResult.data,
            aiContext
          },
          fromFallback: profileResult.fromFallback
        };
      }

      return profileResult;
    } catch (error) {
      logger.error('MCP Integration: Customer profile failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get customer segments for AI segmentation decisions
   */
  async getCustomerSegments(organizationId?: string): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting customer segments', { organizationId });

      const segmentsResult = await this.mcpClient.getCustomerSegments(organizationId);

      if (segmentsResult.success && segmentsResult.data) {
        // Add AI-friendly segment analysis
        const aiSegmentAnalysis = await this.buildSegmentAIContext(segmentsResult.data);
        
        return {
          success: true,
          data: {
            segments: segmentsResult.data,
            aiAnalysis: aiSegmentAnalysis
          },
          fromFallback: segmentsResult.fromFallback
        };
      }

      return segmentsResult;
    } catch (error) {
      logger.error('MCP Integration: Customer segments failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // Campaign Intelligence Methods
  // ============================================================================

  /**
   * Get campaign analytics for AI optimization
   */
  async getCampaignAnalytics(query: CampaignAnalyticsQuery): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting campaign analytics', { query });

      const analyticsResult = await this.mcpClient.getCampaignAnalytics(query);

      if (analyticsResult.success && analyticsResult.data) {
        // Add AI-specific campaign insights
        const aiInsights = await this.buildCampaignAIInsights(analyticsResult.data);
        
        return {
          success: true,
          data: {
            ...analyticsResult.data,
            aiInsights
          },
          fromFallback: analyticsResult.fromFallback
        };
      }

      return analyticsResult;
    } catch (error) {
      logger.error('MCP Integration: Campaign analytics failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get campaign performance for AI decision making
   */
  async getCampaignPerformance(campaignId: string): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting campaign performance', { campaignId });

      const performanceResult = await this.mcpClient.getCampaignPerformance(campaignId);

      if (performanceResult.success && performanceResult.data) {
        // Add AI performance analysis
        const aiPerformanceAnalysis = await this.buildPerformanceAIAnalysis(performanceResult.data);
        
        return {
          success: true,
          data: {
            ...performanceResult.data,
            aiAnalysis: aiPerformanceAnalysis
          },
          fromFallback: performanceResult.fromFallback
        };
      }

      return performanceResult;
    } catch (error) {
      logger.error('MCP Integration: Campaign performance failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // Visitor Intelligence Methods
  // ============================================================================

  /**
   * Get visitor behavior for AI analysis
   */
  async getVisitorBehavior(visitorId: string): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Getting visitor behavior', { visitorId });

      const behaviorResult = await this.mcpClient.getVisitorBehavior(visitorId);

      if (behaviorResult.success && behaviorResult.data) {
        // Add AI behavior analysis
        const aiBehaviorAnalysis = await this.buildVisitorBehaviorAIAnalysis(behaviorResult.data);
        
        return {
          success: true,
          data: {
            ...behaviorResult.data,
            aiAnalysis: aiBehaviorAnalysis
          },
          fromFallback: behaviorResult.fromFallback
        };
      }

      return behaviorResult;
    } catch (error) {
      logger.error('MCP Integration: Visitor behavior failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // Action Execution Methods
  // ============================================================================

  /**
   * Execute AI-requested actions through MCP
   */
  async executeAction(actionType: string, actionData: any): Promise<MCPClientResponse> {
    try {
      logger.info('MCP Integration: Executing action', { actionType, actionData });

      switch (actionType) {
        case 'send_message':
          return await this.mcpClient.sendMessage(actionData as SendMessageRequest);
        
        case 'update_customer':
          // Would implement customer update through MCP
          return { success: true, data: { message: 'Customer update not yet implemented' } };
        
        case 'create_campaign':
          // Would implement campaign creation through MCP
          return { success: true, data: { message: 'Campaign creation not yet implemented' } };
        
        default:
          return {
            success: false,
            error: `Unknown action type: ${actionType}`
          };
      }
    } catch (error) {
      logger.error('MCP Integration: Action execution failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================================================
  // Context Building Methods
  // ============================================================================

  /**
   * Build comprehensive AI context from multiple MCP sources
   */
  async buildComprehensiveAIContext(userId: string, organizationId: string): Promise<{
    customer: any;
    campaigns: any;
    visitors: any;
    monitoring: any;
  }> {
    try {
      logger.info('MCP Integration: Building comprehensive AI context', { userId, organizationId });

      const [customerData, campaignData, visitorData, monitoringData] = await Promise.allSettled([
        this.getCustomerInsights(userId, { includeSegments: true, includePredictions: true }),
        this.getCampaignAnalytics({ organizationId, limit: 10 }),
        this.getVisitorBehavior(userId),
        this.getMonitoringData({ metric: 'users', organizationId })
      ]);

      return {
        customer: customerData.status === 'fulfilled' ? customerData.value.data : null,
        campaigns: campaignData.status === 'fulfilled' ? campaignData.value.data : null,
        visitors: visitorData.status === 'fulfilled' ? visitorData.value.data : null,
        monitoring: monitoringData.status === 'fulfilled' ? monitoringData.value.data : null
      };
    } catch (error) {
      logger.error('MCP Integration: Context building failed', error);
      return {
        customer: null,
        campaigns: null,
        visitors: null,
        monitoring: null
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Enhance customer insights with AI context
   */
  private async enhanceCustomerInsights(customers: any[], options: any): Promise<any> {
    return {
      customers,
      totalCount: customers.length,
      insights: {
        highValueCustomers: customers.filter(c => c.predictions?.lifetimeValue > 1000).length,
        atRiskCustomers: customers.filter(c => c.predictions?.churnRisk > 0.7).length,
        activeSegments: [...new Set(customers.flatMap(c => c.segments || []))],
        averageEngagement: customers.reduce((sum, c) => sum + (c.predictions?.engagementScore || 0), 0) / customers.length
      }
    };
  }

  /**
   * Build customer AI context
   */
  private async buildCustomerAIContext(customer: any): Promise<any> {
    return {
      summary: `Customer ${customer.firstName} ${customer.lastName} (${customer.email})`,
      keyInsights: [
        customer.predictions?.churnRisk > 0.7 ? 'High churn risk' : 'Low churn risk',
        customer.predictions?.lifetimeValue > 1000 ? 'High value customer' : 'Standard value customer',
        `Engagement score: ${customer.predictions?.engagementScore || 0}/100`
      ],
      recommendations: this.generateCustomerRecommendations(customer)
    };
  }

  /**
   * Build segment AI context
   */
  private async buildSegmentAIContext(segments: any[]): Promise<any> {
    return {
      totalSegments: segments.length,
      largestSegment: segments.reduce((max, segment) => 
        segment._count?.contacts > (max._count?.contacts || 0) ? segment : max, {}
      ),
      recommendations: [
        'Consider creating more granular segments for better targeting',
        'Monitor segment performance for optimization opportunities'
      ]
    };
  }

  /**
   * Build campaign AI insights
   */
  private async buildCampaignAIInsights(campaignData: any): Promise<any> {
    return {
      performanceInsights: 'Campaign performance analysis not yet implemented',
      recommendations: [
        'Optimize send times based on engagement patterns',
        'A/B test subject lines for better open rates'
      ]
    };
  }

  /**
   * Build performance AI analysis
   */
  private async buildPerformanceAIAnalysis(performanceData: any): Promise<any> {
    return {
      insights: 'Performance analysis not yet implemented',
      recommendations: ['Implement performance tracking']
    };
  }

  /**
   * Build visitor behavior AI analysis
   */
  private async buildVisitorBehaviorAIAnalysis(behaviorData: any): Promise<any> {
    return {
      insights: 'Visitor behavior analysis not yet implemented',
      recommendations: ['Implement behavior tracking']
    };
  }

  /**
   * Generate customer recommendations
   */
  private generateCustomerRecommendations(customer: any): string[] {
    const recommendations = [];
    
    if (customer.predictions?.churnRisk > 0.7) {
      recommendations.push('Send retention campaign');
    }
    
    if (customer.predictions?.lifetimeValue > 1000) {
      recommendations.push('Offer premium services');
    }
    
    if (customer.predictions?.engagementScore < 30) {
      recommendations.push('Re-engagement campaign needed');
    }
    
    return recommendations;
  }

  /**
   * Get monitoring data
   */
  private async getMonitoringData(query: MonitoringQuery): Promise<MCPClientResponse> {
    return await this.mcpClient.getMonitoringData(query);
  }
}