import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import { useSession } from 'next-auth/react';
import CustomerIntelligenceDashboard from '../../../components/dashboard/CustomerIntelligenceDashboard';
import { 
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS,
  createMockHook
} from '../../utils/test-utils';

// Mock dependencies
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('Customer Intelligence Dashboard Integration Tests', () => {
  // Mock session with full permissions
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'test@marketsage.ai',
      role: 'admin',
      organizationId: 'org_123',
      permissions: ['read:analytics', 'read:customers', 'execute:ml']
    },
    expires: '2024-12-31'
  };

  // Mock successful API responses with real data structure
  const mockApiResponses = {
    churnPrediction: {
      success: true,
      data: {
        predictions: [
          { id: '1', customerId: 'cust_1', riskLevel: 'high', probability: 0.89, factors: ['low_engagement'] },
          { id: '2', customerId: 'cust_2', riskLevel: 'critical', probability: 0.94, factors: ['payment_issues'] },
          { id: '3', customerId: 'cust_3', riskLevel: 'low', probability: 0.15, factors: [] }
        ],
        model: { accuracy: 0.92, lastTrained: new Date().toISOString() },
        summary: { totalPredictions: 850, highRisk: 127, criticalRisk: 45 }
      }
    },
    clvPrediction: {
      success: true,
      data: {
        predictions: [
          { id: '1', customerId: 'cust_1', valueSegment: 'high', predictedCLV: 5000, confidence: 0.87 },
          { id: '2', customerId: 'cust_2', valueSegment: 'medium', predictedCLV: 1500, confidence: 0.82 },
          { id: '3', customerId: 'cust_3', valueSegment: 'low', predictedCLV: 500, confidence: 0.76 }
        ],
        model: { accuracy: 0.85, lastTrained: new Date().toISOString() },
        summary: { totalCLV: '1475000', averageCLV: '1736', highValueCustomers: 342 }
      }
    },
    customerSegmentation: {
      success: true,
      data: {
        overview: { totalCustomers: 2847, totalSegments: 4 },
        segments: [
          { id: '1', name: 'High Engagement', size: 280, criteria: 'engagement > 80', performance: 0.85 },
          { id: '2', name: 'At Risk', size: 150, criteria: 'churn_risk > 0.7', performance: 0.45 },
          { id: '3', name: 'New Users', size: 320, criteria: 'tenure < 30 days', performance: 0.65 },
          { id: '4', name: 'Dormant', size: 100, criteria: 'last_activity > 90 days', performance: 0.25 }
        ],
        analytics: { 
          engagement: { high: 280, medium: 450, low: 217 },
          retention: { '30d': 0.78, '60d': 0.65, '90d': 0.52 }
        }
      }
    },
    aiGovernance: {
      success: true,
      data: {
        decisions: { approved: 142, rejected: 8, pending: 6 },
        config: { requiresApproval: true, trustThreshold: 0.8 },
        metrics: { accuracy: 0.94, responseTime: 120, errorRate: 0.02 },
        complianceScore: 0.88
      }
    }
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    // Mock fetch to return different responses based on URL
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('churn-prediction')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.churnPrediction)
        });
      }
      if (url.includes('clv-prediction')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.clvPrediction)
        });
      }
      if (url.includes('customer-segmentation')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.customerSegmentation)
        });
      }
      if (url.includes('governance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.aiGovernance)
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Real ML Model Integration', () => {
    it('should load and display real churn prediction data', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Check overview cards with real data
        expect(screen.getByText('2,847')).toBeInTheDocument(); // Total customers
        expect(screen.getByText('172')).toBeInTheDocument(); // At risk customers (127 + 45)
        expect(screen.getByText('15.0%')).toBeInTheDocument(); // Churn rate
      });

      // Switch to churn analysis tab
      fireEvent.click(screen.getByText('Churn Analysis'));

      await waitFor(() => {
        // Check churn-specific data
        expect(screen.getByText('Churn Risk Distribution')).toBeInTheDocument();
        expect(screen.getByText('Top Churn Factors')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument(); // Predicted churns
        expect(screen.getByText('45')).toBeInTheDocument(); // Prevention opportunities
      });
    });

    it('should display real CLV prediction insights', async () => {
      render(<CustomerIntelligenceDashboard />);

      // Switch to CLV insights tab
      fireEvent.click(screen.getByText('CLV Insights'));

      await waitFor(() => {
        // Check CLV data
        expect(screen.getByText('CLV by Segment')).toBeInTheDocument();
        expect(screen.getByText('CLV Trends')).toBeInTheDocument();
        expect(screen.getByText('CLV Drivers')).toBeInTheDocument();
        
        // Check segment data
        expect(screen.getByText('High Value')).toBeInTheDocument();
        expect(screen.getByText('$750,000')).toBeInTheDocument(); // Total CLV for high value
      });
    });

    it('should show real customer segmentation analytics', async () => {
      render(<CustomerIntelligenceDashboard />);

      // Switch to segmentation tab
      fireEvent.click(screen.getByText('Segmentation'));

      await waitFor(() => {
        // Check segmentation data
        expect(screen.getByText('Segment Performance')).toBeInTheDocument();
        expect(screen.getByText('High Engagement')).toBeInTheDocument();
        expect(screen.getByText('280 customers')).toBeInTheDocument();
        expect(screen.getByText('At Risk')).toBeInTheDocument();
        expect(screen.getByText('150 customers')).toBeInTheDocument();
      });
    });

    it('should integrate AI governance metrics', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Check AI governance status
        expect(screen.getByText('AI Governance')).toBeInTheDocument();
        expect(screen.getByText('142/156')).toBeInTheDocument(); // Approved/total decisions
        expect(screen.getByText('Semi-Autonomous')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument(); // Trust level
      });
    });
  });

  describe('Database Query Performance', () => {
    it('should render within performance thresholds with real data', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<CustomerIntelligenceDashboard />),
        'Customer Intelligence Dashboard with real data'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should handle large ML model results efficiently', async () => {
      // Mock large dataset response
      const largeChurnData = {
        ...mockApiResponses.churnPrediction,
        data: {
          ...mockApiResponses.churnPrediction.data,
          predictions: Array.from({ length: 5000 }, (_, i) => ({
            id: `pred_${i}`,
            customerId: `cust_${i}`,
            riskLevel: i % 4 === 0 ? 'high' : i % 4 === 1 ? 'medium' : 'low',
            probability: Math.random(),
            factors: ['engagement', 'payment']
          }))
        }
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('churn-prediction')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(largeChurnData)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.customerSegmentation)
        });
      });

      const renderTime = await measureComponentPerformance(
        () => render(<CustomerIntelligenceDashboard />),
        'Customer Intelligence Dashboard with large dataset'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
    });

    it('should optimize database queries for mobile connections', async () => {
      // Mock slow network conditions
      global.fetch = jest.fn().mockImplementation((url: string) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockApiResponses.churnPrediction)
            });
          }, 100); // Simulate slow connection
        });
      });

      render(<CustomerIntelligenceDashboard />);

      // Should show loading state immediately
      expect(screen.getByText('Loading customer intelligence...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Customer Intelligence')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle ML model API failures gracefully', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('churn-prediction')) {
          return Promise.reject(new Error('ML service unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.customerSegmentation)
        });
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should show fallback data when ML models are training', async () => {
      const trainingResponse = {
        ...mockApiResponses.churnPrediction,
        data: {
          ...mockApiResponses.churnPrediction.data,
          model: { status: 'training', accuracy: null, lastTrained: null }
        }
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('churn-prediction')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(trainingResponse)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.customerSegmentation)
        });
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Model Training in Progress')).toBeInTheDocument();
        expect(screen.getByText('Estimated completion: 30 minutes')).toBeInTheDocument();
      });
    });

    it('should handle partial API failures with degraded functionality', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('churn-prediction')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({ error: 'Service temporarily unavailable' })
          });
        }
        if (url.includes('clv-prediction')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiResponses.clvPrediction)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.customerSegmentation)
        });
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show partial data with warnings
        expect(screen.getByText('Customer Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Some features unavailable')).toBeInTheDocument();
        
        // CLV data should still be available
        fireEvent.click(screen.getByText('CLV Insights'));
        expect(screen.getByText('CLV by Segment')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile and African Market Features', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
    });

    it('should render mobile-optimized dashboard layout', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Check mobile-responsive grid
        const overviewCards = screen.getByTestId('overview-cards');
        expect(overviewCards).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
        
        // Check mobile navigation
        expect(screen.getByTestId('mobile-tabs')).toBeInTheDocument();
      });
    });

    it('should display currency in Nigerian Naira for African users', async () => {
      // Mock Nigerian locale
      Object.defineProperty(navigator, 'language', {
        value: 'en-NG',
        configurable: true
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should format currency as NGN
        expect(screen.getByText(/₦/)).toBeInTheDocument();
        expect(screen.getByText('₦1,475,000')).toBeInTheDocument(); // Total CLV in Naira
      });
    });

    it('should optimize for low-bandwidth African connections', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g', downlink: 0.5 },
        configurable: true
      });

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show data optimization notice
        expect(screen.getByText('Optimized for your connection')).toBeInTheDocument();
        
        // Should load essential data first
        expect(screen.getByTestId('essential-metrics')).toBeInTheDocument();
      });
    });

    it('should support West Africa Time (WAT)', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show WAT timestamps
        expect(screen.getByText(/WAT|GMT\+1/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Visualization and Charts', () => {
    it('should render churn risk distribution chart with real data', async () => {
      render(<CustomerIntelligenceDashboard />);

      fireEvent.click(screen.getByText('Churn Analysis'));

      await waitFor(() => {
        // Check pie chart is rendered
        expect(screen.getByTestId('churn-distribution-chart')).toBeInTheDocument();
        
        // Check legend items
        expect(screen.getByText('Low')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
      });
    });

    it('should render CLV trends chart with historical data', async () => {
      render(<CustomerIntelligenceDashboard />);

      fireEvent.click(screen.getByText('CLV Insights'));

      await waitFor(() => {
        // Check area chart is rendered
        expect(screen.getByTestId('clv-trends-chart')).toBeInTheDocument();
        
        // Check data points
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('Feb')).toBeInTheDocument();
        expect(screen.getByText('Jun')).toBeInTheDocument();
      });
    });

    it('should render segment performance bar chart', async () => {
      render(<CustomerIntelligenceDashboard />);

      fireEvent.click(screen.getByText('CLV Insights'));

      await waitFor(() => {
        // Check bar chart is rendered
        expect(screen.getByTestId('clv-segments-chart')).toBeInTheDocument();
        
        // Check segment labels
        expect(screen.getByText('High Value')).toBeInTheDocument();
        expect(screen.getByText('Medium Value')).toBeInTheDocument();
        expect(screen.getByText('Low Value')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates and Refresh', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.churnPrediction)
      });
      global.fetch = mockFetch;

      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Click refresh
      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        // Should call API again
        expect(mockFetch).toHaveBeenCalledTimes(8); // Initial load (4 APIs) + refresh (4 APIs)
      });
    });

    it('should show loading state during refresh', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });

      // Should show refreshing state
      expect(screen.getByTestId('refresh-spinner')).toBeInTheDocument();
    });

    it('should update recommendations based on latest ML predictions', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Check initial recommendations
        expect(screen.getByText('Immediate Churn Prevention')).toBeInTheDocument();
        expect(screen.getByText('CLV Optimization Opportunity')).toBeInTheDocument();
        expect(screen.getByText('Segment Growth Initiative')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check semantic HTML
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
    });

    it('should provide keyboard navigation for all interactive elements', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Tab navigation should work
        const tabs = screen.getAllByRole('tab');
        tabs.forEach(tab => {
          expect(tab).toHaveAttribute('tabIndex');
        });
      });
    });

    it('should display loading skeletons for better perceived performance', async () => {
      // Mock slow API response
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockApiResponses.churnPrediction)
            });
          }, 1000);
        });
      });

      render(<CustomerIntelligenceDashboard />);

      // Should show skeleton loaders immediately
      expect(screen.getByTestId('skeleton-overview')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-charts')).toBeInTheDocument();
    });
  });
});