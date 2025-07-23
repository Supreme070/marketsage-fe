import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { useSession } from 'next-auth/react';
import { WorkflowPerformanceDashboard } from '../../../components/dashboard/WorkflowPerformanceDashboard';
import { SessionRecordingDashboard } from '../../../components/dashboard/SessionRecordingDashboard';
import { 
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS
} from '../../utils/test-utils';

// Mock dependencies
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('Monitoring Dashboard Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'admin@marketsage.ai',
      role: 'admin',
      organizationId: 'org_123',
      permissions: ['read:monitoring', 'read:analytics', 'read:workflows']
    },
    expires: '2024-12-31'
  };

  // Mock monitoring data from MCP sources
  const mockMonitoringData = {
    workflows: {
      active: 12,
      completed: 847,
      failed: 23,
      averageExecutionTime: 245,
      successRate: 0.973,
      performanceMetrics: [
        { name: 'Email Campaign Workflow', executions: 156, successRate: 0.98, avgTime: 180 },
        { name: 'Lead Scoring Workflow', executions: 89, successRate: 0.95, avgTime: 320 },
        { name: 'Customer Segmentation', executions: 234, successRate: 0.99, avgTime: 150 }
      ]
    },
    sessions: {
      totalSessions: 2847,
      activeSessions: 23,
      averageDuration: 342,
      bounceRate: 0.32,
      conversionRate: 0.042,
      topPages: ['/pricing', '/features', '/dashboard'],
      userJourneys: [
        { id: '1', path: 'Landing → Pricing → Signup', users: 234, conversion: 0.15 },
        { id: '2', path: 'Blog → Features → Trial', users: 189, conversion: 0.12 },
        { id: '3', path: 'Organic → Dashboard → Upgrade', users: 156, conversion: 0.08 }
      ]
    },
    performance: {
      pageLoadTime: 1.2,
      timeToInteractive: 2.1,
      firstContentfulPaint: 0.8,
      cumulativeLayoutShift: 0.05,
      largestContentfulPaint: 1.8,
      uptime: 0.9987,
      errorRate: 0.002
    },
    mcpMetrics: {
      connected: true,
      servers: ['leadpulse', 'analytics', 'workflows', 'campaigns'],
      dataLatency: 45, // milliseconds
      throughput: 1250, // requests per minute
      errorRate: 0.001,
      lastSync: new Date()
    }
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    // Mock APIs for monitoring data
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/workflows/monitoring')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockMonitoringData.workflows
          })
        });
      }
      if (url.includes('/api/analytics/sessions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockMonitoringData.sessions
          })
        });
      }
      if (url.includes('/api/monitoring/performance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockMonitoringData.performance
          })
        });
      }
      if (url.includes('/api/mcp/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockMonitoringData.mcpMetrics
          })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Performance Monitoring', () => {
    it('should display real workflow execution metrics', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check workflow metrics
        expect(screen.getByText('Active Workflows')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument(); // Active workflows
        expect(screen.getByText('847')).toBeInTheDocument(); // Completed workflows
        expect(screen.getByText('23')).toBeInTheDocument(); // Failed workflows
        
        // Check success rate
        expect(screen.getByText('97.3%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('245ms')).toBeInTheDocument(); // Average execution time
      });
    });

    it('should show workflow performance breakdown', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check individual workflow performance
        expect(screen.getByText('Email Campaign Workflow')).toBeInTheDocument();
        expect(screen.getByText('156 executions')).toBeInTheDocument();
        expect(screen.getByText('98% success')).toBeInTheDocument();
        
        expect(screen.getByText('Lead Scoring Workflow')).toBeInTheDocument();
        expect(screen.getByText('89 executions')).toBeInTheDocument();
        expect(screen.getByText('95% success')).toBeInTheDocument();
      });
    });

    it('should display workflow execution trends', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check trend chart
        expect(screen.getByTestId('workflow-trends-chart')).toBeInTheDocument();
        expect(screen.getByText('Execution Trends')).toBeInTheDocument();
        expect(screen.getByText('Performance Over Time')).toBeInTheDocument();
      });
    });

    it('should show real-time workflow status', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check real-time indicators
        expect(screen.getByTestId('realtime-status')).toBeInTheDocument();
        expect(screen.getByText('Live Monitoring')).toBeInTheDocument();
        expect(screen.getByText('Last updated: just now')).toBeInTheDocument();
      });
    });
  });

  describe('Session Recording and Analytics', () => {
    it('should display session analytics from real data', async () => {
      render(<SessionRecordingDashboard />);

      await waitFor(() => {
        // Check session metrics
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('2,847')).toBeInTheDocument(); // Total sessions
        expect(screen.getByText('23')).toBeInTheDocument(); // Active sessions
        expect(screen.getByText('342s')).toBeInTheDocument(); // Average duration
        
        // Check conversion metrics
        expect(screen.getByText('4.2%')).toBeInTheDocument(); // Conversion rate
        expect(screen.getByText('32%')).toBeInTheDocument(); // Bounce rate
      });
    });

    it('should show user journey analytics', async () => {
      render(<SessionRecordingDashboard />);

      await waitFor(() => {
        // Check user journeys
        expect(screen.getByText('User Journeys')).toBeInTheDocument();
        expect(screen.getByText('Landing → Pricing → Signup')).toBeInTheDocument();
        expect(screen.getByText('234 users')).toBeInTheDocument();
        expect(screen.getByText('15% conversion')).toBeInTheDocument();
        
        expect(screen.getByText('Blog → Features → Trial')).toBeInTheDocument();
        expect(screen.getByText('189 users')).toBeInTheDocument();
        expect(screen.getByText('12% conversion')).toBeInTheDocument();
      });
    });

    it('should display top performing pages', async () => {
      render(<SessionRecordingDashboard />);

      await waitFor(() => {
        // Check top pages
        expect(screen.getByText('Top Pages')).toBeInTheDocument();
        expect(screen.getByText('/pricing')).toBeInTheDocument();
        expect(screen.getByText('/features')).toBeInTheDocument();
        expect(screen.getByText('/dashboard')).toBeInTheDocument();
      });
    });

    it('should show session heatmap data', async () => {
      render(<SessionRecordingDashboard />);

      await waitFor(() => {
        // Check heatmap visualization
        expect(screen.getByTestId('session-heatmap')).toBeInTheDocument();
        expect(screen.getByText('Click Heatmap')).toBeInTheDocument();
        expect(screen.getByText('Scroll Depth')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should display Core Web Vitals metrics', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check Core Web Vitals
        expect(screen.getByText('Page Load Time')).toBeInTheDocument();
        expect(screen.getByText('1.2s')).toBeInTheDocument();
        
        expect(screen.getByText('Time to Interactive')).toBeInTheDocument();
        expect(screen.getByText('2.1s')).toBeInTheDocument();
        
        expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
        expect(screen.getByText('0.8s')).toBeInTheDocument();
        
        expect(screen.getByText('Cumulative Layout Shift')).toBeInTheDocument();
        expect(screen.getByText('0.05')).toBeInTheDocument();
      });
    });

    it('should show uptime and error metrics', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check uptime metrics
        expect(screen.getByText('Uptime')).toBeInTheDocument();
        expect(screen.getByText('99.87%')).toBeInTheDocument();
        
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
        expect(screen.getByText('0.2%')).toBeInTheDocument();
      });
    });

    it('should display performance trends over time', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check performance charts
        expect(screen.getByTestId('performance-trends')).toBeInTheDocument();
        expect(screen.getByText('Performance Trends')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
      });
    });
  });

  describe('MCP Integration Monitoring', () => {
    it('should display MCP server connection status', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check MCP status
        expect(screen.getByTestId('mcp-status-panel')).toBeInTheDocument();
        expect(screen.getByText('MCP Servers')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        
        // Check individual server status
        expect(screen.getByText('leadpulse')).toBeInTheDocument();
        expect(screen.getByText('analytics')).toBeInTheDocument();
        expect(screen.getByText('workflows')).toBeInTheDocument();
        expect(screen.getByText('campaigns')).toBeInTheDocument();
      });
    });

    it('should show MCP performance metrics', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check MCP metrics
        expect(screen.getByText('Data Latency')).toBeInTheDocument();
        expect(screen.getByText('45ms')).toBeInTheDocument();
        
        expect(screen.getByText('Throughput')).toBeInTheDocument();
        expect(screen.getByText('1,250 req/min')).toBeInTheDocument();
        
        expect(screen.getByText('MCP Error Rate')).toBeInTheDocument();
        expect(screen.getByText('0.1%')).toBeInTheDocument();
      });
    });

    it('should display MCP data synchronization status', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check sync status
        expect(screen.getByText('Last Sync')).toBeInTheDocument();
        expect(screen.getByText('just now')).toBeInTheDocument();
        expect(screen.getByTestId('sync-indicator')).toHaveClass('text-green-500');
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle monitoring API failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Monitoring service unavailable'));

      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Monitoring data unavailable')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should show degraded functionality when MCP is down', async () => {
      const mcpDownData = {
        ...mockMonitoringData,
        mcpMetrics: {
          connected: false,
          servers: [],
          dataLatency: null,
          throughput: 0,
          errorRate: 1,
          lastSync: null
        }
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/mcp/metrics')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mcpDownData.mcpMetrics
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      });

      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('MCP Disconnected')).toBeInTheDocument();
        expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
        expect(screen.getByTestId('degraded-indicator')).toBeInTheDocument();
      });
    });

    it('should handle partial data loading', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/workflows/monitoring')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockMonitoringData.workflows
            })
          });
        }
        // Fail other endpoints
        return Promise.reject(new Error('Service unavailable'));
      });

      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Should show available data
        expect(screen.getByText('Active Workflows')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        
        // Should show warnings for unavailable data
        expect(screen.getByText('Some monitoring data unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Optimization for African Markets', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
    });

    it('should render mobile-optimized monitoring dashboard', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Check mobile layout
        expect(screen.getByTestId('mobile-monitoring-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-metrics-grid')).toHaveClass('grid-cols-1');
      });
    });

    it('should prioritize key metrics on mobile', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Should show essential metrics first
        const metricCards = screen.getAllByTestId('metric-card');
        expect(metricCards[0]).toHaveTextContent('Success Rate');
        expect(metricCards[1]).toHaveTextContent('Active Workflows');
        expect(metricCards[2]).toHaveTextContent('Uptime');
      });
    });

    it('should optimize charts for mobile viewing', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Charts should be mobile-responsive
        const charts = screen.getAllByTestId(/chart$/);
        charts.forEach(chart => {
          expect(chart).toHaveClass('mobile-chart');
        });
      });
    });

    it('should show data usage warnings for African users', async () => {
      // Mock limited data connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '3g', saveData: true },
        configurable: true
      });

      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Data Saver Mode')).toBeInTheDocument();
        expect(screen.getByText('Reduced monitoring frequency')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates and Performance', () => {
    it('should update metrics in real-time', async () => {
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        readyState: WebSocket.OPEN
      };
      
      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      render(<WorkflowPerformanceDashboard enableRealtime={true} />);

      await waitFor(() => {
        // Should establish WebSocket connection
        expect(WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('ws://localhost:3000/api/monitoring/ws')
        );
      });

      // Simulate real-time update
      const updateEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'workflow_completed',
          data: { workflowId: 'wf_123', success: true, duration: 180 }
        })
      });

      mockWebSocket.onmessage?.(updateEvent);

      await waitFor(() => {
        // Should update displayed metrics
        expect(screen.getByTestId('realtime-indicator')).toHaveClass('animate-pulse');
      });
    });

    it('should render within performance thresholds', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<WorkflowPerformanceDashboard />),
        'Monitoring Dashboard'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should handle large monitoring datasets efficiently', async () => {
      // Mock large dataset
      const largeMonitoringData = {
        ...mockMonitoringData,
        workflows: {
          ...mockMonitoringData.workflows,
          performanceMetrics: Array.from({ length: 100 }, (_, i) => ({
            name: `Workflow ${i}`,
            executions: Math.floor(Math.random() * 500),
            successRate: Math.random(),
            avgTime: Math.floor(Math.random() * 1000)
          }))
        }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: largeMonitoringData.workflows
        })
      });

      const renderTime = await measureComponentPerformance(
        () => render(<WorkflowPerformanceDashboard />),
        'Monitoring Dashboard with large dataset'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/monitoring dashboard/i)).toBeInTheDocument();
    });

    it('should provide clear status indicators', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // Status indicators should be clearly visible
        expect(screen.getByTestId('overall-health')).toBeInTheDocument();
        expect(screen.getByText('System Healthy')).toBeInTheDocument();
        expect(screen.getByTestId('health-indicator')).toHaveClass('text-green-500');
      });
    });

    it('should show meaningful error messages', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Network timeout')).toBeInTheDocument();
        expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<WorkflowPerformanceDashboard />);

      await waitFor(() => {
        // All interactive elements should be keyboard accessible
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('tabIndex');
        });
      });
    });
  });
});