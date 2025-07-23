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

describe('African Market Mobile Compatibility Tests', () => {
  const mockSession = {
    user: {
      id: 'user_123',
      email: 'test@marketsage.ng',
      role: 'admin',
      organizationId: 'org_123',
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      currency: 'NGN'
    },
    expires: '2024-12-31'
  };

  // African-focused mock data
  const africanMockData = {
    ...createMockMCPData(),
    visitorLocations: [
      { id: 'loc_1', city: 'Lagos', country: 'Nigeria', visitors: 156, latitude: 6.5244, longitude: 3.3792 },
      { id: 'loc_2', city: 'Abuja', country: 'Nigeria', visitors: 89, latitude: 9.0579, longitude: 7.4951 },
      { id: 'loc_3', city: 'Kano', country: 'Nigeria', visitors: 67, latitude: 12.0022, longitude: 8.5919 },
      { id: 'loc_4', city: 'Cape Town', country: 'South Africa', visitors: 45, latitude: -33.9249, longitude: 18.4241 },
      { id: 'loc_5', city: 'Nairobi', country: 'Kenya', visitors: 38, latitude: -1.2921, longitude: 36.8219 },
      { id: 'loc_6', city: 'Accra', country: 'Ghana', visitors: 32, latitude: 5.6037, longitude: -0.1870 },
      { id: 'loc_7', city: 'Cairo', country: 'Egypt', visitors: 28, latitude: 30.0444, longitude: 31.2357 }
    ],
    analytics: {
      currencies: { NGN: 450000, ZAR: 125000, KES: 89000, GHS: 45000, EGP: 32000 },
      timezones: { 'Africa/Lagos': 156, 'Africa/Johannesburg': 45, 'Africa/Nairobi': 38 },
      languages: { 'en-NG': 245, 'en-ZA': 67, 'sw-KE': 23, 'fr-CI': 18 },
      devices: { mobile: 0.78, desktop: 0.18, tablet: 0.04 },
      networks: { '2G': 0.12, '3G': 0.45, '4G': 0.38, '5G': 0.05 }
    }
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });

    mockUseMCPLeadPulse.mockReturnValue(africanMockData);

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

    // Mock touch device
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true
    });

    // Mock Nigerian network conditions
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '3g',
        downlink: 1.5,
        rtt: 300,
        saveData: false
      },
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Layout Optimization', () => {
    it('should render mobile-first responsive layout for LeadPulse', async () => {
      render(<LiveVisitorMap />);

      await waitFor(() => {
        const mapContainer = screen.getByTestId('visitor-map');
        expect(mapContainer).toHaveClass('mobile-responsive');
        
        // Check mobile grid layout
        const locationList = screen.getByTestId('location-list');
        expect(locationList).toHaveClass('grid-cols-1');
        
        // Mobile-specific components should be visible
        expect(screen.getByTestId('mobile-stats')).toBeInTheDocument();
        expect(screen.getByTestId('touch-controls')).toBeInTheDocument();
      });
    });

    it('should optimize dashboard layout for mobile screens', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Metrics should stack vertically on mobile
        const metricsGrid = screen.getByTestId('metrics-grid');
        expect(metricsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
        
        // Charts should be mobile-optimized
        const charts = screen.getAllByTestId(/chart$/);
        charts.forEach(chart => {
          expect(chart).toHaveClass('mobile-chart');
          expect(chart).toHaveAttribute('data-mobile', 'true');
        });
      });
    });

    it('should provide touch-friendly interactions', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Buttons should be touch-friendly (minimum 44px)
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          const minSize = parseInt(styles.minHeight) || parseInt(styles.height);
          expect(minSize).toBeGreaterThanOrEqual(44);
        });
        
        // Touch targets should have proper spacing
        const cards = screen.getAllByTestId('metric-card');
        cards.forEach(card => {
          expect(card).toHaveClass('touch-friendly');
        });
      });
    });

    it('should hide non-essential elements on small screens', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Secondary information should be hidden on mobile
        expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
        expect(screen.queryByTestId('secondary-metrics')).not.toBeInTheDocument();
        
        // Essential content should remain visible
        expect(screen.getByTestId('primary-metrics')).toBeInTheDocument();
        expect(screen.getByTestId('main-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('African Currency and Localization', () => {
    it('should display currencies in Nigerian Naira by default', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should show NGN currency symbols
        expect(screen.getByText(/₦/)).toBeInTheDocument();
        expect(screen.getByText('₦450,000')).toBeInTheDocument(); // Revenue in Naira
        
        // Currency selector should show NGN as default
        const currencySelector = screen.getByTestId('currency-selector');
        expect(currencySelector).toHaveValue('NGN');
      });
    });

    it('should support multiple African currencies', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        const currencySelector = screen.getByTestId('currency-selector');
        fireEvent.change(currencySelector, { target: { value: 'ZAR' } });
      });

      await waitFor(() => {
        // Should convert and display in South African Rand
        expect(screen.getByText(/R/)).toBeInTheDocument();
        expect(screen.getByText('R125,000')).toBeInTheDocument();
      });
    });

    it('should display timestamps in West Africa Time (WAT)', async () => {
      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show WAT timezone
        expect(screen.getByText(/WAT|GMT\+1/)).toBeInTheDocument();
        
        // Time should be formatted for Nigerian locale
        const timestamps = screen.getAllByTestId('timestamp');
        timestamps.forEach(timestamp => {
          expect(timestamp.textContent).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)\s*WAT/);
        });
      });
    });

    it('should support multiple African languages', async () => {
      // Mock Hausa language preference
      Object.defineProperty(navigator, 'languages', {
        value: ['ha', 'en-NG', 'en'],
        configurable: true
      });

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should show language selector
        expect(screen.getByTestId('language-selector')).toBeInTheDocument();
        
        // Should support internationalization
        expect(screen.getByTestId('i18n-ready')).toBeInTheDocument();
      });
    });
  });

  describe('Network Optimization for African Connections', () => {
    it('should optimize for 3G connections', async () => {
      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show network optimization indicator
        expect(screen.getByText('Optimized for 3G')).toBeInTheDocument();
        
        // Should load essential data first
        expect(screen.getByTestId('essential-data')).toBeInTheDocument();
        expect(screen.getByText('Loading additional data...')).toBeInTheDocument();
      });
    });

    it('should implement progressive data loading', async () => {
      render(<CoreAnalyticsDashboard />);

      // Should show core metrics immediately
      expect(screen.getByTestId('core-metrics')).toBeInTheDocument();
      
      await waitFor(() => {
        // Secondary data should load progressively
        expect(screen.getByTestId('secondary-charts')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should compress data for low-bandwidth connections', async () => {
      // Mock 2G connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.25,
          rtt: 800,
          saveData: true
        },
        configurable: true
      });

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should show data compression notice
        expect(screen.getByText('Data Saver Mode')).toBeInTheDocument();
        expect(screen.getByText('Reduced data usage')).toBeInTheDocument();
        
        // Should load compressed/reduced dataset
        const insights = screen.getAllByTestId('ai-insight');
        expect(insights.length).toBeLessThanOrEqual(3); // Limited insights for 2G
      });
    });

    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });

      const offlineData = {
        ...africanMockData,
        cached: true,
        lastSync: new Date(Date.now() - 300000) // 5 minutes ago
      };
      mockUseMCPLeadPulse.mockReturnValue(offlineData);

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should show offline indicator
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
        expect(screen.getByText('Cached Data (5 min ago)')).toBeInTheDocument();
        
        // Should still show cached data
        expect(screen.getByText('Lagos')).toBeInTheDocument();
        expect(screen.getByText('156')).toBeInTheDocument();
      });
    });
  });

  describe('African Market Specific Features', () => {
    it('should prioritize Nigerian cities in location displays', async () => {
      render(<LiveVisitorMap />);

      await waitFor(() => {
        const locationItems = screen.getAllByTestId('location-item');
        
        // Lagos should be first (highest visitor count)
        expect(locationItems[0]).toHaveTextContent('Lagos');
        expect(locationItems[0]).toHaveTextContent('156');
        
        // Nigerian cities should be grouped at the top
        expect(locationItems[1]).toHaveTextContent('Abuja');
        expect(locationItems[2]).toHaveTextContent('Kano');
      });
    });

    it('should show African business hours awareness', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should indicate peak business hours for African markets
        expect(screen.getByText('Peak Hours: 9 AM - 6 PM WAT')).toBeInTheDocument();
        expect(screen.getByTestId('business-hours-indicator')).toBeInTheDocument();
      });
    });

    it('should display mobile money payment preferences', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should show mobile money options
        expect(screen.getByText('M-Pesa')).toBeInTheDocument();
        expect(screen.getByText('Flutterwave')).toBeInTheDocument();
        expect(screen.getByText('Paystack')).toBeInTheDocument();
        
        // Should prioritize mobile payments
        const paymentMethods = screen.getByTestId('payment-methods');
        expect(paymentMethods.textContent).toMatch(/Mobile.*Card/);
      });
    });

    it('should adapt to high mobile usage patterns', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should show mobile-first insights
        expect(screen.getByText('78% mobile traffic')).toBeInTheDocument();
        expect(screen.getByText('Mobile optimization recommended')).toBeInTheDocument();
        
        // Should prioritize mobile-relevant metrics
        const mobileMetrics = screen.getByTestId('mobile-metrics');
        expect(mobileMetrics).toBeInTheDocument();
      });
    });
  });

  describe('Performance on Mobile Devices', () => {
    it('should meet mobile performance thresholds', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<LiveVisitorMap />),
        'LiveVisitorMap on mobile'
      );

      // Mobile should render within stricter thresholds
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 0.8);
    });

    it('should optimize image and asset loading', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Images should be optimized for mobile
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('loading', 'lazy');
          expect(img).toHaveAttribute('decoding', 'async');
        });
      });
    });

    it('should implement efficient virtual scrolling for large lists', async () => {
      const largeMobileData = {
        ...africanMockData,
        visitorJourneys: Array.from({ length: 500 }, (_, i) => ({
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
      mockUseMCPLeadPulse.mockReturnValue(largeMobileData);

      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should implement virtual scrolling
        const virtualList = screen.getByTestId('virtual-list');
        expect(virtualList).toBeInTheDocument();
        
        // Should only render visible items
        const visibleItems = screen.getAllByTestId('journey-item');
        expect(visibleItems.length).toBeLessThanOrEqual(20); // Limited for performance
      });
    });

    it('should minimize JavaScript bundle size for mobile', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Should lazy load non-critical components
        expect(screen.getByTestId('lazy-loaded-charts')).toBeInTheDocument();
        
        // Should use code splitting
        expect(screen.getByTestId('bundle-optimized')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain accessibility on touch devices', async () => {
      const { container } = render(<LiveVisitorMap />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Touch targets should be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).not.toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should support screen readers on mobile', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should have proper ARIA labels
        expect(screen.getByLabelText('Analytics dashboard')).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
        
        // Live regions for dynamic content
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('should provide keyboard navigation alternatives', async () => {
      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should support keyboard navigation even on touch devices
        const focusableElements = screen.getAllByRole('button');
        focusableElements.forEach(element => {
          expect(element).toHaveAttribute('tabIndex');
        });
      });
    });

    it('should scale text appropriately for mobile viewing', async () => {
      render(<CustomerIntelligenceDashboard />);

      await waitFor(() => {
        // Text should be readable on mobile (minimum 16px)
        const textElements = screen.getAllByTestId('readable-text');
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const fontSize = parseInt(styles.fontSize);
          expect(fontSize).toBeGreaterThanOrEqual(16);
        });
      });
    });
  });

  describe('Data Usage Optimization', () => {
    it('should track and display data usage', async () => {
      render(<CoreAnalyticsDashboard />);

      await waitFor(() => {
        // Should show data usage indicator
        expect(screen.getByTestId('data-usage')).toBeInTheDocument();
        expect(screen.getByText(/Data used:/)).toBeInTheDocument();
      });
    });

    it('should offer data-lite mode for African users', async () => {
      // Enable data saver mode
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          saveData: true
        },
        configurable: true
      });

      render(<LiveVisitorMap />);

      await waitFor(() => {
        // Should automatically enable data-lite mode
        expect(screen.getByText('Data-Lite Mode Active')).toBeInTheDocument();
        expect(screen.getByText('Reduced animations')).toBeInTheDocument();
        expect(screen.getByText('Compressed images')).toBeInTheDocument();
      });
    });

    it('should cache data efficiently for repeat visits', async () => {
      const cachedData = {
        ...africanMockData,
        cached: true,
        cacheSize: '2.3 MB',
        lastUpdate: new Date()
      };
      mockUseMCPLeadPulse.mockReturnValue(cachedData);

      render(<AIIntelligenceDashboard />);

      await waitFor(() => {
        // Should show cache status
        expect(screen.getByText('Using cached data')).toBeInTheDocument();
        expect(screen.getByText('2.3 MB saved')).toBeInTheDocument();
      });
    });
  });
});