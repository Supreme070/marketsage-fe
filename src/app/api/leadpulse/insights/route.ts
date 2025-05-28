import { NextRequest, NextResponse } from 'next/server';

interface InsightItem {
  id: string;
  type: 'behavior' | 'prediction' | 'opportunity' | 'trend';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  metric?: {
    label: string;
    value: number;
    format?: 'percentage' | 'currency' | 'number';
    change?: number;
  };
  recommendation?: string;
  createdAt: string;
}

// Simulated insights database
let insightsDB: InsightItem[] = [];

// Initialize with smart insights
if (insightsDB.length === 0) {
  insightsDB = generateSmartInsights();
}

function generateSmartInsights(): InsightItem[] {
  const now = new Date();
  
  return [
    {
      id: 'insight_1',
      type: 'behavior',
      title: 'Mobile Traffic Surge from Lagos',
      description: 'Mobile visitors from Lagos have increased by 147% in the last 7 days, with 68% higher engagement scores than desktop users.',
      importance: 'high',
      metric: {
        label: 'Mobile Engagement Increase',
        value: 147,
        format: 'percentage',
        change: 12.3
      },
      recommendation: 'Optimize mobile checkout flow and consider Lagos-specific mobile payment options like USSD.',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 'insight_2',
      type: 'prediction',
      title: 'High Conversion Probability Visitors',
      description: 'AI model identifies 23 current visitors with 78%+ conversion probability based on behavioral patterns.',
      importance: 'high',
      metric: {
        label: 'High-Intent Visitors',
        value: 23,
        format: 'number',
        change: 8.7
      },
      recommendation: 'Deploy personalized offers to these visitors immediately. Consider live chat intervention.',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString() // 45 mins ago
    },
    {
      id: 'insight_3',
      type: 'opportunity',
      title: 'Pricing Page Bottleneck',
      description: 'Visitors spend 340% more time on pricing page but only 12% proceed to signup. Exit rate is 67% higher than industry average.',
      importance: 'high',
      metric: {
        label: 'Pricing Page Drop-off',
        value: 67,
        format: 'percentage',
        change: 5.2
      },
      recommendation: 'Add social proof, testimonials, and risk-free trial options to pricing page. Consider price anchoring.',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    },
    {
      id: 'insight_4',
      type: 'trend',
      title: 'WhatsApp Integration Demand',
      description: 'Visitors are clicking WhatsApp contact buttons 5x more than email forms. African markets prefer instant messaging.',
      importance: 'medium',
      metric: {
        label: 'WhatsApp vs Email Preference',
        value: 500,
        format: 'percentage',
        change: 23.1
      },
      recommendation: 'Add WhatsApp Business integration throughout the funnel. Consider WhatsApp checkout flow.',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    },
    {
      id: 'insight_5',
      type: 'behavior',
      title: 'Evening Traffic Peak Pattern',
      description: 'Traffic peaks between 7-9 PM local time across African time zones, with 89% mobile usage during these hours.',
      importance: 'medium',
      metric: {
        label: 'Evening Mobile Usage',
        value: 89,
        format: 'percentage',
        change: 15.7
      },
      recommendation: 'Schedule marketing campaigns and push notifications for evening hours. Optimize for mobile experience.',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    },
    {
      id: 'insight_6',
      type: 'opportunity',
      title: 'Form Abandonment at Phone Field',
      description: 'Users abandon forms 73% of the time when reaching phone number field. International format confusion likely cause.',
      importance: 'high',
      metric: {
        label: 'Phone Field Abandonment',
        value: 73,
        format: 'percentage',
        change: 8.9
      },
      recommendation: 'Add country code selector, format examples, and make phone field optional for initial signup.',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    },
    {
      id: 'insight_7',
      type: 'prediction',
      title: 'Fintech Visitor Segment Growth',
      description: 'Visitors from fintech companies have grown 234% month-over-month and show 4x higher lifetime value.',
      importance: 'medium',
      metric: {
        label: 'Fintech Segment Growth',
        value: 234,
        format: 'percentage',
        change: 45.6
      },
      recommendation: 'Create dedicated fintech landing pages and industry-specific case studies. Target fintech keywords.',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
    },
    {
      id: 'insight_8',
      type: 'trend',
      title: 'Cross-Border Payment Interest',
      description: 'Search queries and page visits related to cross-border payments have increased 156% from Nigerian visitors.',
      importance: 'medium',
      metric: {
        label: 'Cross-border Query Growth',
        value: 156,
        format: 'percentage',
        change: 28.3
      },
      recommendation: 'Highlight cross-border payment capabilities prominently. Create content around forex regulations.',
      createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString() // 18 hours ago
    }
  ];
}

// GET: Fetch AI insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by insight type
    const importance = searchParams.get('importance'); // Filter by importance
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let filteredInsights = [...insightsDB];
    
    // Apply filters
    if (type) {
      filteredInsights = filteredInsights.filter(insight => insight.type === type);
    }
    
    if (importance) {
      filteredInsights = filteredInsights.filter(insight => insight.importance === importance);
    }
    
    // Sort by creation date (newest first)
    filteredInsights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply limit
    filteredInsights = filteredInsights.slice(0, limit);
    
    // Calculate insight analytics
    const analytics = {
      totalInsights: insightsDB.length,
      highPriorityCount: insightsDB.filter(i => i.importance === 'high').length,
      recentInsights: insightsDB.filter(i => {
        const hoursSinceCreated = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceCreated <= 24;
      }).length,
      categoryBreakdown: {
        behavior: insightsDB.filter(i => i.type === 'behavior').length,
        prediction: insightsDB.filter(i => i.type === 'prediction').length,
        opportunity: insightsDB.filter(i => i.type === 'opportunity').length,
        trend: insightsDB.filter(i => i.type === 'trend').length
      }
    };
    
    return NextResponse.json({
      success: true,
      insights: filteredInsights,
      analytics
    });
    
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

// POST: Generate new insights based on current data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trigger, data } = body;
    
    // Simulate insight generation based on trigger
    let newInsight: InsightItem | null = null;
    
    switch (trigger) {
      case 'visitor_spike':
        if (data?.increase > 50) {
          newInsight = {
            id: `insight_${Date.now()}`,
            type: 'trend',
            title: `${data.increase}% Traffic Spike Detected`,
            description: `Unusual traffic increase detected from ${data.source || 'multiple sources'}. This could indicate viral content or campaign success.`,
            importance: data.increase > 100 ? 'high' : 'medium',
            metric: {
              label: 'Traffic Increase',
              value: data.increase,
              format: 'percentage',
              change: data.increase - 100
            },
            recommendation: 'Monitor conversion rates closely and ensure infrastructure can handle the load. Consider scaling marketing budget.',
            createdAt: new Date().toISOString()
          };
        }
        break;
        
      case 'conversion_drop':
        if (data?.dropPercentage > 20) {
          newInsight = {
            id: `insight_${Date.now()}`,
            type: 'opportunity',
            title: `Conversion Rate Drop: ${data.dropPercentage}%`,
            description: `Conversion rate has dropped significantly in the last ${data.timeFrame || 'hour'}. Immediate investigation needed.`,
            importance: 'high',
            metric: {
              label: 'Conversion Drop',
              value: data.dropPercentage,
              format: 'percentage',
              change: -data.dropPercentage
            },
            recommendation: 'Check payment gateway, form functionality, and recent website changes. Consider reverting recent updates.',
            createdAt: new Date().toISOString()
          };
        }
        break;
        
      case 'high_engagement':
        newInsight = {
          id: `insight_${Date.now()}`,
          type: 'behavior',
          title: 'Exceptional Engagement Detected',
          description: `Current session shows ${data?.score || 95}% engagement score, indicating high purchase intent.`,
          importance: 'high',
          metric: {
            label: 'Engagement Score',
            value: data?.score || 95,
            format: 'number',
            change: (data?.score || 95) - 70
          },
          recommendation: 'Deploy personalized offers or initiate live chat to maximize conversion opportunity.',
          createdAt: new Date().toISOString()
        };
        break;
    }
    
    if (newInsight) {
      insightsDB.unshift(newInsight); // Add to beginning of array
      
      // Keep only the most recent 50 insights
      if (insightsDB.length > 50) {
        insightsDB = insightsDB.slice(0, 50);
      }
    }
    
    return NextResponse.json({
      success: true,
      insight: newInsight,
      generated: !!newInsight
    });
    
  } catch (error) {
    console.error('Error generating insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insight' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an insight
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('id');
    
    if (!insightId) {
      return NextResponse.json(
        { success: false, error: 'Insight ID is required' },
        { status: 400 }
      );
    }
    
    const initialLength = insightsDB.length;
    insightsDB = insightsDB.filter(insight => insight.id !== insightId);
    
    const deleted = insightsDB.length < initialLength;
    
    return NextResponse.json({
      success: true,
      deleted
    });
    
  } catch (error) {
    console.error('Error deleting insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete insight' },
      { status: 500 }
    );
  }
} 