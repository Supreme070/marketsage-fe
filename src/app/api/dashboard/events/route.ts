import { NextRequest, NextResponse } from 'next/server';

interface DashboardEvent {
  id: string;
  type: 'campaign' | 'workflow' | 'journey' | 'support' | 'leadpulse' | 'notification' | 'revenue';
  title: string;
  description: string;
  timestamp: string;
  value?: number; // for revenue increment etc.
  href: string;
}

// In-memory event queue
let events: DashboardEvent[] = [];

function generateRandomEvent(): DashboardEvent {
  const now = new Date();
  const random = Math.random();

  if (random < 0.2) {
    return {
      id: `evt_${Date.now()}`,
      type: 'notification',
      title: 'Push Notification Sent',
      description: `${Math.floor(Math.random() * 500 + 100)} notifications delivered`,
      timestamp: now.toISOString(),
      href: '/notifications'
    };
  }
  if (random < 0.4) {
    return {
      id: `evt_${Date.now()}`,
      type: 'revenue',
      title: 'New Order',
      description: `₦${(Math.random() * 40000 + 10000).toFixed(0)} order completed`,
      timestamp: now.toISOString(),
      value: 1,
      href: '/orders'
    };
  }
  if (random < 0.6) {
    return {
      id: `evt_${Date.now()}`,
      type: 'leadpulse',
      title: 'High-Intent Visitor',
      description: 'Visitor from Lagos on checkout page',
      timestamp: now.toISOString(),
      href: '/leadpulse'
    };
  }
  if (random < 0.8) {
    return {
      id: `evt_${Date.now()}`,
      type: 'campaign',
      title: 'Campaign Click',
      description: 'User clicked WhatsApp CTA',
      timestamp: now.toISOString(),
      href: '/email/campaigns'
    };
  }
  return {
    id: `evt_${Date.now()}`,
    type: 'workflow',
    title: 'Workflow Triggered',
    description: 'Cart-abandon sequence started',
    timestamp: now.toISOString(),
    href: '/workflows'
  };
}

export async function GET(request: NextRequest) {
  try {
    // generate 1-3 random events per request to simulate stream
    const newEvents: DashboardEvent[] = [];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const evt = generateRandomEvent();
      events.unshift(evt);
      newEvents.push(evt);
    }

    // keep only last 100 events
    events = events.slice(0, 100);

    return NextResponse.json({ success: true, events: newEvents });
  } catch (error) {
    console.error('Error generating events:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate events' }, { status: 500 });
  }
} 