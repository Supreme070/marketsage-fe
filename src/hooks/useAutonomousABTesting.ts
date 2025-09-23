/**
 * Autonomous A/B Testing Hook
 * ===========================
 * React hook for easy integration with autonomous A/B testing engine
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface AutonomousTestConfiguration {
  id: string;
  name: string;
  type: 'email_campaign' | 'form_optimization' | 'landing_page' | 'workflow' | 'cross_channel';
  priority: 'low' | 'medium' | 'high' | 'critical';
  objectives: TestObjective[];
  constraints: TestConstraints;
  targetMetrics: TestMetric[];
  autoApprovalThreshold: number;
  maxTestDuration: number;
  minSampleSize: number;
  trafficAllocation: number;
  created: Date;
  status: 'pending' | 'designing' | 'waiting_approval' | 'running' | 'analyzing' | 'completed' | 'paused' | 'failed';
}

interface TestObjective {
  metric: 'conversion_rate' | 'open_rate' | 'click_rate' | 'revenue' | 'engagement_time' | 'form_completion';
  targetImprovement: number;
  weight: number;
  currentBaseline?: number;
}

interface TestConstraints {
  maxVariants: number;
  minTrafficPerVariant: number;
  excludeSegments?: string[];
  includeSegments?: string[];
  businessHours?: boolean;
  africanTimezones?: boolean;
  budgetLimit?: number;
  complianceRequirements?: string[];
}

interface TestMetric {
  name: string;
  type: 'primary' | 'secondary' | 'guardrail';
  threshold: number;
  direction: 'increase' | 'decrease' | 'maintain';
}

interface AutonomousTestingMetrics {
  activeTests: number;
  completedTests: number;
  averageImprovement: number;
  autoAppliedTests: number;
  successRate: number;
}

interface TestDesignRequest {
  campaignId?: string;
  formId?: string;
  workflowId?: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'form' | 'landing_page';
  objective: string;
  currentPerformance?: any;
  constraints?: Partial<TestConstraints>;
}

interface TestingOpportunity {
  score: number;
  recommendations: string[];
  estimatedImpact: number;
  testTypes: string[];
  priority: 'low' | 'medium' | 'high';
}

interface UseAutonomousABTestingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onTestComplete?: (testId: string, result: any) => void;
  onError?: (error: string) => void;
}

export function useAutonomousABTesting(options: UseAutonomousABTestingOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    onTestComplete,
    onError
  } = options;

  // State management
  const [activeTests, setActiveTests] = useState<AutonomousTestConfiguration[]>([]);
  const [metrics, setMetrics] = useState<AutonomousTestingMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler
  const handleError = useCallback((err: string) => {
    setError(err);
    if (onError) {
      onError(err);
    } else {
      toast.error(`Autonomous A/B Testing Error: ${err}`);
    }
  }, [onError]);

  // API call wrapper
  const makeApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const method = options.method || 'GET';
      const body = options.body;
      
      if (method === 'GET') {
        return await apiClient.get(`/ai/autonomous-ab-testing${endpoint}`);
      } else if (method === 'POST') {
        return await apiClient.post(`/ai/autonomous-ab-testing${endpoint}`, body ? JSON.parse(body as string) : undefined);
      } else if (method === 'PUT') {
        return await apiClient.put(`/ai/autonomous-ab-testing${endpoint}`, body ? JSON.parse(body as string) : undefined);
      } else if (method === 'DELETE') {
        return await apiClient.delete(`/ai/autonomous-ab-testing${endpoint}`);
      }
      
      throw new Error(`Unsupported method: ${method}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      handleError(errorMessage);
      throw err;
    }
  }, [handleError]);

  // Fetch active tests
  const fetchActiveTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tests = await makeApiCall('?type=active');
      setActiveTests(tests);
      return tests;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metricsData = await makeApiCall('?type=metrics');
      setMetrics(metricsData);
      return metricsData;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await makeApiCall('');
      setActiveTests(overview.activeTests);
      setMetrics(overview.metrics);
      return overview;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Request autonomous test
  const requestTest = useCallback(async (request: TestDesignRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'request_test',
          data: request
        }),
      });

      if (result.success) {
        toast.success(`Autonomous A/B test requested for ${request.channel} optimization`);
        // Refresh active tests
        await fetchActiveTests();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveTests]);

  // Pause test
  const pauseTest = useCallback(async (testId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pause_test',
          data: { testId }
        }),
      });

      if (result.success) {
        toast.success(`Test ${testId} paused successfully`);
        await fetchActiveTests();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveTests]);

  // Resume test
  const resumeTest = useCallback(async (testId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'resume_test',
          data: { testId }
        }),
      });

      if (result.success) {
        toast.success(`Test ${testId} resumed successfully`);
        await fetchActiveTests();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveTests]);

  // Analyze testing opportunity
  const analyzeOpportunity = useCallback(async (campaignData: any, performanceData?: any): Promise<TestingOpportunity | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'analyze_opportunity',
          data: { campaignData, performanceData }
        }),
      });

      if (result.success) {
        return result.opportunity;
      }

      return null;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Get test results
  const getTestResults = useCallback(async (testId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await makeApiCall(`?type=results&testId=${testId}`);
      return results;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Update test configuration
  const updateTestConfiguration = useCallback(async (testId: string, updates: Partial<AutonomousTestConfiguration>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'PUT',
        body: JSON.stringify({
          testId,
          updates
        }),
      });

      if (result.success) {
        toast.success('Test configuration updated successfully');
        await fetchActiveTests();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveTests]);

  // Quick test creation helpers
  const createEmailTest = useCallback(async (objective: string, campaignId?: string) => {
    return requestTest({
      channel: 'email',
      objective,
      campaignId,
      constraints: {
        africanTimezones: true,
        businessHours: true,
        maxVariants: 3
      }
    });
  }, [requestTest]);

  const createFormTest = useCallback(async (objective: string, formId?: string) => {
    return requestTest({
      channel: 'form',
      objective,
      formId,
      constraints: {
        africanTimezones: true,
        maxVariants: 2,
        minTrafficPerVariant: 20
      }
    });
  }, [requestTest]);

  const createLandingPageTest = useCallback(async (objective: string) => {
    return requestTest({
      channel: 'landing_page',
      objective,
      constraints: {
        africanTimezones: true,
        businessHours: true,
        maxVariants: 4
      }
    });
  }, [requestTest]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Test completion monitoring
  useEffect(() => {
    if (onTestComplete && activeTests.length > 0) {
      const completedTests = activeTests.filter(test => test.status === 'completed');
      completedTests.forEach(test => {
        onTestComplete(test.id, test);
      });
    }
  }, [activeTests, onTestComplete]);

  // Computed values
  const runningTests = activeTests.filter(test => test.status === 'running').length;
  const designingTests = activeTests.filter(test => test.status === 'designing').length;
  const pendingApprovalTests = activeTests.filter(test => test.status === 'waiting_approval').length;
  const completedTestsCount = metrics?.completedTests || 0;
  const successRate = metrics?.successRate || 0;
  const averageImprovement = metrics?.averageImprovement || 0;

  // Test status helpers
  const getTestsByStatus = useCallback((status: AutonomousTestConfiguration['status']) => {
    return activeTests.filter(test => test.status === status);
  }, [activeTests]);

  const getTestsByType = useCallback((type: AutonomousTestConfiguration['type']) => {
    return activeTests.filter(test => test.type === type);
  }, [activeTests]);

  const getTestsByPriority = useCallback((priority: AutonomousTestConfiguration['priority']) => {
    return activeTests.filter(test => test.priority === priority);
  }, [activeTests]);

  return {
    // Data
    activeTests,
    metrics,
    
    // Status
    loading,
    error,
    
    // Computed values
    runningTests,
    designingTests,
    pendingApprovalTests,
    completedTestsCount,
    successRate,
    averageImprovement,
    
    // Actions
    requestTest,
    pauseTest,
    resumeTest,
    analyzeOpportunity,
    getTestResults,
    updateTestConfiguration,
    
    // Quick actions
    createEmailTest,
    createFormTest,
    createLandingPageTest,
    
    // Data fetching
    fetchActiveTests,
    fetchMetrics,
    fetchAllData,
    
    // Helpers
    getTestsByStatus,
    getTestsByType,
    getTestsByPriority,
    
    // Utilities
    refresh: fetchAllData,
    clearError: () => setError(null),
  };
}