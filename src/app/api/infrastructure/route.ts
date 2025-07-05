/**
 * Predictive Infrastructure Management API
 * =======================================
 * HTTP endpoints for infrastructure monitoring, scaling, and optimization
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictiveInfrastructureManager } from '@/lib/infrastructure/predictive-infrastructure-manager';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Rate limiting for infrastructure operations
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    // Check permissions - only admins can access infrastructure
    const hasPermission = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'].includes(user.role);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions for infrastructure access' },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    logger.info('Infrastructure API request', {
      action,
      userId: user.id,
      userRole: user.role
    });

    let result;

    switch (action) {
      case 'status':
        result = await predictiveInfrastructureManager.getInfrastructureStatus();
        break;

      case 'health':
        result = await getSystemHealth();
        break;

      case 'metrics':
        const resourceId = url.searchParams.get('resourceId');
        result = await getResourceMetrics(resourceId);
        break;

      case 'scaling_history':
        const limit = Number.parseInt(url.searchParams.get('limit') || '50');
        result = await getScalingHistory(limit);
        break;

      case 'cost_analysis':
        const period = url.searchParams.get('period') || '24h';
        result = await getCostAnalysis(period);
        break;

      case 'predictions':
        result = await getPredictions();
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Infrastructure GET API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    // Check permissions - only super admins can perform scaling operations
    const hasPermission = ['SUPER_ADMIN', 'IT_ADMIN'].includes(user.role);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions for infrastructure operations' },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    logger.info('Infrastructure operation request', {
      action,
      userId: user.id,
      userRole: user.role,
      params
    });

    let result;

    switch (action) {
      case 'force_scaling':
        if (!params.resourceId || !params.scalingAction) {
          return NextResponse.json(
            { success: false, error: 'resourceId and scalingAction are required' },
            { status: 400 }
          );
        }
        
        result = await predictiveInfrastructureManager.forceScaling(
          params.resourceId,
          params.scalingAction,
          params.targetInstances
        );
        break;

      case 'update_scaling_config':
        if (!params.resourceId || !params.configuration) {
          return NextResponse.json(
            { success: false, error: 'resourceId and configuration are required' },
            { status: 400 }
          );
        }
        
        result = await updateScalingConfiguration(params.resourceId, params.configuration);
        break;

      case 'enable_predictive_scaling':
        if (!params.resourceId) {
          return NextResponse.json(
            { success: false, error: 'resourceId is required' },
            { status: 400 }
          );
        }
        
        result = await enablePredictiveScaling(params.resourceId, params.enabled !== false);
        break;

      case 'create_scaling_trigger':
        if (!params.resourceId || !params.trigger) {
          return NextResponse.json(
            { success: false, error: 'resourceId and trigger are required' },
            { status: 400 }
          );
        }
        
        result = await createScalingTrigger(params.resourceId, params.trigger);
        break;

      case 'optimize_costs':
        result = await triggerCostOptimization(params.resourceIds);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Infrastructure POST API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getSystemHealth() {
  const status = await predictiveInfrastructureManager.getInfrastructureStatus();
  
  const totalResources = status.overview.totalResources;
  const healthyResources = status.overview.healthyResources;
  const healthPercentage = totalResources > 0 ? (healthyResources / totalResources) * 100 : 100;
  
  return {
    overall: healthPercentage >= 90 ? 'excellent' : 
             healthPercentage >= 70 ? 'good' : 
             healthPercentage >= 50 ? 'warning' : 'critical',
    healthPercentage,
    summary: {
      ...status.overview,
      lastUpdate: new Date().toISOString()
    },
    alerts: generateHealthAlerts(status)
  };
}

async function getResourceMetrics(resourceId: string | null) {
  const status = await predictiveInfrastructureManager.getInfrastructureStatus();
  
  if (resourceId) {
    const resource = status.resources.find(r => r.id === resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }
    return resource;
  }
  
  return status.resources;
}

async function getScalingHistory(limit: number) {
  const status = await predictiveInfrastructureManager.getInfrastructureStatus();
  return status.recentScalingEvents.slice(0, limit);
}

async function getCostAnalysis(period: string) {
  const status = await predictiveInfrastructureManager.getInfrastructureStatus();
  
  const periodHours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 720;
  
  return {
    period,
    totalCost: {
      current: status.totalCost.hourly * periodHours,
      projected: status.totalCost.hourly * periodHours * 1.1, // 10% growth
      currency: 'USD'
    },
    breakdown: status.resources.map(resource => ({
      resourceId: resource.id,
      name: resource.name,
      type: resource.type,
      cost: resource.costs.hourly * periodHours,
      optimization: resource.costs.optimization
    })),
    recommendations: generateCostRecommendations(status.resources)
  };
}

async function getPredictions() {
  const status = await predictiveInfrastructureManager.getInfrastructureStatus();
  return status.predictions;
}

async function updateScalingConfiguration(resourceId: string, configuration: any) {
  // In a real implementation, this would update the resource configuration
  logger.info('Scaling configuration updated', { resourceId, configuration });
  
  return {
    resourceId,
    configuration,
    message: 'Scaling configuration updated successfully'
  };
}

async function enablePredictiveScaling(resourceId: string, enabled: boolean) {
  // In a real implementation, this would enable/disable predictive scaling
  logger.info('Predictive scaling toggled', { resourceId, enabled });
  
  return {
    resourceId,
    enabled,
    message: `Predictive scaling ${enabled ? 'enabled' : 'disabled'} successfully`
  };
}

async function createScalingTrigger(resourceId: string, trigger: any) {
  // In a real implementation, this would create a new scaling trigger
  logger.info('Scaling trigger created', { resourceId, trigger });
  
  return {
    resourceId,
    triggerId: `trigger_${Date.now()}`,
    trigger,
    message: 'Scaling trigger created successfully'
  };
}

async function triggerCostOptimization(resourceIds?: string[]) {
  // In a real implementation, this would trigger cost optimization
  logger.info('Cost optimization triggered', { resourceIds });
  
  return {
    resourceIds,
    optimizationId: `opt_${Date.now()}`,
    message: 'Cost optimization process started',
    estimatedDuration: '5-10 minutes'
  };
}

function generateHealthAlerts(status: any) {
  const alerts = [];
  
  if (status.overview.criticalResources > 0) {
    alerts.push({
      level: 'critical',
      message: `${status.overview.criticalResources} resource(s) in critical state`,
      action: 'Immediate attention required'
    });
  }
  
  if (status.overview.warningResources > 0) {
    alerts.push({
      level: 'warning',
      message: `${status.overview.warningResources} resource(s) showing warning signs`,
      action: 'Monitor closely and consider scaling'
    });
  }
  
  if (status.overview.scalingResources > 0) {
    alerts.push({
      level: 'info',
      message: `${status.overview.scalingResources} resource(s) currently scaling`,
      action: 'Scaling operations in progress'
    });
  }
  
  return alerts;
}

function generateCostRecommendations(resources: any[]) {
  const recommendations = [];
  
  for (const resource of resources) {
    if (resource.metrics.cpu.usage < 30 && resource.metrics.memory.usage < 40) {
      recommendations.push({
        type: 'right_sizing',
        resourceId: resource.id,
        resourceName: resource.name,
        description: 'Consider downsizing this resource due to low utilization',
        potentialSavings: resource.costs.hourly * 0.3 * 24 * 30, // Monthly savings
        priority: 'medium'
      });
    }
    
    if (resource.location !== 'multi_region') {
      recommendations.push({
        type: 'scheduling',
        resourceId: resource.id,
        resourceName: resource.name,
        description: 'Enable African business hours scaling for additional savings',
        potentialSavings: resource.costs.daily * 0.2 * 30, // Monthly savings
        priority: 'low'
      });
    }
  }
  
  return recommendations;
}