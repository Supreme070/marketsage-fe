/**
 * MCP Health Check API Endpoint
 * 
 * Provides comprehensive health status for all MCP servers
 * including performance metrics and system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';

// Import MCP servers for health checks
import { CustomerDataMCPServer } from '@/mcp/servers/customer-data-server';
import { CampaignAnalyticsMCPServer } from '@/mcp/servers/campaign-analytics-server';
import { LeadPulseMCPServer } from '@/mcp/servers/leadpulse-server';
import { ExternalServicesMCPServer } from '@/mcp/servers/external-services-server';
import { MonitoringMCPServer } from '@/mcp/servers/monitoring-server';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details: Record<string, any>;
  error?: string;
}

interface SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    mcpServers: HealthCheckResult[];
  };
  performance: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    responseTime: number;
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check critical tables
    const [userCount, contactCount, mcpTablesExist] = await Promise.all([
      prisma.user.count(),
      prisma.contact.count(),
      checkMCPTablesExist()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'Database',
      status: 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connected: true,
        userCount,
        contactCount,
        mcpTablesAvailable: mcpTablesExist,
        queryTime: responseTime
      }
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        connected: false
      },
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Check if MCP tables exist
 */
async function checkMCPTablesExist(): Promise<boolean> {
  try {
    const mcpTables = [
      'MCPCampaignMetrics',
      'MCPCustomerPredictions',
      'MCPVisitorSessions',
      'MCPMonitoringMetrics'
    ];
    
    const tableChecks = await Promise.all(
      mcpTables.map(async (table) => {
        try {
          await prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`;
          return true;
        } catch {
          return false;
        }
      })
    );
    
    return tableChecks.every(exists => exists);
  } catch {
    return false;
  }
}

/**
 * Check Redis health
 */
async function checkRedisHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test connectivity with ping
    const pingResult = await redis.ping();
    
    // Test read/write operations
    const testKey = `health-check-${Date.now()}`;
    await redis.set(testKey, 'test', 'EX', 60);
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    
    // Get Redis info
    const info = await redis.info();
    const memoryUsage = info.match(/used_memory:(\d+)/)?.[1] || '0';
    const connectedClients = info.match(/connected_clients:(\d+)/)?.[1] || '0';
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'Redis',
      status: testValue === 'test' ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connected: pingResult === 'PONG',
        memoryUsage: parseInt(memoryUsage),
        connectedClients: parseInt(connectedClients),
        readWriteTest: testValue === 'test'
      }
    };
  } catch (error) {
    return {
      name: 'Redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        connected: false
      },
      error: error instanceof Error ? error.message : 'Unknown Redis error'
    };
  }
}

/**
 * Check MCP server health
 */
async function checkMCPServerHealth(
  ServerClass: any,
  name: string,
  authContext: any
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const server = new ServerClass();
    
    // Test basic server functionality
    const resources = await server.listResources(authContext);
    const tools = await server.listTools(authContext);
    
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      status: 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        available: true,
        resourceCount: resources.length,
        toolCount: tools.length,
        responseTime
      }
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        available: false
      },
      error: error instanceof Error ? error.message : `Unknown ${name} error`
    };
  }
}

/**
 * Get system performance metrics
 */
function getPerformanceMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    },
    cpu: {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to milliseconds
    },
    responseTime: 0 // Will be calculated at the end
  };
}

/**
 * Calculate overall system status
 */
function calculateOverallStatus(results: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;
  
  if (unhealthyCount > 0) {
    return 'unhealthy';
  } else if (degradedCount > 0) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * GET /api/mcp/health
 * Returns comprehensive health status of all MCP components
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check authentication (optional for health checks, but good for detailed info)
    const session = await getServerSession(authOptions);
    const authContext = session?.user ? {
      userId: session.user.id || '',
      organizationId: (session.user as any).organizationId || '',
      permissions: ['read:health'],
      role: (session.user as any).role || 'user'
    } : {
      userId: 'anonymous',
      organizationId: 'anonymous',
      permissions: ['read:health'],
      role: 'user'
    };
    
    // Run health checks in parallel
    const [
      databaseHealth,
      redisHealth,
      ...mcpServerHealths
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkMCPServerHealth(CustomerDataMCPServer, 'Customer Data Server', authContext),
      checkMCPServerHealth(CampaignAnalyticsMCPServer, 'Campaign Analytics Server', authContext),
      checkMCPServerHealth(LeadPulseMCPServer, 'LeadPulse Server', authContext),
      checkMCPServerHealth(ExternalServicesMCPServer, 'External Services Server', authContext),
      checkMCPServerHealth(MonitoringMCPServer, 'Monitoring Server', authContext)
    ]);
    
    // Get performance metrics
    const performance = getPerformanceMetrics();
    performance.responseTime = Date.now() - startTime;
    
    // Calculate overall status
    const allResults = [databaseHealth, redisHealth, ...mcpServerHealths];
    const overallStatus = calculateOverallStatus(allResults);
    
    // Get basic metrics (mock for now - would be from actual metrics store)
    const metrics = {
      totalRequests: 0, // Would track actual requests
      errorRate: 0, // Would calculate from logs
      averageResponseTime: performance.responseTime
    };
    
    const response: SystemHealthResponse = {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealth,
        redis: redisHealth,
        mcpServers: mcpServerHealths
      },
      performance,
      metrics
    };
    
    // Return appropriate HTTP status based on overall health
    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

/**
 * HEAD /api/mcp/health
 * Simple health check endpoint for load balancers
 */
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check - just database ping
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}