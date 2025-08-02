import { type NextRequest, NextResponse } from 'next/server';
import featureFlags from '@/lib/feature-flags';

/**
 * Feature Flags API Endpoint
 * Returns current feature flag status for debugging and monitoring
 */

export async function GET(request: NextRequest) {
  try {
    const flags = featureFlags.getAll();
    const nestjsURL = featureFlags.getNestJSBackendURL();

    return NextResponse.json({
      success: true,
      data: {
        flags,
        environment: process.env.NODE_ENV,
        nestjsBackendURL: nestjsURL,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Feature flags error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load feature flags'
    }, { status: 500 });
  }
}

// Optional: Allow dynamic flag updates in development
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Feature flag updates only allowed in development'
    }, { status: 403 });
  }

  try {
    // Reload flags from environment
    featureFlags.reload();
    
    return NextResponse.json({
      success: true,
      message: 'Feature flags reloaded',
      data: featureFlags.getAll()
    });

  } catch (error) {
    console.error('Feature flags reload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reload feature flags'
    }, { status: 500 });
  }
}