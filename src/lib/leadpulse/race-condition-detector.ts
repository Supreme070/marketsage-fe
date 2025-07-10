/**
 * Race Condition Detector for LeadPulse
 * 
 * Monitors and prevents race conditions in real-time data updates
 * by tracking concurrent operations and detecting conflicts.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface OperationTrace {
  id: string;
  type: 'api_fetch' | 'websocket_update' | 'cache_read' | 'cache_write';
  key: string;
  timestamp: number;
  duration?: number;
  status: 'pending' | 'completed' | 'failed';
  source: string;
  metadata?: any;
}

export interface RaceCondition {
  id: string;
  type: 'concurrent_updates' | 'stale_data_override' | 'circular_dependency' | 'deadlock';
  operations: OperationTrace[];
  detectedAt: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: 'auto' | 'manual' | 'ignored';
  description: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: (operations: OperationTrace[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  autoResolve: boolean;
  resolver?: (operations: OperationTrace[]) => void;
}

class RaceConditionDetector extends EventEmitter {
  private static instance: RaceConditionDetector;
  private activeOperations = new Map<string, OperationTrace>();
  private completedOperations: OperationTrace[] = [];
  private detectedRaceConditions = new Map<string, RaceCondition>();
  private detectionRules = new Map<string, DetectionRule>();
  private isEnabled = true;
  private maxOperationHistory = 1000;
  private operationTimeout = 30000; // 30 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): RaceConditionDetector {
    if (!RaceConditionDetector.instance) {
      RaceConditionDetector.instance = new RaceConditionDetector();
    }
    return RaceConditionDetector.instance;
  }

  private constructor() {
    super();
    this.setupDefaultRules();
    this.startCleanupTimer();
  }

  /**
   * Enable or disable race condition detection
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('detection_status_changed', { enabled });
  }

  /**
   * Start tracking an operation
   */
  startOperation(operation: Omit<OperationTrace, 'timestamp' | 'status'>): string {
    if (!this.isEnabled) return operation.id;

    const trace: OperationTrace = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.activeOperations.set(operation.id, trace);
    this.checkForRaceConditions(operation.key);
    
    // Set timeout for operation
    setTimeout(() => {
      this.timeoutOperation(operation.id);
    }, this.operationTimeout);

    this.emit('operation_started', trace);
    return operation.id;
  }

  /**
   * Complete an operation
   */
  completeOperation(operationId: string, duration?: number, metadata?: any): void {
    if (!this.isEnabled) return;

    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    operation.status = 'completed';
    operation.duration = duration || (Date.now() - operation.timestamp);
    operation.metadata = { ...operation.metadata, ...metadata };

    this.activeOperations.delete(operationId);
    this.completedOperations.push(operation);

    // Trim history if needed
    if (this.completedOperations.length > this.maxOperationHistory) {
      this.completedOperations = this.completedOperations.slice(-this.maxOperationHistory);
    }

    this.emit('operation_completed', operation);
  }

  /**
   * Mark operation as failed
   */
  failOperation(operationId: string, error?: Error): void {
    if (!this.isEnabled) return;

    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    operation.status = 'failed';
    operation.duration = Date.now() - operation.timestamp;
    operation.metadata = { ...operation.metadata, error: error?.message };

    this.activeOperations.delete(operationId);
    this.completedOperations.push(operation);

    this.emit('operation_failed', operation);
  }

  /**
   * Add a custom detection rule
   */
  addDetectionRule(rule: DetectionRule): void {
    this.detectionRules.set(rule.id, rule);
    this.emit('rule_added', rule);
  }

  /**
   * Remove a detection rule
   */
  removeDetectionRule(ruleId: string): void {
    this.detectionRules.delete(ruleId);
    this.emit('rule_removed', { ruleId });
  }

  /**
   * Get all detected race conditions
   */
  getDetectedRaceConditions(): RaceCondition[] {
    return Array.from(this.detectedRaceConditions.values());
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): {
    active: number;
    completed: number;
    failed: number;
    avgDuration: number;
    raceConditions: number;
  } {
    const completed = this.completedOperations.filter(op => op.status === 'completed');
    const failed = this.completedOperations.filter(op => op.status === 'failed');
    const avgDuration = completed.reduce((sum, op) => sum + (op.duration || 0), 0) / completed.length || 0;

    return {
      active: this.activeOperations.size,
      completed: completed.length,
      failed: failed.length,
      avgDuration,
      raceConditions: this.detectedRaceConditions.size
    };
  }

  /**
   * Resolve a race condition
   */
  resolveRaceCondition(raceConditionId: string, resolution: 'auto' | 'manual' | 'ignored'): void {
    const raceCondition = this.detectedRaceConditions.get(raceConditionId);
    if (!raceCondition) return;

    raceCondition.resolution = resolution;
    this.emit('race_condition_resolved', { raceConditionId, resolution });
  }

  /**
   * Check for race conditions for a specific key
   */
  private checkForRaceConditions(key: string): void {
    const relevantOperations = this.getOperationsForKey(key);
    
    for (const rule of this.detectionRules.values()) {
      if (!rule.enabled) continue;
      
      if (rule.condition(relevantOperations)) {
        this.detectRaceCondition(rule, relevantOperations);
      }
    }
  }

  /**
   * Get operations for a specific key
   */
  private getOperationsForKey(key: string): OperationTrace[] {
    const activeOps = Array.from(this.activeOperations.values()).filter(op => op.key === key);
    const recentOps = this.completedOperations
      .filter(op => op.key === key && Date.now() - op.timestamp < 60000) // Last minute
      .slice(-10); // Last 10 operations
    
    return [...activeOps, ...recentOps];
  }

  /**
   * Detect and record a race condition
   */
  private detectRaceCondition(rule: DetectionRule, operations: OperationTrace[]): void {
    const raceConditionId = `${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const raceCondition: RaceCondition = {
      id: raceConditionId,
      type: this.getRaceConditionType(rule),
      operations: operations.slice(),
      detectedAt: Date.now(),
      severity: rule.severity,
      resolution: rule.autoResolve ? 'auto' : 'manual',
      description: rule.description
    };

    this.detectedRaceConditions.set(raceConditionId, raceCondition);
    
    logger.warn(`Race condition detected: ${rule.name}`, {
      raceConditionId,
      operations: operations.map(op => ({
        id: op.id,
        type: op.type,
        key: op.key,
        status: op.status
      }))
    });

    // Auto-resolve if possible
    if (rule.autoResolve && rule.resolver) {
      try {
        rule.resolver(operations);
        this.resolveRaceCondition(raceConditionId, 'auto');
      } catch (error) {
        logger.error('Failed to auto-resolve race condition:', error);
      }
    }

    this.emit('race_condition_detected', raceCondition);
  }

  /**
   * Get race condition type from rule
   */
  private getRaceConditionType(rule: DetectionRule): RaceCondition['type'] {
    if (rule.id.includes('concurrent')) return 'concurrent_updates';
    if (rule.id.includes('stale')) return 'stale_data_override';
    if (rule.id.includes('circular')) return 'circular_dependency';
    if (rule.id.includes('deadlock')) return 'deadlock';
    return 'concurrent_updates';
  }

  /**
   * Timeout an operation
   */
  private timeoutOperation(operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    operation.status = 'failed';
    operation.duration = this.operationTimeout;
    operation.metadata = { ...operation.metadata, timeout: true };

    this.activeOperations.delete(operationId);
    this.completedOperations.push(operation);

    this.emit('operation_timeout', operation);
  }

  /**
   * Setup default detection rules
   */
  private setupDefaultRules(): void {
    // Concurrent API calls for same data
    this.addDetectionRule({
      id: 'concurrent_api_calls',
      name: 'Concurrent API Calls',
      enabled: true,
      condition: (operations) => {
        const apiCalls = operations.filter(op => op.type === 'api_fetch' && op.status === 'pending');
        return apiCalls.length > 1;
      },
      severity: 'medium',
      description: 'Multiple API calls for the same data are running concurrently',
      autoResolve: true,
      resolver: (operations) => {
        // Cancel all but the most recent API call
        const apiCalls = operations.filter(op => op.type === 'api_fetch' && op.status === 'pending');
        const mostRecent = apiCalls.reduce((latest, current) => 
          current.timestamp > latest.timestamp ? current : latest
        );
        
        apiCalls.forEach(op => {
          if (op.id !== mostRecent.id) {
            this.failOperation(op.id, new Error('Cancelled due to concurrent API call'));
          }
        });
      }
    });

    // WebSocket update overriding fresh API data
    this.addDetectionRule({
      id: 'stale_websocket_override',
      name: 'Stale WebSocket Override',
      enabled: true,
      condition: (operations) => {
        const recentApi = operations.find(op => 
          op.type === 'api_fetch' && 
          op.status === 'completed' && 
          Date.now() - op.timestamp < 5000
        );
        const recentWebSocket = operations.find(op => 
          op.type === 'websocket_update' && 
          op.status === 'pending'
        );
        
        return !!(recentApi && recentWebSocket && recentWebSocket.timestamp < recentApi.timestamp);
      },
      severity: 'high',
      description: 'WebSocket update is trying to override fresh API data',
      autoResolve: true,
      resolver: (operations) => {
        const staleWebSocket = operations.find(op => 
          op.type === 'websocket_update' && 
          op.status === 'pending'
        );
        if (staleWebSocket) {
          this.failOperation(staleWebSocket.id, new Error('Cancelled stale WebSocket update'));
        }
      }
    });

    // Rapid successive operations
    this.addDetectionRule({
      id: 'rapid_successive_operations',
      name: 'Rapid Successive Operations',
      enabled: true,
      condition: (operations) => {
        const recent = operations.filter(op => Date.now() - op.timestamp < 1000);
        return recent.length > 3;
      },
      severity: 'low',
      description: 'Too many operations in quick succession',
      autoResolve: false
    });

    // Circular cache dependencies
    this.addDetectionRule({
      id: 'circular_cache_dependency',
      name: 'Circular Cache Dependency',
      enabled: true,
      condition: (operations) => {
        const cacheOps = operations.filter(op => 
          op.type === 'cache_read' || op.type === 'cache_write'
        );
        
        // Simple circular dependency detection
        const writeFollowedByRead = cacheOps.some((op, index) => {
          if (op.type === 'cache_write') {
            const nextOp = cacheOps[index + 1];
            return nextOp && nextOp.type === 'cache_read' && nextOp.timestamp - op.timestamp < 100;
          }
          return false;
        });
        
        return writeFollowedByRead && cacheOps.length > 4;
      },
      severity: 'medium',
      description: 'Potential circular dependency in cache operations',
      autoResolve: false
    });
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Cleanup old operations and race conditions
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    // Clean up old completed operations
    this.completedOperations = this.completedOperations.filter(
      op => now - op.timestamp < maxAge
    );

    // Clean up old race conditions
    for (const [id, raceCondition] of this.detectedRaceConditions.entries()) {
      if (now - raceCondition.detectedAt > maxAge) {
        this.detectedRaceConditions.delete(id);
      }
    }

    // Clean up timed out active operations
    for (const [id, operation] of this.activeOperations.entries()) {
      if (now - operation.timestamp > this.operationTimeout) {
        this.timeoutOperation(id);
      }
    }

    this.emit('cleanup_completed', {
      completedOperations: this.completedOperations.length,
      activeOperations: this.activeOperations.size,
      raceConditions: this.detectedRaceConditions.size
    });
  }

  /**
   * Destroy the detector
   */
  destroy(): void {
    this.isEnabled = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.activeOperations.clear();
    this.completedOperations.length = 0;
    this.detectedRaceConditions.clear();
    this.detectionRules.clear();
    this.removeAllListeners();
  }
}

export const raceConditionDetector = RaceConditionDetector.getInstance();
export default raceConditionDetector;