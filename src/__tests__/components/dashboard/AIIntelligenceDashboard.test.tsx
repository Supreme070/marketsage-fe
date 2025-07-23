import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import { useSession } from 'next-auth/react';
import { useSupremeAI } from '../../../hooks/useSupremeAI';
import { AIIntelligenceDashboard } from '../../../components/leadpulse/AIIntelligenceDashboard';
import { MultiAgentDashboard } from '../../../components/dashboard/MultiAgentDashboard';
import { 
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS,
  createMockHook
} from '../../utils/test-utils';

// Mock hooks and dependencies
jest.mock('../../../hooks/useSupremeAI');
jest.mock('next-auth/react');

const mockUseSupremeAI = useSupremeAI as jest.MockedFunction<typeof useSupremeAI>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('AI Intelligence Dashboard Integration Tests', () => {
  // Mock session data with AI permissions
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'test@marketsage.ai',
      role: 'admin',
      organizationId: 'org_123',
      aiPermissions: ['read:ai', 'execute:ai', 'approve:ai']
    },
    expires: '2024-12-31'
  };

  // Mock AI intelligence data
  const mockAIData = {
    // Supreme AI v3 status
    status: {
      isOnline: true,
      mode: 'autonomous',
      trustLevel: 0.85,
      activeTasks: 3,
      completedToday: 47,
      errorRate: 0.02
    },
    
    // Multi-agent coordination
    agents: [
      {
        id: 'agent_1',
        name: 'Customer Intelligence Agent',
        type: 'analytics',
        status: 'active',
        currentTask: 'Analyzing customer segments',
        performance: 0.92,
        lastAction: '2 minutes ago'
      },
      {
        id: 'agent_2', 
        name: 'Campaign Optimization Agent',
        type: 'optimization',
        status: 'active',
        currentTask: 'Optimizing email campaigns',
        performance: 0.88,
        lastAction: '5 minutes ago'
      },
      {
        id: 'agent_3',
        name: 'Predictive Analytics Agent',
        type: 'prediction',
        status: 'idle',
        currentTask: null,
        performance: 0.95,
        lastAction: '30 minutes ago'
      }
    ],

    // AI insights and predictions
    insights: [
      {
        id: 'insight_1',
        type: 'revenue_opportunity',
        priority: 'high',
        title: 'Revenue Optimization Opportunity',
        description: 'Customer segment "High Value" shows 23% upsell potential',
        confidence: 0.89,
        expectedImpact: '$125,000 ARR increase',
        actions: ['Create upsell campaign', 'Personalize offers'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight_2',
        type: 'churn_prevention',
        priority: 'critical',
        title: 'Churn Risk Detected',
        description: '15 high-value customers at critical churn risk',
        confidence: 0.94,
        expectedImpact: '$75,000 CLV preservation',
        actions: ['Immediate retention campaign', 'Personal outreach'],
        timestamp: new Date().toISOString()
      }
    ],

    // MCP integration status
    mcpStatus: {
      connected: true,
      servers: ['leadpulse', 'analytics', 'campaigns'],
      lastSync: new Date(),
      dataQuality: 0.96
    },

    // Real-time analytics
    analytics: {
      customerIntelligence: {
        totalCustomers: 2847,
        highValueCustomers: 342,
        churnRisk: 127,
        segmentAccuracy: 0.91
      },
      campaignPerformance: {
        activeCampaigns: 8,
        avgOpenRate: 0.245,
        avgClickRate: 0.068,
        conversionRate: 0.042
      },
      leadPulseMetrics: {
        activeVisitors: 23,
        engagementScore: 78,
        conversionFunnel: [1000, 245, 68, 42],
        topSources: ['organic', 'social', 'email']
      }
    },

    // Error states
    isLoading: false,
    error: null,
    
    // Methods
    refresh: jest.fn(),
    executeTask: jest.fn(),
    approveAction: jest.fn(),
    pauseAgent: jest.fn(),
    resumeAgent: jest.fn()
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    mockUseSupremeAI.mockReturnValue(mockAIData);

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Dashboard Real Data Integration', () => {
    it('should load and display Supreme AI v3 status with MCP data', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Check AI status indicators
        expect(screen.getByTestId('ai-status-indicator')).toBeInTheDocument();
        expect(screen.getByText('Supreme AI v3')).toBeInTheDocument();
        expect(screen.getByText('Online')).toBeInTheDocument();
        expect(screen.getByText('Autonomous Mode')).toBeInTheDocument();
        
        // Check trust level
        expect(screen.getByText('85%')).toBeInTheDocument(); // Trust level
        expect(screen.getByText('Trust Level')).toBeInTheDocument();
      });
    });

    it('should display real multi-agent coordination data', async () => {
      render(<MultiAgentDashboard />);

      await waitFor(() => {
        // Check agent cards
        expect(screen.getByText('Customer Intelligence Agent')).toBeInTheDocument();
        expect(screen.getByText('Campaign Optimization Agent')).toBeInTheDocument();
        expect(screen.getByText('Predictive Analytics Agent')).toBeInTheDocument();
        
        // Check agent statuses
        expect(screen.getAllByText('Active')).toHaveLength(2);
        expect(screen.getByText('Idle')).toBeInTheDocument();
        
        // Check performance metrics
        expect(screen.getByText('92%')).toBeInTheDocument(); // Customer Intelligence performance
        expect(screen.getByText('88%')).toBeInTheDocument(); // Campaign Optimization performance
      });
    });

    it('should show real AI insights with MCP-derived data', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Check high-priority insights
        expect(screen.getByText('Revenue Optimization Opportunity')).toBeInTheDocument();
        expect(screen.getByText('Churn Risk Detected')).toBeInTheDocument();
        
        // Check confidence levels
        expect(screen.getByText('89% confidence')).toBeInTheDocument();
        expect(screen.getByText('94% confidence')).toBeInTheDocument();
        
        // Check expected impact
        expect(screen.getByText('$125,000 ARR increase')).toBeInTheDocument();
        expect(screen.getByText('$75,000 CLV preservation')).toBeInTheDocument();
      });
    });

    it('should display MCP server connection status', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('mcp-status')).toBeInTheDocument();
        expect(screen.getByText('MCP Connected')).toBeInTheDocument();
        expect(screen.getByText('leadpulse')).toBeInTheDocument();
        expect(screen.getByText('analytics')).toBeInTheDocument();
        expect(screen.getByText('campaigns')).toBeInTheDocument();
        
        // Check data quality indicator
        expect(screen.getByText('96%')).toBeInTheDocument(); // Data quality
      });
    });
  });

  describe('Real-time AI Task Execution', () => {
    it('should execute AI tasks with real MCP backend integration', async () => {
      const mockExecuteTask = jest.fn().mockResolvedValue({
        success: true,
        taskId: 'task_123',
        result: 'Customer segmentation completed'
      });
      
      mockUseSupremeAI.mockReturnValue({
        ...mockAIData,
        executeTask: mockExecuteTask
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        const executeButton = screen.getByText('Execute Segmentation');
        fireEvent.click(executeButton);
      });

      expect(mockExecuteTask).toHaveBeenCalledWith({
        type: 'customer_segmentation',
        priority: 'high',
        dataSource: 'mcp'
      });
    });

    it('should show real-time task progress updates', async () => {
      const mockTaskData = {
        ...mockAIData,
        activeTasks: [
          {
            id: 'task_1',
            type: 'campaign_optimization',
            status: 'running',
            progress: 0.67,
            eta: '2 minutes',
            agent: 'Campaign Optimization Agent'
          }
        ]
      };
      
      mockUseSupremeAI.mockReturnValue(mockTaskData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('task-progress')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument(); // Progress
        expect(screen.getByText('2 minutes')).toBeInTheDocument(); // ETA
        expect(screen.getByText('Campaign Optimization')).toBeInTheDocument();
      });
    });

    it('should handle AI task approval workflow', async () => {
      const mockApproveAction = jest.fn();
      mockUseSupremeAI.mockReturnValue({
        ...mockAIData,
        approveAction: mockApproveAction,
        pendingApprovals: [
          {
            id: 'approval_1',
            type: 'campaign_modification',
            description: 'Modify email campaign subject lines based on engagement data',
            risk: 'low',
            expectedImpact: '15% open rate increase'
          }
        ]
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        const approveButton = screen.getByText('Approve');
        fireEvent.click(approveButton);
      });

      expect(mockApproveAction).toHaveBeenCalledWith('approval_1');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should render within performance thresholds', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<AIIntelligenceDashboard />),
        'AI Intelligence Dashboard'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should handle AI service unavailable gracefully', async () => {
      const mockErrorData = {
        ...mockAIData,
        status: {
          ...mockAIData.status,
          isOnline: false
        },
        error: 'Supreme AI v3 service unavailable',
        mcpStatus: {
          ...mockAIData.mcpStatus,
          connected: false
        }
      };
      
      mockUseSupremeAI.mockReturnValue(mockErrorData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Supreme AI v3 service unavailable')).toBeInTheDocument();
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should show fallback mode when MCP servers are down', async () => {
      const mockFallbackData = {
        ...mockAIData,
        mcpStatus: {
          connected: false,
          servers: [],
          lastSync: null,
          dataQuality: 0
        },
        error: 'MCP servers unavailable - running in fallback mode'
      };
      
      mockUseSupremeAI.mockReturnValue(mockFallbackData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
        expect(screen.getByText('MCP servers unavailable')).toBeInTheDocument();
        expect(screen.getByTestId('fallback-indicator')).toBeInTheDocument();
      });
    });

    it('should handle AI task execution failures', async () => {
      const mockExecuteTask = jest.fn().mockRejectedValue(new Error('Task execution failed'));
      
      mockUseSupremeAI.mockReturnValue({
        ...mockAIData,
        executeTask: mockExecuteTask
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        const executeButton = screen.getByText('Execute Segmentation');
        fireEvent.click(executeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Task execution failed')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile and African Market Optimization', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
    });

    it('should render mobile-optimized AI dashboard', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-ai-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('ai-summary-cards')).toHaveClass('mobile-grid');
      });
    });

    it('should prioritize critical insights on mobile', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Critical insights should be shown first on mobile
        const insights = screen.getAllByTestId('ai-insight-card');
        expect(insights[0]).toHaveTextContent('Churn Risk Detected'); // Critical priority
      });
    });

    it('should support offline AI insights caching', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const mockOfflineData = {
        ...mockAIData,
        mcpStatus: {
          ...mockAIData.mcpStatus,
          connected: false
        },
        cached: true,
        lastSync: new Date(Date.now() - 300000) // 5 minutes ago
      };
      
      mockUseSupremeAI.mockReturnValue(mockOfflineData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
        expect(screen.getByText('Cached Data (5 min ago)')).toBeInTheDocument();
      });
    });

    it('should display AI costs in Nigerian Naira', async () => {
      const mockAIDataWithCosts = {
        ...mockAIData,
        costs: {
          todaySpend: 8500, // In Naira
          monthlyBudget: 250000,
          avgTaskCost: 150
        }
      };
      
      mockUseSupremeAI.mockReturnValue(mockAIDataWithCosts);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('₦8,500')).toBeInTheDocument(); // Today's spend
        expect(screen.getByText('₦250,000')).toBeInTheDocument(); // Monthly budget
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should respect AI execution permissions', async () => {
      mockUseSession.mockReturnValue({
        data: {
          ...mockSession,
          user: {
            ...mockSession.user,
            aiPermissions: ['read:ai'] // No execute permission
          }
        },
        status: 'authenticated'
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Execute buttons should be disabled
        const executeButtons = screen.getAllByText(/execute/i);
        executeButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
        
        expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
      });
    });

    it('should show approval required for high-risk tasks', async () => {
      const mockHighRiskData = {
        ...mockAIData,
        pendingApprovals: [
          {
            id: 'approval_2',
            type: 'campaign_deletion',
            description: 'AI suggests deleting underperforming campaign',
            risk: 'high',
            expectedImpact: 'Potential revenue loss: $5,000'
          }
        ]
      };
      
      mockUseSupremeAI.mockReturnValue(mockHighRiskData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('high-risk-approval')).toBeInTheDocument();
        expect(screen.getByText('High Risk')).toBeInTheDocument();
        expect(screen.getByText('Requires Manual Approval')).toBeInTheDocument();
      });
    });

    it('should audit AI actions for compliance', async () => {
      const mockExecuteTask = jest.fn().mockResolvedValue({
        success: true,
        auditId: 'audit_123',
        logged: true
      });
      
      mockUseSupremeAI.mockReturnValue({
        ...mockAIData,
        executeTask: mockExecuteTask
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        const executeButton = screen.getByText('Execute Segmentation');
        fireEvent.click(executeButton);
      });

      // Should log action for audit trail
      expect(mockExecuteTask).toHaveBeenCalledWith(
        expect.objectContaining({
          auditRequired: true,
          userId: 'user_123',
          organizationId: 'org_123'
        })
      );
    });
  });

  describe('AI Analytics and Insights', () => {
    it('should display real customer intelligence from AI', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Customer intelligence metrics
        expect(screen.getByText('2,847')).toBeInTheDocument(); // Total customers
        expect(screen.getByText('342')).toBeInTheDocument(); // High value customers
        expect(screen.getByText('127')).toBeInTheDocument(); // Churn risk
        expect(screen.getByText('91%')).toBeInTheDocument(); // Segment accuracy
      });
    });

    it('should show campaign performance insights', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Campaign metrics
        expect(screen.getByText('8')).toBeInTheDocument(); // Active campaigns
        expect(screen.getByText('24.5%')).toBeInTheDocument(); // Open rate
        expect(screen.getByText('6.8%')).toBeInTheDocument(); // Click rate
        expect(screen.getByText('4.2%')).toBeInTheDocument(); // Conversion rate
      });
    });

    it('should integrate LeadPulse analytics with AI insights', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // LeadPulse integration
        expect(screen.getByText('23')).toBeInTheDocument(); // Active visitors
        expect(screen.getByText('78')).toBeInTheDocument(); // Engagement score
        
        // Funnel metrics
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Top of funnel
        expect(screen.getByText('42')).toBeInTheDocument(); // Conversions
        
        // Traffic sources
        expect(screen.getByText('organic')).toBeInTheDocument();
        expect(screen.getByText('social')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Usability', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check for proper semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/ai dashboard/i)).toBeInTheDocument();
    });

    it('should provide clear AI decision explanations', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should explain AI reasoning
        expect(screen.getByText('Why this insight?')).toBeInTheDocument();
        expect(screen.getByText('Based on 30-day behavioral patterns')).toBeInTheDocument();
      });
    });

    it('should show AI confidence levels clearly', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Confidence indicators should be visible
        const confidenceIndicators = screen.getAllByTestId('confidence-indicator');
        expect(confidenceIndicators.length).toBeGreaterThan(0);
        
        // High confidence should be green
        expect(screen.getByText('94% confidence')).toHaveClass('text-green-600');
      });
    });
  });
});