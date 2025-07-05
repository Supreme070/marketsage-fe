/**
 * React Hook for Autonomous Content Generation
 * ==========================================
 * 
 * Hook for interacting with the autonomous content generation system
 * Provides AI-powered content creation, brand voice management, and performance tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export interface ContentGenerationRequest {
  type: 'email' | 'sms' | 'whatsapp' | 'social' | 'blog' | 'ad_copy';
  purpose: 'onboarding' | 'nurturing' | 'conversion' | 'retention' | 'reactivation' | 'promotional' | 'transactional';
  targetAudience?: {
    segment?: string;
    demographics?: {
      age?: string;
      gender?: string;
      location?: string;
      income?: string;
    };
    psychographics?: {
      interests?: string[];
      values?: string[];
      lifestyle?: string;
    };
    behaviorProfile?: {
      engagementLevel?: 'high' | 'medium' | 'low';
      purchaseHistory?: string;
      preferredChannels?: string[];
    };
  };
  brandGuidelines?: {
    voice?: 'professional' | 'friendly' | 'authoritative' | 'casual' | 'empathetic';
    tone?: 'formal' | 'conversational' | 'enthusiastic' | 'urgent' | 'educational';
    keywords?: string[];
    avoidWords?: string[];
    culturalContext?: 'nigeria' | 'south_africa' | 'kenya' | 'ghana' | 'general_african';
  };
  contentParameters?: {
    length?: 'short' | 'medium' | 'long';
    includePersonalization?: boolean;
    includeCTA?: boolean;
    ctaType?: 'button' | 'link' | 'phone' | 'email';
    urgency?: 'low' | 'medium' | 'high';
    emotionalTrigger?: 'fear' | 'joy' | 'trust' | 'curiosity' | 'urgency';
  };
  context?: {
    campaignGoal?: string;
    productService?: string;
    promotionDetails?: string;
    seasonality?: string;
    competitorContext?: string;
  };
  abTestVariations?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface GeneratedContent {
  id: string;
  requestId: string;
  type: string;
  content: {
    subject?: string;
    body: string;
    headline?: string;
    cta?: string;
    metadata?: Record<string, any>;
  };
  personalizationTokens: string[];
  performancePrediction: {
    expectedEngagementRate: number;
    expectedConversionRate: number;
    confidence: number;
    riskFactors: string[];
  };
  abTestVariant?: number;
  culturalAdaptations: {
    localizedPhrases: string[];
    culturalReferences: string[];
    timingRecommendations: string;
  };
  qualityScore: number;
  generatedAt: string;
  approvalStatus: 'pending' | 'approved' | 'needs_review' | 'rejected';
  reviewNotes?: string;
}

export interface BrandVoiceProfile {
  organizationId: string;
  voiceCharacteristics: {
    personality: string[];
    communicationStyle: string;
    keyPhrases: string[];
    avoidanceList: string[];
  };
  tonalGuidelines: {
    formal: string;
    casual: string;
    supportive: string;
    promotional: string;
  };
  culturalAdaptations: Record<string, {
    localPhrases: string[];
    culturalNuances: string;
    communicationPreferences: string;
  }>;
  performanceHistory: {
    successfulPatterns: string[];
    unsuccessfulPatterns: string[];
    learningInsights: string[];
  };
  lastAnalyzed: string;
}

export interface ContentTemplate {
  id: string;
  type: string;
  purpose: string;
  name: string;
  content: string;
  variables: string[];
  performanceMetrics: {
    avgEngagementRate: number;
    avgConversionRate: number;
    usageCount: number;
    successScore: number;
  };
  culturalVariants: Record<string, string>;
  lastUpdated: string;
}

export interface UseContentGenerationState {
  // Data
  generatedContent: GeneratedContent[];
  brandProfile: BrandVoiceProfile | null;
  templates: ContentTemplate[];
  performanceData: any;
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  isLoadingBrandProfile: boolean;
  isLoadingTemplates: boolean;
  isLoadingPerformance: boolean;
  
  // Action states
  isApproving: boolean;
  isCreatingTemplate: boolean;
  isUpdatingBrandProfile: boolean;
  
  // Error states
  error: string | null;
}

export interface UseContentGenerationActions {
  // Content generation
  generateContent: (request: ContentGenerationRequest) => Promise<{ success: boolean; message: string; data?: any }>;
  
  // Content management
  getGeneratedContent: (requestId: string) => Promise<void>;
  approveContent: (contentId: string, approved: boolean, reviewNotes?: string) => Promise<{ success: boolean; message: string }>;
  
  // Brand profile management
  fetchBrandProfile: () => Promise<void>;
  updateBrandProfile: (updates: Partial<BrandVoiceProfile>) => Promise<{ success: boolean; message: string }>;
  
  // Template management
  fetchTemplates: (type?: string, purpose?: string) => Promise<void>;
  createTemplate: (template: Partial<ContentTemplate>) => Promise<{ success: boolean; message: string; templateId?: string }>;
  
  // Performance analysis
  fetchPerformanceData: () => Promise<void>;
  
  // Batch operations
  batchGenerate: (requests: ContentGenerationRequest[]) => Promise<{ success: boolean; message: string; results?: any }>;
  
  // Utility actions
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useContentGeneration(): UseContentGenerationState & UseContentGenerationActions {
  const { data: session } = useSession();
  const [state, setState] = useState<UseContentGenerationState>({
    generatedContent: [],
    brandProfile: null,
    templates: [],
    performanceData: null,
    isLoading: false,
    isGenerating: false,
    isLoadingBrandProfile: false,
    isLoadingTemplates: false,
    isLoadingPerformance: false,
    isApproving: false,
    isCreatingTemplate: false,
    isUpdatingBrandProfile: false,
    error: null,
  });

  // Helper function to handle API calls
  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    try {
      const response = await fetch(`/api/ai/content-generation${endpoint}`, {
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

  // Generate content
  const generateContent = useCallback(async (request: ContentGenerationRequest) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_content',
          data: request
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isGenerating: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Add generated content to state
        if (result.data?.generatedContent) {
          setState(prev => ({
            ...prev,
            generatedContent: [...prev.generatedContent, ...result.data.generatedContent]
          }));
        }
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
      const message = error instanceof Error ? error.message : 'Failed to generate content';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall]);

  // Get generated content
  const getGeneratedContent = useCallback(async (requestId: string) => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiCall(`?action=generated_content&requestId=${requestId}`);
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          generatedContent: result.data,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to fetch generated content');
    }
  }, [session, apiCall]);

  // Approve content
  const approveContent = useCallback(async (contentId: string, approved: boolean, reviewNotes?: string) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isApproving: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve_content',
          data: { contentId, approved, reviewNotes }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isApproving: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Update content approval status in state
        setState(prev => ({
          ...prev,
          generatedContent: prev.generatedContent.map(content => 
            content.id === contentId 
              ? { 
                  ...content, 
                  approvalStatus: approved ? 'approved' : 'rejected' as any,
                  reviewNotes 
                } 
              : content
          )
        }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isApproving: false }));
      const message = error instanceof Error ? error.message : 'Failed to update approval status';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall]);

  // Fetch brand profile
  const fetchBrandProfile = useCallback(async () => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingBrandProfile: true, error: null }));
    try {
      const response = await apiCall('?action=brand_profile');
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          brandProfile: result.data,
          isLoadingBrandProfile: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingBrandProfile: false }));
      toast.error('Failed to fetch brand profile');
    }
  }, [session, apiCall]);

  // Update brand profile
  const updateBrandProfile = useCallback(async (updates: Partial<BrandVoiceProfile>) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isUpdatingBrandProfile: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_brand_profile',
          data: { brandProfile: updates }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isUpdatingBrandProfile: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Update brand profile in state
        setState(prev => ({
          ...prev,
          brandProfile: prev.brandProfile ? { ...prev.brandProfile, ...updates } : null
        }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isUpdatingBrandProfile: false }));
      const message = error instanceof Error ? error.message : 'Failed to update brand profile';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall]);

  // Fetch templates
  const fetchTemplates = useCallback(async (type?: string, purpose?: string) => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingTemplates: true, error: null }));
    try {
      const params = new URLSearchParams({ action: 'templates' });
      if (type) params.append('type', type);
      if (purpose) params.append('purpose', purpose);
      
      const response = await apiCall(`?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          templates: result.data.templates || [],
          isLoadingTemplates: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingTemplates: false }));
      toast.error('Failed to fetch templates');
    }
  }, [session, apiCall]);

  // Create template
  const createTemplate = useCallback(async (template: Partial<ContentTemplate>) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isCreatingTemplate: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_template',
          data: { template }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isCreatingTemplate: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Refresh templates after creation
        await fetchTemplates();
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isCreatingTemplate: false }));
      const message = error instanceof Error ? error.message : 'Failed to create template';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall, fetchTemplates]);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    if (!session?.user) return;

    setState(prev => ({ ...prev, isLoadingPerformance: true, error: null }));
    try {
      const response = await apiCall('?action=performance_analysis');
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          performanceData: result.data,
          isLoadingPerformance: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingPerformance: false }));
      toast.error('Failed to fetch performance data');
    }
  }, [session, apiCall]);

  // Batch generate
  const batchGenerate = useCallback(async (requests: ContentGenerationRequest[]) => {
    if (!session?.user) {
      toast.error('Authentication required');
      return { success: false, message: 'Authentication required' };
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'batch_generate',
          data: { requests }
        }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, isGenerating: false }));
      
      if (result.success) {
        toast.success(result.message);
        // Add all generated content to state
        if (result.data?.successful) {
          const allGeneratedContent = result.data.successful.flatMap((item: any) => item.result);
          setState(prev => ({
            ...prev,
            generatedContent: [...prev.generatedContent, ...allGeneratedContent]
          }));
        }
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
      const message = error instanceof Error ? error.message : 'Failed to batch generate content';
      toast.error(message);
      return { success: false, message };
    }
  }, [session, apiCall]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchBrandProfile(),
      fetchTemplates(),
      fetchPerformanceData()
    ]);
  }, [fetchBrandProfile, fetchTemplates, fetchPerformanceData]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch brand profile on mount and session change
  useEffect(() => {
    if (session?.user) {
      fetchBrandProfile();
    }
  }, [session, fetchBrandProfile]);

  return {
    // State
    ...state,
    
    // Actions
    generateContent,
    getGeneratedContent,
    approveContent,
    fetchBrandProfile,
    updateBrandProfile,
    fetchTemplates,
    createTemplate,
    fetchPerformanceData,
    batchGenerate,
    refreshData,
    clearError,
  };
}

export default useContentGeneration;