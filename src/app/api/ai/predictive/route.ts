import { type NextRequest, NextResponse } from 'next/server';
import { predictiveAnalytics } from '@/lib/ai/predictive-analytics-engine';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai/predictive/market-forecast
 * Generate market forecasts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { market, timeframe, periods } = body;

    if (!market || !timeframe) {
      return NextResponse.json(
        { error: 'Missing required fields: market, timeframe' },
        { status: 400 }
      );
    }

    const forecast = await predictiveAnalytics.generateMarketForecast(
      market,
      timeframe,
      periods
    );

    return NextResponse.json({
      success: true,
      forecast,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Market forecast generation failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Market forecast failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/predictive/customer-behavior
 * Predict customer behavior and CLV
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: customerId' },
        { status: 400 }
      );
    }

    const prediction = await predictiveAnalytics.predictCustomerBehavior(customerId);

    return NextResponse.json({
      success: true,
      prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Customer behavior prediction failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Customer prediction failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/predictive/revenue-forecast
 * Generate revenue forecasts
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, periods } = body;

    if (!period) {
      return NextResponse.json(
        { error: 'Missing required field: period' },
        { status: 400 }
      );
    }

    const forecast = await predictiveAnalytics.generateRevenueForecast(
      period,
      periods
    );

    return NextResponse.json({
      success: true,
      forecast,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Revenue forecast generation failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Revenue forecast failed', details: String(error) },
      { status: 500 }
    );
  }
} 