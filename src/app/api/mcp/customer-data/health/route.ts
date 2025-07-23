/**
 * Customer Data MCP Server Health Check
 */

import { NextResponse } from 'next/server';
import { CustomerDataMCPServer } from '@/mcp/servers/customer-data-server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const server = new CustomerDataMCPServer();
    
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
    
    // Test database connectivity for contacts
    const contactCount = await prisma.contact.count();
    const predictionCount = await prisma.mCPCustomerPredictions.count();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'Customer Data MCP Server',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        server: {
          available: true,
          resourceCount: resources.length,
          toolCount: tools.length
        },
        database: {
          contactCount,
          predictionCount,
          connected: true
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'Customer Data MCP Server',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

export async function HEAD() {
  try {
    const server = new CustomerDataMCPServer();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}