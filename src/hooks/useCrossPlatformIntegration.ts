/**
 * Cross-Platform Integration Hook
 * =============================
 * React hook for managing cross-platform integrations with African fintech APIs
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export interface CrossPlatformIntegration {
  id: string;
  organizationId: string;
  platformType: 'african_fintech' | 'global_payment' | 'communication' | 'crm' | 'ecommerce' | 'social_media' | 'analytics';
  platformName: string;
  providerId: string;
  displayName: string;
  description: string;
  isActive: boolean;
  healthStatus: 'healthy' | 'warning' | 'error' | 'maintenance';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AfricanFintechProvider {
  id: string;
  name: string;
  type: 'payment_gateway' | 'mobile_money' | 'banking_api' | 'remittance' | 'crypto';
  countries: string[];
  currencies: string[];
  paymentMethods: string[];
  features: string[];
  setupComplexity: 'simple' | 'moderate' | 'complex';
  monthlyVolumeLimits: {
    free?: number;
    paid?: number;
  };
}

export interface IntegrationRecommendations {
  recommended: AfricanFintechProvider[];
  reasons: string[];
  integrationPlan: string;
}

interface UseCrossPlatformIntegrationState {
  integrations: CrossPlatformIntegration[];
  providers: AfricanFintechProvider[];
  recommendations: IntegrationRecommendations | null;
  healthStats: {
    healthy: number;
    warning: number;
    error: number;
    maintenance: number;
  };
  isLoading: boolean;
  error: string | null;
}

export function useCrossPlatformIntegration() {
  const { data: session } = useSession();
  const [state, setState] = useState<UseCrossPlatformIntegrationState>({
    integrations: [],
    providers: [],
    recommendations: null,
    healthStats: {
      healthy: 0,
      warning: 0,
      error: 0,
      maintenance: 0
    },
    isLoading: false,
    error: null
  });

  /**
   * Fetch integrations data
   */
  const fetchIntegrations = useCallback(async () => {
    if (!session?.user?.organizationId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/integrations/cross-platform?action=integrations&organizationId=${session.user.organizationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const integrations = result.data || [];
        const healthStats = {
          healthy: integrations.filter((i: CrossPlatformIntegration) => i.healthStatus === 'healthy').length,
          warning: integrations.filter((i: CrossPlatformIntegration) => i.healthStatus === 'warning').length,
          error: integrations.filter((i: CrossPlatformIntegration) => i.healthStatus === 'error').length,
          maintenance: integrations.filter((i: CrossPlatformIntegration) => i.healthStatus === 'maintenance').length
        };

        setState(prev => ({
          ...prev,
          integrations,
          healthStats,
          isLoading: false
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch integrations');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to fetch integrations: ${errorMessage}`);
    }
  }, [session?.user?.organizationId]);

  /**
   * Fetch available providers
   */
  const fetchProviders = useCallback(async (country?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = new URL('/api/integrations/cross-platform', window.location.origin);
      url.searchParams.set('action', 'providers');
      if (country) {
        url.searchParams.set('country', country);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          providers: result.data.providers || [],
          isLoading: false
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch providers');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to fetch providers: ${errorMessage}`);
    }
  }, []);

  /**
   * Get AI-powered integration recommendations
   */
  const getRecommendations = useCallback(async (
    businessType = 'fintech',
    targetMarkets: string[] = ['nigeria']
  ) => {
    if (!session?.user?.organizationId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = new URL('/api/integrations/cross-platform', window.location.origin);
      url.searchParams.set('action', 'recommendations');
      url.searchParams.set('organizationId', session.user.organizationId);
      url.searchParams.set('businessType', businessType);
      url.searchParams.set('targetMarkets', targetMarkets.join(','));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          recommendations: result.data,
          isLoading: false
        }));
        toast.success('Integration recommendations generated successfully');
      } else {
        throw new Error(result.error || 'Failed to get recommendations');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to get recommendations: ${errorMessage}`);
    }
  }, [session?.user?.organizationId]);

  /**
   * Create new integration
   */
  const createIntegration = useCallback(async (
    providerId: string,
    credentials: Record<string, string>,
    configuration?: Record<string, any>,
    displayName?: string
  ) => {
    if (!session?.user?.organizationId) {
      toast.error('Organization not found');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/integrations/cross-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_integration',
          data: {
            providerId,
            credentials,
            configuration,
            displayName
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create integration: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Integration created successfully');
        // Refresh integrations list
        await fetchIntegrations();
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      } else {
        throw new Error(result.error || 'Failed to create integration');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to create integration: ${errorMessage}`);
      return false;
    }
  }, [session?.user?.organizationId, fetchIntegrations]);

  /**
   * Trigger integration sync
   */
  const triggerSync = useCallback(async (integrationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/integrations/cross-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger_sync',
          data: {
            integrationId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger sync: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Integration sync triggered successfully');
        // Refresh integrations list after a delay
        setTimeout(() => {
          fetchIntegrations();
        }, 2000);
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      } else {
        throw new Error(result.error || 'Failed to trigger sync');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to trigger sync: ${errorMessage}`);
      return false;
    }
  }, [fetchIntegrations]);

  /**
   * Test integration connectivity
   */
  const testIntegration = useCallback(async (integrationId: string, testType = 'connectivity') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/integrations/cross-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_integration',
          data: {
            testIntegrationId: integrationId,
            testType
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to test integration: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Integration test completed successfully');
        setState(prev => ({ ...prev, isLoading: false }));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to test integration');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to test integration: ${errorMessage}`);
      return null;
    }
  }, []);

  /**
   * Delete integration
   */
  const deleteIntegration = useCallback(async (integrationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/integrations/cross-platform?integrationId=${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete integration: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Integration deleted successfully');
        // Refresh integrations list
        await fetchIntegrations();
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete integration');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(`Failed to delete integration: ${errorMessage}`);
      return false;
    }
  }, [fetchIntegrations]);

  /**
   * Get integration health status
   */
  const getHealthStatus = useCallback(async () => {
    if (!session?.user?.organizationId) return;

    try {
      const response = await fetch(
        `/api/integrations/cross-platform?action=health_status&organizationId=${session.user.organizationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get health status: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          healthStats: result.data
        }));
      }
    } catch (error) {
      console.error('Failed to get health status:', error);
    }
  }, [session?.user?.organizationId]);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    if (session?.user?.organizationId) {
      fetchIntegrations();
      fetchProviders();
      getHealthStatus();
    }
  }, [session?.user?.organizationId, fetchIntegrations, fetchProviders, getHealthStatus]);

  /**
   * Refresh data periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.organizationId) {
        getHealthStatus();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [session?.user?.organizationId, getHealthStatus]);

  return {
    // State
    integrations: state.integrations,
    providers: state.providers,
    recommendations: state.recommendations,
    healthStats: state.healthStats,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    fetchIntegrations,
    fetchProviders,
    getRecommendations,
    createIntegration,
    triggerSync,
    testIntegration,
    deleteIntegration,
    getHealthStatus,

    // Computed values
    activeIntegrations: state.integrations.filter(i => i.isActive),
    totalIntegrations: state.integrations.length,
    healthyIntegrations: state.integrations.filter(i => i.healthStatus === 'healthy'),
    hasErrors: state.healthStats.error > 0,
    overallHealthy: state.healthStats.error === 0 && state.healthStats.warning === 0
  };
}

export default useCrossPlatformIntegration;