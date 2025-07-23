/**
 * Monitoring MCP Server Health Check
 */

import { NextResponse } from 'next/server';
import { MonitoringMCPServer } from '@/mcp/servers/monitoring-server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const server = new MonitoringMCPServer();
    
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
    
    // Test database connectivity for monitoring data
    const monitoringMetricsCount = await prisma.mCPMonitoringMetrics.count();
    
    // Check recent metrics (last hour)
    const recentMetrics = await prisma.mCPMonitoringMetrics.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });
    
    // Get basic system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      },
      cpu: process.cpuUsage()
    };
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'Monitoring MCP Server',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        server: {
          available: true,
          resourceCount: resources.length,
          toolCount: tools.length
        },
        database: {
          totalMonitoringMetrics: monitoringMetricsCount,
          recentMetrics1h: recentMetrics,
          connected: true
        },
        system: systemMetrics
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'Monitoring MCP Server',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

export async function HEAD() {
  try {
    const server = new MonitoringMCPServer();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}