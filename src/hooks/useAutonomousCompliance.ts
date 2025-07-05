/**
 * React Hook for Autonomous Compliance Monitoring
 * =============================================
 * 
 * Hook for interacting with the autonomous compliance monitoring system
 * Provides real-time compliance data, violations, and remediation capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export interface ComplianceFramework {
  id: string;
  name: string;
  country: 'Nigeria' | 'South Africa' | 'Kenya' | 'Ghana' | 'Zimbabwe' | 'Uganda' | 'Tanzania' | 'Rwanda';
  type: 'data_protection' | 'financial_services' | 'telecommunications' | 'consumer_protection' | 'anti_money_laundering';
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: string;
  nextAssessment: string;
}

export interface ComplianceViolation {
  id: string;
  frameworkId: string;
  regulationId: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'remediated' | 'false_positive' | 'accepted_risk';
  description: string;
  detectedAt: string;
  assignedTo?: string;
  dueDate?: string;
  resolved?: boolean;
}

export interface ComplianceOverview {
  score: number;
  status: 'compliant' | 'partial' | 'non_compliant';
  frameworks: number;
  activeViolations: number;
  criticalViolations: number;
  africanMarketsCovered: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: string;
  nextAssessment: string;
  capabilities: {
    autonomousMonitoring: boolean;
    africanRegulations: boolean;
    realTimeAlerts: boolean;
    autoRemediation: boolean;
    complianceReporting: boolean;
  };
}

export interface ComplianceReport {
  id: string;
  frameworkId: string;
  reportType: 'assessment' | 'violation' | 'remediation' | 'dashboard' | 'audit';
  period: {
    start: string;
    end: string;
  };
  overallScore: number;
  compliance: {
    compliant: number;
    nonCompliant: number;
    partiallyCompliant: number;
    notApplicable: number;
  };
  violations: ComplianceViolation[];
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    title: string;
    description: string;
    estimatedImpact: number;
    estimatedEffort: string;
    estimatedCost?: number;
    autoImplementable: boolean;
  }>;
  generatedAt: string;
  generatedBy: 'system' | 'user' | 'scheduled';
}

export interface UseAutonomousComplianceState {
  // Data
  overview: ComplianceOverview | null;
  frameworks: ComplianceFramework[];
  violations: ComplianceViolation[];
  reports: ComplianceReport[];
  
  // Loading states
  isLoading: boolean;
  isLoadingFrameworks: boolean;
  isLoadingViolations: boolean;
  isLoadingReports: boolean;
  
  // Action states
  isTriggering: boolean;
  isAcknowledging: boolean;
  isRequestingRemediation: boolean;
  isGeneratingReport: boolean;
  
  // Error states
  error: string | null;
}

export interface UseAutonomousComplianceActions {
  // Data fetching
  fetchOverview: () => Promise<void>;
  fetchFrameworks: () => Promise<void>;
  fetchViolations: (frameworkId?: string) => Promise<void>;
  fetchReports: () => Promise<void>;
  
  // Compliance actions
  triggerAssessment: (frameworkId?: string, assessmentType?: 'quick' | 'comprehensive') => Promise<{ success: boolean; message: string; assessmentId?: string }>;
  acknowledgeViolation: (violationId: string, acknowledgment?: string) => Promise<{ success: boolean; message: string }>;
  requestRemediation: (violationId: string, priority?: 'low' | 'medium' | 'high' | 'critical') => Promise<{ success: boolean; message: string; remediationId?: string }>;
  updateFramework: (frameworkId: string, enabled?: boolean, riskLevel?: string) => Promise<{ success: boolean; message: string }>;
  generateReport: (reportType?: string, frameworkId?: string) => Promise<{ success: boolean; message: string; report?: ComplianceReport }>;
  
  // Utility actions
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useAutonomousCompliance(): UseAutonomousComplianceState & UseAutonomousComplianceActions {
  const { data: session } = useSession();
  const [state, setState] = useState<UseAutonomousComplianceState>({
    overview: null,
    frameworks: [],
    violations: [],
    reports: [],
    isLoading: false,
    isLoadingFrameworks: false,
    isLoadingViolations: false,
    isLoadingReports: false,
    isTriggering: false,
    isAcknowledging: false,
    isRequestingRemediation: false,
    isGeneratingReport: false,
    error: null,
  });

  // Helper function to handle API calls
  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    try {
      const response = await fetch(`/api/compliance/autonomous${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  // Fetch compliance overview
  const fetchOverview = useCallback(async () => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiCall('');
      const overview = await response.json();
      setState(prev => ({ ...prev, overview, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to fetch compliance overview');
    }
  }, [session, apiCall]);

  // Fetch compliance frameworks
  const fetchFrameworks = useCallback(async () => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingFrameworks: true, error: null }));
    try {
      const response = await apiCall('?type=frameworks');
      const frameworks = await response.json();
      setState(prev => ({ ...prev, frameworks, isLoadingFrameworks: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingFrameworks: false }));
      toast.error('Failed to fetch compliance frameworks');
    }
  }, [session, apiCall]);

  // Fetch compliance violations
  const fetchViolations = useCallback(async (frameworkId?: string) => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingViolations: true, error: null }));
    try {
      const params = new URLSearchParams({ type: 'violations' });
      if (frameworkId) {
        params.append('frameworkId', frameworkId);
      }
      
      const response = await apiCall(`?${params.toString()}`);
      const violations = await response.json();
      setState(prev => ({ ...prev, violations, isLoadingViolations: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingViolations: false }));
      toast.error('Failed to fetch compliance violations');
    }
  }, [session, apiCall]);

  // Fetch compliance reports
  const fetchReports = useCallback(async () => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingReports: true, error: null }));
    try {
      const response = await apiCall('?type=report');
      const report = await response.json();
      setState(prev => ({ ...prev, reports: [report], isLoadingReports: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingReports: false }));
      toast.error('Failed to fetch compliance reports');
    }
  }, [session, apiCall]);

  // Trigger compliance assessment
  const triggerAssessment = useCallback(async (
    frameworkId?: string,
    assessmentType: 'quick' | 'comprehensive' = 'comprehensive'
  ) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isTriggering: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'trigger_assessment',
          data: { frameworkId, assessmentType }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isTriggering: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Refresh data after triggering assessment
        await fetchOverview();
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isTriggering: false }));
      const message = error instanceof Error ? error.message : 'Failed to trigger assessment';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchOverview]);

  // Acknowledge violation
  const acknowledgeViolation = useCallback(async (violationId: string, acknowledgment?: string) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isAcknowledging: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'acknowledge_violation',
          data: { violationId, acknowledgment }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isAcknowledging: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Refresh violations after acknowledgment
        await fetchViolations();
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isAcknowledging: false }));
      const message = error instanceof Error ? error.message : 'Failed to acknowledge violation';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchViolations]);

  // Request remediation
  const requestRemediation = useCallback(async (
    violationId: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isRequestingRemediation: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'request_remediation',
          data: { violationId, priority }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isRequestingRemediation: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Refresh violations after remediation request
        await fetchViolations();
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isRequestingRemediation: false }));
      const message = error instanceof Error ? error.message : 'Failed to request remediation';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchViolations]);

  // Update framework
  const updateFramework = useCallback(async (frameworkId: string, enabled?: boolean, riskLevel?: string) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_framework',
          data: { frameworkId, enabled, riskLevel }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        // Refresh frameworks after update
        await fetchFrameworks();
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update framework';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchFrameworks]);

  // Generate report
  const generateReport = useCallback(async (reportType?: string, frameworkId?: string) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isGeneratingReport: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_report',
          data: { reportType, frameworkId }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isGeneratingReport: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Refresh reports after generation
        await fetchReports();
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isGeneratingReport: false }));
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchReports]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchOverview(),
      fetchFrameworks(),
      fetchViolations(),
      fetchReports()
    ]);
  }, [fetchOverview, fetchFrameworks, fetchViolations, fetchReports]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch overview on mount and session change
  useEffect(() => {
    if (session?.user) {
      fetchOverview();
    }
  }, [session, fetchOverview]);

  return {
    // State
    ...state,
    
    // Actions
    fetchOverview,
    fetchFrameworks,
    fetchViolations,
    fetchReports,
    triggerAssessment,
    acknowledgeViolation,
    requestRemediation,
    updateFramework,
    generateReport,
    refreshData,
    clearError,
  };
}

export default useAutonomousCompliance;