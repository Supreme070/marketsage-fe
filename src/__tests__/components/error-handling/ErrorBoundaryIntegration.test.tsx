import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { useSession } from 'next-auth/react';
import { useMCPLeadPulse } from '../../../hooks/useMCPLeadPulse';
import { LiveVisitorMap } from '../../../components/leadpulse/LiveVisitorMap';
import { CoreAnalyticsDashboard } from '../../../components/leadpulse/CoreAnalyticsDashboard';
import { AIIntelligenceDashboard } from '../../../components/leadpulse/AIIntelligenceDashboard';
import CustomerIntelligenceDashboard from '../../../components/dashboard/CustomerIntelligenceDashboard';
import { 
  createMockMCPData,
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS
} from '../../utils/test-utils';

// Mock dependencies
jest.mock('../../../hooks/useMCPLeadPulse');
jest.mock('next-auth/react');

const mockUseMCPLeadPulse = useMCPLeadPulse as jest.MockedFunction<typeof useMCPLeadPulse>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Error Boundary Component for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Something went wrong</h2>
          <p data-testid="error-message">{this.state.error?.message}</p>
          <button 
            data-testid="retry-button"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

describe('Error Handling and Fallback Scenarios Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'test@marketsage.ai',
      role: 'admin',
      organizationId: 'org_123'
    },
    expires: '2024-12-31'
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    // Mock console.error to prevent test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('MCP Server Connection Failures', () => {
    it('should handle MCP server unavailable gracefully', async () => {
      const mcpErrorData = {
        ...createMockMCPData(),
        mcpConnected: false,
        mcpEnabled: false,
        error: 'MCP server connection failed',
        dataSource: 'fallback' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(mcpErrorData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show MCP connection error
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('MCP server connection failed')).toBeInTheDocument();
        
        // Should indicate fallback mode
        expect(screen.getByText('Fallback Mode')).toBeInTheDocument();
        expect(screen.getByTestId('fallback-indicator')).toBeInTheDocument();
        
        // Retry option should be available
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });
    });

    it('should retry MCP connection when requested', async () => {
      const mockRefresh = jest.fn();
      const mcpErrorData = {
        ...createMockMCPData(),
        mcpConnected: false,
        error: 'Connection timeout',
        refresh: mockRefresh
      };
      mockUseMCPLeadPulse.mockReturnValue(mcpErrorData);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry Connection');
        fireEvent.click(retryButton);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle partial MCP server failures', async () => {
      const partialFailureData = {
        ...createMockMCPData(),
        visitorLocations: [], // Failed to load locations
        visitorJourneys: createMockMCPData().visitorJourneys, // Loaded successfully
        insights: [], // Failed to load insights
        error: 'Partial data unavailable - some MCP endpoints down',
        dataSource: 'mcp' as const,
        mcpConnected: true
      };
      mockUseMCPLeadPulse.mockReturnValue(partialFailureData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should show partial data warning
        expect(screen.getByText('Some data unavailable')).toBeInTheDocument();
        expect(screen.getByText('Partial data unavailable - some MCP endpoints down')).toBeInTheDocument();
        
        // Should still show available data
        expect(screen.getByTestId('available-insights')).toBeInTheDocument();
        
        // Should indicate which data is missing
        expect(screen.getByText('Location data unavailable')).toBeInTheDocument();
        expect(screen.getByText('Insights temporarily unavailable')).toBeInTheDocument();
      });
    });

    it('should handle MCP authentication failures', async () => {
      const authErrorData = {
        ...createMockMCPData(),
        mcpConnected: false,
        error: 'MCP authentication failed - invalid credentials',
        dataSource: 'fallback' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(authErrorData);

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show authentication error
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
        expect(screen.getByText('MCP authentication failed - invalid credentials')).toBeInTheDocument();
        
        // Should suggest re-authentication
        expect(screen.getByText('Please check your credentials')).toBeInTheDocument();
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
      });
    });
  });

  describe('Database Connection Failures', () => {
    it('should handle database connection timeout', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Database connection timeout'));

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show database error
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
        
        // Should offer retry
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle database query failures', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Database query failed',
          code: 'QUERY_ERROR'
        })
      });

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should show specific database error
        expect(screen.getByText('Database query failed')).toBeInTheDocument();
        expect(screen.getByText('Error Code: QUERY_ERROR')).toBeInTheDocument();
        
        // Should show fallback data message
        expect(screen.getByText('Showing cached data')).toBeInTheDocument();
      });
    });

    it('should fall back to cached data when database is unavailable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      const cachedData = {
        ...createMockMCPData(),
        cached: true,
        lastSync: new Date(Date.now() - 600000), // 10 minutes ago
        dataSource: 'fallback' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(cachedData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show cached data indicator
        expect(screen.getByText('Cached Data')).toBeInTheDocument();
        expect(screen.getByText('Last updated: 10 minutes ago')).toBeInTheDocument();
        
        // Should still display data
        expect(screen.getByText('Lagos')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument(); // Visitor count
      });
    });
  });

  describe('Component Error Boundaries', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Component rendering error');
      }
      return <div data-testid="working-component">Component working</div>;
    };

    it('should catch and display component rendering errors', async () => {
      const { rerender } = render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TestErrorBoundary>
      );

      // Initially working
      expect(screen.getByTestId('working-component')).toBeInTheDocument();

      // Trigger error
      rerender(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Component rendering error');
      });
    });

    it('should allow error recovery through retry', async () => {
      let shouldThrow = true;
      const { rerender } = render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </TestErrorBoundary>
      );

      // Error state
      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });

      // Fix the error condition
      shouldThrow = false;
      
      // Click retry
      fireEvent.click(screen.getByTestId('retry-button'));

      // Should recover
      rerender(
        <TestErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('working-component')).toBeInTheDocument();
      });
    });

    it('should handle async component errors', async () => {
      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          // Simulate async error
          setTimeout(() => {
            throw new Error('Async operation failed');
          }, 100);
        }, []);
        return <div data-testid="async-component">Loading...</div>;
      };

      render(
        <TestErrorBoundary>
          <AsyncErrorComponent />
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Async operation failed');
      }, { timeout: 1000 });
    });
  });

  describe('Network Connectivity Issues', () => {
    it('should handle network disconnection gracefully', async () => {
      // Mock network disconnection
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Trigger online/offline events
      window.dispatchEvent(new Event('offline'));

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show offline indicator
        expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      });
    });

    it('should restore functionality when network reconnects', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
      });

      // Simulate reconnection
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        // Should attempt to restore data
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
        expect(screen.getByText('Syncing data')).toBeInTheDocument();
      });
    });

    it('should handle slow network connections', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: 'slow-2g',
          downlink: 0.1,
          rtt: 2000
        },
        configurable: true
      });

      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(createMockMCPData())
            });
          }, 3000); // 3 second delay
        });
      });

      render(<AIIntelligenceDashboard />);

      // Should show slow connection warning
      expect(screen.getByText('Slow Connection Detected')).toBeInTheDocument();
      expect(screen.getByText('Loading may take longer')).toBeInTheDocument();

      await waitFor(() => {
        // Should eventually load
        expect(screen.getByTestId('ai-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle request timeouts', async () => {
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, 1000);
        });
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show timeout error
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
        expect(screen.getByText('Server took too long to respond')).toBeInTheDocument();
        
        // Should offer retry
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation and Corruption', () => {
    it('should handle malformed API responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Malformed response missing required fields
          data: {
            visitors: 'invalid', // Should be array
            analytics: null, // Should be object
            timestamp: 'not-a-date' // Invalid date
          }
        })
      });

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should handle malformed data gracefully
        expect(screen.getByText('Data validation error')).toBeInTheDocument();
        expect(screen.getByText('Received invalid data format')).toBeInTheDocument();
        
        // Should show empty state
        expect(screen.getByText('No valid data available')).toBeInTheDocument();
      });
    });

    it('should sanitize potentially dangerous data', async () => {
      const maliciousData = {
        ...createMockMCPData(),
        insights: [
          {
            id: '1',
            type: 'xss',
            message: '<script>alert("XSS")</script>High engagement detected',
            title: '<img src=x onerror=alert("XSS")>Alert'
          }
        ]
      };
      mockUseMCPLeadPulse.mockReturnValue(maliciousData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should not render dangerous HTML
        expect(screen.queryByText('<script>')).not.toBeInTheDocument();
        expect(screen.queryByText('<img')).not.toBeInTheDocument();
        
        // Should show sanitized content
        expect(screen.getByText('High engagement detected')).toBeInTheDocument();
        expect(screen.getByText('[Unsafe content removed]')).toBeInTheDocument();
      });
    });

    it('should handle missing required data fields', async () => {
      const incompleteData = {
        visitorLocations: [],
        visitorJourneys: undefined, // Missing required field
        insights: null, // Missing required field
        segments: [],
        analyticsOverview: {
          // Missing some required fields
          activeVisitors: 0,
          totalVisitors: 0
          // Missing other required fields
        },
        isLoading: false,
        error: null,
        dataSource: 'mcp' as const,
        lastUpdated: null,
        mcpEnabled: true,
        mcpConnected: true,
        refresh: jest.fn(),
        refreshVisitors: jest.fn(),
        refreshInsights: jest.fn(),
        refreshLocations: jest.fn()
      };
      mockUseMCPLeadPulse.mockReturnValue(incompleteData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should handle missing data gracefully
        expect(screen.getByText('Some data is unavailable')).toBeInTheDocument();
        expect(screen.getByText('Partial data loaded')).toBeInTheDocument();
        
        // Should show what data is available
        expect(screen.getByText('0 visitors from 0 countries')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Degradation Handling', () => {
    it('should handle high memory usage gracefully', async () => {
      // Mock performance API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 950000000, // ~950MB - high usage
          totalJSHeapSize: 1000000000, // 1GB limit
          jsHeapSizeLimit: 1073741824
        },
        configurable: true
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show memory warning
        expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
        expect(screen.getByText('Performance mode enabled')).toBeInTheDocument();
        
        // Should reduce functionality
        expect(screen.getByText('Some features disabled')).toBeInTheDocument();
      });
    });

    it('should degrade functionality on slow devices', async () => {
      // Mock slow device
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB RAM - low-end device
        configurable: true
      });

      const slowRenderTime = jest.fn().mockReturnValue(250); // Slow rendering
      jest.spyOn(performance, 'now').mockImplementation(slowRenderTime);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should enable performance mode
        expect(screen.getByText('Performance Mode')).toBeInTheDocument();
        expect(screen.getByText('Reduced animations')).toBeInTheDocument();
        expect(screen.getByText('Simplified charts')).toBeInTheDocument();
      });
    });

    it('should handle large dataset rendering efficiently', async () => {
      const largeDataset = {
        ...createMockMCPData(),
        visitorJourneys: Array.from({ length: 10000 }, (_, i) => ({
          id: `journey_${i}`,
          visitorId: `visitor_${i}`,
          sessionId: `session_${i}`,
          device: 'mobile',
          location: 'Lagos, Nigeria',
          engagementScore: Math.floor(Math.random() * 100),
          pulseData: [],
          lastActive: '2 min ago'
        }))
      };
      mockUseMCPLeadPulse.mockReturnValue(largeDataset);

      const renderTime = await measureComponentPerformance(
        () => render(<CoreAnalyticsDashboard />),
        'Large dataset rendering'
      );

      await waitFor(() => {
        // Should implement virtualization
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
        expect(screen.getByText('Showing 50 of 10,000 items')).toBeInTheDocument();
      });

      // Should still render within reasonable time
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 3);
    });
  });

  describe('User Permission and Security Errors', () => {
    it('should handle insufficient permissions gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: {
          ...mockSession,
          user: {
            ...mockSession.user,
            role: 'viewer', // Limited permissions
            permissions: ['read:basic'] // No advanced permissions
          }
        },
        status: 'authenticated'
      });

      const restrictedData = {
        ...createMockMCPData(),
        error: 'Insufficient permissions to access advanced analytics',
        mcpEnabled: false
      };
      mockUseMCPLeadPulse.mockReturnValue(restrictedData);

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show permission error
        expect(screen.getByText('Access Restricted')).toBeInTheDocument();
        expect(screen.getByText('Insufficient permissions to access advanced analytics')).toBeInTheDocument();
        
        // Should suggest contacting admin
        expect(screen.getByText('Contact your administrator')).toBeInTheDocument();
      });
    });

    it('should handle session expiration', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      });

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show authentication required
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });

    it('should handle security token validation failures', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Invalid security token',
          code: 'TOKEN_INVALID'
        })
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should show token error
        expect(screen.getByText('Security Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid security token')).toBeInTheDocument();
        expect(screen.getByText('Please refresh and try again')).toBeInTheDocument();
      });
    });
  });
});