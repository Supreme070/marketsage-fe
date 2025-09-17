/**
 * Unified MarketSage API
 * Single entry point for all API functionality
 */

// Export the unified client and services
export { 
  MarketSageApiClient, 
  apiClient,
  ApiClientError,
  ApiError,
  ApiResponse,
  RequestConfig,
  RetryConfig
} from './client';

export {
  SMSService,
  EmailService,
  ContactService,
  WorkflowService,
  UserService,
  OrganizationService,
  smsService,
  emailService,
  contactService,
  workflowService,
  userService,
  organizationService
} from './services';

// Export hooks
export {
  useApiOperation,
  useSMS,
  useEmail,
  useContacts,
  useWorkflows,
  useUsers,
  useOrganizations
} from './hooks';

// Export all types
export * from './types/sms';
export * from './types/email';
export * from './types/contacts';
export * from './types/workflows';
export * from './types/users';
export * from './types/organizations';