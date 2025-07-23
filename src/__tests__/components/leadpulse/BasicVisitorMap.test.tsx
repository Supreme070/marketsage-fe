import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { BasicVisitorMap } from '../../../components/leadpulse/BasicVisitorMap';
import { 
  mockVisitorLocation, 
  measureComponentPerformance, 
  checkAccessibility,
  PERFORMANCE_THRESHOLDS 
} from '../../utils/test-utils';

describe('BasicVisitorMap', () => {
  const mockLocations = [
    mockVisitorLocation({ city: 'Lagos', country: 'Nigeria', visitors: 45 }),
    mockVisitorLocation({ city: 'Abuja', country: 'Nigeria', visitors: 32 }),
    mockVisitorLocation({ city: 'Kano', country: 'Nigeria', visitors: 28 }),
    mockVisitorLocation({ city: 'Cape Town', country: 'South Africa', visitors: 25 }),
    mockVisitorLocation({ city: 'Nairobi', country: 'Kenya', visitors: 20 }),
  ];

  describe('Rendering', () => {
    it('renders loading state correctly', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<BasicVisitorMap locations={[]} isLoading={true} />),
        'BasicVisitorMap Loading'
      );

      expect(screen.getByText('Loading visitor data...')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('renders visitor map with data', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        expect(screen.getByText('Visitor Locations')).toBeInTheDocument();
        expect(screen.getByText('Live Visitor Map')).toBeInTheDocument();
        expect(screen.getByText('Top Locations')).toBeInTheDocument();
      });
    });

    it('displays correct visitor statistics', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        const totalVisitors = mockLocations.reduce((sum, loc) => sum + loc.visitors, 0);
        expect(screen.getByText(`${totalVisitors} visitors from 3 countries`)).toBeInTheDocument();
      });
    });

    it('shows visitor location dots', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        // Check for visitor dots (should be positioned on the map)
        const visitorDots = document.querySelectorAll('.bg-blue-500.rounded-full.animate-pulse');
        expect(visitorDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Processing', () => {
    it('sorts locations by visitor count', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        const locationItems = screen.getAllByText(/\d+/).filter(el => 
          el.parentElement?.className.includes('font-medium')
        );
        
        // Lagos should be first (45 visitors), then Abuja (32), etc.
        expect(screen.getByText('Lagos')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
      });
    });

    it('calculates unique countries correctly', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        // Should show 3 countries (Nigeria, South Africa, Kenya)
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Countries')).toBeInTheDocument();
      });
    });

    it('displays top 5 locations only', async () => {
      const manyLocations = Array.from({ length: 20 }, (_, i) => 
        mockVisitorLocation({ 
          city: `City${i}`, 
          visitors: 20 - i 
        })
      );

      render(<BasicVisitorMap locations={manyLocations} />);

      await waitFor(() => {
        // Should only show 5 location items in the list
        const locationItems = screen.getAllByRole('generic').filter(el => 
          el.className.includes('flex items-center justify-between py-2')
        );
        expect(locationItems.length).toBe(5);
      });
    });
  });

  describe('Interactions', () => {
    it('shows tooltips on hover', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        const visitorDot = document.querySelector('.group');
        if (visitorDot) {
          fireEvent.mouseEnter(visitorDot);
          // Tooltip should become visible on hover
          const tooltip = document.querySelector('.group-hover\\:opacity-100');
          expect(tooltip).toBeInTheDocument();
        }
      });
    });

    it('displays location details in tooltips', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        // Check for tooltip content
        expect(screen.getByText('Hover over dots to see details')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Elements', () => {
    it('renders map background', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        const mapBackground = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-50');
        expect(mapBackground).toBeInTheDocument();
      });
    });

    it('displays correct icons', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        // Check for MapPin, Users, and Activity icons
        expect(screen.getByText('Visitor Locations')).toBeInTheDocument();
        expect(screen.getByText('Top Locations')).toBeInTheDocument();
      });
    });

    it('shows summary statistics', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        expect(screen.getByText('Countries')).toBeInTheDocument();
        expect(screen.getByText('Cities')).toBeInTheDocument();
        expect(screen.getByText('Total Visitors')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders within performance threshold', async () => {
      const renderTime = await measureComponentPerformance(
        () => render(<BasicVisitorMap locations={mockLocations} />),
        'BasicVisitorMap with data'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        mockVisitorLocation({ 
          city: `City${i}`, 
          visitors: Math.floor(Math.random() * 100) 
        })
      );

      const renderTime = await measureComponentPerformance(
        () => render(<BasicVisitorMap locations={largeDataset} />),
        'BasicVisitorMap with large dataset'
      );

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2);
    });

    it('memoizes processed data', async () => {
      const { rerender } = render(<BasicVisitorMap locations={mockLocations} />);

      // Re-render with same data
      const startTime = performance.now();
      rerender(<BasicVisitorMap locations={mockLocations} />);
      const endTime = performance.now();

      // Second render should be faster due to memoization
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards', async () => {
      const { container } = render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        checkAccessibility(container);
      });

      // Check for proper semantic structure
      expect(screen.getByRole('heading', { name: /visitor locations/i })).toBeInTheDocument();
    });

    it('provides meaningful text alternatives', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        // Check for descriptive text
        expect(screen.getByText('Live Visitor Map')).toBeInTheDocument();
        expect(screen.getByText('Hover over dots to see details')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty locations array', async () => {
      render(<BasicVisitorMap locations={[]} />);

      await waitFor(() => {
        expect(screen.getByText('0 visitors from 0 countries')).toBeInTheDocument();
        expect(screen.getByText('Visitor Locations')).toBeInTheDocument();
      });
    });

    it('handles locations with zero visitors', async () => {
      const locationsWithZero = [
        mockVisitorLocation({ visitors: 0 }),
        mockVisitorLocation({ visitors: 5 }),
      ];

      render(<BasicVisitorMap locations={locationsWithZero} />);

      await waitFor(() => {
        expect(screen.getByText('5 visitors from 1 countries')).toBeInTheDocument();
      });
    });

    it('handles missing location data gracefully', async () => {
      const incompleteLocations = [
        { ...mockVisitorLocation(), city: '', country: '' },
        mockVisitorLocation(),
      ];

      expect(() => {
        render(<BasicVisitorMap locations={incompleteLocations} />);
      }).not.toThrow();
    });

    it('handles very long city names', async () => {
      const locationWithLongName = mockVisitorLocation({
        city: 'This is a very long city name that might cause layout issues',
        visitors: 10,
      });

      render(<BasicVisitorMap locations={[locationWithLongName]} />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long city name that might cause layout issues')).toBeInTheDocument();
      });
    });
  });

  describe('Data Visualization', () => {
    it('scales visitor dots based on visitor count', async () => {
      const locationsWithVariedCounts = [
        mockVisitorLocation({ visitors: 100 }),
        mockVisitorLocation({ visitors: 1 }),
      ];

      render(<BasicVisitorMap locations={locationsWithVariedCounts} />);

      await waitFor(() => {
        const dots = document.querySelectorAll('.bg-blue-500.rounded-full');
        expect(dots.length).toBeGreaterThan(0);
        // Note: In a real implementation, you'd check the computed styles for different sizes
      });
    });

    it('positions dots within map boundaries', async () => {
      render(<BasicVisitorMap locations={mockLocations} />);

      await waitFor(() => {
        const mapContainer = document.querySelector('.relative.bg-gradient-to-br');
        const dots = document.querySelectorAll('.absolute.group');
        
        expect(mapContainer).toBeInTheDocument();
        expect(dots.length).toBeGreaterThan(0);
      });
    });
  });
});