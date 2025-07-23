/**
 * External Services MCP Server Health Check
 */

import { NextResponse } from 'next/server';
import { ExternalServicesMCPServer } from '@/mcp/servers/external-services-server';
import { whatsappService } from '@/lib/whatsapp-service';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const server = new ExternalServicesMCPServer();
    
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
    
    // Check external service configurations
    const serviceStatus = {
      email: {
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        provider: process.env.EMAIL_PROVIDER || 'not_configured'
      },
      sms: {
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        africastalking: !!process.env.AFRICASTALKING_API_KEY,
        termii: !!process.env.TERMII_API_KEY
      },
      whatsapp: {
        configured: whatsappService.isConfigured(),
        businessApi: !!process.env.WHATSAPP_ACCESS_TOKEN
      }
    };
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall status
    const hasEmailConfig = serviceStatus.email.configured;
    const hasSmsConfig = serviceStatus.sms.twilio || serviceStatus.sms.africastalking || serviceStatus.sms.termii;
    const hasWhatsappConfig = serviceStatus.whatsapp.configured;
    
    const configuredServicesCount = [hasEmailConfig, hasSmsConfig, hasWhatsappConfig].filter(Boolean).length;
    const status = configuredServicesCount >= 2 ? 'healthy' : configuredServicesCount >= 1 ? 'degraded' : 'unhealthy';
    
    return NextResponse.json({
      status,
      service: 'External Services MCP Server',
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        server: {
          available: true,
          resourceCount: resources.length,
          toolCount: tools.length
        },
        services: serviceStatus,
        configuredServices: configuredServicesCount
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      service: 'External Services MCP Server',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

export async function HEAD() {
  try {
    const server = new ExternalServicesMCPServer();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}