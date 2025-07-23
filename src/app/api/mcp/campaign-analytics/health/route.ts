/**
 * Campaign Analytics MCP Server Health Check
 */

import { NextResponse } from 'next/server';
import { CampaignAnalyticsMCPServer } from '@/mcp/servers/campaign-analytics-server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const server = new CampaignAnalyticsMCPServer();
    
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
    
    // Test database connectivity for campaigns
    const [emailCount, smsCount, whatsappCount, mcpMetricsCount] = await Promise.all([
      prisma.emailCampaign.count(),
      prisma.sMSCampaign.count(),
      prisma.whatsAppCampaign.count(),
      prisma.mCPCampaignMetrics.count()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'Campaign Analytics MCP Server',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        server: {
          available: true,
          resourceCount: resources.length,
          toolCount: tools.length
        },
        database: {
          emailCampaigns: emailCount,
          smsCampaigns: smsCount,
          whatsappCampaigns: whatsappCount,
          mcpMetrics: mcpMetricsCount,
          connected: true
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'Campaign Analytics MCP Server',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

export async function HEAD() {
  try {
    const server = new CampaignAnalyticsMCPServer();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}