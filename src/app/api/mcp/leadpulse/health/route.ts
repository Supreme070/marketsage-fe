/**
 * LeadPulse MCP Server Health Check
 */

import { NextResponse } from 'next/server';
import { LeadPulseMCPServer } from '@/mcp/servers/leadpulse-server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const server = new LeadPulseMCPServer();
    
    // Mock auth context for health check
    const authContext = {
      userId: 'health-check',
      organizationId: 'health-check',
      permissions: ['read:health'] as string[],
      role: 'user' as const
    };
    
    // Test basic server functionality
    const resources = await server.listResources(authContext);
    const tools = await server.listTools(authContext);
    
    // Test database connectivity for visitor data
    const visitorSessionCount = await prisma.mCPVisitorSessions.count();
    
    // Check recent activity (last 24 hours)
    const recentSessions = await prisma.mCPVisitorSessions.count({
      where: {
        sessionStart: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'LeadPulse MCP Server',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        server: {
          available: true,
          resourceCount: resources.length,
          toolCount: tools.length
        },
        database: {
          totalVisitorSessions: visitorSessionCount,
          recentSessions24h: recentSessions,
          connected: true
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'LeadPulse MCP Server',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

export async function HEAD() {
  try {
    const server = new LeadPulseMCPServer();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}