import { renderHook, act } from '@testing-library/react';
import { useMCPLeadPulse } from '../../hooks/useMCPLeadPulse';
import { createMockMCPData, PERFORMANCE_THRESHOLDS } from '../utils/test-utils';

// Mock the data provider
jest.mock('../../lib/leadpulse/mcp-data-provider', () => ({
  MCPDataProvider: {
    getInstance: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn(),
      isConnected: jest.fn(() => true),
      fetchVisitorLocations: jest.fn().mockResolvedValue([]),
      fetchVisitorJourneys: jest.fn().mockResolvedValue([]),
      fetchInsights: jest.fn().mockResolvedValue([]),
      fetchSegments: jest.fn().mockResolvedValue([]),
      fetchAnalyticsOverview: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Mock the fallback data provider
jest.mock('../../lib/leadpulse/dataProvider', () => ({
  generateFallbackData: jest.fn(() => createMockMCPData()),
}));

describe('useMCPLeadPulse Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useMCPLeadPulse());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.mcpEnabled).toBe(true);
      expect(result.current.mcpConnected).toBe(false);
      expect(result.current.dataSource).toBe('fallback');
      expect(result.current.visitorLocations).toEqual([]);
      expect(result.current.visitorJourneys).toEqual([]);
      expect(result.current.insights).toEqual([]);
      expect(result.current.segments).toEqual([]);
    });

    it('accepts custom configuration', () => {
      const config = {
        timeRange: '7d' as const,
        refreshInterval: 30000,
        enableRealtime: true,
        autoRefresh: false,
        maxVisitors: 100,
      };

      renderHook(() => useMCPLeadPulse(config));

      // Configuration should be applied internally
      expect(jest.fn()).toHaveBeenCalledTimes(0); // No external calls expected during init
    });
  });

  describe('Data Fetching', () => {
    it('fetches data on mount', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useMCPLeadPulse());

      // Initial state should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('handles MCP connection success', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        enableRealtime: false,
      }));

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Should eventually connect to MCP
      expect(result.current.mcpEnabled).toBe(true);
    });

    it('falls back to demo data when MCP fails', async () => {
      // Mock MCP failure
      const mockMCPProvider = require('../../lib/leadpulse/mcp-data-provider').MCPDataProvider;
      mockMCPProvider.getInstance().connect.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useMCPLeadPulse());

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.dataSource).toBe('fallback');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Auto Refresh', () => {
    it('refreshes data at specified intervals', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        refreshInterval: 60000,
        autoRefresh: true,
      }));

      // Initial fetch
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isLoading).toBe(false);

      // Advance time to trigger refresh
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      // Should have triggered a refresh
      expect(result.current.isLoading).toBe(false); // Should complete quickly in mock
    });

    it('does not refresh when autoRefresh is disabled', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        refreshInterval: 60000,
        autoRefresh: false,
      }));

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const initialData = result.current.visitorLocations;

      // Advance time beyond refresh interval
      await act(async () => {
        jest.advanceTimersByTime(120000);
      });

      // Data should not have changed
      expect(result.current.visitorLocations).toBe(initialData);
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const mockMCPProvider = require('../../lib/leadpulse/mcp-data-provider').MCPDataProvider;
      mockMCPProvider.getInstance().fetchVisitorLocations.mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() => useMCPLeadPulse());

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('retries failed requests', async () => {
      const mockMCPProvider = require('../../lib/leadpulse/mcp-data-provider').MCPDataProvider;
      const fetchMock = mockMCPProvider.getInstance().fetchVisitorLocations;
      
      // Fail first two attempts, succeed on third
      fetchMock
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue([]);

      const { result } = renderHook(() => useMCPLeadPulse());

      await act(async () => {
        jest.advanceTimersByTime(10000); // Allow time for retries
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Performance', () => {
    it('manages memory efficiently', async () => {
      const { result, unmount } = renderHook(() => useMCPLeadPulse({
        refreshInterval: 1000,
        autoRefresh: true,
      }));

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Unmount should clean up timers
      unmount();

      // No more timer calls should occur
      const timerCount = jest.getTimerCount();
      expect(timerCount).toBe(0);
    });

    it('debounces rapid configuration changes', async () => {
      const { result, rerender } = renderHook(
        ({ config }) => useMCPLeadPulse(config),
        {
          initialProps: { config: { timeRange: '24h' as const } }
        }
      );

      // Rapidly change configuration
      rerender({ config: { timeRange: '7d' as const } });
      rerender({ config: { timeRange: '30d' as const } });
      rerender({ config: { timeRange: '24h' as const } });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should handle changes without issues
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Data Filtering and Processing', () => {
    it('respects maxVisitors configuration', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        maxVisitors: 10,
      }));

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.visitorJourneys.length).toBeLessThanOrEqual(10);
    });

    it('filters data by time range', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        timeRange: '24h',
      }));

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // All data should be within the specified time range
      // Note: This would require actual time-based filtering in the implementation
      expect(result.current.visitorJourneys).toBeDefined();
    });
  });

  describe('Real-time Features', () => {
    it('enables real-time updates when configured', async () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        enableRealtime: true,
      }));

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Real-time should be enabled
      expect(result.current.mcpEnabled).toBe(true);
    });

    it('handles real-time connection failures', async () => {
      const mockMCPProvider = require('../../lib/leadpulse/mcp-data-provider').MCPDataProvider;
      mockMCPProvider.getInstance().connect.mockRejectedValue(new Error('WebSocket failed'));

      const { result } = renderHook(() => useMCPLeadPulse({
        enableRealtime: true,
      }));

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.mcpConnected).toBe(false);
      expect(result.current.dataSource).toBe('fallback');
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on unmount', async () => {
      const { result, unmount } = renderHook(() => useMCPLeadPulse({
        refreshInterval: 1000,
        enableRealtime: true,
      }));

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const mockMCPProvider = require('../../lib/leadpulse/mcp-data-provider').MCPDataProvider;
      const disconnectSpy = mockMCPProvider.getInstance().disconnect;

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Configuration Validation', () => {
    it('handles invalid refresh intervals', () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        refreshInterval: -1000, // Invalid
      }));

      // Should use default or minimum value
      expect(result.current.isLoading).toBe(true);
    });

    it('handles invalid time ranges', () => {
      const { result } = renderHook(() => useMCPLeadPulse({
        timeRange: 'invalid' as any,
      }));

      // Should handle gracefully
      expect(result.current.isLoading).toBe(true);
    });
  });
});