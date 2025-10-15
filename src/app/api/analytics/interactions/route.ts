import { NextRequest, NextResponse } from 'next/server';

/**
 * User Interaction Analytics API
 * Receives and stores user interaction events (clicks, navigation, forms)
 */

interface InteractionEvent {
  type: string;
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface InteractionPayload {
  sessionId: string;
  events: InteractionEvent[];
  page: string;
  timestamp: number;
}

// In-memory storage (in production, send to database or analytics service)
const interactionsStore: InteractionPayload[] = [];
const MAX_STORED = 1000;

/**
 * POST /api/analytics/interactions
 * Receive interaction events from the frontend
 */
export async function POST(request: NextRequest) {
  try {
    const payload: InteractionPayload = await request.json();

    // Validate payload
    if (!payload.sessionId || !Array.isArray(payload.events)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Enrich with request context
    const enrichedPayload = {
      ...payload,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request),
      receivedAt: new Date().toISOString(),
    };

    // Store in memory
    interactionsStore.push(enrichedPayload);

    // Trim to MAX_STORED
    if (interactionsStore.length > MAX_STORED) {
      interactionsStore.shift();
    }

    // Send to backend for permanent storage
    await sendToBackend(enrichedPayload);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to process interaction events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/interactions
 * Retrieve interaction events (for debugging/testing)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    let filteredEvents = [...interactionsStore];

    if (sessionId) {
      filteredEvents = filteredEvents.filter(e => e.sessionId === sessionId);
    }

    return NextResponse.json({
      count: filteredEvents.length,
      sessions: filteredEvents.slice(-50), // Last 50 sessions
    });
  } catch (error) {
    console.error('Failed to get interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send interactions to backend for permanent storage
 */
async function sendToBackend(payload: any): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

  try {
    const response = await fetch(`${backendUrl}/api/v2/user-interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to send to backend: ${response.status}`);
    }
  } catch (error) {
    // Silently fail - events are still stored in memory
    console.error('Failed to send interactions to backend:', error);
  }
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return request.headers.get('x-vercel-forwarded-for') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}
