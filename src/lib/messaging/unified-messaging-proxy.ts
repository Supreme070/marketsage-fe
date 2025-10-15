/**
 * Unified Messaging Proxy
 *
 * Secure proxy for unified messaging operations through backend API
 * All master account credentials and crypto operations are handled server-side
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

// ==================== INTERFACES ====================

export interface MessageRequest {
  to: string;
  content: string;
  channel: 'sms' | 'email' | 'whatsapp';
  organizationId: string;
  campaignId?: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedMessageResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  cost?: number;
  credits?: number;
  error?: {
    message: string;
    code?: string;
  };
}

export interface OrganizationMessagingConfig {
  messagingModel: 'customer_managed' | 'platform_managed';
  creditBalance: number;
  autoTopUp: boolean;
  autoTopUpAmount: number;
  autoTopUpThreshold: number;
  preferredProviders: {
    sms?: string;
    email?: string;
    whatsapp?: string;
  };
  region: string;
}

export interface UsageAnalytics {
  usage: Array<{
    id: string;
    organizationId: string;
    channel: string;
    messageCount: number;
    credits: number;
    provider: string;
    timestamp: string;
  }>;
  summary: Record<string, {
    messages: number;
    credits: number;
  }>;
}

// ==================== API FUNCTIONS ====================

/**
 * Send a single message via unified messaging service
 */
export async function sendMessage(
  request: MessageRequest,
  token: string
): Promise<UnifiedMessageResult> {
  const response = await fetch(`${BACKEND_URL}/messaging/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return await response.json();
}

/**
 * Send multiple messages in bulk
 */
export async function bulkSendMessages(
  requests: MessageRequest[],
  token: string
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: UnifiedMessageResult[];
}> {
  const response = await fetch(`${BACKEND_URL}/messaging/bulk-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send bulk messages');
  }

  return await response.json();
}

/**
 * Get credit balance for organization
 */
export async function getCreditBalance(
  organizationId: string,
  token: string
): Promise<{ organizationId: string; creditBalance: number }> {
  const response = await fetch(`${BACKEND_URL}/messaging/credit-balance/${organizationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get credit balance');
  }

  return await response.json();
}

/**
 * Get usage analytics for organization
 */
export async function getUsageAnalytics(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  token: string
): Promise<UsageAnalytics> {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(
    `${BACKEND_URL}/messaging/usage-analytics/${organizationId}?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get usage analytics');
  }

  return await response.json();
}

/**
 * Switch messaging model for organization
 */
export async function switchMessagingModel(
  organizationId: string,
  newModel: 'customer_managed' | 'platform_managed',
  token: string
): Promise<{
  message: string;
  organizationId: string;
  newModel: string;
}> {
  const response = await fetch(`${BACKEND_URL}/messaging/model/${organizationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ newModel }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to switch messaging model');
  }

  return await response.json();
}

/**
 * Get messaging configuration for organization
 */
export async function getMessagingConfig(
  organizationId: string,
  token: string
): Promise<OrganizationMessagingConfig> {
  const response = await fetch(`${BACKEND_URL}/messaging/config/${organizationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get messaging config');
  }

  return await response.json();
}

/**
 * Calculate message cost
 */
export async function calculateCost(
  channel: 'sms' | 'email' | 'whatsapp',
  messageCount: number,
  region: string,
  token: string
): Promise<{
  channel: string;
  messageCount: number;
  region: string;
  creditCost: number;
}> {
  const response = await fetch(`${BACKEND_URL}/messaging/calculate-cost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, messageCount, region }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to calculate cost');
  }

  return await response.json();
}

/**
 * Test master account connectivity
 */
export async function testMasterAccount(
  channel: 'sms' | 'email' | 'whatsapp',
  region: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_URL}/messaging/test-master-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, region }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to test master account');
  }

  return await response.json();
}

// ==================== EXPORT DEFAULT SERVICE ====================

export const unifiedMessagingProxy = {
  sendMessage,
  bulkSendMessages,
  getCreditBalance,
  getUsageAnalytics,
  switchMessagingModel,
  getMessagingConfig,
  calculateCost,
  testMasterAccount,
};
