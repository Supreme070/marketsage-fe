/**
 * Autonomous Model Deployment Pipeline
 * ===================================
 * Automated model deployment orchestration that integrates with existing MLOps infrastructure
 * Builds upon the existing model registry, training, and monitoring systems
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { modelRegistry } from './model-registry';
import { performanceMonitor } from './performance-monitor';
import { autoTrainer } from './auto-trainer';

export interface DeploymentTarget {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  endpoint: string;
  resourceLimits: {
    cpu: string;
    memory: string;
    replicas: number;
  };
  healthCheckPath: string;
  rollbackThreshold: number; // Error rate threshold for automatic rollback
  trafficSplitPercentage?: number; // For canary deployments
}

export interface DeploymentStrategy {
  type: 'blue-green' | 'rolling' | 'canary' | 'immediate';
  parameters: {
    canaryPercentage?: number;
    rollbackThreshold?: number;
    healthCheckInterval?: number;
    promotionDelay?: number; // minutes
  };
}

export interface DeploymentPlan {
  id: string;
  modelId: string;
  modelVersion: string;
  strategy: DeploymentStrategy;
  targets: DeploymentTarget[];
  approvalRequired: boolean;
  scheduledAt?: Date;
  triggeredBy: 'auto-trainer' | 'performance-monitor' | 'manual' | 'scheduled';
  metadata: {
    reason: string;
    previousVersion?: string;
    performanceMetrics?: any;
    approvedBy?: string;
  };
}

export interface DeploymentExecution {
  id: string;
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back';
  startedAt: Date;
  completedAt?: Date;
  steps: DeploymentStep[];
  rollbackPlan?: DeploymentStep[];
  error?: string;
  metrics: {
    totalDuration: number;
    successRate: number;
    errorRate: number;
    healthScore: number;
  };
}

export interface DeploymentStep {
  id: string;
  name: string;
  type: 'validate' | 'build' | 'test' | 'deploy' | 'promote' | 'monitor' | 'rollback';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  duration?: number;
  retryCount?: number;
}

export interface ModelArtifact {
  modelId: string;
  version: string;
  artifacts: {
    model: string; // Path or URL to model file
    metadata: string; // Model metadata file
    requirements: string; // Dependencies file
    dockerfile?: string; // Container configuration
    kubernetesManifest?: string; // K8s deployment config
  };
  checksum: string;
  size: number;
  createdAt: Date;
}

class AutonomousDeploymentPipeline {
  private deploymentPlans = new Map<string, DeploymentPlan>();
  private activeDeployments = new Map<string, DeploymentExecution>();
  private deploymentHistory: DeploymentExecution[] = [];
  private deploymentTargets = new Map<string, DeploymentTarget>();

  constructor() {
    this.initializeDeploymentTargets();
    this.startDeploymentOrchestrator();
    this.registerEventHandlers();
  }

  /**
   * Initialize default deployment targets
   */
  private initializeDeploymentTargets(): void {
    const targets: DeploymentTarget[] = [
      {
        id: 'dev',
        name: 'Development Environment',
        environment: 'development',
        endpoint: 'http://localhost:3001/api/ml',
        resourceLimits: { cpu: '500m', memory: '1Gi', replicas: 1 },
        healthCheckPath: '/health',
        rollbackThreshold: 0.5 // 50% error rate
      },
      {
        id: 'staging',
        name: 'Staging Environment',
        environment: 'staging',
        endpoint: 'https://staging-api.marketsage.africa/ml',
        resourceLimits: { cpu: '1000m', memory: '2Gi', replicas: 2 },
        healthCheckPath: '/health',
        rollbackThreshold: 0.2 // 20% error rate
      },
      {
        id: 'production',
        name: 'Production Environment',
        environment: 'production',
        endpoint: 'https://api.marketsage.africa/ml',
        resourceLimits: { cpu: '2000m', memory: '4Gi', replicas: 3 },
        healthCheckPath: '/health',
        rollbackThreshold: 0.05 // 5% error rate
      }
    ];

    targets.forEach(target => {
      this.deploymentTargets.set(target.id, target);
    });

    logger.info('Deployment targets initialized', {
      targetsCount: targets.length,
      environments: targets.map(t => t.environment)
    });
  }

  /**
   * Register event handlers from existing MLOps systems
   */
  private registerEventHandlers(): void {
    // Listen for model promotion events from model registry
    modelRegistry.on('modelPromoted', this.handleModelPromotion.bind(this));
    
    // Listen for performance degradation from performance monitor
    performanceMonitor.on('performanceDegraded', this.handlePerformanceDegradation.bind(this));
    
    // Listen for new model training completion from auto-trainer
    autoTrainer.on('trainingCompleted', this.handleTrainingCompletion.bind(this));

    logger.info('Event handlers registered for autonomous deployment');
  }

  /**
   * Handle model promotion from registry
   */
  private async handleModelPromotion(event: any): Promise<void> {
    try {
      const { modelId, version, targetStage } = event;
      
      logger.info('Model promotion detected', { modelId, version, targetStage });

      // Create deployment plan for promoted model
      const plan = await this.createDeploymentPlan({
        modelId,
        modelVersion: version,
        targetEnvironment: this.mapStageToEnvironment(targetStage),
        strategy: { type: 'canary', parameters: { canaryPercentage: 10 } },
        triggeredBy: 'auto-trainer',
        reason: `Model promoted to ${targetStage}`
      });

      await this.scheduleDeployment(plan);

    } catch (error) {
      logger.error('Failed to handle model promotion', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Handle performance degradation detection
   */
  private async handlePerformanceDegradation(event: any): Promise<void> {
    try {
      const { modelId, metrics, threshold } = event;
      
      logger.warn('Performance degradation detected', { modelId, metrics, threshold });

      // Check if there's a better version available
      const availableVersions = await modelRegistry.getModelVersions(modelId);
      const currentVersion = await modelRegistry.getCurrentProductionVersion(modelId);
      
      const betterVersion = availableVersions.find(v => 
        v.version !== currentVersion?.version && 
        v.metrics.accuracy > (currentVersion?.metrics.accuracy || 0)
      );

      if (betterVersion) {
        // Create deployment plan to replace underperforming model
        const plan = await this.createDeploymentPlan({
          modelId,
          modelVersion: betterVersion.version,
          targetEnvironment: 'production',
          strategy: { type: 'blue-green', parameters: {} },
          triggeredBy: 'performance-monitor',
          reason: `Performance degraded below threshold, deploying better version`
        });

        await this.scheduleDeployment(plan);
      }

    } catch (error) {
      logger.error('Failed to handle performance degradation', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Handle training completion from auto-trainer
   */
  private async handleTrainingCompletion(event: any): Promise<void> {
    try {
      const { modelId, version, metrics, validationPassed } = event;
      
      logger.info('Training completion detected', { 
        modelId, version, metrics, validationPassed 
      });

      if (validationPassed) {
        // Auto-deploy to development environment
        const plan = await this.createDeploymentPlan({
          modelId,
          modelVersion: version,
          targetEnvironment: 'development',
          strategy: { type: 'immediate', parameters: {} },
          triggeredBy: 'auto-trainer',
          reason: 'New model training completed successfully'
        });

        await this.scheduleDeployment(plan);
      }

    } catch (error) {
      logger.error('Failed to handle training completion', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create a deployment plan
   */
  async createDeploymentPlan(params: {
    modelId: string;
    modelVersion: string;
    targetEnvironment: 'development' | 'staging' | 'production';
    strategy: DeploymentStrategy;
    triggeredBy: DeploymentPlan['triggeredBy'];
    reason: string;
    scheduledAt?: Date;
  }): Promise<DeploymentPlan> {
    const tracer = trace.getTracer('autonomous-deployment');
    
    return tracer.startActiveSpan('create-deployment-plan', async (span) => {
      try {
        const planId = `deploy_${params.modelId}_${params.modelVersion}_${Date.now()}`;
        
        // Get target deployment configuration
        const targets = Array.from(this.deploymentTargets.values())
          .filter(target => target.environment === params.targetEnvironment);

        if (targets.length === 0) {
          throw new Error(`No deployment targets found for environment: ${params.targetEnvironment}`);
        }

        // Check if approval is required for production deployments
        const approvalRequired = params.targetEnvironment === 'production' && 
                                params.triggeredBy !== 'performance-monitor';

        const plan: DeploymentPlan = {
          id: planId,
          modelId: params.modelId,
          modelVersion: params.modelVersion,
          strategy: params.strategy,
          targets,
          approvalRequired,
          scheduledAt: params.scheduledAt,
          triggeredBy: params.triggeredBy,
          metadata: {
            reason: params.reason,
            previousVersion: await this.getCurrentDeployedVersion(params.modelId, params.targetEnvironment)
          }
        };

        this.deploymentPlans.set(planId, plan);

        span.setAttributes({
          'deployment.plan.id': planId,
          'deployment.model.id': params.modelId,
          'deployment.model.version': params.modelVersion,
          'deployment.environment': params.targetEnvironment,
          'deployment.strategy': params.strategy.type,
          'deployment.approval_required': approvalRequired
        });

        logger.info('Deployment plan created', {
          planId,
          modelId: params.modelId,
          version: params.modelVersion,
          environment: params.targetEnvironment,
          strategy: params.strategy.type,
          approvalRequired
        });

        return plan;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Schedule deployment execution
   */
  async scheduleDeployment(plan: DeploymentPlan): Promise<string> {
    if (plan.approvalRequired) {
      logger.info('Deployment scheduled pending approval', {
        planId: plan.id,
        modelId: plan.modelId,
        environment: plan.targets[0]?.environment
      });
      
      // Store plan for approval
      return plan.id;
    }

    // Execute immediately if no approval required
    return this.executeDeployment(plan.id);
  }

  /**
   * Execute deployment plan
   */
  async executeDeployment(planId: string): Promise<string> {
    const plan = this.deploymentPlans.get(planId);
    if (!plan) {
      throw new Error(`Deployment plan not found: ${planId}`);
    }

    const tracer = trace.getTracer('autonomous-deployment');
    
    return tracer.startActiveSpan('execute-deployment', async (span) => {
      try {
        const executionId = `exec_${planId}_${Date.now()}`;
        
        const execution: DeploymentExecution = {
          id: executionId,
          planId,
          status: 'running',
          startedAt: new Date(),
          steps: [],
          metrics: {
            totalDuration: 0,
            successRate: 0,
            errorRate: 0,
            healthScore: 0
          }
        };

        this.activeDeployments.set(executionId, execution);

        span.setAttributes({
          'deployment.execution.id': executionId,
          'deployment.plan.id': planId,
          'deployment.model.id': plan.modelId,
          'deployment.model.version': plan.modelVersion
        });

        logger.info('Deployment execution started', {
          executionId,
          planId,
          modelId: plan.modelId,
          version: plan.modelVersion
        });

        // Generate deployment steps based on strategy
        const steps = await this.generateDeploymentSteps(plan);
        execution.steps = steps;

        // Execute steps sequentially
        for (const step of steps) {
          try {
            await this.executeDeploymentStep(step, plan, execution);
            
            if (step.status === 'failed') {
              execution.status = 'failed';
              break;
            }
          } catch (error) {
            step.status = 'failed';
            step.error = error instanceof Error ? error.message : String(error);
            execution.status = 'failed';
            break;
          }
        }

        // Finalize execution
        execution.completedAt = new Date();
        execution.metrics.totalDuration = execution.completedAt.getTime() - execution.startedAt.getTime();
        
        if (execution.status === 'failed') {
          await this.handleDeploymentFailure(execution, plan);
        } else {
          execution.status = 'completed';
          await this.handleDeploymentSuccess(execution, plan);
        }

        // Move to history
        this.deploymentHistory.push(execution);
        this.activeDeployments.delete(executionId);

        span.setAttributes({
          'deployment.execution.status': execution.status,
          'deployment.execution.duration': execution.metrics.totalDuration
        });

        return executionId;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Generate deployment steps based on strategy
   */
  private async generateDeploymentSteps(plan: DeploymentPlan): Promise<DeploymentStep[]> {
    const steps: DeploymentStep[] = [];

    // Validation steps
    steps.push({
      id: `validate_${Date.now()}`,
      name: 'Validate Model Artifacts',
      type: 'validate',
      status: 'pending'
    });

    steps.push({
      id: `validate_target_${Date.now()}`,
      name: 'Validate Deployment Targets',
      type: 'validate',
      status: 'pending'
    });

    // Build steps
    steps.push({
      id: `build_${Date.now()}`,
      name: 'Build Model Container',
      type: 'build',
      status: 'pending'
    });

    // Test steps
    steps.push({
      id: `test_${Date.now()}`,
      name: 'Run Model Tests',
      type: 'test',
      status: 'pending'
    });

    // Deployment steps based on strategy
    switch (plan.strategy.type) {
      case 'canary':
        steps.push({
          id: `deploy_canary_${Date.now()}`,
          name: `Deploy Canary (${plan.strategy.parameters.canaryPercentage}%)`,
          type: 'deploy',
          status: 'pending'
        });
        steps.push({
          id: `monitor_canary_${Date.now()}`,
          name: 'Monitor Canary Performance',
          type: 'monitor',
          status: 'pending'
        });
        steps.push({
          id: `promote_canary_${Date.now()}`,
          name: 'Promote Canary to Full Traffic',
          type: 'promote',
          status: 'pending'
        });
        break;

      case 'blue-green':
        steps.push({
          id: `deploy_green_${Date.now()}`,
          name: 'Deploy to Green Environment',
          type: 'deploy',
          status: 'pending'
        });
        steps.push({
          id: `test_green_${Date.now()}`,
          name: 'Test Green Environment',
          type: 'test',
          status: 'pending'
        });
        steps.push({
          id: `switch_traffic_${Date.now()}`,
          name: 'Switch Traffic to Green',
          type: 'promote',
          status: 'pending'
        });
        break;

      case 'rolling':
        for (const target of plan.targets) {
          steps.push({
            id: `deploy_rolling_${target.id}_${Date.now()}`,
            name: `Rolling Deploy to ${target.name}`,
            type: 'deploy',
            status: 'pending'
          });
        }
        break;

      case 'immediate':
        steps.push({
          id: `deploy_immediate_${Date.now()}`,
          name: 'Immediate Deployment',
          type: 'deploy',
          status: 'pending'
        });
        break;
    }

    // Final monitoring step
    steps.push({
      id: `monitor_final_${Date.now()}`,
      name: 'Post-Deployment Monitoring',
      type: 'monitor',
      status: 'pending'
    });

    return steps;
  }

  /**
   * Execute individual deployment step
   */
  private async executeDeploymentStep(
    step: DeploymentStep,
    plan: DeploymentPlan,
    execution: DeploymentExecution
  ): Promise<void> {
    step.status = 'running';
    step.startedAt = new Date();

    try {
      logger.info('Executing deployment step', {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        executionId: execution.id
      });

      switch (step.type) {
        case 'validate':
          await this.executeValidationStep(step, plan);
          break;
        case 'build':
          await this.executeBuildStep(step, plan);
          break;
        case 'test':
          await this.executeTestStep(step, plan);
          break;
        case 'deploy':
          await this.executeDeployStep(step, plan);
          break;
        case 'promote':
          await this.executePromoteStep(step, plan);
          break;
        case 'monitor':
          await this.executeMonitorStep(step, plan);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = 'completed';
      step.output = `Step completed successfully`;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      step.completedAt = new Date();
      if (step.startedAt) {
        step.duration = step.completedAt.getTime() - step.startedAt.getTime();
      }
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate validation logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (step.name.includes('Model Artifacts')) {
      // Validate model exists and artifacts are complete
      const modelVersion = await modelRegistry.getModelVersion(plan.modelId, plan.modelVersion);
      if (!modelVersion) {
        throw new Error(`Model version not found: ${plan.modelId}@${plan.modelVersion}`);
      }
    } else if (step.name.includes('Deployment Targets')) {
      // Validate deployment targets are healthy
      for (const target of plan.targets) {
        const healthCheck = await this.checkTargetHealth(target);
        if (!healthCheck.healthy) {
          throw new Error(`Target ${target.name} is unhealthy: ${healthCheck.error}`);
        }
      }
    }
  }

  /**
   * Execute build step
   */
  private async executeBuildStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate container build
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // In reality, this would:
    // 1. Pull model artifacts
    // 2. Build Docker container
    // 3. Push to container registry
    // 4. Generate Kubernetes manifests
    
    step.output = `Container built for ${plan.modelId}:${plan.modelVersion}`;
  }

  /**
   * Execute test step
   */
  private async executeTestStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate testing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In reality, this would:
    // 1. Run model validation tests
    // 2. Performance benchmarks
    // 3. Integration tests
    // 4. Security scans
    
    step.output = `All tests passed for ${plan.modelId}:${plan.modelVersion}`;
  }

  /**
   * Execute deploy step
   */
  private async executeDeployStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // In reality, this would:
    // 1. Apply Kubernetes manifests
    // 2. Wait for pods to be ready
    // 3. Update load balancer configuration
    // 4. Verify deployment health
    
    step.output = `Deployed ${plan.modelId}:${plan.modelVersion} to ${plan.targets.map(t => t.name).join(', ')}`;
  }

  /**
   * Execute promote step
   */
  private async executePromoteStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate traffic promotion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In reality, this would:
    // 1. Gradually increase traffic to new version
    // 2. Monitor error rates and performance
    // 3. Complete traffic switch
    // 4. Retire old version
    
    step.output = `Traffic promoted to ${plan.modelId}:${plan.modelVersion}`;
  }

  /**
   * Execute monitor step
   */
  private async executeMonitorStep(step: DeploymentStep, plan: DeploymentPlan): Promise<void> {
    // Simulate monitoring
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In reality, this would:
    // 1. Check model performance metrics
    // 2. Monitor error rates
    // 3. Verify health checks
    // 4. Set up alerting
    
    step.output = `Monitoring configured for ${plan.modelId}:${plan.modelVersion}`;
  }

  /**
   * Start deployment orchestrator
   */
  private startDeploymentOrchestrator(): void {
    // Monitor for scheduled deployments
    setInterval(async () => {
      try {
        const now = new Date();
        
        for (const [planId, plan] of this.deploymentPlans.entries()) {
          if (plan.scheduledAt && plan.scheduledAt <= now && !this.activeDeployments.has(planId)) {
            logger.info('Executing scheduled deployment', { planId });
            await this.executeDeployment(planId);
          }
        }
      } catch (error) {
        logger.error('Deployment orchestrator error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 60000); // Check every minute

    logger.info('Deployment orchestrator started');
  }

  /**
   * Utility methods
   */
  private mapStageToEnvironment(stage: string): 'development' | 'staging' | 'production' {
    switch (stage.toLowerCase()) {
      case 'development': return 'development';
      case 'staging': return 'staging';
      case 'production': return 'production';
      default: return 'development';
    }
  }

  private async getCurrentDeployedVersion(modelId: string, environment: string): Promise<string | undefined> {
    // This would query the actual deployment system
    return undefined;
  }

  private async checkTargetHealth(target: DeploymentTarget): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 500));
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  private async handleDeploymentSuccess(execution: DeploymentExecution, plan: DeploymentPlan): Promise<void> {
    logger.info('Deployment completed successfully', {
      executionId: execution.id,
      modelId: plan.modelId,
      version: plan.modelVersion
    });

    // Update model registry with deployment info
    await modelRegistry.recordDeployment(plan.modelId, plan.modelVersion, {
      environment: plan.targets[0]?.environment,
      deployedAt: execution.completedAt,
      executionId: execution.id
    });
  }

  private async handleDeploymentFailure(execution: DeploymentExecution, plan: DeploymentPlan): Promise<void> {
    logger.error('Deployment failed', {
      executionId: execution.id,
      modelId: plan.modelId,
      version: plan.modelVersion,
      error: execution.error
    });

    // Trigger rollback if needed
    if (plan.targets[0]?.environment === 'production') {
      await this.triggerRollback(execution, plan);
    }
  }

  private async triggerRollback(execution: DeploymentExecution, plan: DeploymentPlan): Promise<void> {
    logger.info('Triggering rollback', {
      executionId: execution.id,
      modelId: plan.modelId
    });

    // Implementation would create rollback deployment plan
  }

  /**
   * Public API methods
   */
  async getDeploymentHistory(limit = 10): Promise<DeploymentExecution[]> {
    return this.deploymentHistory.slice(-limit);
  }

  async getActiveDeployments(): Promise<DeploymentExecution[]> {
    return Array.from(this.activeDeployments.values());
  }

  async approveDeployment(planId: string, approvedBy: string): Promise<string> {
    const plan = this.deploymentPlans.get(planId);
    if (!plan) {
      throw new Error(`Deployment plan not found: ${planId}`);
    }

    plan.metadata.approvedBy = approvedBy;
    plan.approvalRequired = false;

    logger.info('Deployment approved', { planId, approvedBy });
    
    return this.executeDeployment(planId);
  }

  async cancelDeployment(executionId: string): Promise<void> {
    const execution = this.activeDeployments.get(executionId);
    if (!execution) {
      throw new Error(`Active deployment not found: ${executionId}`);
    }

    execution.status = 'failed';
    execution.error = 'Deployment cancelled by user';
    execution.completedAt = new Date();

    this.activeDeployments.delete(executionId);
    this.deploymentHistory.push(execution);

    logger.info('Deployment cancelled', { executionId });
  }
}

// Export singleton instance
export const autonomousDeploymentPipeline = new AutonomousDeploymentPipeline();

// Convenience functions
export async function createModelDeployment(params: {
  modelId: string;
  modelVersion: string;
  targetEnvironment: 'development' | 'staging' | 'production';
  strategy?: DeploymentStrategy;
}): Promise<string> {
  const plan = await autonomousDeploymentPipeline.createDeploymentPlan({
    ...params,
    strategy: params.strategy || { type: 'rolling', parameters: {} },
    triggeredBy: 'manual',
    reason: 'Manual deployment request'
  });

  return autonomousDeploymentPipeline.scheduleDeployment(plan);
}

export async function getDeploymentStatus(executionId: string): Promise<DeploymentExecution | null> {
  const active = await autonomousDeploymentPipeline.getActiveDeployments();
  const activeExecution = active.find(e => e.id === executionId);
  
  if (activeExecution) return activeExecution;

  const history = await autonomousDeploymentPipeline.getDeploymentHistory(100);
  return history.find(e => e.id === executionId) || null;
}

export async function approveDeployment(planId: string, approvedBy: string): Promise<string> {
  return autonomousDeploymentPipeline.approveDeployment(planId, approvedBy);
}