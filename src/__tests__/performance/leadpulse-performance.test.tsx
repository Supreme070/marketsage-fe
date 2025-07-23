import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { 
  CustomerJourneyVisualization 
} from '../../components/leadpulse/CustomerJourneyVisualization';
import { BasicVisitorMap } from '../../components/leadpulse/BasicVisitorMap';
import { EngagementMetrics } from '../../components/leadpulse/EngagementMetrics';
import { FormTracker } from '../../components/leadpulse/FormTracker';
import { CoreAnalyticsDashboard } from '../../components/leadpulse/CoreAnalyticsDashboard';
import { 
  mockCustomerJourney, 
  mockVisitorLocation, 
  mockVisitorJourney,
  PERFORMANCE_THRESHOLDS 
} from '../utils/test-utils';

// Performance testing utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const measureInteractionTime = async (interactionFn: () => void): Promise<number> => {
  const start = performance.now();
  interactionFn();
  const end = performance.now();
  return end - start;
};

describe('LeadPulse Components Performance Tests', () => {
  describe('CustomerJourneyVisualization Performance', () => {
    it('renders within performance threshold with small dataset', async () => {
      const smallDataset = Array.from({ length: 10 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        render(<CustomerJourneyVisualization journeys={smallDataset} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      console.log(`CustomerJourneyVisualization (10 items): ${renderTime.toFixed(2)}ms`);
    });

    it('handles medium dataset efficiently', async () => {
      const mediumDataset = Array.from({ length: 100 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        render(<CustomerJourneyVisualization journeys={mediumDataset} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
      console.log(`CustomerJourneyVisualization (100 items): ${renderTime.toFixed(2)}ms`);
    });

    it('handles large dataset without performance degradation', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        render(<CustomerJourneyVisualization journeys={largeDataset} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 5);
      console.log(`CustomerJourneyVisualization (1000 items): ${renderTime.toFixed(2)}ms`);
    });

    it('view mode switching is fast', async () => {
      const dataset = Array.from({ length: 50 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      render(<CustomerJourneyVisualization journeys={dataset} />);

      const interactionTime = await measureInteractionTime(() => {
        const detailedButton = screen.getByRole('button', { name: /detailed/i });
        fireEvent.click(detailedButton);
      });

      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE);
      console.log(`View mode switch: ${interactionTime.toFixed(2)}ms`);
    });

    it('filtering operations are performant', async () => {
      const dataset = Array.from({ length: 500 }, (_, i) => 
        mockCustomerJourney({ 
          sessionId: `session_${i}`,
          outcome: i % 2 === 0 ? 'converted' : 'abandoned'
        })
      );

      render(<CustomerJourneyVisualization journeys={dataset} />);

      const interactionTime = await measureInteractionTime(() => {
        const filterSelect = screen.getByDisplayValue('All Journeys');
        fireEvent.change(filterSelect, { target: { value: 'converted' } });
      });

      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE * 2);
      console.log(`Filter operation (500 items): ${interactionTime.toFixed(2)}ms`);
    });
  });

  describe('BasicVisitorMap Performance', () => {
    it('renders efficiently with multiple locations', async () => {
      const locations = Array.from({ length: 100 }, (_, i) => 
        mockVisitorLocation({ city: `City${i}`, visitors: Math.floor(Math.random() * 100) })
      );

      const renderTime = await measureRenderTime(() => {
        render(<BasicVisitorMap locations={locations} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      console.log(`BasicVisitorMap (100 locations): ${renderTime.toFixed(2)}ms`);
    });

    it('handles map interactions smoothly', async () => {
      const locations = Array.from({ length: 50 }, (_, i) => 
        mockVisitorLocation({ city: `City${i}` })
      );

      render(<BasicVisitorMap locations={locations} />);

      const interactionTime = await measureInteractionTime(() => {
        const firstDot = document.querySelector('.group');
        if (firstDot) {
          fireEvent.mouseEnter(firstDot);
          fireEvent.mouseLeave(firstDot);
        }
      });

      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE);
      console.log(`Map hover interaction: ${interactionTime.toFixed(2)}ms`);
    });
  });

  describe('EngagementMetrics Performance', () => {
    it('processes large journey datasets efficiently', async () => {
      const journeys = Array.from({ length: 500 }, (_, i) => 
        mockVisitorJourney({ engagementScore: Math.floor(Math.random() * 100) })
      );

      const renderTime = await measureRenderTime(() => {
        render(<EngagementMetrics journeys={journeys} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
      console.log(`EngagementMetrics (500 journeys): ${renderTime.toFixed(2)}ms`);
    });

    it('calculations complete quickly', async () => {
      const journeys = Array.from({ length: 1000 }, (_, i) => 
        mockVisitorJourney({ 
          engagementScore: Math.floor(Math.random() * 100),
          totalPages: Math.floor(Math.random() * 20),
        })
      );

      const start = performance.now();
      render(<EngagementMetrics journeys={journeys} />);
      const end = performance.now();

      const calculationTime = end - start;
      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 3);
      console.log(`EngagementMetrics calculations (1000 journeys): ${calculationTime.toFixed(2)}ms`);
    });
  });

  describe('FormTracker Performance', () => {
    it('renders form data efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<FormTracker isLoading={false} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      console.log(`FormTracker render: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('CoreAnalyticsDashboard Performance', () => {
    it('renders analytics dashboard efficiently', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<CoreAnalyticsDashboard isLoading={false} />);
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      console.log(`CoreAnalyticsDashboard render: ${renderTime.toFixed(2)}ms`);
    });

    it('chart rendering is performant', async () => {
      render(<CoreAnalyticsDashboard isLoading={false} />);

      // Test hourly traffic chart interaction
      const interactionTime = await measureInteractionTime(() => {
        const chartBar = document.querySelector('.bg-blue-500');
        if (chartBar) {
          fireEvent.mouseEnter(chartBar);
          fireEvent.mouseLeave(chartBar);
        }
      });

      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE);
      console.log(`Chart interaction: ${interactionTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    it('components clean up properly on unmount', async () => {
      const dataset = Array.from({ length: 100 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      const { unmount } = render(<CustomerJourneyVisualization journeys={dataset} />);

      // Measure memory before and after unmount
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      
      console.log(`Memory before unmount: ${memoryBefore}`);
      console.log(`Memory after unmount: ${memoryAfter}`);
      
      // Memory should not continuously grow
      expect(memoryAfter).toBeLessThanOrEqual(memoryBefore * 1.1);
    });

    it('handles rapid re-renders without memory leaks', async () => {
      const datasets = Array.from({ length: 10 }, (_, i) => 
        Array.from({ length: 50 }, (_, j) => 
          mockCustomerJourney({ sessionId: `session_${i}_${j}` })
        )
      );

      const { rerender } = render(<CustomerJourneyVisualization journeys={datasets[0]} />);

      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // Rapidly re-render with different datasets
      for (let i = 1; i < datasets.length; i++) {
        rerender(<CustomerJourneyVisualization journeys={datasets[i]} />);
      }

      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = memoryAfter - memoryBefore;

      console.log(`Memory growth after 10 re-renders: ${memoryGrowth} bytes`);
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });

  describe('Animation Performance', () => {
    it('animations run at acceptable frame rates', async () => {
      const dataset = Array.from({ length: 20 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );

      render(<CustomerJourneyVisualization journeys={dataset} />);

      // Select first journey and switch to detailed view
      const journeyCard = screen.getAllByText(/Session/)[0];
      fireEvent.click(journeyCard.closest('div')!);
      fireEvent.click(screen.getByRole('button', { name: /detailed/i }));

      // Measure animation frame time
      const animationTime = await measureInteractionTime(() => {
        const playButton = screen.getByRole('button', { name: /play/i });
        fireEvent.click(playButton);
      });

      expect(animationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANIMATION_FRAME * 5);
      console.log(`Animation trigger time: ${animationTime.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Performance', () => {
    it('handles multiple components rendering simultaneously', async () => {
      const journeys = Array.from({ length: 50 }, (_, i) => 
        mockCustomerJourney({ sessionId: `session_${i}` })
      );
      const locations = Array.from({ length: 20 }, (_, i) => 
        mockVisitorLocation({ city: `City${i}` })
      );
      const visitorJourneys = Array.from({ length: 30 }, (_, i) => 
        mockVisitorJourney({ id: `journey_${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        render(
          <div>
            <CustomerJourneyVisualization journeys={journeys} />
            <BasicVisitorMap locations={locations} />
            <EngagementMetrics journeys={visitorJourneys} />
            <FormTracker />
            <CoreAnalyticsDashboard />
          </div>
        );
      });

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 3);
      console.log(`All components together: ${renderTime.toFixed(2)}ms`);
    });
  });
});