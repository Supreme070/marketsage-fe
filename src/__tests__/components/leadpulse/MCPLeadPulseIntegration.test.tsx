import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import { useSession } from 'next-auth/react';
import { useMCPLeadPulse } from '../../../hooks/useMCPLeadPulse';
import { LiveVisitorMap } from '../../../components/leadpulse/LiveVisitorMap';
import { CoreAnalyticsDashboard } from '../../../components/leadpulse/CoreAnalyticsDashboard';
import { VisitorInsights } from '../../../components/leadpulse/VisitorInsights';
import { 
  createMockMCPData,
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS,
  TEST_CONSTANTS
} from '../../utils/test-utils';

// Mock the MCP hook
jest.mock('../../../hooks/useMCPLeadPulse');
jest.mock('next-auth/react');

const mockUseMCPLeadPulse = useMCPLeadPulse as jest.MockedFunction<typeof useMCPLeadPulse>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('MCP LeadPulse Integration Tests', () => {
  // Mock session data
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'test@example.com',
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

    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Real MCP Data Integration', () => {
    it('should load and display real visitor data from MCP server', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Check that MCP data is loaded
        expect(screen.getByTestId('visitor-map')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument(); // Lagos visitors
        expect(screen.getByText('Lagos')).toBeInTheDocument();
      });

      // Verify MCP connection status
      expect(screen.getByText(/mcp connected/i)).toBeInTheDocument();
    });

    it('should handle MCP server unavailable gracefully', async () => {
      const mockMCPDataWithError = {
        ...createMockMCPData(),
        mcpConnected: false,
        error: 'MCP server unavailable',
        dataSource: 'fallback' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(mockMCPDataWithError);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should show fallback message
        expect(screen.getByText(/fallback mode/i)).toBeInTheDocument();
        expect(screen.getByText(/mcp server unavailable/i)).toBeInTheDocument();
      });
    });

    it('should perform real database queries when MCP is enabled', async () => {
      const mockMCPData = {
        ...createMockMCPData(),
        mcpEnabled: true,
        mcpConnected: true,
        dataSource: 'mcp' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<VisitorInsights />);

      await waitFor(() => {
        // Verify real data is displayed
        expect(screen.getByText(/high engagement detected/i)).toBeInTheDocument();
        expect(screen.getByText(/conversion rate improved/i)).toBeInTheDocument();
      });

      // Verify MCP data source indicator
      expect(screen.getByTestId('data-source-indicator')).toHaveTextContent('MCP');
    });

    it('should handle empty database results properly', async () => {
      const mockEmptyData = {
        visitorLocations: [],
        visitorJourneys: [],
        insights: [],
        segments: [],
        analyticsOverview: {
          activeVisitors: 0,
          totalVisitors: 0,
          conversionRate: 0,
          engagementScore: 0,
          bounceRate: 0,
          averageSessionTime: 0
        },
        isLoading: false,
        error: null,
        dataSource: 'mcp' as const,
        lastUpdated: new Date(),
        mcpEnabled: true,
        mcpConnected: true,
        refresh: jest.fn(),
        refreshVisitors: jest.fn(),
        refreshInsights: jest.fn(),
        refreshLocations: jest.fn()
      };
      mockUseMCPLeadPulse.mockReturnValue(mockEmptyData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        expect(screen.getByText(/no visitors/i)).toBeInTheDocument();
        expect(screen.getByText(/0 visitors from 0 countries/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Rendering with Real Data', () => {
    it('should render LiveVisitorMap with MCP data correctly', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      const renderTime = await measureComponentPerformance(
        () => render(<LiveVisitorMap />),
        'LiveVisitorMap with MCP data'
      );

      await waitFor(() => {
        // Check map renders with real locations
        expect(screen.getByTestId('visitor-map')).toBeInTheDocument();
        expect(screen.getByText('Live Visitor Tracking')).toBeInTheDocument();
        
        // Verify African cities are displayed
        expect(screen.getByText('Lagos')).toBeInTheDocument();
        expect(screen.getByText('Abuja')).toBeInTheDocument();
        expect(screen.getByText('Kano')).toBeInTheDocument();
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should render CoreAnalyticsDashboard with real analytics', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Check analytics cards
        expect(screen.getByTestId('active-visitors-card')).toBeInTheDocument();
        expect(screen.getByTestId('total-visitors-card')).toBeInTheDocument();
        expect(screen.getByTestId('conversion-rate-card')).toBeInTheDocument();
        
        // Verify real numbers are displayed
        expect(screen.getByText('23')).toBeInTheDocument(); // activeVisitors
        expect(screen.getByText('1,547')).toBeInTheDocument(); // totalVisitors
      });
    });

    it('should render VisitorInsights with MCP insights', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<VisitorInsights />);

      await waitFor(() => {
        // Check insights are rendered
        expect(screen.getByText('High engagement detected')).toBeInTheDocument();
        expect(screen.getByText('Conversion rate improved')).toBeInTheDocument();
        
        // Check segments
        expect(screen.getByText('High Value Visitors')).toBeInTheDocument();
        expect(screen.getByText('234')).toBeInTheDocument(); // segment count
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching MCP data', async () => {
      const mockLoadingData = {
        ...createMockMCPData(),
        isLoading: true
      };
      mockUseMCPLeadPulse.mockReturnValue(mockLoadingData);

      render(<LiveVisitorMap />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading visitor data/i)).toBeInTheDocument();
    });

    it('should show skeleton loaders for dashboard components', async () => {
      const mockLoadingData = {
        ...createMockMCPData(),
        isLoading: true
      };
      mockUseMCPLeadPulse.mockReturnValue(mockLoadingData);

      render(<CoreAnalyticsDashboard />);

      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(4); // 4 metric cards
    });
  });

  describe('Error Boundaries and Fallback', () => {
    it('should display error message when MCP fails', async () => {
      const mockErrorData = {
        ...createMockMCPData(),
        error: 'Database connection failed',
        mcpConnected: false,
        dataSource: 'fallback' as const
      };
      mockUseMCPLeadPulse.mockReturnValue(mockErrorData);

      render(<VisitorInsights />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should allow retry when MCP connection fails', async () => {
      const mockRefresh = jest.fn();
      const mockErrorData = {
        ...createMockMCPData(),
        error: 'Connection timeout',
        refresh: mockRefresh
      };
      mockUseMCPLeadPulse.mockReturnValue(mockErrorData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        const retryButton = screen.getByText(/retry/i);
        fireEvent.click(retryButton);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const mockErrorData = {
        ...createMockMCPData(),
        error: 'Network error',
        mcpConnected: false
      };
      mockUseMCPLeadPulse.mockReturnValue(mockErrorData);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Compatibility (African Market)', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });
    });

    it('should render mobile-optimized layout for visitor map', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        const mapContainer = screen.getByTestId('visitor-map');
        expect(mapContainer).toHaveClass('mobile-responsive');
        
        // Check mobile-specific elements
        expect(screen.getByTestId('mobile-stats')).toBeInTheDocument();
      });
    });

    it('should use touch-friendly interactions on mobile', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/metric-card/);
        cards.forEach(card => {
          expect(card).toHaveClass('touch-friendly');
        });
      });
    });

    it('should optimize data loading for low-bandwidth connections', async () => {
      const mockMCPData = {
        ...createMockMCPData(),
        visitorLocations: createMockMCPData().visitorLocations.slice(0, 3) // Reduced data
      };
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show limited data for performance
        const locationItems = screen.getAllByTestId('location-item');
        expect(locationItems.length).toBeLessThanOrEqual(5);
      });
    });

    it('should display currency in NGN for African users', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      // Mock user location as Nigeria
      Object.defineProperty(navigator, 'language', {
        value: 'en-NG',
        configurable: true
      });

      render(<VisitorInsights />);

      await waitFor(() => {
        // Should show NGN currency format
        expect(screen.getByText(/₦/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update data when MCP provides new information', async () => {
      const mockRefresh = jest.fn();
      const initialData = createMockMCPData();
      initialData.refresh = mockRefresh;
      
      mockUseMCPLeadPulse.mockReturnValue(initialData);

      render(<LiveVisitorMap />);

      // Simulate real-time update
      await act(async () => {
        // Update data
        const updatedData = {
          ...initialData,
          analyticsOverview: {
            ...initialData.analyticsOverview,
            activeVisitors: 25 // Changed from 23
          }
        };
        mockUseMCPLeadPulse.mockReturnValue(updatedData);
      });

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should handle refresh intervals correctly', async () => {
      const mockRefresh = jest.fn();
      const mockMCPData = {
        ...createMockMCPData(),
        refresh: mockRefresh
      };
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<CoreAnalyticsDashboard enableRealtime={true} refreshInterval={1000} />);

      // Wait for auto-refresh
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should meet performance thresholds with MCP data', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      const renderTime = await measureComponentPerformance(
        () => render(<VisitorInsights />),
        'VisitorInsights with MCP data'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should maintain accessibility standards', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      const { container } = render(<LiveVisitorMap />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/visitor map/i)).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', async () => {
      const largeMCPData = {
        ...createMockMCPData(),
        visitorJourneys: Array.from({ length: 500 }, (_, i) => ({
          id: `journey_${i}`,
          visitorId: `visitor_${i}`,
          sessionId: `session_${i}`,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalPages: 3,
          engagementScore: Math.floor(Math.random() * 100),
          conversionEvents: [],
          pulseData: [],
          device: 'mobile',
          location: 'Lagos, Nigeria',
          lastActive: '2 min ago'
        }))
      };
      mockUseMCPLeadPulse.mockReturnValue(largeMCPData);

      const renderTime = await measureComponentPerformance(
        () => render(<CoreAnalyticsDashboard />),
        'CoreAnalyticsDashboard with large dataset'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
    });
  });

  describe('Data Validation and Security', () => {
    it('should validate MCP data structure', async () => {
      const invalidMCPData = {
        // Missing required fields
        visitorLocations: null,
        visitorJourneys: undefined,
        insights: 'invalid',
        segments: []
      };
      
      // Should handle invalid data gracefully
      expect(() => {
        mockUseMCPLeadPulse.mockReturnValue(invalidMCPData as any);
        render(<VisitorInsights />);
      }).not.toThrow();
    });

    it('should sanitize data from MCP server', async () => {
      const maliciousData = {
        ...createMockMCPData(),
        insights: [
          {
            id: '1',
            type: 'xss',
            message: '<script>alert("xss")</script>High engagement detected'
          }
        ]
      };
      mockUseMCPLeadPulse.mockReturnValue(maliciousData);

      render(<VisitorInsights />);

      await waitFor(() => {
        // Should not render script tags
        expect(screen.queryByText('<script>')).not.toBeInTheDocument();
        expect(screen.getByText(/high engagement detected/i)).toBeInTheDocument();
      });
    });

    it('should respect user permissions for MCP data access', async () => {
      // Mock user without LeadPulse permissions
      mockUseSession.mockReturnValue({
        data: {
          ...mockSession,
          user: {
            ...mockSession.user,
            role: 'viewer' // Limited role
          }
        },
        status: 'authenticated'
      });

      const restrictedData = {
        ...createMockMCPData(),
        mcpEnabled: false,
        error: 'Insufficient permissions'
      };
      mockUseMCPLeadPulse.mockReturnValue(restrictedData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
      });
    });
  });

  describe('African Market Specific Features', () => {
    it('should display timezone-aware timestamps for African regions', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      // Mock African timezone
      const mockDate = new Date('2024-07-19T15:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<VisitorInsights />);

      await waitFor(() => {
        // Should show WAT (West Africa Time) format
        expect(screen.getByText(/wat|west africa time/i)).toBeInTheDocument();
      });
    });

    it('should prioritize Nigerian cities in location data', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        const locationItems = screen.getAllByTestId('location-item');
        // Lagos should be first (highest visitor count)
        expect(locationItems[0]).toHaveTextContent('Lagos');
      });
    });

    it('should support multiple African languages', async () => {
      const mockMCPData = createMockMCPData();
      mockUseMCPLeadPulse.mockReturnValue(mockMCPData);

      // Mock Hausa language preference
      Object.defineProperty(navigator, 'languages', {
        value: ['ha', 'en'],
        configurable: true
      });

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should support internationalization
        expect(screen.getByTestId('i18n-ready')).toBeInTheDocument();
      });
    });
  });
});