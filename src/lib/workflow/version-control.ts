/**
 * Workflow Version Control and Rollback System
 * 
 * Provides comprehensive version management for workflows including:
 * - Version tracking and history
 * - Safe deployment and rollback capabilities
 * - Version comparison and diff analysis
 * - Branch-like development with staging environments
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Version control types
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  definition: any;
  description?: string;
  status: 'draft' | 'staging' | 'production' | 'archived';
  createdBy: string;
  createdAt: Date;
  metadata: {
    changelog?: string[];
    tags?: string[];
    deploymentNotes?: string;
    performance?: {
      complexityScore: number;
      estimatedCost: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    validation?: {
      isValid: boolean;
      warnings: string[];
      errors: string[];
    };
  };
}

export interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  changes: {
    nodes: {
      added: any[];
      removed: any[];
      modified: Array<{
        nodeId: string;
        field: string;
        oldValue: any;
        newValue: any;
      }>;
    };
    edges: {
      added: any[];
      removed: any[];
    };
    metadata: {
      nameChanged: boolean;
      descriptionChanged: boolean;
      statusChanged: boolean;
    };
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    concerns: string[];
    recommendations: string[];
  };
}

export interface DeploymentResult {
  success: boolean;
  versionId: string;
  fromVersion?: string;
  toVersion: string;
  affectedExecutions: number;
  timestamp: Date;
  rollbackPlan?: {
    steps: string[];
    estimatedTime: number;
  };
}

export class WorkflowVersionControl {
  /**
   * Create a new version of a workflow
   */
  async createVersion(
    workflowId: string,
    definition: any,
    options: {
      description?: string;
      status?: 'draft' | 'staging' | 'production';
      changelog?: string[];
      tags?: string[];
      createdBy: string;
      parentVersion?: string;
    }
  ): Promise<WorkflowVersion> {
    try {
      // Get current workflow
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Get latest version number
      const latestVersion = await this.getLatestVersion(workflowId);
      const newVersionNumber = this.generateVersionNumber(latestVersion?.version);

      // Validate the workflow definition
      const validation = await this.validateWorkflowDefinition(definition);
      
      // Calculate performance metrics
      const performance = await this.calculatePerformanceMetrics(definition);

      // Create version record
      const versionId = uuidv4();
      const versionData = {
        id: versionId,
        workflowId,
        version: newVersionNumber,
        definition: JSON.stringify(definition),
        description: options.description || `Version ${newVersionNumber}`,
        status: options.status || 'draft',
        metadata: JSON.stringify({
          changelog: options.changelog || [],
          tags: options.tags || [],
          performance,
          validation,
          parentVersion: options.parentVersion,
          createdBy: options.createdBy,
        }),
        createdBy: options.createdBy,
        createdAt: new Date(),
      };

      // Store in a workflow versions table (we'll create this)
      await this.storeWorkflowVersion(versionData);

      logger.info('Workflow version created', {
        workflowId,
        version: newVersionNumber,
        status: options.status,
        createdBy: options.createdBy
      });

      return {
        ...versionData,
        definition,
        metadata: {
          changelog: options.changelog || [],
          tags: options.tags || [],
          performance,
          validation,
        }
      };
    } catch (error) {
      logger.error('Error creating workflow version:', error);
      throw error;
    }
  }

  /**
   * Deploy a version to production
   */
  async deployVersion(
    workflowId: string,
    versionId: string,
    options: {
      deployedBy: string;
      deploymentNotes?: string;
      skipValidation?: boolean;
      dryRun?: boolean;
    }
  ): Promise<DeploymentResult> {
    try {
      // Get the version to deploy
      const version = await this.getVersion(versionId);
      if (!version) {
        throw new Error(`Version not found: ${versionId}`);
      }

      if (version.workflowId !== workflowId) {
        throw new Error('Version does not belong to specified workflow');
      }

      // Get current production version
      const currentProduction = await this.getProductionVersion(workflowId);
      
      // Validate deployment if not skipped
      if (!options.skipValidation) {
        const validation = await this.validateDeployment(version, currentProduction);
        if (!validation.canDeploy) {
          throw new Error(`Deployment validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check for running executions
      const runningExecutions = await prisma.workflowExecution.count({
        where: {
          workflowId,
          status: 'RUNNING'
        }
      });

      if (options.dryRun) {
        return {
          success: true,
          versionId,
          fromVersion: currentProduction?.version,
          toVersion: version.version,
          affectedExecutions: runningExecutions,
          timestamp: new Date(),
          rollbackPlan: await this.generateRollbackPlan(workflowId, currentProduction?.id, versionId)
        };
      }

      // Create deployment record
      const deploymentId = uuidv4();
      await this.createDeploymentRecord({
        id: deploymentId,
        workflowId,
        fromVersionId: currentProduction?.id,
        toVersionId: versionId,
        deployedBy: options.deployedBy,
        deploymentNotes: options.deploymentNotes,
        affectedExecutions: runningExecutions,
        status: 'deploying',
        startedAt: new Date(),
      });

      try {
        // Update the main workflow with the new definition
        await prisma.workflow.update({
          where: { id: workflowId },
          data: {
            definition: JSON.stringify(version.definition),
            updatedAt: new Date(),
          }
        });

        // Update version status to production
        await this.updateVersionStatus(versionId, 'production');

        // Archive previous production version
        if (currentProduction) {
          await this.updateVersionStatus(currentProduction.id, 'archived');
        }

        // Complete deployment record
        await this.updateDeploymentRecord(deploymentId, {
          status: 'completed',
          completedAt: new Date(),
        });

        logger.info('Workflow version deployed successfully', {
          workflowId,
          fromVersion: currentProduction?.version,
          toVersion: version.version,
          deployedBy: options.deployedBy,
          affectedExecutions: runningExecutions
        });

        return {
          success: true,
          versionId,
          fromVersion: currentProduction?.version,
          toVersion: version.version,
          affectedExecutions: runningExecutions,
          timestamp: new Date(),
        };
      } catch (deployError) {
        // Mark deployment as failed
        await this.updateDeploymentRecord(deploymentId, {
          status: 'failed',
          error: deployError instanceof Error ? deployError.message : String(deployError),
          completedAt: new Date(),
        });
        throw deployError;
      }
    } catch (error) {
      logger.error('Error deploying workflow version:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(
    workflowId: string,
    targetVersionId: string,
    options: {
      rolledBackBy: string;
      reason: string;
      forceRollback?: boolean;
    }
  ): Promise<DeploymentResult> {
    try {
      const targetVersion = await this.getVersion(targetVersionId);
      if (!targetVersion) {
        throw new Error(`Target version not found: ${targetVersionId}`);
      }

      const currentProduction = await this.getProductionVersion(workflowId);
      if (!currentProduction) {
        throw new Error('No current production version found');
      }

      if (targetVersion.id === currentProduction.id) {
        throw new Error('Target version is already the production version');
      }

      // Check if rollback is safe
      if (!options.forceRollback) {
        const rollbackValidation = await this.validateRollback(currentProduction, targetVersion);
        if (!rollbackValidation.isSafe) {
          throw new Error(`Rollback validation failed: ${rollbackValidation.risks.join(', ')}`);
        }
      }

      // Create rollback deployment
      const deploymentResult = await this.deployVersion(workflowId, targetVersionId, {
        deployedBy: options.rolledBackBy,
        deploymentNotes: `Rollback: ${options.reason}`,
        skipValidation: options.forceRollback,
      });

      // Create rollback record
      await this.createRollbackRecord({
        id: uuidv4(),
        workflowId,
        fromVersionId: currentProduction.id,
        toVersionId: targetVersionId,
        reason: options.reason,
        rolledBackBy: options.rolledBackBy,
        timestamp: new Date(),
      });

      logger.info('Workflow rollback completed', {
        workflowId,
        fromVersion: currentProduction.version,
        toVersion: targetVersion.version,
        rolledBackBy: options.rolledBackBy,
        reason: options.reason
      });

      return deploymentResult;
    } catch (error) {
      logger.error('Error rolling back workflow:', error);
      throw error;
    }
  }

  /**
   * Compare two workflow versions
   */
  async compareVersions(
    workflowId: string,
    fromVersionId: string,
    toVersionId: string
  ): Promise<VersionComparison> {
    try {
      const [fromVersion, toVersion] = await Promise.all([
        this.getVersion(fromVersionId),
        this.getVersion(toVersionId)
      ]);

      if (!fromVersion || !toVersion) {
        throw new Error('One or both versions not found');
      }

      const fromDef = fromVersion.definition;
      const toDef = toVersion.definition;

      // Compare nodes
      const nodeChanges = this.compareNodes(fromDef.nodes || [], toDef.nodes || []);
      
      // Compare edges
      const edgeChanges = this.compareEdges(fromDef.edges || [], toDef.edges || []);

      // Compare metadata
      const metadataChanges = {
        nameChanged: fromDef.name !== toDef.name,
        descriptionChanged: fromDef.description !== toDef.description,
        statusChanged: fromVersion.status !== toVersion.status,
      };

      // Assess risk
      const riskAssessment = this.assessChangeRisk(nodeChanges, edgeChanges, metadataChanges);

      return {
        fromVersion: fromVersion.version,
        toVersion: toVersion.version,
        changes: {
          nodes: nodeChanges,
          edges: edgeChanges,
          metadata: metadataChanges,
        },
        riskAssessment,
      };
    } catch (error) {
      logger.error('Error comparing workflow versions:', error);
      throw error;
    }
  }

  /**
   * Get version history for a workflow
   */
  async getVersionHistory(
    workflowId: string,
    options: {
      limit?: number;
      includeArchived?: boolean;
      status?: string;
    } = {}
  ): Promise<WorkflowVersion[]> {
    try {
      const versions = await this.getWorkflowVersions(workflowId, options);
      return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('Error getting version history:', error);
      throw error;
    }
  }

  /**
   * Get deployment history for a workflow
   */
  async getDeploymentHistory(workflowId: string, limit = 50) {
    try {
      return await this.getWorkflowDeployments(workflowId, limit);
    } catch (error) {
      logger.error('Error getting deployment history:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateVersionNumber(latestVersion?: string): string {
    if (!latestVersion) {
      return '1.0.0';
    }

    const [major, minor, patch] = latestVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private async validateWorkflowDefinition(definition: any) {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for required fields
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      errors.push('Workflow must have nodes array');
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      errors.push('Workflow must have edges array');
    }

    // Check for trigger nodes
    const triggerNodes = definition.nodes?.filter((node: any) => node.type === 'triggerNode') || [];
    if (triggerNodes.length === 0) {
      warnings.push('Workflow has no trigger nodes');
    }

    // Check for orphaned nodes
    const nodeIds = new Set(definition.nodes?.map((node: any) => node.id) || []);
    const connectedNodes = new Set();
    
    definition.edges?.forEach((edge: any) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphanedNodes = Array.from(nodeIds).filter(id => !connectedNodes.has(id));
    if (orphanedNodes.length > 0) {
      warnings.push(`Orphaned nodes detected: ${orphanedNodes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  private async calculatePerformanceMetrics(definition: any) {
    const nodeCount = definition.nodes?.length || 0;
    const edgeCount = definition.edges?.length || 0;
    
    // Simple complexity scoring
    let complexityScore = nodeCount * 2 + edgeCount;
    
    // Adjust for node types
    definition.nodes?.forEach((node: any) => {
      switch (node.type) {
        case 'webhookNode':
        case 'apiCallNode':
          complexityScore += 5;
          break;
        case 'conditionNode':
          complexityScore += 3;
          break;
        case 'delayNode':
          complexityScore += 1;
          break;
      }
    });

    // Estimate cost (simplified)
    const estimatedCost = nodeCount * 0.01 + edgeCount * 0.005; // $0.01 per node, $0.005 per edge

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (complexityScore > 50) riskLevel = 'high';
    else if (complexityScore > 20) riskLevel = 'medium';

    return {
      complexityScore,
      estimatedCost,
      riskLevel,
    };
  }

  private compareNodes(fromNodes: any[], toNodes: any[]) {
    const fromNodeMap = new Map(fromNodes.map(node => [node.id, node]));
    const toNodeMap = new Map(toNodes.map(node => [node.id, node]));

    const added = toNodes.filter(node => !fromNodeMap.has(node.id));
    const removed = fromNodes.filter(node => !toNodeMap.has(node.id));
    const modified: any[] = [];

    // Check for modifications
    for (const [nodeId, toNode] of toNodeMap) {
      const fromNode = fromNodeMap.get(nodeId);
      if (fromNode) {
        const changes = this.getNodeChanges(fromNode, toNode);
        if (changes.length > 0) {
          modified.push({
            nodeId,
            changes,
          });
        }
      }
    }

    return { added, removed, modified };
  }

  private compareEdges(fromEdges: any[], toEdges: any[]) {
    const fromEdgeSet = new Set(fromEdges.map(edge => `${edge.source}-${edge.target}`));
    const toEdgeSet = new Set(toEdges.map(edge => `${edge.source}-${edge.target}`));

    const added = toEdges.filter(edge => !fromEdgeSet.has(`${edge.source}-${edge.target}`));
    const removed = fromEdges.filter(edge => !toEdgeSet.has(`${edge.source}-${edge.target}`));

    return { added, removed };
  }

  private getNodeChanges(fromNode: any, toNode: any): any[] {
    const changes: any[] = [];
    
    ['type', 'label', 'description'].forEach(field => {
      if (fromNode.data?.[field] !== toNode.data?.[field]) {
        changes.push({
          field,
          oldValue: fromNode.data?.[field],
          newValue: toNode.data?.[field],
        });
      }
    });

    // Compare properties
    const fromProps = fromNode.data?.properties || {};
    const toProps = toNode.data?.properties || {};
    
    const allPropKeys = new Set([...Object.keys(fromProps), ...Object.keys(toProps)]);
    
    for (const key of allPropKeys) {
      if (JSON.stringify(fromProps[key]) !== JSON.stringify(toProps[key])) {
        changes.push({
          field: `properties.${key}`,
          oldValue: fromProps[key],
          newValue: toProps[key],
        });
      }
    }

    return changes;
  }

  private assessChangeRisk(nodeChanges: any, edgeChanges: any, metadataChanges: any) {
    const concerns: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Assess node changes
    if (nodeChanges.removed.length > 0) {
      concerns.push(`${nodeChanges.removed.length} nodes removed`);
      riskLevel = 'high';
      recommendations.push('Verify that removed nodes are not critical to workflow operation');
    }

    if (nodeChanges.added.length > 5) {
      concerns.push(`Large number of nodes added (${nodeChanges.added.length})`);
      riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
      recommendations.push('Test thoroughly with increased workflow complexity');
    }

    // Assess edge changes
    if (edgeChanges.removed.length > 0) {
      concerns.push(`${edgeChanges.removed.length} connections removed`);
      riskLevel = 'high';
      recommendations.push('Ensure workflow logic flow is still intact');
    }

    // Assess webhook/API changes
    const webhookChanges = nodeChanges.modified.filter((mod: any) => 
      mod.nodeId.includes('webhook') || mod.nodeId.includes('api')
    );
    
    if (webhookChanges.length > 0) {
      concerns.push('External API integrations modified');
      riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
      recommendations.push('Verify external API endpoints are accessible and compatible');
    }

    if (concerns.length === 0) {
      recommendations.push('Changes appear safe for deployment');
    }

    return {
      level: riskLevel,
      concerns,
      recommendations,
    };
  }

  private async validateDeployment(version: WorkflowVersion, currentProduction?: WorkflowVersion) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if version is validated
    if (!version.metadata.validation?.isValid) {
      errors.push('Version has validation errors');
    }

    // Check for high-risk changes
    if (currentProduction) {
      const comparison = await this.compareVersions(
        version.workflowId,
        currentProduction.id,
        version.id
      );
      
      if (comparison.riskAssessment.level === 'critical') {
        errors.push('Changes have critical risk level');
      }
    }

    return {
      canDeploy: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async validateRollback(currentVersion: WorkflowVersion, targetVersion: WorkflowVersion) {
    const risks: string[] = [];

    // Check version age
    const daysDiff = (Date.now() - targetVersion.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      risks.push('Target version is older than 30 days');
    }

    // Check for breaking changes
    const comparison = await this.compareVersions(
      currentVersion.workflowId,
      targetVersion.id,
      currentVersion.id
    );

    if (comparison.changes.nodes.added.length > 0) {
      risks.push('Rolling back will remove nodes that were added');
    }

    return {
      isSafe: risks.length === 0,
      risks,
    };
  }

  private async generateRollbackPlan(workflowId: string, fromVersionId?: string, toVersionId?: string) {
    const steps = [
      'Validate target version integrity',
      'Check for running workflow executions',
      'Create deployment backup',
      'Update workflow definition',
      'Verify deployment success',
      'Monitor for issues',
    ];

    return {
      steps,
      estimatedTime: 300, // 5 minutes
    };
  }

  // Database operations
  private async storeWorkflowVersion(versionData: any) {
    try {
      await prisma.workflowVersion.create({
        data: {
          id: versionData.id,
          workflowId: versionData.workflowId,
          version: versionData.version,
          definition: versionData.definition,
          description: versionData.description,
          status: versionData.status,
          metadata: versionData.metadata,
          createdBy: versionData.createdBy,
          createdAt: versionData.createdAt,
          updatedAt: versionData.createdAt,
        }
      });
      logger.info('Workflow version stored successfully:', versionData.id);
    } catch (error) {
      logger.error('Error storing workflow version:', error);
      throw error;
    }
  }

  private async getVersion(versionId: string): Promise<WorkflowVersion | null> {
    try {
      const version = await prisma.workflowVersion.findUnique({
        where: { id: versionId }
      });

      if (!version) return null;

      return {
        id: version.id,
        workflowId: version.workflowId,
        version: version.version,
        definition: JSON.parse(version.definition),
        description: version.description || undefined,
        status: version.status as 'draft' | 'staging' | 'production' | 'archived',
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        metadata: JSON.parse(version.metadata),
      };
    } catch (error) {
      logger.error('Error getting version:', error);
      throw error;
    }
  }

  private async getLatestVersion(workflowId: string): Promise<WorkflowVersion | null> {
    try {
      const version = await prisma.workflowVersion.findFirst({
        where: { workflowId },
        orderBy: { createdAt: 'desc' }
      });

      if (!version) return null;

      return {
        id: version.id,
        workflowId: version.workflowId,
        version: version.version,
        definition: JSON.parse(version.definition),
        description: version.description || undefined,
        status: version.status as 'draft' | 'staging' | 'production' | 'archived',
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        metadata: JSON.parse(version.metadata),
      };
    } catch (error) {
      logger.error('Error getting latest version:', error);
      throw error;
    }
  }

  private async getProductionVersion(workflowId: string): Promise<WorkflowVersion | null> {
    try {
      const version = await prisma.workflowVersion.findFirst({
        where: { 
          workflowId,
          status: 'PRODUCTION'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!version) return null;

      return {
        id: version.id,
        workflowId: version.workflowId,
        version: version.version,
        definition: JSON.parse(version.definition),
        description: version.description || undefined,
        status: version.status as 'draft' | 'staging' | 'production' | 'archived',
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        metadata: JSON.parse(version.metadata),
      };
    } catch (error) {
      logger.error('Error getting production version:', error);
      throw error;
    }
  }

  private async updateVersionStatus(versionId: string, status: string) {
    try {
      await prisma.workflowVersion.update({
        where: { id: versionId },
        data: { 
          status: status as any,
          updatedAt: new Date()
        }
      });
      logger.info('Version status updated:', { versionId, status });
    } catch (error) {
      logger.error('Error updating version status:', error);
      throw error;
    }
  }

  private async createDeploymentRecord(deployment: any) {
    try {
      await prisma.workflowDeployment.create({
        data: {
          id: deployment.id,
          workflowId: deployment.workflowId,
          fromVersionId: deployment.fromVersionId,
          toVersionId: deployment.toVersionId,
          status: deployment.status,
          deployedBy: deployment.deployedBy,
          deploymentNotes: deployment.deploymentNotes,
          affectedExecutions: deployment.affectedExecutions,
          startedAt: deployment.startedAt,
          rollbackPlan: deployment.rollbackPlan ? JSON.stringify(deployment.rollbackPlan) : null,
        }
      });
      logger.info('Deployment record created:', deployment.id);
    } catch (error) {
      logger.error('Error creating deployment record:', error);
      throw error;
    }
  }

  private async updateDeploymentRecord(deploymentId: string, updates: any) {
    try {
      await prisma.workflowDeployment.update({
        where: { id: deploymentId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      logger.info('Deployment record updated:', { deploymentId, updates });
    } catch (error) {
      logger.error('Error updating deployment record:', error);
      throw error;
    }
  }

  private async createRollbackRecord(rollback: any) {
    try {
      await prisma.workflowRollback.create({
        data: {
          id: rollback.id,
          workflowId: rollback.workflowId,
          fromVersionId: rollback.fromVersionId,
          toVersionId: rollback.toVersionId,
          reason: rollback.reason,
          rolledBackBy: rollback.rolledBackBy,
          deploymentId: rollback.deploymentId,
          timestamp: rollback.timestamp,
          metadata: rollback.metadata ? JSON.stringify(rollback.metadata) : '{}',
        }
      });
      logger.info('Rollback record created:', rollback.id);
    } catch (error) {
      logger.error('Error creating rollback record:', error);
      throw error;
    }
  }

  private async getWorkflowVersions(workflowId: string, options: any): Promise<WorkflowVersion[]> {
    try {
      const whereCondition: any = { workflowId };
      
      if (options.status) {
        whereCondition.status = options.status;
      }
      
      if (!options.includeArchived) {
        whereCondition.status = { not: 'ARCHIVED' };
      }

      const versions = await prisma.workflowVersion.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50
      });

      return versions.map(version => ({
        id: version.id,
        workflowId: version.workflowId,
        version: version.version,
        definition: JSON.parse(version.definition),
        description: version.description || undefined,
        status: version.status as 'draft' | 'staging' | 'production' | 'archived',
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        metadata: JSON.parse(version.metadata),
      }));
    } catch (error) {
      logger.error('Error getting workflow versions:', error);
      throw error;
    }
  }

  private async getWorkflowDeployments(workflowId: string, limit: number) {
    try {
      const deployments = await prisma.workflowDeployment.findMany({
        where: { workflowId },
        include: {
          fromVersion: { select: { version: true } },
          toVersion: { select: { version: true } },
          deployer: { select: { name: true, email: true } }
        },
        orderBy: { startedAt: 'desc' },
        take: limit
      });

      return deployments.map(deployment => ({
        id: deployment.id,
        workflowId: deployment.workflowId,
        fromVersion: deployment.fromVersion?.version,
        toVersion: deployment.toVersion.version,
        status: deployment.status,
        deployedBy: deployment.deployer.name || deployment.deployer.email,
        deploymentNotes: deployment.deploymentNotes,
        affectedExecutions: deployment.affectedExecutions,
        startedAt: deployment.startedAt,
        completedAt: deployment.completedAt,
        error: deployment.error,
      }));
    } catch (error) {
      logger.error('Error getting workflow deployments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const workflowVersionControl = new WorkflowVersionControl();