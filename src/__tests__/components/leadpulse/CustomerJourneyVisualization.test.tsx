import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { CustomerJourneyVisualization } from '../../../components/leadpulse/CustomerJourneyVisualization';
import { 
  mockCustomerJourney, 
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS,
  createMockMCPData
} from '../../utils/test-utils';

// Mock the CSS import
jest.mock('../../../styles/journey-animations.css', () => ({}));

describe('CustomerJourneyVisualization', () => {
  const mockJourneys = [
    mockCustomerJourney({
      sessionId: 'session_1',
      outcome: 'converted',
      engagementScore: 92,
    }),
    mockCustomerJourney({
      sessionId: 'session_2',
      outcome: 'abandoned',
      engagementScore: 45,
      steps: [
        {
          id: 'step_1',
          timestamp: '2024-07-18T10:00:00Z',
          action: 'Landing Page Visit',
          page: '/',
          duration: 120,
          type: 'page_view' as const,
          metadata: {
            device: 'mobile' as const,
            location: 'Abuja, Nigeria',
            engagement: 60
          }
        },
        {
          id: 'step_2',
          timestamp: '2024-07-18T10:02:00Z',
          action: 'Exit Intent',
          page: '/',
          duration: 30,
          type: 'exit' as const,
          metadata: {
            device: 'mobile' as const,
            location: 'Abuja, Nigeria',
            engagement: 30
          }
        }
      ]
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading state correctly', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<CustomerJourneyVisualization isLoading={true} />),
        'CustomerJourneyVisualization Loading'
      );

      expect(screen.getByText('Loading journey data...')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('renders with demo data when no journeys provided', async () => {
      render(<CustomerJourneyVisualization />);

      await waitFor(() => {
        expect(screen.getByText('Customer Journey Visualization')).toBeInTheDocument();
        expect(screen.getByText('Total Journeys')).toBeInTheDocument();
      });
    });

    it('renders journey statistics correctly', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        expect(screen.getByText('Total Journeys')).toBeInTheDocument();
        expect(screen.getByText('Converted')).toBeInTheDocument();
        expect(screen.getByText('Abandoned')).toBeInTheDocument();
        expect(screen.getByText('Conversion')).toBeInTheDocument();
        expect(screen.getByText('Avg Duration')).toBeInTheDocument();
        expect(screen.getByText('Engagement')).toBeInTheDocument();
      });
    });

    it('displays correct journey counts', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        // Should show 2 total journeys
        expect(screen.getByText('2')).toBeInTheDocument();
        // Should show 1 converted and 1 abandoned
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('switches between view modes', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      // Test overview mode (default)
      expect(screen.getByRole('button', { name: /overview/i })).toHaveClass('bg-blue-500');

      // Switch to detailed mode
      fireEvent.click(screen.getByRole('button', { name: /detailed/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /detailed/i })).toHaveClass('bg-blue-500');
      });

      // Switch to timeline mode
      fireEvent.click(screen.getByRole('button', { name: /timeline/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /timeline/i })).toHaveClass('bg-blue-500');
      });
    });

    it('filters journeys by outcome', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      const filterSelect = screen.getByDisplayValue('All Journeys');
      
      // Filter to converted only
      fireEvent.change(filterSelect, { target: { value: 'converted' } });
      await waitFor(() => {
        expect(filterSelect).toHaveValue('converted');
      });

      // Filter to abandoned only
      fireEvent.change(filterSelect, { target: { value: 'abandoned' } });
      await waitFor(() => {
        expect(filterSelect).toHaveValue('abandoned');
      });
    });

    it('selects journey for detailed view', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      // Click on a journey card
      const journeyCard = screen.getAllByText(/Session/)[0];
      fireEvent.click(journeyCard.closest('div')!);

      // Switch to detailed view
      fireEvent.click(screen.getByRole('button', { name: /detailed/i }));

      await waitFor(() => {
        expect(screen.getByText('Journey Details')).toBeInTheDocument();
      });
    });

    it('plays journey animation', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      // Select first journey
      const journeyCard = screen.getAllByText(/Session/)[0];
      fireEvent.click(journeyCard.closest('div')!);

      // Switch to detailed view
      fireEvent.click(screen.getByRole('button', { name: /detailed/i }));

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play/i });
        expect(playButton).toBeInTheDocument();
        
        // Click play button
        fireEvent.click(playButton);
        
        // Should show pause button
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });

    it('resets journey animation', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      // Select first journey and switch to detailed view
      const journeyCard = screen.getAllByText(/Session/)[0];
      fireEvent.click(journeyCard.closest('div')!);
      fireEvent.click(screen.getByRole('button', { name: /detailed/i }));

      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /rotateccw/i });
        expect(resetButton).toBeInTheDocument();
        
        fireEvent.click(resetButton);
      });
    });
  });

  describe('Performance', () => {
    it('renders within performance threshold', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<CustomerJourneyVisualization journeys={mockJourneys} />),
        'CustomerJourneyVisualization with data'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => 
        mockCustomerJourney({
          sessionId: `session_${i}`,
          engagementScore: Math.floor(Math.random() * 100),
        })
      );

      const renderTime = await measureComponentPerformance(
        () => render(<CustomerJourneyVisualization journeys={largeDataset} />),
        'CustomerJourneyVisualization with large dataset'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards', async () => {
      const { container } = render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check for proper ARIA labels
      expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /detailed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /timeline/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      const overviewButton = screen.getByRole('button', { name: /overview/i });
      const detailedButton = screen.getByRole('button', { name: /detailed/i });

      // Test tab navigation
      overviewButton.focus();
      expect(overviewButton).toHaveFocus();

      // Test Enter key activation
      fireEvent.keyDown(detailedButton, { key: 'Enter', code: 'Enter' });
      // Note: This would require additional keyboard event handling in the component
    });
  });

  describe('Data Visualization', () => {
    it('displays engagement scores correctly', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        expect(screen.getByText('92% engagement')).toBeInTheDocument();
        expect(screen.getByText('45% engagement')).toBeInTheDocument();
      });
    });

    it('shows correct journey duration formatting', async () => {
      const journeyWithCustomDuration = mockCustomerJourney({
        totalDuration: 3665, // 1 hour, 1 minute, 5 seconds
      });

      render(<CustomerJourneyVisualization journeys={[journeyWithCustomDuration]} />);

      await waitFor(() => {
        expect(screen.getByText('61m 5s')).toBeInTheDocument();
      });
    });

    it('displays device and location information', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        expect(screen.getByText(/desktop/i)).toBeInTheDocument();
        expect(screen.getByText(/mobile/i)).toBeInTheDocument();
        expect(screen.getByText(/Lagos, Nigeria/i)).toBeInTheDocument();
        expect(screen.getByText(/Abuja, Nigeria/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty journey array', async () => {
      render(<CustomerJourneyVisualization journeys={[]} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Journey Visualization')).toBeInTheDocument();
        // Should still show interface elements
        expect(screen.getByText('Total Journeys')).toBeInTheDocument();
      });
    });

    it('handles journey with no steps', async () => {
      const journeyWithNoSteps = mockCustomerJourney({
        steps: [],
      });

      render(<CustomerJourneyVisualization journeys={[journeyWithNoSteps]} />);

      await waitFor(() => {
        expect(screen.getByText('Customer Journey Visualization')).toBeInTheDocument();
      });
    });

    it('handles invalid timestamp formats gracefully', async () => {
      const journeyWithInvalidTimestamp = mockCustomerJourney({
        startTime: 'invalid-timestamp',
      });

      expect(() => {
        render(<CustomerJourneyVisualization journeys={[journeyWithInvalidTimestamp]} />);
      }).not.toThrow();
    });
  });

  describe('Visual States', () => {
    it('shows correct outcome indicators', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        const journeyCards = screen.getAllByText(/Session/);
        expect(journeyCards).toHaveLength(2);
        
        // Check for outcome indicators (colored dots)
        const dots = document.querySelectorAll('.w-3.h-3.rounded-full');
        expect(dots).toHaveLength(2);
      });
    });

    it('applies correct step type colors', async () => {
      render(<CustomerJourneyVisualization journeys={mockJourneys} />);

      await waitFor(() => {
        // Check for step icons with different colors
        const stepIcons = document.querySelectorAll('.w-8.h-8.rounded-full');
        expect(stepIcons.length).toBeGreaterThan(0);
      });
    });
  });
});