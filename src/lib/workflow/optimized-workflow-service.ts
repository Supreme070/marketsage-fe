/**
 * Optimized Workflow Service
 * Replaces JSON-based workflow definitions with normalized database queries
 * Provides dramatic performance improvements and better query capabilities
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { WorkflowStatus, WorkflowNodeType, Workflow } from '@prisma/client';
import { SimpleCache } from '@/lib/utils/simple-cache';

// Enhanced types for normalized workflow structure
interface OptimizedWorkflowDefinition {
  nodes: OptimizedWorkflowNode[];
  connections: OptimizedWorkflowConnection[];
  triggers: OptimizedWorkflowTrigger[];
  metadata: {
    complexity: number;
    nodeCount: number;
    connectionCount: number;
    lastModified: Date;
  };
}

interface OptimizedWorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  isActive: boolean;
}

interface OptimizedWorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  conditionType: string;
  conditionValue?: string;
  label?: string;
}

interface OptimizedWorkflowTrigger {
  id: string;
  nodeId: string;
  triggerType: string;
  conditions: Record<string, any>;
  isActive: boolean;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

// Performance caching layer
const workflowCache = new SimpleCache({
  max: 500, // Cache up to 500 workflows
  ttl: 1000 * 60 * 15, // 15 minutes TTL
});

const workflowListCache = new SimpleCache({
  max: 50, // Cache different list queries
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

export class OptimizedWorkflowService {
  /**
   * Get workflow with optimized normalized structure
   * Replaces single JSON query with efficient joined queries
   */
  static async getWorkflowById(workflowId: string, includeInactive = false): Promise<OptimizedWorkflowDefinition | null> {
    try {
      // Check cache first
      const cacheKey = `workflow_${workflowId}_${includeInactive}`;
      const cached = workflowCache.get(cacheKey);
      if (cached) {
        logger.info('Workflow cache hit', { workflowId });
        return cached;
      }

      // Single optimized query with proper includes
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          nodes: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
          connections: {
            where: includeInactive ? {} : { isActive: true },
            include: {
              sourceNode: { select: { id: true, label: true } },
              targetNode: { select: { id: true, label: true } },
            },
          },
          triggers: {
            where: includeInactive ? {} : { isActive: true },
          },
          cache: true, // Include definition cache if exists
        },
      });

      if (!workflow) {
        logger.warn('Workflow not found', { workflowId });
        return null;
      }

      // Transform to optimized structure
      const optimizedDefinition: OptimizedWorkflowDefinition = {
        nodes: workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          label: node.label,
          description: node.description || undefined,
          position: { x: node.positionX, y: node.positionY },
          config: (node.config as Record<string, any>) || {},
          isActive: node.isActive,
        })),
        connections: workflow.connections.map(conn => ({
          id: conn.id,
          sourceNodeId: conn.sourceNodeId,
          targetNodeId: conn.targetNodeId,
          sourceHandle: conn.sourceHandle || undefined,
          targetHandle: conn.targetHandle || undefined,
          conditionType: conn.conditionType,
          conditionValue: conn.conditionValue || undefined,
          label: conn.label || undefined,
        })),
        triggers: workflow.triggers.map(trigger => ({
          id: trigger.id,
          nodeId: trigger.nodeId,
          triggerType: trigger.triggerType,
          conditions: (trigger.conditions as Record<string, any>) || {},
          isActive: trigger.isActive,
          lastTriggeredAt: trigger.lastTriggeredAt || undefined,
          triggerCount: trigger.triggerCount,
        })),
        metadata: {
          complexity: this.calculateComplexity(workflow.nodes.length, workflow.connections.length),
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          lastModified: workflow.updatedAt,
        },
      };

      // Cache the result
      workflowCache.set(cacheKey, optimizedDefinition);
      
      // Update cache hit statistics
      if (workflow.cache) {
        await prisma.workflowDefinitionCache.update({
          where: { workflowId },
          data: { cacheHitCount: { increment: 1 } },
        });
      }

      logger.info('Workflow loaded and cached', { 
        workflowId, 
        nodeCount: optimizedDefinition.nodes.length,
        complexity: optimizedDefinition.metadata.complexity 
      });

      return optimizedDefinition;
    } catch (error) {
      logger.error('Failed to get workflow', { error, workflowId });
      throw error;
    }
  }

  /**
   * Get workflows list with enhanced filtering and performance
   */
  static async getWorkflowsList(options: {
    userId: string;
    status?: WorkflowStatus[];
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'performanceScore';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        userId,
        status,
        search,
        limit = 50,
        offset = 0,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
      } = options;

      // Generate cache key
      const cacheKey = `workflows_list_${JSON.stringify(options)}`;
      const cached = workflowListCache.get(cacheKey);
      if (cached) {
        logger.info('Workflow list cache hit', { userId, cacheKey });
        return cached;
      }

      // Build optimized query
      const where: any = {
        createdById: userId,
      };

      if (status && status.length > 0) {
        where.status = { in: status };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get workflows with essential data only (no heavy joins for list view)
      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            performanceScore: true,
            complexityRating: true,
            totalExecutions: true,
            successRate: true,
            avgExecutionTime: true,
            _count: {
              select: {
                nodes: { where: { isActive: true } },
                executions: { where: { status: 'RUNNING' } },
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        }),
        prisma.workflow.count({ where }),
      ]);

      const result = {
        workflows: workflows.map(workflow => ({
          ...workflow,
          activeNodeCount: workflow._count.nodes,
          activeExecutions: workflow._count.executions,
        })),
        total,
        hasMore: offset + limit < total,
      };

      // Cache the result
      workflowListCache.set(cacheKey, result);

      logger.info('Workflow list loaded', { 
        userId, 
        count: workflows.length, 
        total,
        cacheKey 
      });

      return result;
    } catch (error) {
      logger.error('Failed to get workflows list', { error, options });
      throw error;
    }
  }

  /**
   * Create workflow with normalized structure
   */
  static async createWorkflow(data: {
    name: string;
    description?: string;
    createdById: string;
    initialNodes?: OptimizedWorkflowNode[];
    initialConnections?: OptimizedWorkflowConnection[];
    initialTriggers?: OptimizedWorkflowTrigger[];
  }) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create workflow
        const workflow = await tx.workflow.create({
          data: {
            name: data.name,
            description: data.description,
            createdById: data.createdById,
            status: 'DRAFT',
            complexityRating: 'SIMPLE',
          },
        });

        // Create nodes
        if (data.initialNodes && data.initialNodes.length > 0) {
          await tx.workflowNode.createMany({
            data: data.initialNodes.map(node => ({
              id: node.id,
              workflowId: workflow.id,
              type: node.type,
              label: node.label,
              description: node.description,
              positionX: node.position.x,
              positionY: node.position.y,
              config: node.config,
              isActive: node.isActive,
            })),
          });
        }

        // Create connections
        if (data.initialConnections && data.initialConnections.length > 0) {
          await tx.workflowConnection.createMany({
            data: data.initialConnections.map(conn => ({
              id: conn.id,
              workflowId: workflow.id,
              sourceNodeId: conn.sourceNodeId,
              targetNodeId: conn.targetNodeId,
              sourceHandle: conn.sourceHandle,
              targetHandle: conn.targetHandle,
              conditionType: conn.conditionType as any,
              conditionValue: conn.conditionValue,
              label: conn.label,
            })),
          });
        }

        // Create triggers
        if (data.initialTriggers && data.initialTriggers.length > 0) {
          await tx.workflowTrigger.createMany({
            data: data.initialTriggers.map(trigger => ({
              id: trigger.id,
              workflowId: workflow.id,
              nodeId: trigger.nodeId,
              triggerType: trigger.triggerType as any,
              conditions: trigger.conditions,
            })),
          });
        }

        return workflow;
      });

      // Invalidate cache
      this.invalidateWorkflowCaches(data.createdById);

      logger.info('Workflow created with normalized structure', { 
        workflowId: result.id, 
        name: data.name,
        nodeCount: data.initialNodes?.length || 0 
      });

      return result;
    } catch (error) {
      logger.error('Failed to create workflow', { error, data });
      throw error;
    }
  }

  /**
   * Update workflow with optimized operations
   */
  static async updateWorkflow(
    workflowId: string,
    updates: {
      name?: string;
      description?: string;
      status?: WorkflowStatus;
      nodes?: OptimizedWorkflowNode[];
      connections?: OptimizedWorkflowConnection[];
      triggers?: OptimizedWorkflowTrigger[];
    }
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update workflow metadata
        const workflow = await tx.workflow.update({
          where: { id: workflowId },
          data: {
            name: updates.name,
            description: updates.description,
            status: updates.status,
            updatedAt: new Date(),
            ...(updates.nodes && {
              complexityRating: this.getComplexityRating(updates.nodes.length),
            }),
          },
        });

        // Update nodes if provided
        if (updates.nodes) {
          // Delete existing nodes
          await tx.workflowNode.deleteMany({
            where: { workflowId },
          });

          // Create new nodes
          if (updates.nodes.length > 0) {
            await tx.workflowNode.createMany({
              data: updates.nodes.map(node => ({
                id: node.id,
                workflowId,
                type: node.type,
                label: node.label,
                description: node.description,
                positionX: node.position.x,
                positionY: node.position.y,
                config: node.config,
                isActive: node.isActive,
              })),
            });
          }
        }

        // Update connections if provided
        if (updates.connections) {
          await tx.workflowConnection.deleteMany({
            where: { workflowId },
          });

          if (updates.connections.length > 0) {
            await tx.workflowConnection.createMany({
              data: updates.connections.map(conn => ({
                id: conn.id,
                workflowId,
                sourceNodeId: conn.sourceNodeId,
                targetNodeId: conn.targetNodeId,
                sourceHandle: conn.sourceHandle,
                targetHandle: conn.targetHandle,
                conditionType: conn.conditionType as any,
                conditionValue: conn.conditionValue,
                label: conn.label,
              })),
            });
          }
        }

        // Update triggers if provided
        if (updates.triggers) {
          await tx.workflowTrigger.deleteMany({
            where: { workflowId },
          });

          if (updates.triggers.length > 0) {
            await tx.workflowTrigger.createMany({
              data: updates.triggers.map(trigger => ({
                id: trigger.id,
                workflowId,
                nodeId: trigger.nodeId,
                triggerType: trigger.triggerType as any,
                conditions: trigger.conditions,
                isActive: trigger.isActive,
              })),
            });
          }
        }

        // Update cache
        await this.updateDefinitionCache(workflowId);

        return workflow;
      });

      // Invalidate cache
      this.invalidateWorkflowCache(workflowId);

      logger.info('Workflow updated with normalized structure', { 
        workflowId, 
        updates: Object.keys(updates) 
      });

      return result;
    } catch (error) {
      logger.error('Failed to update workflow', { error, workflowId, updates });
      throw error;
    }
  }

  /**
   * Get workflow performance analytics
   */
  static async getWorkflowAnalytics(workflowId: string, dateRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Check for cached analytics
      const cachedAnalytics = await prisma.workflowAnalytics.findFirst({
        where: {
          workflowId,
          dateRange: dateRange.toUpperCase() as any,
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (cachedAnalytics && 
          (Date.now() - cachedAnalytics.updatedAt.getTime()) < 1000 * 60 * 30) { // 30 min cache
        return cachedAnalytics;
      }

      // Calculate fresh analytics
      const executions = await prisma.workflowExecution.findMany({
        where: {
          workflowId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          steps: {
            select: {
              status: true,
              executionDuration: true,
              errorCategory: true,
            },
          },
        },
      });

      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'COMPLETED').length;
      const failedExecutions = executions.filter(e => e.status === 'FAILED').length;
      
      const completionTimes = executions
        .filter(e => e.completedAt && e.startedAt)
        .map(e => e.completedAt!.getTime() - e.startedAt.getTime());
      
      const avgCompletionTime = completionTimes.length > 0 
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
        : 0;

      const analytics = {
        workflowId,
        dateRange: dateRange.toUpperCase() as any,
        periodStart: startDate,
        periodEnd: endDate,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        avgCompletionTime,
        completionRate: totalExecutions > 0 ? completedExecutions / totalExecutions : 0,
        errorRate: totalExecutions > 0 ? failedExecutions / totalExecutions : 0,
        performanceScore: this.calculatePerformanceScore(completedExecutions, totalExecutions, avgCompletionTime),
      };

      // Cache the analytics
      await prisma.workflowAnalytics.upsert({
        where: {
          workflowId_dateRange_periodStart: {
            workflowId,
            dateRange: analytics.dateRange,
            periodStart: startDate,
          },
        },
        update: analytics,
        create: analytics,
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get workflow analytics', { error, workflowId, dateRange });
      throw error;
    }
  }

  // Helper methods
  private static calculateComplexity(nodeCount: number, connectionCount: number): number {
    return nodeCount * 1.0 + connectionCount * 0.5;
  }

  private static getComplexityRating(nodeCount: number): 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'ADVANCED' {
    if (nodeCount <= 5) return 'SIMPLE';
    if (nodeCount <= 15) return 'MODERATE';
    if (nodeCount <= 30) return 'COMPLEX';
    return 'ADVANCED';
  }

  private static calculatePerformanceScore(completed: number, total: number, avgTime: number): number {
    if (total === 0) return 0;
    const completionRate = completed / total;
    const timeScore = Math.max(0, 1 - (avgTime / (1000 * 60 * 5))); // Normalize against 5 min
    return (completionRate * 0.7 + timeScore * 0.3) * 100;
  }

  private static async updateDefinitionCache(workflowId: string) {
    const workflow = await this.getWorkflowById(workflowId);
    if (workflow) {
      const definitionHash = this.generateDefinitionHash(workflow);
      
      await prisma.workflowDefinitionCache.upsert({
        where: { workflowId },
        update: {
          definitionHash,
          cachedDefinition: workflow as any,
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          lastModified: workflow.metadata.lastModified,
        },
        create: {
          workflowId,
          definitionHash,
          cachedDefinition: workflow as any,
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          lastModified: workflow.metadata.lastModified,
        },
      });
    }
  }

  private static generateDefinitionHash(definition: OptimizedWorkflowDefinition): string {
    const content = JSON.stringify({
      nodes: definition.nodes.map(n => ({ id: n.id, type: n.type, config: n.config })),
      connections: definition.connections.map(c => ({ source: c.sourceNodeId, target: c.targetNodeId })),
    });
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private static invalidateWorkflowCache(workflowId: string) {
    workflowCache.delete(`workflow_${workflowId}_true`);
    workflowCache.delete(`workflow_${workflowId}_false`);
  }

  private static invalidateWorkflowCaches(userId: string) {
    // Clear list caches for this user
    const keys = Array.from(workflowListCache.keys());
    keys.forEach(key => {
      if (key.includes(userId)) {
        workflowListCache.delete(key);
      }
    });
  }
}