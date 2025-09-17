/**
 * Phase 4 AI Hooks - Advanced AI Features Integration
 * ==================================================
 * React hooks for integrating with Phase 4 AI endpoints
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

// Phase 4 AI Chat Hook
export const usePhase4AIChat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const sendMessage = useCallback(async (content: string, options?: {
    stream?: boolean;
    context?: any;
    africanContext?: boolean;
  }) => {
    if (!session?.user?.id) {
      toast.error('Please log in to use AI chat');
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMessage = {
      id: `msg_${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: content,
          userId: session.user.id,
          context: options?.context || {},
          stream: options?.stream || false,
          africanContext: options?.africanContext || true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const assistantMessage = {
          id: `msg_${Date.now()}`,
          content: result.data.answer,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('AI response received');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to get AI response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`AI Error: ${errorMessage}`);
      console.error('Phase 4 AI error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages: () => setMessages([]),
  };
};

// Phase 4 AI Analysis Hook
export const usePhase4AIAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const performAnalysis = useCallback(async (analysisType: string, data: any) => {
    if (!session?.user?.id) {
      toast.error('Please log in to perform AI analysis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/${analysisType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${analysisType} analysis completed`);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Analysis Error: ${errorMessage}`);
      console.error('Phase 4 AI analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    performAnalysis,
  };
};

// Phase 4 AI Content Generation Hook
export const usePhase4AIContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const generateContent = useCallback(async (contentType: string, prompt: string, options?: any) => {
    if (!session?.user?.id) {
      toast.error('Please log in to generate content');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/content-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentType,
          prompt,
          userId: session.user.id,
          options: options || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Content generated successfully');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Content generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Content Generation Error: ${errorMessage}`);
      console.error('Phase 4 AI content generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    generateContent,
  };
};

// Phase 4 AI Prediction Hook
export const usePhase4AIPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const makePrediction = useCallback(async (predictionType: string, data: any) => {
    if (!session?.user?.id) {
      toast.error('Please log in to make predictions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          predictionType,
          data,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Prediction completed');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Prediction failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Prediction Error: ${errorMessage}`);
      console.error('Phase 4 AI prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    makePrediction,
  };
};

// Phase 5 Analytics Hook
export const usePhase5Analytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const executeAnalyticsQuery = useCallback(async (query: any) => {
    if (!session?.user?.id) {
      toast.error('Please log in to execute analytics queries');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...query,
          userId: session.user.id,
          organizationId: session.user.organizationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Analytics query executed successfully');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Analytics query failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Analytics Error: ${errorMessage}`);
      console.error('Phase 5 analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    executeAnalyticsQuery,
  };
};

// Phase 5 Reporting Hook
export const usePhase5Reporting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const generateReport = useCallback(async (reportConfig: any) => {
    if (!session?.user?.id) {
      toast.error('Please log in to generate reports');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/reports/generate/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...reportConfig,
          userId: session.user.id,
          organizationId: session.user.organizationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Report generated successfully');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Report generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Reporting Error: ${errorMessage}`);
      console.error('Phase 5 reporting error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    generateReport,
  };
};

// Phase 5 Performance Monitoring Hook
export const usePhase5Performance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const getPerformanceMetrics = useCallback(async (timeRange: string = 'day') => {
    if (!session?.user?.id) {
      toast.error('Please log in to get performance metrics');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/performance/metrics?timeRange=${timeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to get performance metrics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Performance Error: ${errorMessage}`);
      console.error('Phase 5 performance error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    isLoading,
    error,
    getPerformanceMetrics,
  };
};
