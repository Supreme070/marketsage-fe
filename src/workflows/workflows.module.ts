import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../core/database/prisma/prisma.service';
import { RedisService } from '../core/database/redis/redis.service';
import { QueueService } from '../core/queue/queue.service';

// Services
import {
  WorkflowBuilderService,
  WorkflowExecutionService,
} from './services';
import { WorkflowTriggerService } from './services/workflow-trigger.service';
import { WorkflowActionHandlerService } from './services/workflow-action-handler.service';
import { WorkflowAnalyticsService } from './services/workflow-analytics.service';
import { WorkflowValidatorService } from './services/workflow-validator.service';
import { WorkflowOptimizerService } from './services/workflow-optimizer.service';
import { WorkflowMonitoringService } from './services/workflow-monitoring.service';
import { WorkflowAdvancedTriggersService } from './services/workflow-advanced-triggers.service';

// Controllers
import {
  WorkflowBuilderController,
  WorkflowExecutionController,
} from './controllers';
import { WorkflowAnalyticsController } from './controllers/workflow-analytics.controller';
import { WorkflowAdvancedTriggersController } from './controllers/workflow-advanced-triggers.controller';

@Module({
  imports: [
    HttpModule, // For API calls in action handlers
  ],
  controllers: [
    WorkflowBuilderController,
    WorkflowExecutionController,
    WorkflowAnalyticsController,
    WorkflowAdvancedTriggersController,
  ],
  providers: [
    // Core services
    WorkflowBuilderService,
    WorkflowExecutionService,
    WorkflowTriggerService,
    WorkflowActionHandlerService,
    WorkflowAnalyticsService,
    WorkflowValidatorService,
    WorkflowOptimizerService,
    WorkflowMonitoringService,
    WorkflowAdvancedTriggersService,
    
    // Database and infrastructure
    PrismaService,
    RedisService,
    QueueService,
  ],
  exports: [
    WorkflowBuilderService,
    WorkflowExecutionService,
    WorkflowTriggerService,
    WorkflowActionHandlerService,
    WorkflowAnalyticsService,
    WorkflowValidatorService,
    WorkflowOptimizerService,
    WorkflowMonitoringService,
    WorkflowAdvancedTriggersService,
  ],
})
export class WorkflowsModule {}