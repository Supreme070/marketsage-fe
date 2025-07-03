/**
 * Action Executor Exports
 * =======================
 * 
 * Central export point for all action executor implementations
 */

// Base executor
export { BaseExecutor } from './base-executor';

// Communication executors
export {
  EmailExecutor,
  SMSExecutor,
  WhatsAppExecutor,
  PushNotificationExecutor
} from './communication-executors';

// Task management executors
export {
  TaskCreationExecutor,
  TaskAssignmentExecutor,
  TaskUpdateExecutor
} from './task-executors';

// Customer journey executors
export {
  WorkflowTriggerExecutor,
  SegmentMoveExecutor,
  ListAddExecutor,
  ListRemoveExecutor
} from './journey-executors';

// Marketing and engagement executors
export {
  DiscountApplyExecutor,
  CouponSendExecutor,
  PersonalizedOfferExecutor,
  SurveyExecutor,
  ReviewRequestExecutor,
  EducationalContentExecutor,
  BirthdayGreetingExecutor,
  AnniversaryGreetingExecutor,
  ChurnPreventionExecutor,
  WinbackCampaignExecutor
} from './marketing-executors';