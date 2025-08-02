import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode, WorkflowNodeType } from './workflow-action-handler.service';
import { RedisService } from '../../core/database/redis/redis.service';

export interface OptimizationResult {
  originalNodes: number;
  optimizedNodes: number;
  optimizations: Optimization[];
  estimatedPerformanceGain: number; // percentage
  estimatedCostSaving: number; // percentage
}

export interface Optimization {
  type: 'MERGE_NODES' | 'REMOVE_REDUNDANT' | 'REORDER_SEQUENCE' | 'BATCH_OPERATIONS' | 'CACHE_OPTIMIZATION';
  description: string;
  nodesAffected: string[];
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface WorkflowOptimizationContext {
  nodes: WorkflowNode[];
  connections: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    connectionType: string;
  }>;
  executionHistory?: WorkflowExecutionStats[];
  organizationId: string;
}

export interface WorkflowExecutionStats {
  nodeId: string;
  avgExecutionTime: number;
  successRate: number;
  errorRate: number;
  executionCount: number;
}

export interface OptimizedWorkflow {
  nodes: WorkflowNode[];
  connections: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    connectionType: string;
  }>;
  optimizationResult: OptimizationResult;
}

@Injectable()
export class WorkflowOptimizerService {
  private readonly logger = new Logger(WorkflowOptimizerService.name);

  constructor(private readonly redis: RedisService) {}

  async optimizeWorkflow(context: WorkflowOptimizationContext): Promise<OptimizedWorkflow> {
    try {
      const optimizations: Optimization[] = [];
      let optimizedNodes = [...context.nodes];
      let optimizedConnections = [...context.connections];

      // Apply various optimization strategies
      const mergeResult = this.optimizeMergeableNodes(optimizedNodes, optimizedConnections);
      if (mergeResult.optimizations.length > 0) {
        optimizations.push(...mergeResult.optimizations);
        optimizedNodes = mergeResult.nodes;
        optimizedConnections = mergeResult.connections;
      }

      const redundantResult = this.removeRedundantNodes(optimizedNodes, optimizedConnections);
      if (redundantResult.optimizations.length > 0) {
        optimizations.push(...redundantResult.optimizations);
        optimizedNodes = redundantResult.nodes;
        optimizedConnections = redundantResult.connections;
      }

      const sequenceResult = this.optimizeSequenceOrder(optimizedNodes, optimizedConnections, context.executionHistory);
      if (sequenceResult.optimizations.length > 0) {
        optimizations.push(...sequenceResult.optimizations);
        optimizedNodes = sequenceResult.nodes;
        optimizedConnections = sequenceResult.connections;
      }

      const batchResult = this.optimizeBatchOperations(optimizedNodes, optimizedConnections);
      if (batchResult.optimizations.length > 0) {
        optimizations.push(...batchResult.optimizations);
        optimizedNodes = batchResult.nodes;
        optimizedConnections = batchResult.connections;
      }

      const cacheResult = await this.optimizeCaching(optimizedNodes, context.organizationId);
      if (cacheResult.optimizations.length > 0) {
        optimizations.push(...cacheResult.optimizations);
        optimizedNodes = cacheResult.nodes;
      }

      const optimizationResult: OptimizationResult = {
        originalNodes: context.nodes.length,
        optimizedNodes: optimizedNodes.length,
        optimizations,
        estimatedPerformanceGain: this.calculatePerformanceGain(optimizations),
        estimatedCostSaving: this.calculateCostSaving(optimizations),
      };

      this.logger.log(`Optimized workflow: ${optimizations.length} optimizations applied`);

      return {
        nodes: optimizedNodes,
        connections: optimizedConnections,
        optimizationResult,
      };
    } catch (error) {
      this.logger.error(`Workflow optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private optimizeMergeableNodes(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): { nodes: WorkflowNode[]; connections: typeof connections; optimizations: Optimization[] } {
    const optimizations: Optimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedConnections = [...connections];

    // Find sequential nodes of the same type that can be merged
    const mergeableGroups = this.findMergeableGroups(nodes, connections);

    for (const group of mergeableGroups) {
      if (group.length > 1) {
        const mergedNode = this.mergeNodes(group);
        
        // Remove original nodes and add merged node
        const nodeIdsToRemove = group.map(n => n.id);
        const remainingNodes = optimizedNodes.filter(n => !nodeIdsToRemove.includes(n.id));
        remainingNodes.push(mergedNode);

        // Update connections
        this.updateConnectionsForMergedNodes(optimizedConnections, nodeIdsToRemove, mergedNode.id);

        optimizations.push({
          type: 'MERGE_NODES',
          description: `Merged ${group.length} ${group[0].type} nodes into a single batch operation`,
          nodesAffected: nodeIdsToRemove,
          impact: 'MEDIUM',
        });
      }
    }

    return {
      nodes: optimizedNodes,
      connections: optimizedConnections,
      optimizations,
    };
  }

  private removeRedundantNodes(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): { nodes: WorkflowNode[]; connections: typeof connections; optimizations: Optimization[] } {
    const optimizations: Optimization[] = [];
    let optimizedNodes = [...nodes];
    let optimizedConnections = [...connections];

    // Find redundant condition nodes
    const redundantConditions = this.findRedundantConditions(nodes, connections);
    
    for (const nodeId of redundantConditions) {
      const node = optimizedNodes.find(n => n.id === nodeId);
      if (node) {
        // Remove the redundant node and update connections
        optimizedNodes = optimizedNodes.filter(n => n.id !== nodeId);
        this.bypassNode(optimizedConnections, nodeId);

        optimizations.push({
          type: 'REMOVE_REDUNDANT',
          description: `Removed redundant condition node: ${node.name}`,
          nodesAffected: [nodeId],
          impact: 'LOW',
        });
      }
    }

    // Find duplicate action nodes
    const duplicateActions = this.findDuplicateActions(optimizedNodes);
    
    for (const duplicateGroup of duplicateActions) {
      if (duplicateGroup.length > 1) {
        // Keep the first node, remove duplicates
        const keepNode = duplicateGroup[0];
        const removeNodes = duplicateGroup.slice(1);

        for (const node of removeNodes) {
          optimizedNodes = optimizedNodes.filter(n => n.id !== node.id);
          this.redirectConnections(optimizedConnections, node.id, keepNode.id);
        }

        optimizations.push({
          type: 'REMOVE_REDUNDANT',
          description: `Removed ${removeNodes.length} duplicate ${keepNode.type} nodes`,
          nodesAffected: removeNodes.map(n => n.id),
          impact: 'MEDIUM',
        });
      }
    }

    return {
      nodes: optimizedNodes,
      connections: optimizedConnections,
      optimizations,
    };
  }

  private optimizeSequenceOrder(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    executionHistory?: WorkflowExecutionStats[]
  ): { nodes: WorkflowNode[]; connections: typeof connections; optimizations: Optimization[] } {
    const optimizations: Optimization[] = [];

    if (!executionHistory || executionHistory.length === 0) {
      return { nodes, connections, optimizations };
    }

    // Find sequences that can be reordered for better performance
    const sequences = this.findLinearSequences(nodes, connections);
    
    for (const sequence of sequences) {
      const reorderedSequence = this.reorderSequenceByPerformance(sequence, executionHistory);
      
      if (this.hasSequenceChanged(sequence, reorderedSequence)) {
        // Update the workflow with the new sequence order
        this.updateSequenceOrder(nodes, connections, sequence, reorderedSequence);

        optimizations.push({
          type: 'REORDER_SEQUENCE',
          description: `Reordered sequence of ${sequence.length} nodes for better performance`,
          nodesAffected: sequence.map(n => n.id),
          impact: 'HIGH',
        });
      }
    }

    return { nodes, connections, optimizations };
  }

  private optimizeBatchOperations(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): { nodes: WorkflowNode[]; connections: typeof connections; optimizations: Optimization[] } {
    const optimizations: Optimization[] = [];
    let optimizedNodes = [...nodes];
    let optimizedConnections = [...connections];

    // Find nodes that can be batched together
    const batchableGroups = this.findBatchableNodes(nodes, connections);

    for (const group of batchableGroups) {
      if (group.length > 1) {
        const batchNode = this.createBatchNode(group);
        
        // Replace individual nodes with batch node
        const nodeIdsToRemove = group.map(n => n.id);
        optimizedNodes = optimizedNodes.filter(n => !nodeIdsToRemove.includes(n.id));
        optimizedNodes.push(batchNode);

        // Update connections
        this.updateConnectionsForBatchNode(optimizedConnections, nodeIdsToRemove, batchNode.id);

        optimizations.push({
          type: 'BATCH_OPERATIONS',
          description: `Created batch operation for ${group.length} parallel ${group[0].type} nodes`,
          nodesAffected: nodeIdsToRemove,
          impact: 'HIGH',
        });
      }
    }

    return {
      nodes: optimizedNodes,
      connections: optimizedConnections,
      optimizations,
    };
  }

  private async optimizeCaching(
    nodes: WorkflowNode[],
    organizationId: string
  ): Promise<{ nodes: WorkflowNode[]; optimizations: Optimization[] }> {
    const optimizations: Optimization[] = [];
    const optimizedNodes = [...nodes];

    // Identify nodes that would benefit from caching
    const cacheableNodes = nodes.filter(node => this.isCacheable(node));

    for (const node of cacheableNodes) {
      const optimizedNode = { ...node };
      
      // Add caching configuration
      optimizedNode.config = {
        ...optimizedNode.config,
        caching: {
          enabled: true,
          ttl: this.calculateOptimalTTL(node),
          keyStrategy: 'contact_based',
        },
      };

      // Update the node in the optimized list
      const nodeIndex = optimizedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        optimizedNodes[nodeIndex] = optimizedNode;
      }

      optimizations.push({
        type: 'CACHE_OPTIMIZATION',
        description: `Enabled caching for ${node.type} node to improve performance`,
        nodesAffected: [node.id],
        impact: 'MEDIUM',
      });
    }

    return { nodes: optimizedNodes, optimizations };
  }

  // Helper methods for optimization strategies

  private findMergeableGroups(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): WorkflowNode[][] {
    const groups: WorkflowNode[][] = [];
    const processed = new Set<string>();

    for (const node of nodes) {
      if (processed.has(node.id) || !this.isMergeable(node.type)) {
        continue;
      }

      const group = [node];
      processed.add(node.id);

      // Find sequential nodes of the same type
      let currentNode = node;
      while (true) {
        const nextConnection = connections.find(c => 
          c.sourceNodeId === currentNode.id && c.connectionType === 'success'
        );
        
        if (!nextConnection) break;

        const nextNode = nodes.find(n => n.id === nextConnection.targetNodeId);
        if (!nextNode || nextNode.type !== node.type || processed.has(nextNode.id)) {
          break;
        }

        group.push(nextNode);
        processed.add(nextNode.id);
        currentNode = nextNode;
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  private findRedundantConditions(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): string[] {
    const redundant: string[] = [];

    const conditionNodes = nodes.filter(n => n.type === WorkflowNodeType.CONDITION);
    
    for (const condition of conditionNodes) {
      // Check if condition always evaluates to true/false
      if (this.isAlwaysTrueCondition(condition) || this.isAlwaysFalseCondition(condition)) {
        redundant.push(condition.id);
      }
    }

    return redundant;
  }

  private findDuplicateActions(nodes: WorkflowNode[]): WorkflowNode[][] {
    const duplicateGroups: WorkflowNode[][] = [];
    const processed = new Set<string>();

    for (const node of nodes) {
      if (processed.has(node.id)) continue;

      const duplicates = nodes.filter(n => 
        n.id !== node.id && 
        !processed.has(n.id) && 
        this.areNodesEquivalent(node, n)
      );

      if (duplicates.length > 0) {
        const group = [node, ...duplicates];
        duplicateGroups.push(group);
        
        group.forEach(n => processed.add(n.id));
      } else {
        processed.add(node.id);
      }
    }

    return duplicateGroups;
  }

  private findLinearSequences(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): WorkflowNode[][] {
    const sequences: WorkflowNode[][] = [];
    const processed = new Set<string>();

    for (const node of nodes) {
      if (processed.has(node.id)) continue;

      const sequence = [node];
      processed.add(node.id);

      // Follow the linear path
      let currentNode = node;
      while (true) {
        const outgoing = connections.filter(c => c.sourceNodeId === currentNode.id);
        const incoming = connections.filter(c => c.targetNodeId === currentNode.id);

        // Only continue if this is a linear sequence (one in, one out)
        if (outgoing.length !== 1 || incoming.length > 1) break;

        const nextConnection = outgoing[0];
        const nextNode = nodes.find(n => n.id === nextConnection.targetNodeId);
        
        if (!nextNode || processed.has(nextNode.id)) break;

        sequence.push(nextNode);
        processed.add(nextNode.id);
        currentNode = nextNode;
      }

      if (sequence.length > 2) {
        sequences.push(sequence);
      }
    }

    return sequences;
  }

  private findBatchableNodes(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>
  ): WorkflowNode[][] {
    const batchableGroups: WorkflowNode[][] = [];
    const processed = new Set<string>();

    // Find nodes that can run in parallel (same incoming connections)
    const nodesByIncoming = new Map<string, WorkflowNode[]>();

    for (const node of nodes) {
      if (!this.isBatchable(node.type)) continue;

      const incomingConnections = connections
        .filter(c => c.targetNodeId === node.id)
        .map(c => c.sourceNodeId)
        .sort()
        .join(',');

      if (!nodesByIncoming.has(incomingConnections)) {
        nodesByIncoming.set(incomingConnections, []);
      }
      nodesByIncoming.get(incomingConnections)!.push(node);
    }

    // Group nodes with same incoming connections and compatible types
    for (const [, nodesGroup] of nodesByIncoming) {
      if (nodesGroup.length > 1) {
        const compatibleGroups = this.groupCompatibleNodes(nodesGroup);
        batchableGroups.push(...compatibleGroups.filter(g => g.length > 1));
      }
    }

    return batchableGroups;
  }

  private groupCompatibleNodes(nodes: WorkflowNode[]): WorkflowNode[][] {
    const groups: WorkflowNode[][] = [];
    const nodesByType = new Map<WorkflowNodeType, WorkflowNode[]>();

    for (const node of nodes) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, []);
      }
      nodesByType.get(node.type)!.push(node);
    }

    for (const [, nodesOfType] of nodesByType) {
      if (nodesOfType.length > 1) {
        groups.push(nodesOfType);
      }
    }

    return groups;
  }

  private reorderSequenceByPerformance(
    sequence: WorkflowNode[],
    executionHistory: WorkflowExecutionStats[]
  ): WorkflowNode[] {
    const statsMap = new Map<string, WorkflowExecutionStats>();
    executionHistory.forEach(stat => statsMap.set(stat.nodeId, stat));

    // Sort by success rate (descending) and execution time (ascending)
    return [...sequence].sort((a, b) => {
      const statsA = statsMap.get(a.id);
      const statsB = statsMap.get(b.id);

      if (!statsA || !statsB) return 0;

      // Prioritize higher success rate
      if (statsA.successRate !== statsB.successRate) {
        return statsB.successRate - statsA.successRate;
      }

      // Then prioritize faster execution
      return statsA.avgExecutionTime - statsB.avgExecutionTime;
    });
  }

  private mergeNodes(nodes: WorkflowNode[]): WorkflowNode {
    const firstNode = nodes[0];
    
    return {
      id: `merged_${Date.now()}`,
      type: firstNode.type,
      name: `Batch ${firstNode.type}`,
      description: `Merged ${nodes.length} ${firstNode.type} operations`,
      config: {
        ...firstNode.config,
        batchMode: true,
        batchItems: nodes.map(n => ({
          id: n.id,
          name: n.name,
          config: n.config,
        })),
      },
      position: firstNode.position,
      connections: firstNode.connections,
    };
  }

  private createBatchNode(nodes: WorkflowNode[]): WorkflowNode {
    const firstNode = nodes[0];
    
    return {
      id: `batch_${Date.now()}`,
      type: firstNode.type,
      name: `Parallel ${firstNode.type} Batch`,
      description: `Parallel execution of ${nodes.length} ${firstNode.type} operations`,
      config: {
        batchMode: true,
        parallelExecution: true,
        items: nodes.map(n => ({
          id: n.id,
          name: n.name,
          config: n.config,
        })),
      },
      position: firstNode.position,
      connections: firstNode.connections,
    };
  }

  // Helper utility methods

  private isMergeable(nodeType: WorkflowNodeType): boolean {
    return [
      WorkflowNodeType.UPDATE_CONTACT,
      WorkflowNodeType.ADD_TAG,
      WorkflowNodeType.REMOVE_TAG,
    ].includes(nodeType);
  }

  private isBatchable(nodeType: WorkflowNodeType): boolean {
    return [
      WorkflowNodeType.EMAIL,
      WorkflowNodeType.SMS,
      WorkflowNodeType.WHATSAPP,
      WorkflowNodeType.WEBHOOK,
      WorkflowNodeType.API_CALL,
    ].includes(nodeType);
  }

  private isCacheable(node: WorkflowNode): boolean {
    return [
      WorkflowNodeType.API_CALL,
      WorkflowNodeType.CONDITION,
      WorkflowNodeType.WEBHOOK,
    ].includes(node.type);
  }

  private calculateOptimalTTL(node: WorkflowNode): number {
    switch (node.type) {
      case WorkflowNodeType.API_CALL:
        return 300; // 5 minutes
      case WorkflowNodeType.CONDITION:
        return 60; // 1 minute
      case WorkflowNodeType.WEBHOOK:
        return 180; // 3 minutes
      default:
        return 300;
    }
  }

  private areNodesEquivalent(node1: WorkflowNode, node2: WorkflowNode): boolean {
    return node1.type === node2.type &&
           JSON.stringify(node1.config) === JSON.stringify(node2.config);
  }

  private isAlwaysTrueCondition(node: WorkflowNode): boolean {
    const { conditions } = node.config;
    if (!conditions || conditions.length === 0) return false;
    
    // Simple check for obviously true conditions
    return conditions.some((condition: any) => 
      condition.operator === 'EQUALS' && condition.field === condition.value
    );
  }

  private isAlwaysFalseCondition(node: WorkflowNode): boolean {
    const { conditions } = node.config;
    if (!conditions || conditions.length === 0) return false;
    
    // Simple check for obviously false conditions
    return conditions.some((condition: any) => 
      condition.operator === 'EQUALS' && 
      condition.field !== condition.value &&
      typeof condition.field === typeof condition.value
    );
  }

  private hasSequenceChanged(original: WorkflowNode[], reordered: WorkflowNode[]): boolean {
    if (original.length !== reordered.length) return true;
    
    for (let i = 0; i < original.length; i++) {
      if (original[i].id !== reordered[i].id) return true;
    }
    
    return false;
  }

  private updateConnectionsForMergedNodes(
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    oldNodeIds: string[],
    newNodeId: string
  ): void {
    for (const connection of connections) {
      if (oldNodeIds.includes(connection.sourceNodeId)) {
        connection.sourceNodeId = newNodeId;
      }
      if (oldNodeIds.includes(connection.targetNodeId)) {
        connection.targetNodeId = newNodeId;
      }
    }
  }

  private updateConnectionsForBatchNode(
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    oldNodeIds: string[],
    newNodeId: string
  ): void {
    this.updateConnectionsForMergedNodes(connections, oldNodeIds, newNodeId);
  }

  private bypassNode(
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    nodeId: string
  ): void {
    const incoming = connections.filter(c => c.targetNodeId === nodeId);
    const outgoing = connections.filter(c => c.sourceNodeId === nodeId);

    // Create direct connections from incoming to outgoing
    for (const inConn of incoming) {
      for (const outConn of outgoing) {
        connections.push({
          sourceNodeId: inConn.sourceNodeId,
          targetNodeId: outConn.targetNodeId,
          connectionType: outConn.connectionType,
        });
      }
    }

    // Remove old connections
    const toRemove = connections.filter(c => 
      c.sourceNodeId === nodeId || c.targetNodeId === nodeId
    );
    
    for (const conn of toRemove) {
      const index = connections.indexOf(conn);
      if (index > -1) {
        connections.splice(index, 1);
      }
    }
  }

  private redirectConnections(
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    fromNodeId: string,
    toNodeId: string
  ): void {
    for (const connection of connections) {
      if (connection.sourceNodeId === fromNodeId) {
        connection.sourceNodeId = toNodeId;
      }
      if (connection.targetNodeId === fromNodeId) {
        connection.targetNodeId = toNodeId;
      }
    }
  }

  private updateSequenceOrder(
    nodes: WorkflowNode[],
    connections: Array<{ sourceNodeId: string; targetNodeId: string; connectionType: string; }>,
    originalSequence: WorkflowNode[],
    reorderedSequence: WorkflowNode[]
  ): void {
    // This would involve updating the connections to reflect the new order
    // Implementation would depend on the specific connection structure
    // For now, we'll just log the change
    this.logger.log(`Sequence reordered: ${originalSequence.map(n => n.name).join(' -> ')} to ${reorderedSequence.map(n => n.name).join(' -> ')}`);
  }

  private calculatePerformanceGain(optimizations: Optimization[]): number {
    let totalGain = 0;
    
    for (const optimization of optimizations) {
      switch (optimization.type) {
        case 'MERGE_NODES':
          totalGain += optimization.impact === 'HIGH' ? 25 : optimization.impact === 'MEDIUM' ? 15 : 5;
          break;
        case 'REMOVE_REDUNDANT':
          totalGain += optimization.impact === 'HIGH' ? 20 : optimization.impact === 'MEDIUM' ? 10 : 5;
          break;
        case 'REORDER_SEQUENCE':
          totalGain += optimization.impact === 'HIGH' ? 30 : optimization.impact === 'MEDIUM' ? 20 : 10;
          break;
        case 'BATCH_OPERATIONS':
          totalGain += optimization.impact === 'HIGH' ? 35 : optimization.impact === 'MEDIUM' ? 25 : 15;
          break;
        case 'CACHE_OPTIMIZATION':
          totalGain += optimization.impact === 'HIGH' ? 40 : optimization.impact === 'MEDIUM' ? 30 : 20;
          break;
      }
    }

    return Math.min(totalGain, 80); // Cap at 80% improvement
  }

  private calculateCostSaving(optimizations: Optimization[]): number {
    let totalSaving = 0;
    
    for (const optimization of optimizations) {
      switch (optimization.type) {
        case 'MERGE_NODES':
        case 'BATCH_OPERATIONS':
          totalSaving += optimization.nodesAffected.length * 5; // 5% per merged node
          break;
        case 'REMOVE_REDUNDANT':
          totalSaving += optimization.nodesAffected.length * 10; // 10% per removed node
          break;
        case 'CACHE_OPTIMIZATION':
          totalSaving += optimization.nodesAffected.length * 15; // 15% per cached node
          break;
      }
    }

    return Math.min(totalSaving, 60); // Cap at 60% cost saving
  }
}