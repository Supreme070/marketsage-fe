import { useState, useEffect, useCallback } from 'react';

interface ContentAnalyticsData {
  overview: {
    totalContent: number;
    avgSupremeScore: number;
    avgEngagement: number;
    avgSentiment: number;
    avgReadability: number;
    trend: {
      supremeScore: number;
      engagement: number;
      sentiment: number;
      readability: number;
    };
  };
  performance: {
    timeSeries: Array<{
      date: string;
      supremeScore: number;
      engagement: number;
      sentiment: number;
      readability: number;
    }>;
    contentTypes: Array<{
      name: string;
      value: number;
      supremeScore: number;
    }>;
    topKeywords: Array<{
      keyword: string;
      count: number;
      avgScore: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  insights: Array<{
    type: 'positive' | 'warning' | 'info';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    estimatedImpact: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    title: string;
    supremeScore: number;
    engagement: number;
    sentiment: number;
    readability: number;
    createdAt: string;
    contentType: string;
  }>;
}

export function useContentAnalytics(userId?: string, timeRange: string = '30d') {
  const [data, setData] = useState<ContentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/ai/content-analytics?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content analytics');
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Content Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  const analyzeContent = useCallback(async (content: string, title?: string) => {
    try {
      const response = await fetch('/api/ai/content-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the analytics data after new analysis
        await fetchData();
        return result.data;
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      throw err;
    }
  }, [userId, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    analyzeContent
  };
} 