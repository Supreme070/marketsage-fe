/**
 * Workflow Proxy Service
 *
 * Thin API wrapper for all workflow services (replaces 7 frontend files with backend API calls).
 * All business logic now executes securely in the backend.
 *
 * IMPORTANT: This file contains ZERO business logic - only API calls to backend.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ==================== HELPER FUNCTIONS ====================

/**
 * Make authenticated API call to backend
 */
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token: string,
  body?: any
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// ==================== WORKFLOW EXECUTION SERVICE ====================

/**
 * Start a new workflow execution for a contact
 */
export async function startWorkflowExecution(
  workflowId: string,
  contactId: string,
  triggerData: Record<string, any> | undefined,
  token: string
): Promise<{ executionId: string; status: string }> {
  return apiCall(
    `/workflows/${workflowId}/executions/start`,
    'POST',
    token,
    { contactId, triggerData }
  );
}

/**
 * Execute a specific workflow step (for retry/manual execution)
 */
export async function executeWorkflowStep(
  executionId: string,
  stepId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/executions/${executionId}/steps/${stepId}/execute`,
    'POST',
    token
  );
}

/**
 * Start enhanced workflow execution with performance monitoring
 */
export async function startEnhancedWorkflowExecution(
  workflowId: string,
  contactId: string,
  triggerData: Record<string, any> | undefined,
  token: string
): Promise<{ executionId: string; status: string; type: string }> {
  return apiCall(
    `/workflows/${workflowId}/executions/enhanced/start`,
    'POST',
    token,
    { contactId, triggerData }
  );
}

// ==================== COST TRACKING SERVICE ====================

/**
 * Initialize cost tracking for a workflow
 */
export async function initializeWorkflowCostTracking(
  workflowId: string,
  token: string
): Promise<{ trackingId: string; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/initialize`,
    'POST',
    token
  );
}

/**
 * Get cost summary for a workflow
 */
export async function getWorkflowCostSummary(
  workflowId: string,
  token: string
): Promise<any> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/summary`,
    'GET',
    token
  );
}

/**
 * Record email cost
 */
export async function recordWorkflowEmailCost(
  workflowId: string,
  executionId: string | null,
  emailCount: number,
  provider: string | undefined,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/email`,
    'POST',
    token,
    { executionId, emailCount, provider }
  );
}

/**
 * Record SMS cost
 */
export async function recordWorkflowSmsCost(
  workflowId: string,
  executionId: string | null,
  smsCount: number,
  provider: string | undefined,
  region: string | undefined,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/sms`,
    'POST',
    token,
    { executionId, smsCount, provider, region }
  );
}

/**
 * Record WhatsApp cost
 */
export async function recordWorkflowWhatsAppCost(
  workflowId: string,
  executionId: string | null,
  messageCount: number,
  provider: string | undefined,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/whatsapp`,
    'POST',
    token,
    { executionId, messageCount, provider }
  );
}

/**
 * Create workflow budget
 */
export async function createWorkflowBudget(
  workflowId: string,
  budgetSettings: {
    budgetAmount: number;
    currency: string;
    period: string;
    startDate: Date;
    endDate: Date;
    warningThreshold: number;
    criticalThreshold: number;
    pauseOnExceeded: boolean;
    autoRenew: boolean;
  },
  token: string
): Promise<{ budgetId: string; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/budget`,
    'POST',
    token,
    budgetSettings
  );
}

/**
 * Generate cost projection
 */
export async function generateWorkflowCostProjection(
  workflowId: string,
  period: string | undefined,
  token: string
): Promise<any> {
  const endpoint = period
    ? `/workflows/${workflowId}/cost-tracking/projection?period=${period}`
    : `/workflows/${workflowId}/cost-tracking/projection`;

  return apiCall(endpoint, 'GET', token);
}

/**
 * Get cost optimization recommendations
 */
export async function getWorkflowCostOptimizationRecommendations(
  workflowId: string,
  token: string
): Promise<any> {
  return apiCall(
    `/workflows/${workflowId}/cost-tracking/recommendations`,
    'GET',
    token
  );
}

// ==================== RETRY SERVICE ====================

/**
 * Check if step should be retried
 */
export async function shouldRetryWorkflowStep(
  executionId: string,
  stepId: string,
  stepType: string,
  error: string,
  token: string
): Promise<{ shouldRetry: boolean }> {
  return apiCall(
    `/workflows/executions/${executionId}/steps/${stepId}/should-retry`,
    'POST',
    token,
    { stepType, error }
  );
}

/**
 * Schedule step retry
 */
export async function scheduleWorkflowStepRetry(
  executionId: string,
  stepId: string,
  stepType: string,
  error: string,
  token: string
): Promise<{ scheduled: boolean; nextRetryAt?: Date; delayMs?: number }> {
  return apiCall(
    `/workflows/executions/${executionId}/steps/${stepId}/schedule-retry`,
    'POST',
    token,
    { stepType, error }
  );
}

/**
 * Mark step as successful
 */
export async function markWorkflowStepSuccess(
  executionId: string,
  stepId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/executions/${executionId}/steps/${stepId}/mark-success`,
    'POST',
    token
  );
}

// ==================== A/B TESTING SERVICE ====================

/**
 * Assign workflow variant to contact
 */
export async function assignWorkflowVariant(
  workflowId: string,
  contactId: string,
  token: string
): Promise<{ variantId?: string; workflowDefinition?: any; message?: string }> {
  return apiCall(
    `/workflows/${workflowId}/ab-testing/assign-variant`,
    'POST',
    token,
    { contactId }
  );
}

/**
 * Record workflow test result
 */
export async function recordWorkflowTestResult(
  workflowId: string,
  contactId: string,
  metric: 'COMPLETION_RATE' | 'EXECUTION_TIME' | 'ERROR_RATE' | 'CONVERSION_RATE',
  value: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/ab-testing/record-result`,
    'POST',
    token,
    { contactId, metric, value }
  );
}

/**
 * Create workflow A/B test
 */
export async function createWorkflowABTest(
  workflowId: string,
  testData: {
    name: string;
    description?: string;
    testType: 'SIMPLE_AB' | 'MULTIVARIATE';
    winnerMetric: 'COMPLETION_RATE' | 'CONVERSION_RATE' | 'EXECUTION_TIME' | 'ERROR_RATE';
    winnerThreshold: number;
    distributionPercent: number;
    variants: Array<{
      name: string;
      description?: string;
      workflowDefinition: any;
      trafficPercent: number;
    }>;
  },
  token: string
): Promise<{ testId: string; message: string }> {
  return apiCall(
    `/workflows/${workflowId}/ab-testing/create`,
    'POST',
    token,
    testData
  );
}

/**
 * Analyze workflow A/B test
 */
export async function analyzeWorkflowABTest(
  testId: string,
  token: string
): Promise<{
  hasWinner: boolean;
  winnerVariantId?: string;
  confidence: number;
  results: Array<{
    variantId: string;
    variantName: string;
    sampleSize: number;
    metricValue: number;
    improvementPercent: number;
  }>;
}> {
  return apiCall(
    `/workflows/ab-testing/${testId}/analyze`,
    'GET',
    token
  );
}

// ==================== ADVANCED TRIGGER SERVICE ====================

/**
 * Evaluate advanced trigger conditions
 */
export async function evaluateAdvancedTrigger(
  workflowId: string,
  contactId: string,
  triggerConditions: any[],
  token: string
): Promise<any> {
  return apiCall(
    `/workflows/${workflowId}/triggers/evaluate`,
    'POST',
    token,
    { contactId, triggerConditions }
  );
}

// ==================== COMPLIANCE SERVICE ====================

/**
 * Check workflow compliance
 */
export async function checkWorkflowCompliance(
  workflowId: string,
  context: {
    country: string;
    industry: string;
    dataTypes: string[];
    communicationChannels: string[];
  },
  executionId: string | undefined,
  token: string
): Promise<any> {
  return apiCall(
    `/workflows/${workflowId}/compliance/check`,
    'POST',
    token,
    { context, executionId }
  );
}

// ==================== EXPORTS ====================

export default {
  // Execution
  startWorkflowExecution,
  executeWorkflowStep,
  startEnhancedWorkflowExecution,

  // Cost Tracking
  initializeWorkflowCostTracking,
  getWorkflowCostSummary,
  recordWorkflowEmailCost,
  recordWorkflowSmsCost,
  recordWorkflowWhatsAppCost,
  createWorkflowBudget,
  generateWorkflowCostProjection,
  getWorkflowCostOptimizationRecommendations,

  // Retry
  shouldRetryWorkflowStep,
  scheduleWorkflowStepRetry,
  markWorkflowStepSuccess,

  // A/B Testing
  assignWorkflowVariant,
  recordWorkflowTestResult,
  createWorkflowABTest,
  analyzeWorkflowABTest,

  // Advanced Triggers
  evaluateAdvancedTrigger,

  // Compliance
  checkWorkflowCompliance,
};
