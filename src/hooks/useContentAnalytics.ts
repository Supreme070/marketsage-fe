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

export function useContentAnalytics(userId?: string, timeRange = '30d') {
  const [data, setData] = useState<ContentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the dedicated content analytics endpoint that has mock data
      const response = await fetch('/api/v2/ai/content-analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch content analytics');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Use the mock data directly from the content analytics API
        setData(result.data);
      } else {
        throw new Error(result.error || 'No data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Content Analytics fetch error:', err);
      
      // Provide comprehensive fallback demo data when API fails
      setData({
        overview: {
          totalContent: 24,
          avgSupremeScore: 85.2,
          avgEngagement: 76.3,
          avgSentiment: 0.82,
          avgReadability: 84.1,
          trend: {
            supremeScore: 5.2,
            engagement: 8.1,
            sentiment: 8.7,
            readability: 3.4
          }
        },
        performance: {
          timeSeries: Array.from({ length: 30 }).map((_, idx) => ({
            date: new Date(Date.now() - (29 - idx) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            supremeScore: Math.round(75 + Math.random() * 25 + Math.sin(idx * 0.2) * 10),
            engagement: Math.round(65 + Math.random() * 25 + Math.sin(idx * 0.15) * 8),
            sentiment: Math.round((0.7 + Math.random() * 0.25 + Math.sin(idx * 0.1) * 0.1) * 100) / 100,
            readability: Math.round(78 + Math.random() * 20 + Math.sin(idx * 0.12) * 5)
          })),
          contentTypes: [
            { name: 'Email Campaigns', value: 35, supremeScore: 89 },
            { name: 'WhatsApp Messages', value: 28, supremeScore: 92 },
            { name: 'SMS Campaigns', value: 22, supremeScore: 78 },
            { name: 'Push Notifications', value: 15, supremeScore: 81 }
          ],
          topKeywords: [
            { keyword: 'fintech', count: 156, avgScore: 94, trend: 'up' as const },
            { keyword: 'transfer', count: 142, avgScore: 87, trend: 'up' as const },
            { keyword: 'secure', count: 98, avgScore: 91, trend: 'stable' as const },
            { keyword: 'instant', count: 87, avgScore: 88, trend: 'up' as const },
            { keyword: 'Nigeria', count: 134, avgScore: 86, trend: 'up' as const }
          ]
        },
        insights: [
          {
            type: 'positive',
            title: 'Strong Fintech Performance',
            description: 'Fintech-related content shows 94% average score, significantly outperforming other content',
            impact: 'high',
            recommendation: 'Focus more content on fintech themes and Nigerian market specifics'
          },
          {
            type: 'info',
            title: 'WhatsApp Leading Engagement',
            description: 'WhatsApp messages achieve 92% supreme score, highest among all channels',
            impact: 'high',
            recommendation: 'Consider migrating more campaigns to WhatsApp for better engagement'
          },
          {
            type: 'warning', 
            title: 'SMS Optimization Needed',
            description: 'SMS campaigns show lower engagement at 78%, indicating room for improvement',
            impact: 'medium',
            recommendation: 'A/B test shorter SMS formats and optimize timing for Nigerian audience'
          }
        ],
        recommendations: [
          {
            priority: 'high',
            category: 'Content Strategy',
            title: 'Increase Fintech Focus',
            description: 'Content with fintech keywords performs 23% better. Include more financial technology terminology',
            estimatedImpact: '+23% engagement'
          },
          {
            priority: 'high',
            category: 'Channel Optimization',
            title: 'Expand WhatsApp Usage',
            description: 'WhatsApp shows highest performance (92%). Consider migrating email campaigns to WhatsApp',
            estimatedImpact: '+15% overall performance'
          },
          {
            priority: 'medium',
            category: 'Localization',
            title: 'Add Nigerian Context',
            description: 'Include local expressions, Naira currency references, and Nigerian business context',
            estimatedImpact: '+12% engagement'
          },
          {
            priority: 'medium',
            category: 'SMS Strategy',
            title: 'Optimize SMS Length',
            description: 'Test shorter SMS formats (under 160 characters) for better engagement',
            estimatedImpact: '+8% SMS performance'
          }
        ],
        recentAnalyses: [
          {
            id: '1',
            title: 'Q4 Email Campaign - Fintech Launch',
            supremeScore: 94,
            engagement: 87,
            sentiment: 0.91,
            readability: 89,
            createdAt: new Date().toISOString(),
            contentType: 'email'
          },
          {
            id: '2',
            title: 'WhatsApp: Mobile Banking Promotion',
            supremeScore: 92,
            engagement: 88,
            sentiment: 0.85,
            readability: 86,
            createdAt: new Date(Date.now() - 120000).toISOString(),
            contentType: 'whatsapp'
          },
          {
            id: '3',
            title: 'SMS: Transfer Fee Reduction Alert',
            supremeScore: 78,
            engagement: 72,
            sentiment: 0.78,
            readability: 84,
            createdAt: new Date(Date.now() - 240000).toISOString(),
            contentType: 'sms'
          },
          {
            id: '4',
            title: 'Push: New Feature Announcement',
            supremeScore: 81,
            engagement: 76,
            sentiment: 0.82,
            readability: 88,
            createdAt: new Date(Date.now() - 360000).toISOString(),
            contentType: 'push'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  const analyzeContent = useCallback(async (content: string, title?: string) => {
    try {
      const response = await fetch('/api/v2/ai/content-analytics', {
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