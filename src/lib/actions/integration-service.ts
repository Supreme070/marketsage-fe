/**
 * Action System Integration Service
 * =================================
 * 
 * Safe integration layer that connects the Action Dispatcher with the existing
 * MarketSage infrastructure without breaking current functionality.
 * 
 * This service ensures gradual rollout and backwards compatibility.
 */

import { getActionDispatcher, startActionDispatcher } from './action-dispatcher';
import { getCustomerEventBus } from '@/lib/events/event-bus';
import { AIDecisionHandler } from '@/lib/events/handlers/ai-decision-handler';
import { logger } from '@/lib/logger';

export interface IntegrationConfig {
  enableActionDispatcher: boolean;
  enableAutoExecution: boolean;
  enableBackgroundProcessing: boolean;
  maxConcurrentActions: number;
  dryRunMode: boolean;
  organizationWhitelist?: string[];
}

/**
 * Action System Integration Service
 */
export class ActionIntegrationService {
  private static instance: ActionIntegrationService | null = null;
  private config: IntegrationConfig;
  private isInitialized = false;

  private constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(config?: IntegrationConfig): ActionIntegrationService {
    if (!ActionIntegrationService.instance) {
      const defaultConfig: IntegrationConfig = {
        enableActionDispatcher: true,
        enableAutoExecution: false, // Start conservatively
        enableBackgroundProcessing: false, // Start conservatively
        maxConcurrentActions: 3,
        dryRunMode: true, // Start in dry run mode for safety
        organizationWhitelist: undefined // No restrictions by default
      };

      ActionIntegrationService.instance = new ActionIntegrationService(
        config || defaultConfig
      );
    }
    return ActionIntegrationService.instance;
  }

  /**
   * Initialize the action system safely
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Action Integration Service already initialized');
      return;
    }

    try {
      logger.info('Initializing Action Integration Service', {
        config: this.config
      });

      // Initialize Action Dispatcher if enabled
      if (this.config.enableActionDispatcher) {
        const dispatcher = getActionDispatcher();
        
        if (this.config.enableBackgroundProcessing) {
          startActionDispatcher();
          logger.info('Action Dispatcher background processing started');
        } else {
          logger.info('Action Dispatcher initialized (manual execution only)');
        }
      }

      // Connect to event bus for AI decision integration
      this.setupEventBusIntegration();

      this.isInitialized = true;
      logger.info('Action Integration Service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Action Integration Service', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Setup event bus integration for AI decisions
   */
  private setupEventBusIntegration(): void {
    try {
      const eventBus = getCustomerEventBus();
      
      // Subscribe to customer events for AI decision making
      eventBus.subscribe('ai-decision-integration', (event) => {
        this.handleCustomerEvent(event);
      });

      logger.info('Event bus integration setup completed');

    } catch (error) {
      logger.error('Failed to setup event bus integration', {
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - this is not critical for basic functionality
    }
  }

  /**
   * Handle customer events and trigger AI decision making
   */
  private async handleCustomerEvent(event: any): Promise<void> {
    try {
      // Check if organization is whitelisted (if whitelist is configured)
      if (this.config.organizationWhitelist && 
          !this.config.organizationWhitelist.includes(event.organizationId)) {
        return; // Skip non-whitelisted organizations
      }

      // Use the enhanced AI Decision Handler
      await AIDecisionHandler.handleCustomerEvent(event);

    } catch (error) {
      logger.error('Failed to handle customer event in integration service', {
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Safely execute an action plan
   */
  async executeActionPlan(
    actionPlanId: string,
    options: {
      userId?: string;
      forceExecution?: boolean;
      skipWhitelist?: boolean;
    } = {}
  ): Promise<any> {
    if (!this.config.enableActionDispatcher) {
      throw new Error('Action Dispatcher is disabled');
    }

    try {
      const dispatcher = getActionDispatcher();
      
      // Always use dry run mode if configured globally
      const dryRun = this.config.dryRunMode && !options.forceExecution;
      
      const result = await dispatcher.executeActionPlan(actionPlanId, {
        userId: options.userId,
        dryRun,
        forceExecution: options.forceExecution || false
      });

      logger.info('Action plan executed via integration service', {
        actionPlanId,
        success: result.success,
        dryRun,
        executionId: result.executionId
      });

      return result;

    } catch (error) {
      logger.error('Failed to execute action plan via integration service', {
        actionPlanId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get actions ready for execution
   */
  async getReadyActions(organizationId?: string): Promise<any[]> {
    if (!this.config.enableActionDispatcher) {
      return [];
    }

    try {
      const dispatcher = getActionDispatcher();
      const actions = await dispatcher.getActionsReadyForExecution(organizationId);

      // Filter by whitelist if configured
      if (this.config.organizationWhitelist) {
        return actions.filter(action => 
          this.config.organizationWhitelist!.includes(action.organizationId)
        );
      }

      return actions;

    } catch (error) {
      logger.error('Failed to get ready actions via integration service', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }

  /**
   * Update configuration safely
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    logger.info('Action Integration Service configuration updated', {
      oldConfig,
      newConfig: this.config
    });

    // Handle background processing changes
    if (oldConfig.enableBackgroundProcessing !== this.config.enableBackgroundProcessing) {
      if (this.config.enableBackgroundProcessing && this.config.enableActionDispatcher) {
        startActionDispatcher();
        logger.info('Background processing enabled');
      } else {
        // Note: We don't stop the dispatcher here to avoid disrupting ongoing executions
        logger.info('Background processing disabled (existing processes will continue)');
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    isInitialized: boolean;
    config: IntegrationConfig;
    dispatcher: {
      available: boolean;
      executorCount: number;
    };
    eventBus: {
      connected: boolean;
    };
  }> {
    let dispatcherStatus = {
      available: false,
      executorCount: 0
    };

    let eventBusStatus = {
      connected: false
    };

    try {
      if (this.config.enableActionDispatcher) {
        const dispatcher = getActionDispatcher();
        dispatcherStatus = {
          available: true,
          executorCount: (dispatcher as any).executors?.size || 0
        };
      }
    } catch (error) {
      logger.warn('Could not get dispatcher status', { error });
    }

    try {
      const eventBus = getCustomerEventBus();
      eventBusStatus = {
        connected: true // If we can get the instance, it's connected
      };
    } catch (error) {
      logger.warn('Could not get event bus status', { error });
    }

    return {
      isInitialized: this.isInitialized,
      config: this.config,
      dispatcher: dispatcherStatus,
      eventBus: eventBusStatus
    };
  }

  /**
   * Shutdown the integration service safely
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      logger.info('Shutting down Action Integration Service');

      // The dispatcher and event bus will handle their own cleanup
      this.isInitialized = false;
      
      logger.info('Action Integration Service shutdown completed');

    } catch (error) {
      logger.error('Error during Action Integration Service shutdown', {
        error: error instanceof Error ? error.message : error
      });
    }
  }
}

/**
 * Convenience functions for easy access
 */

/**
 * Initialize the action system with safe defaults
 */
export async function initializeActionSystem(config?: Partial<IntegrationConfig>): Promise<void> {
  const integrationService = ActionIntegrationService.getInstance(config as IntegrationConfig);
  await integrationService.initialize();
}

/**
 * Get the action integration service instance
 */
export function getActionIntegrationService(): ActionIntegrationService {
  return ActionIntegrationService.getInstance();
}

/**
 * Safely execute an action plan
 */
export async function executeActionPlan(
  actionPlanId: string,
  options?: {
    userId?: string;
    forceExecution?: boolean;
  }
): Promise<any> {
  const service = getActionIntegrationService();
  return service.executeActionPlan(actionPlanId, options);
}

/**
 * Get actions ready for execution
 */
export async function getReadyActions(organizationId?: string): Promise<any[]> {
  const service = getActionIntegrationService();
  return service.getReadyActions(organizationId);
}

/**
 * Enable production mode (disable dry run)
 */
export function enableProductionMode(): void {
  const service = getActionIntegrationService();
  service.updateConfig({
    dryRunMode: false,
    enableAutoExecution: true,
    enableBackgroundProcessing: true
  });
  
  logger.info('Action system switched to production mode');
}

/**
 * Enable safe mode (enable dry run, disable auto execution)
 */
export function enableSafeMode(): void {
  const service = getActionIntegrationService();
  service.updateConfig({
    dryRunMode: true,
    enableAutoExecution: false,
    enableBackgroundProcessing: false
  });
  
  logger.info('Action system switched to safe mode');
}