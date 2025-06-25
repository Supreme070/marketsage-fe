/**
 * Demo Simulator API Endpoints
 * 
 * Provides REST API for controlling the real-time demo simulation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { demoSimulator } from '@/lib/demo/real-time-simulator';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        if (config) {
          // Create new simulator with custom config
          const { RealTimeDemoSimulator } = await import('@/lib/demo/real-time-simulator');
          const customSimulator = new RealTimeDemoSimulator(config);
          await customSimulator.startSimulation();
        } else {
          await demoSimulator.startSimulation();
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Demo simulation started',
          status: demoSimulator.getStatus()
        });

      case 'stop':
        demoSimulator.stopSimulation();
        return NextResponse.json({ 
          success: true, 
          message: 'Demo simulation stopped',
          status: demoSimulator.getStatus()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Demo simulator API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = demoSimulator.getStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    logger.error('Demo simulator status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}