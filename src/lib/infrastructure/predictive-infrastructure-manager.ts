/**
 * Predictive Infrastructure Management System
 * ==========================================
 * AI-powered infrastructure management with auto-scaling and resource optimization
 * 
 * Features:
 * - Predictive resource scaling based on usage patterns
 * - Cost optimization through intelligent resource allocation
 * - Performance-driven scaling decisions
 * - African market-aware infrastructure patterns
 * - Multi-service orchestration and health monitoring
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import prisma from '@/lib/db/prisma';
import { EventEmitter } from 'events';

export interface InfrastructureResource {
  id: string;
  type: 'database' | 'api_server' | 'worker' | 'cache' | 'storage' | 'network';
  name: string;
  provider: 'docker' | 'kubernetes' | 'aws' | 'gcp' | 'azure' | 'local';
  status: 'healthy' | 'warning' | 'critical' | 'scaling' | 'maintenance';
  metrics: ResourceMetrics;
  configuration: ResourceConfiguration;
  scaling: ScalingConfiguration;
  costs: CostMetrics;
  location: AfricanRegion;
  lastUpdated: Date;
}

export interface ResourceMetrics {
  cpu: {
    usage: number; // 0-100%
    average: number; // 5-minute average
    peak: number; // peak in last hour
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  memory: {
    usage: number; // 0-100%
    available: number; // MB
    peak: number;
    swapUsage: number;
  };
  disk: {
    usage: number; // 0-100%
    iops: number;
    throughput: number; // MB/s
    latency: number; // ms
  };
  network: {
    inbound: number; // MB/s
    outbound: number; // MB/s
    connections: number;
    latency: number; // ms
  };
  application: {
    requestsPerSecond: number;
    responseTime: number; // ms
    errorRate: number; // 0-100%
    activeUsers: number;
  };
}

export interface ResourceConfiguration {
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scalingPolicy: 'reactive' | 'predictive' | 'scheduled' | 'hybrid';
  cooldownPeriod: number; // seconds
  resourceLimits: {
    cpu: string; // e.g., "2000m"
    memory: string; // e.g., "4Gi"
    storage: string; // e.g., "100Gi"
  };
}

export interface ScalingConfiguration {
  enabled: boolean;
  triggers: ScalingTrigger[];
  predictions: ResourcePrediction[];
  lastScalingAction: Date | null;
  scalingHistory: ScalingEvent[];
}

export interface ScalingTrigger {
  id: string;
  type: 'threshold' | 'predictive' | 'scheduled' | 'external';
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'trend_up' | 'trend_down';
  value: number;
  duration: number; // seconds
  action: 'scale_up' | 'scale_down' | 'scale_to' | 'alert';
  enabled: boolean;
  africanMarketAware: boolean; // Consider African peak hours and patterns
}

export interface ResourcePrediction {
  timestamp: Date;
  horizon: '1h' | '6h' | '24h' | '7d' | '30d';
  predictedMetrics: Partial<ResourceMetrics>;
  confidence: number; // 0-1
  factors: string[]; // e.g., ["campaign_launch", "market_hours", "seasonal_trend"]
  recommendedAction: 'scale_up' | 'scale_down' | 'maintain' | 'optimize';
  predictedCost: number;
  businessImpact: string;
}

export interface ScalingEvent {
  id: string;
  timestamp: Date;
  resourceId: string;
  action: 'scale_up' | 'scale_down' | 'scale_to';
  trigger: string;
  fromInstances: number;
  toInstances: number;
  reason: string;
  cost: number;
  duration: number; // seconds
  success: boolean;
  impact: {
    performanceImprovement: number; // %
    costChange: number;
    userExperienceImpact: string;
  };
}

export interface CostMetrics {
  hourly: number;
  daily: number;
  monthly: number;
  currency: 'USD' | 'NGN' | 'KES' | 'ZAR' | 'GHS';
  optimization: {
    potentialSavings: number;
    efficiency: number; // 0-100%
    recommendations: string[];
  };
}

export type AfricanRegion = 
  | 'nigeria_lagos' 
  | 'kenya_nairobi' 
  | 'south_africa_cape_town' 
  | 'ghana_accra' 
  | 'egypt_cairo'
  | 'morocco_casablanca'
  | 'multi_region';

class PredictiveInfrastructureManager extends EventEmitter {
  private resources: Map<string, InfrastructureResource> = new Map();
  private scalingQueue: ScalingEvent[] = [];
  private predictionEngine: ResourcePredictionEngine;
  private costOptimizer: CostOptimizer;
  private africaAwareScheduler: AfricaAwareScheduler;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.predictionEngine = new ResourcePredictionEngine();
    this.costOptimizer = new CostOptimizer();
    this.africaAwareScheduler = new AfricaAwareScheduler();
    this.initializeInfrastructureDiscovery();
    this.startMonitoring();
  }

  /**
   * Initialize infrastructure discovery and register core resources
   */
  private async initializeInfrastructureDiscovery() {
    try {
      logger.info('Initializing infrastructure discovery...');

      // Register core MarketSage infrastructure
      await this.registerCoreInfrastructure();
      
      // Start resource health monitoring
      this.startResourceHealthChecks();
      
      // Initialize predictive models
      await this.predictionEngine.initialize();
      
      logger.info('Infrastructure discovery completed', {
        resourceCount: this.resources.size,
        regions: Array.from(new Set(Array.from(this.resources.values()).map(r => r.location)))
      });

    } catch (error) {
      logger.error('Infrastructure discovery failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Register core MarketSage infrastructure components
   */
  private async registerCoreInfrastructure() {
    const coreResources: Partial<InfrastructureResource>[] = [
      {
        type: 'database',
        name: 'PostgreSQL Primary',
        provider: 'docker',
        status: 'healthy',
        location: 'nigeria_lagos',
        configuration: {
          minInstances: 1,
          maxInstances: 3,
          currentInstances: 1,
          targetCpuUtilization: 70,
          targetMemoryUtilization: 80,
          scalingPolicy: 'hybrid',
          cooldownPeriod: 300,
          resourceLimits: {
            cpu: '2000m',
            memory: '4Gi',
            storage: '100Gi'
          }
        },
        scaling: {
          enabled: true,
          triggers: [
            {
              id: 'cpu_high',
              type: 'threshold',
              metric: 'cpu.usage',
              condition: 'greater_than',
              value: 80,
              duration: 300,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: true
            },
            {
              id: 'connections_high',
              type: 'threshold',
              metric: 'network.connections',
              condition: 'greater_than',
              value: 100,
              duration: 180,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: false
            }
          ],
          predictions: [],
          lastScalingAction: null,
          scalingHistory: []
        }
      },
      {
        type: 'api_server',
        name: 'Next.js Application Server',
        provider: 'docker',
        status: 'healthy',
        location: 'multi_region',
        configuration: {
          minInstances: 2,
          maxInstances: 10,
          currentInstances: 2,
          targetCpuUtilization: 60,
          targetMemoryUtilization: 70,
          scalingPolicy: 'predictive',
          cooldownPeriod: 180,
          resourceLimits: {
            cpu: '1000m',
            memory: '2Gi',
            storage: '10Gi'
          }
        },
        scaling: {
          enabled: true,
          triggers: [
            {
              id: 'response_time_high',
              type: 'threshold',
              metric: 'application.responseTime',
              condition: 'greater_than',
              value: 2000,
              duration: 120,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: true
            },
            {
              id: 'requests_per_second_high',
              type: 'threshold',
              metric: 'application.requestsPerSecond',
              condition: 'greater_than',
              value: 50,
              duration: 60,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: true
            }
          ],
          predictions: [],
          lastScalingAction: null,
          scalingHistory: []
        }
      },
      {
        type: 'cache',
        name: 'Redis Cache',
        provider: 'docker',
        status: 'healthy',
        location: 'nigeria_lagos',
        configuration: {
          minInstances: 1,
          maxInstances: 3,
          currentInstances: 1,
          targetCpuUtilization: 75,
          targetMemoryUtilization: 85,
          scalingPolicy: 'reactive',
          cooldownPeriod: 240,
          resourceLimits: {
            cpu: '500m',
            memory: '1Gi',
            storage: '5Gi'
          }
        },
        scaling: {
          enabled: true,
          triggers: [
            {
              id: 'memory_high',
              type: 'threshold',
              metric: 'memory.usage',
              condition: 'greater_than',
              value: 90,
              duration: 60,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: false
            }
          ],
          predictions: [],
          lastScalingAction: null,
          scalingHistory: []
        }
      },
      {
        type: 'worker',
        name: 'Campaign Processing Workers',
        provider: 'docker',
        status: 'healthy',
        location: 'multi_region',
        configuration: {
          minInstances: 1,
          maxInstances: 8,
          currentInstances: 1,
          targetCpuUtilization: 70,
          targetMemoryUtilization: 75,
          scalingPolicy: 'scheduled',
          cooldownPeriod: 120,
          resourceLimits: {
            cpu: '1500m',
            memory: '3Gi',
            storage: '20Gi'
          }
        },
        scaling: {
          enabled: true,
          triggers: [
            {
              id: 'campaign_queue_high',
              type: 'external',
              metric: 'queue.depth',
              condition: 'greater_than',
              value: 10,
              duration: 30,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: true
            },
            {
              id: 'african_business_hours',
              type: 'scheduled',
              metric: 'time.hour',
              condition: 'equals',
              value: 8, // 8 AM WAT
              duration: 0,
              action: 'scale_up',
              enabled: true,
              africanMarketAware: true
            }
          ],
          predictions: [],
          lastScalingAction: null,
          scalingHistory: []
        }
      }
    ];

    for (const resourceData of coreResources) {
      const resource: InfrastructureResource = {
        id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metrics: this.initializeResourceMetrics(),
        costs: this.initializeCostMetrics(resourceData.location || 'nigeria_lagos'),
        lastUpdated: new Date(),
        ...resourceData
      } as InfrastructureResource;

      this.resources.set(resource.id, resource);
    }
  }

  /**
   * Initialize default resource metrics
   */
  private initializeResourceMetrics(): ResourceMetrics {
    return {
      cpu: {
        usage: Math.random() * 30 + 20, // 20-50% baseline
        average: Math.random() * 30 + 20,
        peak: Math.random() * 20 + 60,
        trend: 'stable'
      },
      memory: {
        usage: Math.random() * 40 + 30, // 30-70% baseline
        available: Math.random() * 2000 + 1000, // 1-3GB
        peak: Math.random() * 20 + 70,
        swapUsage: Math.random() * 10
      },
      disk: {
        usage: Math.random() * 30 + 40, // 40-70% baseline
        iops: Math.random() * 1000 + 500,
        throughput: Math.random() * 100 + 50,
        latency: Math.random() * 5 + 2
      },
      network: {
        inbound: Math.random() * 50 + 10,
        outbound: Math.random() * 30 + 5,
        connections: Math.random() * 50 + 10,
        latency: Math.random() * 50 + 20
      },
      application: {
        requestsPerSecond: Math.random() * 20 + 5,
        responseTime: Math.random() * 500 + 200,
        errorRate: Math.random() * 2,
        activeUsers: Math.random() * 100 + 50
      }
    };
  }

  /**
   * Initialize cost metrics based on region
   */
  private initializeCostMetrics(region: AfricanRegion): CostMetrics {
    const baseCost = region === 'multi_region' ? 0.12 : 0.08; // USD per hour
    
    return {
      hourly: baseCost,
      daily: baseCost * 24,
      monthly: baseCost * 24 * 30,
      currency: 'USD',
      optimization: {
        potentialSavings: Math.random() * 20 + 5,
        efficiency: Math.random() * 30 + 70,
        recommendations: [
          'Consider right-sizing during off-peak hours',
          'Optimize for African business hours',
          'Enable predictive scaling'
        ]
      }
    };
  }

  /**
   * Start continuous monitoring and optimization
   */
  private startMonitoring() {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, 30000);

    // Generate predictions every 5 minutes
    setInterval(async () => {
      await this.generatePredictions();
    }, 300000);

    // Cost optimization every hour
    setInterval(async () => {
      await this.optimizeCosts();
    }, 3600000);

    logger.info('Infrastructure monitoring started');
  }

  /**
   * Perform a complete monitoring cycle
   */
  private async performMonitoringCycle() {
    const tracer = trace.getTracer('infrastructure-monitoring');
    
    return tracer.startActiveSpan('monitoring-cycle', async (span) => {
      try {
        span.setAttributes({
          'monitoring.resources.count': this.resources.size,
          'monitoring.cycle.timestamp': Date.now()
        });

        // Update resource metrics
        await this.updateResourceMetrics();
        
        // Check scaling triggers
        await this.checkScalingTriggers();
        
        // Process scaling queue
        await this.processScalingQueue();
        
        // Update health status
        await this.updateHealthStatus();
        
        // Emit monitoring event
        this.emit('monitoring_cycle_complete', {
          timestamp: new Date(),
          resourceCount: this.resources.size,
          healthyResources: Array.from(this.resources.values()).filter(r => r.status === 'healthy').length
        });

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Monitoring cycle failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        span.end();
      }
    });
  }

  /**
   * Update metrics for all resources
   */
  private async updateResourceMetrics() {
    for (const [resourceId, resource] of this.resources.entries()) {
      try {
        // Simulate metric collection (in production, this would call actual monitoring APIs)
        const updatedMetrics = await this.collectResourceMetrics(resource);
        
        resource.metrics = updatedMetrics;
        resource.lastUpdated = new Date();
        
        this.resources.set(resourceId, resource);
        
      } catch (error) {
        logger.error('Failed to update metrics for resource', {
          resourceId,
          resourceName: resource.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Simulate resource metrics collection
   */
  private async collectResourceMetrics(resource: InfrastructureResource): Promise<ResourceMetrics> {
    // In production, this would integrate with actual monitoring systems
    // For now, simulate realistic metrics with trends
    
    const current = resource.metrics;
    const variation = 0.1; // 10% variation
    
    return {
      cpu: {
        usage: Math.max(0, Math.min(100, current.cpu.usage + (Math.random() - 0.5) * variation * 100)),
        average: current.cpu.average * 0.9 + current.cpu.usage * 0.1, // Moving average
        peak: Math.max(current.cpu.peak, current.cpu.usage),
        trend: this.calculateTrend(current.cpu.usage, current.cpu.average)
      },
      memory: {
        usage: Math.max(0, Math.min(100, current.memory.usage + (Math.random() - 0.5) * variation * 100)),
        available: current.memory.available + (Math.random() - 0.5) * 200,
        peak: Math.max(current.memory.peak, current.memory.usage),
        swapUsage: Math.max(0, current.memory.swapUsage + (Math.random() - 0.5) * 5)
      },
      disk: {
        usage: Math.max(0, Math.min(100, current.disk.usage + (Math.random() - 0.5) * variation * 20)),
        iops: Math.max(0, current.disk.iops + (Math.random() - 0.5) * 200),
        throughput: Math.max(0, current.disk.throughput + (Math.random() - 0.5) * 20),
        latency: Math.max(1, current.disk.latency + (Math.random() - 0.5) * 2)
      },
      network: {
        inbound: Math.max(0, current.network.inbound + (Math.random() - 0.5) * 10),
        outbound: Math.max(0, current.network.outbound + (Math.random() - 0.5) * 5),
        connections: Math.max(0, current.network.connections + (Math.random() - 0.5) * 10),
        latency: Math.max(1, current.network.latency + (Math.random() - 0.5) * 10)
      },
      application: {
        requestsPerSecond: Math.max(0, current.application.requestsPerSecond + (Math.random() - 0.5) * 5),
        responseTime: Math.max(50, current.application.responseTime + (Math.random() - 0.5) * 100),
        errorRate: Math.max(0, Math.min(100, current.application.errorRate + (Math.random() - 0.5) * 1)),
        activeUsers: Math.max(0, current.application.activeUsers + (Math.random() - 0.5) * 20)
      }
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(current: number, average: number): 'increasing' | 'decreasing' | 'stable' {
    const diff = current - average;
    const threshold = average * 0.05; // 5% threshold
    
    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Check scaling triggers for all resources
   */
  private async checkScalingTriggers() {
    for (const resource of this.resources.values()) {
      if (!resource.scaling.enabled) continue;
      
      for (const trigger of resource.scaling.triggers) {
        if (!trigger.enabled) continue;
        
        const shouldScale = await this.evaluateScalingTrigger(resource, trigger);
        
        if (shouldScale) {
          await this.queueScalingAction(resource, trigger);
        }
      }
    }
  }

  /**
   * Evaluate a scaling trigger
   */
  private async evaluateScalingTrigger(
    resource: InfrastructureResource, 
    trigger: ScalingTrigger
  ): Promise<boolean> {
    try {
      const metricValue = this.getMetricValue(resource, trigger.metric);
      
      // Apply African market awareness
      if (trigger.africanMarketAware) {
        const isAfricanBusinessHours = this.africaAwareScheduler.isBusinessHours(resource.location);
        const marketFactor = isAfricanBusinessHours ? 1.2 : 0.8; // More aggressive scaling during business hours
        trigger.value = trigger.value * marketFactor;
      }
      
      switch (trigger.condition) {
        case 'greater_than':
          return metricValue > trigger.value;
        case 'less_than':
          return metricValue < trigger.value;
        case 'equals':
          return Math.abs(metricValue - trigger.value) < 0.01;
        case 'trend_up':
          return resource.metrics.cpu.trend === 'increasing' && metricValue > trigger.value;
        case 'trend_down':
          return resource.metrics.cpu.trend === 'decreasing' && metricValue < trigger.value;
        default:
          return false;
      }
      
    } catch (error) {
      logger.error('Error evaluating scaling trigger', {
        resourceId: resource.id,
        triggerId: trigger.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get metric value by path
   */
  private getMetricValue(resource: InfrastructureResource, metricPath: string): number {
    const parts = metricPath.split('.');
    let value: any = resource.metrics;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Queue a scaling action
   */
  private async queueScalingAction(resource: InfrastructureResource, trigger: ScalingTrigger) {
    // Check cooldown period
    if (resource.scaling.lastScalingAction) {
      const timeSinceLastScaling = Date.now() - resource.scaling.lastScalingAction.getTime();
      if (timeSinceLastScaling < resource.configuration.cooldownPeriod * 1000) {
        return; // Still in cooldown
      }
    }
    
    const scalingEvent: ScalingEvent = {
      id: `scaling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resourceId: resource.id,
      action: trigger.action,
      trigger: trigger.id,
      fromInstances: resource.configuration.currentInstances,
      toInstances: this.calculateTargetInstances(resource, trigger.action),
      reason: `Triggered by ${trigger.type}: ${trigger.metric} ${trigger.condition} ${trigger.value}`,
      cost: 0, // Will be calculated during execution
      duration: 0,
      success: false,
      impact: {
        performanceImprovement: 0,
        costChange: 0,
        userExperienceImpact: 'pending'
      }
    };
    
    this.scalingQueue.push(scalingEvent);
    
    logger.info('Scaling action queued', {
      resourceId: resource.id,
      resourceName: resource.name,
      action: trigger.action,
      trigger: trigger.id,
      fromInstances: scalingEvent.fromInstances,
      toInstances: scalingEvent.toInstances
    });
  }

  /**
   * Calculate target instances for scaling action
   */
  private calculateTargetInstances(resource: InfrastructureResource, action: string): number {
    const current = resource.configuration.currentInstances;
    const min = resource.configuration.minInstances;
    const max = resource.configuration.maxInstances;
    
    switch (action) {
      case 'scale_up':
        return Math.min(max, Math.ceil(current * 1.5)); // Scale up by 50%
      case 'scale_down':
        return Math.max(min, Math.floor(current * 0.7)); // Scale down by 30%
      case 'scale_to':
        return current; // This would be specified by the trigger
      default:
        return current;
    }
  }

  /**
   * Process queued scaling actions
   */
  private async processScalingQueue() {
    while (this.scalingQueue.length > 0) {
      const scalingEvent = this.scalingQueue.shift()!;
      
      try {
        await this.executeScalingAction(scalingEvent);
      } catch (error) {
        logger.error('Failed to execute scaling action', {
          scalingEventId: scalingEvent.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Execute a scaling action
   */
  private async executeScalingAction(scalingEvent: ScalingEvent) {
    const tracer = trace.getTracer('infrastructure-scaling');
    
    return tracer.startActiveSpan('execute-scaling', async (span) => {
      const startTime = Date.now();
      
      try {
        span.setAttributes({
          'scaling.resource.id': scalingEvent.resourceId,
          'scaling.action': scalingEvent.action,
          'scaling.from_instances': scalingEvent.fromInstances,
          'scaling.to_instances': scalingEvent.toInstances
        });

        const resource = this.resources.get(scalingEvent.resourceId);
        if (!resource) {
          throw new Error(`Resource not found: ${scalingEvent.resourceId}`);
        }

        // Update resource status
        resource.status = 'scaling';
        
        // Simulate scaling execution (in production, this would call actual scaling APIs)
        await this.performActualScaling(resource, scalingEvent);
        
        // Update resource configuration
        resource.configuration.currentInstances = scalingEvent.toInstances;
        resource.scaling.lastScalingAction = new Date();
        resource.status = 'healthy';
        
        // Calculate scaling impact
        const endTime = Date.now();
        scalingEvent.duration = endTime - startTime;
        scalingEvent.success = true;
        scalingEvent.cost = this.calculateScalingCost(resource, scalingEvent);
        scalingEvent.impact = this.calculateScalingImpact(resource, scalingEvent);
        
        // Add to scaling history
        resource.scaling.scalingHistory.push(scalingEvent);
        
        // Update resource in map
        this.resources.set(resource.id, resource);
        
        // Emit scaling event
        this.emit('scaling_completed', {
          resourceId: resource.id,
          resourceName: resource.name,
          scalingEvent
        });
        
        logger.info('Scaling action completed successfully', {
          resourceId: resource.id,
          resourceName: resource.name,
          action: scalingEvent.action,
          duration: scalingEvent.duration,
          cost: scalingEvent.cost,
          newInstanceCount: resource.configuration.currentInstances
        });

      } catch (error) {
        scalingEvent.success = false;
        scalingEvent.duration = Date.now() - startTime;
        
        span.setStatus({ code: 2, message: String(error) });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Simulate actual scaling operation
   */
  private async performActualScaling(resource: InfrastructureResource, scalingEvent: ScalingEvent) {
    // In production, this would integrate with actual infrastructure APIs
    // Docker, Kubernetes, cloud providers, etc.
    
    const scalingTime = Math.random() * 30000 + 10000; // 10-40 seconds
    await new Promise(resolve => setTimeout(resolve, scalingTime));
    
    logger.info('Simulated scaling operation', {
      resourceType: resource.type,
      provider: resource.provider,
      action: scalingEvent.action,
      duration: scalingTime
    });
  }

  /**
   * Calculate scaling cost
   */
  private calculateScalingCost(resource: InfrastructureResource, scalingEvent: ScalingEvent): number {
    const instanceDiff = scalingEvent.toInstances - scalingEvent.fromInstances;
    const hourlyInstanceCost = resource.costs.hourly / resource.configuration.currentInstances;
    
    // Calculate additional cost per hour
    return instanceDiff * hourlyInstanceCost;
  }

  /**
   * Calculate scaling impact
   */
  private calculateScalingImpact(resource: InfrastructureResource, scalingEvent: ScalingEvent) {
    const instanceRatio = scalingEvent.toInstances / scalingEvent.fromInstances;
    
    return {
      performanceImprovement: scalingEvent.action === 'scale_up' ? (instanceRatio - 1) * 100 : 0,
      costChange: this.calculateScalingCost(resource, scalingEvent),
      userExperienceImpact: scalingEvent.action === 'scale_up' ? 'improved' : 'maintained'
    };
  }

  /**
   * Generate resource predictions
   */
  private async generatePredictions() {
    for (const resource of this.resources.values()) {
      try {
        const predictions = await this.predictionEngine.generatePredictions(resource);
        resource.scaling.predictions = predictions;
        
        // Check if predictive actions are needed
        for (const prediction of predictions) {
          if (prediction.recommendedAction !== 'maintain' && prediction.confidence > 0.7) {
            await this.considerPredictiveScaling(resource, prediction);
          }
        }
        
      } catch (error) {
        logger.error('Failed to generate predictions for resource', {
          resourceId: resource.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Consider predictive scaling based on prediction
   */
  private async considerPredictiveScaling(resource: InfrastructureResource, prediction: ResourcePrediction) {
    // Only act on high-confidence predictions for significant horizons
    if (prediction.confidence < 0.8 || !['6h', '24h'].includes(prediction.horizon)) {
      return;
    }
    
    // Create predictive scaling trigger
    const predictiveTrigger: ScalingTrigger = {
      id: `predictive_${Date.now()}`,
      type: 'predictive',
      metric: 'prediction.confidence',
      condition: 'greater_than',
      value: 0.8,
      duration: 0,
      action: prediction.recommendedAction as any,
      enabled: true,
      africanMarketAware: true
    };
    
    await this.queueScalingAction(resource, predictiveTrigger);
    
    logger.info('Predictive scaling triggered', {
      resourceId: resource.id,
      horizon: prediction.horizon,
      confidence: prediction.confidence,
      recommendedAction: prediction.recommendedAction,
      factors: prediction.factors
    });
  }

  /**
   * Update health status for all resources
   */
  private async updateHealthStatus() {
    for (const resource of this.resources.values()) {
      const previousStatus = resource.status;
      
      if (resource.status === 'scaling') {
        continue; // Don't update status during scaling
      }
      
      // Determine health based on metrics
      const healthScore = this.calculateHealthScore(resource);
      
      if (healthScore >= 90) {
        resource.status = 'healthy';
      } else if (healthScore >= 70) {
        resource.status = 'warning';
      } else {
        resource.status = 'critical';
      }
      
      // Emit status change events
      if (previousStatus !== resource.status) {
        this.emit('resource_status_changed', {
          resourceId: resource.id,
          resourceName: resource.name,
          previousStatus,
          newStatus: resource.status,
          healthScore
        });
      }
    }
  }

  /**
   * Calculate resource health score
   */
  private calculateHealthScore(resource: InfrastructureResource): number {
    const weights = {
      cpu: 0.25,
      memory: 0.25,
      disk: 0.15,
      network: 0.15,
      application: 0.20
    };
    
    const scores = {
      cpu: Math.max(0, 100 - resource.metrics.cpu.usage),
      memory: Math.max(0, 100 - resource.metrics.memory.usage),
      disk: Math.max(0, 100 - resource.metrics.disk.usage),
      network: Math.min(100, Math.max(0, 100 - resource.metrics.network.latency)),
      application: Math.max(0, 100 - resource.metrics.application.errorRate)
    };
    
    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (scores[metric as keyof typeof scores] * weight);
    }, 0);
  }

  /**
   * Optimize costs across all resources
   */
  private async optimizeCosts() {
    try {
      const optimizations = await this.costOptimizer.generateOptimizations(Array.from(this.resources.values()));
      
      for (const optimization of optimizations) {
        logger.info('Cost optimization recommendation', optimization);
        
        // Apply automatic optimizations if they're safe
        if (optimization.autoApply && optimization.riskLevel === 'low') {
          await this.applyCostOptimization(optimization);
        }
      }
      
    } catch (error) {
      logger.error('Cost optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Apply cost optimization
   */
  private async applyCostOptimization(optimization: any) {
    logger.info('Applying cost optimization', optimization);
    // Implementation would depend on the specific optimization
  }

  /**
   * Get current infrastructure status
   */
  async getInfrastructureStatus() {
    const resources = Array.from(this.resources.values());
    
    return {
      overview: {
        totalResources: resources.length,
        healthyResources: resources.filter(r => r.status === 'healthy').length,
        warningResources: resources.filter(r => r.status === 'warning').length,
        criticalResources: resources.filter(r => r.status === 'critical').length,
        scalingResources: resources.filter(r => r.status === 'scaling').length
      },
      resources: resources,
      totalCost: {
        hourly: resources.reduce((sum, r) => sum + r.costs.hourly, 0),
        daily: resources.reduce((sum, r) => sum + r.costs.daily, 0),
        monthly: resources.reduce((sum, r) => sum + r.costs.monthly, 0)
      },
      recentScalingEvents: resources
        .flatMap(r => r.scaling.scalingHistory)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      predictions: resources
        .flatMap(r => r.scaling.predictions)
        .filter(p => p.confidence > 0.7)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
    };
  }

  /**
   * Force scaling action for a resource
   */
  async forceScaling(resourceId: string, action: 'scale_up' | 'scale_down' | 'scale_to', targetInstances?: number) {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }
    
    const scalingEvent: ScalingEvent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resourceId,
      action,
      trigger: 'manual',
      fromInstances: resource.configuration.currentInstances,
      toInstances: targetInstances || this.calculateTargetInstances(resource, action),
      reason: 'Manual scaling action',
      cost: 0,
      duration: 0,
      success: false,
      impact: {
        performanceImprovement: 0,
        costChange: 0,
        userExperienceImpact: 'pending'
      }
    };
    
    this.scalingQueue.push(scalingEvent);
    
    logger.info('Manual scaling action queued', {
      resourceId,
      action,
      targetInstances: scalingEvent.toInstances
    });
    
    return scalingEvent.id;
  }

  /**
   * Cleanup and stop monitoring
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('Predictive infrastructure manager destroyed');
  }
}

/**
 * Resource Prediction Engine
 */
class ResourcePredictionEngine {
  async initialize() {
    logger.info('Resource prediction engine initialized');
  }

  async generatePredictions(resource: InfrastructureResource): Promise<ResourcePrediction[]> {
    const horizons: Array<'1h' | '6h' | '24h' | '7d' | '30d'> = ['1h', '6h', '24h', '7d', '30d'];
    
    return horizons.map(horizon => ({
      timestamp: new Date(),
      horizon,
      predictedMetrics: this.predictMetrics(resource, horizon),
      confidence: this.calculateConfidence(resource, horizon),
      factors: this.identifyFactors(resource, horizon),
      recommendedAction: this.recommendAction(resource, horizon),
      predictedCost: this.predictCost(resource, horizon),
      businessImpact: this.predictBusinessImpact(resource, horizon)
    }));
  }

  private predictMetrics(resource: InfrastructureResource, horizon: string): Partial<ResourceMetrics> {
    // Simple trend-based prediction (in production, would use ML models)
    const factor = horizon === '1h' ? 1.05 : horizon === '6h' ? 1.15 : 1.3;
    
    return {
      cpu: {
        usage: Math.min(100, resource.metrics.cpu.usage * factor),
        average: resource.metrics.cpu.average * factor,
        peak: resource.metrics.cpu.peak * factor,
        trend: resource.metrics.cpu.trend
      },
      application: {
        requestsPerSecond: resource.metrics.application.requestsPerSecond * factor,
        responseTime: resource.metrics.application.responseTime * factor,
        errorRate: resource.metrics.application.errorRate,
        activeUsers: resource.metrics.application.activeUsers * factor
      }
    };
  }

  private calculateConfidence(resource: InfrastructureResource, horizon: string): number {
    // Confidence decreases with longer horizons
    const baseConfidence = 0.9;
    const horizonPenalty = horizon === '1h' ? 0 : horizon === '6h' ? 0.1 : horizon === '24h' ? 0.2 : 0.4;
    
    return Math.max(0.5, baseConfidence - horizonPenalty);
  }

  private identifyFactors(resource: InfrastructureResource, horizon: string): string[] {
    const factors = ['historical_trend', 'resource_utilization'];
    
    if (resource.location !== 'multi_region') {
      factors.push('african_business_hours');
    }
    
    if (horizon === '24h' || horizon === '7d') {
      factors.push('daily_patterns', 'weekly_cycles');
    }
    
    return factors;
  }

  private recommendAction(resource: InfrastructureResource, horizon: string): 'scale_up' | 'scale_down' | 'maintain' | 'optimize' {
    const cpuTrend = resource.metrics.cpu.trend;
    const currentUsage = resource.metrics.cpu.usage;
    
    if (cpuTrend === 'increasing' && currentUsage > 70) {
      return 'scale_up';
    } else if (cpuTrend === 'decreasing' && currentUsage < 30) {
      return 'scale_down';
    } else if (currentUsage > 80) {
      return 'optimize';
    }
    
    return 'maintain';
  }

  private predictCost(resource: InfrastructureResource, horizon: string): number {
    const multiplier = horizon === '1h' ? 1 : horizon === '6h' ? 6 : horizon === '24h' ? 24 : 168;
    return resource.costs.hourly * multiplier;
  }

  private predictBusinessImpact(resource: InfrastructureResource, horizon: string): string {
    const usage = resource.metrics.cpu.usage;
    
    if (usage > 80) {
      return 'High load may impact user experience';
    } else if (usage < 30) {
      return 'Low utilization presents cost optimization opportunity';
    }
    
    return 'Stable performance expected';
  }
}

/**
 * Cost Optimizer
 */
class CostOptimizer {
  async generateOptimizations(resources: InfrastructureResource[]): Promise<any[]> {
    const optimizations = [];
    
    for (const resource of resources) {
      // Check for over-provisioning
      if (resource.metrics.cpu.usage < 30 && resource.metrics.memory.usage < 40) {
        optimizations.push({
          type: 'right_sizing',
          resourceId: resource.id,
          resourceName: resource.name,
          description: 'Resource appears over-provisioned',
          potentialSavings: resource.costs.hourly * 0.3,
          riskLevel: 'low',
          autoApply: true
        });
      }
      
      // Check for African off-peak optimization
      if (resource.location !== 'multi_region' && resource.scaling.enabled) {
        optimizations.push({
          type: 'african_off_peak_scaling',
          resourceId: resource.id,
          resourceName: resource.name,
          description: 'Scale down during African off-peak hours',
          potentialSavings: resource.costs.daily * 0.2,
          riskLevel: 'medium',
          autoApply: false
        });
      }
    }
    
    return optimizations;
  }
}

/**
 * Africa-Aware Scheduler
 */
class AfricaAwareScheduler {
  isBusinessHours(region: AfricanRegion): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // African business hours: 8 AM to 6 PM local time
    const businessStart = 8;
    const businessEnd = 18;
    
    // Adjust for different African time zones
    let adjustedHour = hour;
    
    switch (region) {
      case 'nigeria_lagos':
      case 'ghana_accra':
        adjustedHour = hour; // WAT (UTC+1)
        break;
      case 'kenya_nairobi':
        adjustedHour = hour - 2; // EAT (UTC+3)
        break;
      case 'south_africa_cape_town':
        adjustedHour = hour - 1; // SAST (UTC+2)
        break;
      case 'egypt_cairo':
        adjustedHour = hour - 1; // EET (UTC+2)
        break;
      case 'morocco_casablanca':
        adjustedHour = hour + 1; // WET (UTC+0)
        break;
      default:
        adjustedHour = hour; // Default to WAT
    }
    
    return adjustedHour >= businessStart && adjustedHour < businessEnd;
  }
  
  getNextBusinessHour(region: AfricanRegion): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // 8 AM next day
    
    return tomorrow;
  }
}

// Export singleton instance
export const predictiveInfrastructureManager = new PredictiveInfrastructureManager();

// Export types and classes
export {
  PredictiveInfrastructureManager,
  ResourcePredictionEngine,
  CostOptimizer,
  AfricaAwareScheduler
};