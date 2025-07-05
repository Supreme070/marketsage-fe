import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai/personalization/profile
 * Build comprehensive personalization profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required field: customerId' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { advancedPersonalization } = await import('@/lib/ai/advanced-personalization-engine');
    const profile = await advancedPersonalization.buildPersonalizationProfile(customerId);

    return NextResponse.json({
      success: true,
      profile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Personalization profile building failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Profile building failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/personalization/content
 * Generate personalized content
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, contentType, context } = body;

    if (!customerId || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, contentType' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { advancedPersonalization } = await import('@/lib/ai/advanced-personalization-engine');
    const content = await advancedPersonalization.generatePersonalizedContent(
      customerId,
      contentType,
      context || {}
    );

    return NextResponse.json({
      success: true,
      content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Personalized content generation failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Content generation failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/personalization/recommendations
 * Generate personalized product recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const channel = searchParams.get('channel');
    const location = searchParams.get('location');
    const timeOfDay = searchParams.get('timeOfDay');
    const limit = searchParams.get('limit');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: customerId' },
        { status: 400 }
      );
    }

    const context = {
      channel: channel || undefined,
      location: location || undefined,
      timeOfDay: timeOfDay ? Number.parseInt(timeOfDay) : undefined,
      limit: limit ? Number.parseInt(limit) : undefined
    };

    // Dynamic import
    const { advancedPersonalization } = await import('@/lib/ai/advanced-personalization-engine');
    const recommendations = await advancedPersonalization.generatePersonalizedRecommendations(
      customerId,
      context
    );

    return NextResponse.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Personalized recommendations generation failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Recommendations generation failed', details: String(error) },
      { status: 500 }
    );
  }
} 