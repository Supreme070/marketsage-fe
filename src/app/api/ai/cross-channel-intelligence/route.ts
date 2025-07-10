import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { crossChannelAIIntelligence, MessageChannel, MessageType, OptimizationStrategy } from '@/lib/ai/cross-channel-ai-intelligence';
import { logger } from '@/lib/logger';

/**
 * Cross-Channel AI Intelligence API
 * 
 * Provides unified AI intelligence across Email, SMS, and WhatsApp channels
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      contactId,
      organizationId = session.user.organizationId,
      messageType,
      urgency = 'medium',
      content,
      optimizationStrategy = OptimizationStrategy.ENGAGEMENT,
      campaign,
      enableStreaming = false
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('Cross-channel AI intelligence request', {
      action,
      contactId,
      organizationId,
      messageType,
      urgency,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'analyze_customer_profile':
        if (!contactId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: contactId'
          }, { status: 400 });
        }

        result = await crossChannelAIIntelligence.analyzeCustomerProfile(
          contactId,
          organizationId,
          true
        );
        break;

      case 'intelligent_routing':
        if (!contactId || !messageType || !content) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: contactId, messageType, content'
          }, { status: 400 });
        }

        result = await crossChannelAIIntelligence.intelligentRouting(
          contactId,
          organizationId,
          messageType as MessageType,
          urgency,
          content,
          optimizationStrategy as OptimizationStrategy
        );
        break;

      case 'execute_cross_channel_campaign':
        if (!campaign) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: campaign'
          }, { status: 400 });
        }

        result = await crossChannelAIIntelligence.executeCrossChannelCampaign(
          campaign,
          organizationId,
          session.user.id,
          enableStreaming
        );
        break;

      case 'analyze_performance':
        const { startDate, endDate, channels } = body;
        
        if (!startDate || !endDate) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: startDate, endDate'
          }, { status: 400 });
        }

        result = await crossChannelAIIntelligence.analyzeCrossChannelPerformance(
          organizationId,
          new Date(startDate),
          new Date(endDate),
          channels as MessageChannel[]
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Cross-channel AI intelligence error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Cross-channel AI intelligence operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              customerProfileAnalysis: true,
              intelligentRouting: true,
              crossChannelCampaigns: true,
              performanceAnalytics: true,
              aiOptimization: true,
              realTimeStreaming: true
            },
            supportedChannels: Object.values(MessageChannel),
            supportedMessageTypes: Object.values(MessageType),
            optimizationStrategies: Object.values(OptimizationStrategy),
            features: [
              'Cross-channel customer journey mapping',
              'Intelligent channel selection and routing',
              'AI-powered content optimization per channel',
              'Performance analytics and insights',
              'Automated A/B testing across channels',
              'Customer preference learning',
              'Unified campaign orchestration',
              'Real-time streaming with WebSocket support'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'channel_stats':
        // Get basic channel statistics
        const stats = {
          totalChannels: Object.values(MessageChannel).length,
          channelBreakdown: {
            [MessageChannel.EMAIL]: {
              name: 'Email',
              description: 'Email marketing campaigns',
              avgDeliveryRate: 95.2,
              avgOpenRate: 24.8,
              avgClickRate: 3.7,
              avgConversionRate: 2.1
            },
            [MessageChannel.SMS]: {
              name: 'SMS',
              description: 'SMS/text messaging',
              avgDeliveryRate: 98.5,
              avgOpenRate: 94.3,
              avgClickRate: 8.2,
              avgConversionRate: 4.5
            },
            [MessageChannel.WHATSAPP]: {
              name: 'WhatsApp',
              description: 'WhatsApp Business messaging',
              avgDeliveryRate: 99.1,
              avgOpenRate: 97.8,
              avgClickRate: 12.3,
              avgConversionRate: 6.8
            }
          }
        };

        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Cross-channel AI intelligence GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve cross-channel AI intelligence information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}