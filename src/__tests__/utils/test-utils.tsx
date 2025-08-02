import type React from 'react';
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data generators for testing
export const mockVisitorLocation = (overrides = {}) => ({
  id: 'loc_123',
  city: 'Lagos',
  country: 'Nigeria',
  visitors: 42,
  latitude: 6.5244,
  longitude: 3.3792,
  ...overrides,
});

export const mockVisitorJourney = (overrides = {}) => ({
  id: 'journey_123',
  visitorId: 'visitor_123',
  sessionId: 'session_123',
  startTime: '2024-07-18T10:00:00Z',
  endTime: '2024-07-18T10:30:00Z',
  totalPages: 5,
  engagementScore: 85,
  conversionEvents: [],
  pulseData: [
    {
      id: 'pulse_1',
      timestamp: '2024-07-18T10:00:00Z',
      type: 'PAGE_VIEW' as const,
      value: 120,
      metadata: { page: '/', device: 'desktop' }
    }
  ],
  ...overrides,
});

export const mockCustomerJourney = (overrides = {}) => ({
  visitorId: 'visitor_123',
  sessionId: 'session_123',
  startTime: '2024-07-18T10:00:00Z',
  endTime: '2024-07-18T10:30:00Z',
  totalDuration: 1800,
  outcome: 'converted' as const,
  value: 299,
  engagementScore: 85,
  steps: [
    {
      id: 'step_1',
      timestamp: '2024-07-18T10:00:00Z',
      action: 'Landing Page Visit',
      page: '/',
      duration: 120,
      type: 'page_view' as const,
      metadata: {
        device: 'desktop' as const,
        location: 'Lagos, Nigeria',
        engagement: 85
      }
    }
  ],
  ...overrides,
});

export const mockAnalyticsOverview = (overrides = {}) => ({
  activeVisitors: 23,
  totalVisitors: 1547,
  bounceRate: 32,
  averageSessionDuration: 245,
  conversionRate: 4.2,
  engagementScore: 78,
  topPages: ['/features', '/pricing', '/'],
  topSources: ['direct', 'google', 'social'],
  ...overrides,
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Performance testing utilities
export const measureComponentPerformance = async (
  componentRender: () => Promise<void> | void,
  name: string
) => {
  const startTime = performance.now();
  await componentRender();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`${name} render time: ${duration.toFixed(2)}ms`);
  
  // Assert performance thresholds
  expect(duration).toBeLessThan(100); // Components should render in < 100ms
  
  return duration;
};

// Accessibility testing helper
export const checkAccessibility = async (container: HTMLElement) => {
  // Check for basic accessibility attributes
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]'
  );
  
  interactiveElements.forEach(element => {
    // Check for accessible names
    const hasAccessibleName = 
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      (element as HTMLInputElement).placeholder;
    
    if (!hasAccessibleName) {
      console.warn('Interactive element missing accessible name:', element);
    }
  });
  
  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach(heading => {
    const level = Number.parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      console.warn('Heading hierarchy skipped level:', heading);
    }
    previousLevel = level;
  });
};

// Mock hook factory
export const createMockHook = <T,>(defaultValue: T) => {
  let mockReturnValue = defaultValue;
  
  const mockHook = jest.fn(() => mockReturnValue);
  
  mockHook.mockReturnValue = (value: T) => {
    mockReturnValue = value;
  };
  
  return mockHook;
};

// Wait for component to stabilize (useful for async components)
export const waitForComponentToStabilize = async (timeout = 1000) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

// Mock data providers
export const createMockMCPData = () => ({
  visitorLocations: [
    mockVisitorLocation({ city: 'Lagos', visitors: 45 }),
    mockVisitorLocation({ city: 'Abuja', visitors: 32 }),
    mockVisitorLocation({ city: 'Kano', visitors: 28 }),
  ],
  visitorJourneys: [
    mockVisitorJourney({ engagementScore: 92 }),
    mockVisitorJourney({ engagementScore: 76 }),
    mockVisitorJourney({ engagementScore: 84 }),
  ],
  insights: [
    { id: '1', type: 'engagement', message: 'High engagement detected' },
    { id: '2', type: 'conversion', message: 'Conversion rate improved' },
  ],
  segments: [
    { id: '1', name: 'High Value Visitors', count: 234 },
    { id: '2', name: 'New Visitors', count: 567 },
  ],
  analyticsOverview: mockAnalyticsOverview(),
  isLoading: false,
  error: null,
  dataSource: 'mcp' as const,
  mcpEnabled: true,
  mcpConnected: true,
});

// Performance benchmarks
export const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 100, // ms
  DATA_FETCH: 500, // ms
  INTERACTION_RESPONSE: 50, // ms
  ANIMATION_FRAME: 16.67, // ms (60fps)
};

// Test data constants
export const TEST_CONSTANTS = {
  MOCK_SESSION_ID: 'test_session_123',
  MOCK_VISITOR_ID: 'test_visitor_456',
  MOCK_TIMESTAMP: '2024-07-18T10:00:00Z',
  MOCK_LOCATIONS: ['Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria'],
  MOCK_DEVICES: ['desktop', 'mobile', 'tablet'] as const,
};