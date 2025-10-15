/**
 * SMS Frontend Proxy
 * ==================
 *
 * SECURITY: This file proxies all SMS operations through the backend.
 * NO API keys are exposed in the frontend.
 *
 * Backend API: http://localhost:3006/sms
 *
 * Migration Date: October 11, 2025
 *
 * ⚠️ IMPORTANT: The old SMS provider files (africastalking-provider.ts,
 * termii-provider.ts, twilio-provider.ts) with hardcoded API keys
 * should be DELETED after this migration is verified.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

/**
 * SMS Result interface
 */
export interface SMSResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: any;
  provider?: string;
}

/**
 * Send SMS directly through backend
 *
 * ✅ SECURE: Proxies through backend - NO API keys in frontend
 *
 * Backend endpoint: POST /sms/send
 *
 * @param phoneNumber - Recipient phone number (E.164 format recommended)
 * @param message - SMS message content
 * @param providerId - Optional specific provider ID to use
 * @returns SMS result with success status and message ID
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  providerId?: string
): Promise<SMSResult> => {
  try {
    const token = localStorage.getItem('auth_token'); // Get JWT token

    const response = await fetch(`${BACKEND_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        phoneNumber,
        message,
        providerId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'SMS sending failed');
    }

    return await response.json();
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

/**
 * Get SMS campaigns
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /sms/campaigns
 */
export const getSMSCampaigns = async (query: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (query.page) queryParams.append('page', query.page.toString());
    if (query.limit) queryParams.append('limit', query.limit.toString());
    if (query.status) queryParams.append('status', query.status);
    if (query.search) queryParams.append('search', query.search);

    const response = await fetch(
      `${BACKEND_URL}/sms/campaigns?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch SMS campaigns');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SMS campaigns:', error);
    throw error;
  }
};

/**
 * Get SMS campaign by ID
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /sms/campaigns/:id
 */
export const getSMSCampaign = async (id: string) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/campaigns/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Campaign not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SMS campaign:', error);
    throw error;
  }
};

/**
 * Create SMS campaign
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/campaigns
 */
export const createSMSCampaign = async (data: {
  name: string;
  message: string;
  scheduledAt?: Date;
  audienceSegmentId?: string;
  contactIds?: string[];
  templateId?: string;
}) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create campaign');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create SMS campaign:', error);
    throw error;
  }
};

/**
 * Send SMS campaign
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/campaigns/:id/send
 */
export const sendSMSCampaign = async (
  id: string,
  data: {
    testMode?: boolean;
    testPhoneNumber?: string;
  } = {}
) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/campaigns/${id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send campaign');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send SMS campaign:', error);
    throw error;
  }
};

/**
 * Get SMS campaign analytics
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /sms/campaigns/:id/analytics
 */
export const getSMSCampaignAnalytics = async (
  id: string,
  query: {
    startDate?: string;
    endDate?: string;
  } = {}
) => {
  try {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (query.startDate) queryParams.append('startDate', query.startDate);
    if (query.endDate) queryParams.append('endDate', query.endDate);

    const response = await fetch(
      `${BACKEND_URL}/sms/campaigns/${id}/analytics?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SMS campaign analytics:', error);
    throw error;
  }
};

/**
 * Get SMS templates
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /sms/templates
 */
export const getSMSTemplates = async (query: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (query.page) queryParams.append('page', query.page.toString());
    if (query.limit) queryParams.append('limit', query.limit.toString());
    if (query.search) queryParams.append('search', query.search);

    const response = await fetch(
      `${BACKEND_URL}/sms/templates?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SMS templates:', error);
    throw error;
  }
};

/**
 * Get SMS providers for current organization
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /sms/providers
 */
export const getSMSProviders = async () => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/providers`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch providers');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch SMS providers:', error);
    throw error;
  }
};

/**
 * Create SMS provider
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/providers
 */
export const createSMSProvider = async (data: {
  provider: 'africastalking' | 'twilio' | 'termii' | 'nexmo';
  apiKey: string;
  username?: string;
  senderId: string;
  isActive?: boolean;
}) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create provider');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create SMS provider:', error);
    throw error;
  }
};

/**
 * Test SMS provider
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/providers/:id/test
 */
export const testSMSProvider = async (
  id: string,
  testPhoneNumber: string
) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/sms/providers/${id}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ testPhoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Provider test failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to test SMS provider:', error);
    throw error;
  }
};

/**
 * Track SMS activity (clicks, conversions, etc.)
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/track/:campaignId/:contactId/:type
 */
export const trackSMSActivity = async (
  campaignId: string,
  contactId: string,
  type: string,
  metadata?: any
) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/sms/track/${campaignId}/${contactId}/${type}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata || {}),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to track activity');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to track SMS activity:', error);
    throw error;
  }
};

/**
 * Unsubscribe contact from SMS
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /sms/unsubscribe/:contactId
 */
export const unsubscribeContact = async (
  contactId: string,
  campaignId?: string
) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/sms/unsubscribe/${contactId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unsubscribe');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to unsubscribe contact:', error);
    throw error;
  }
};

/**
 * ⚠️ DEPRECATED: Legacy exports for backward compatibility
 * These should be removed in next major version
 */
export default {
  sendSMS,
  campaigns: {
    list: getSMSCampaigns,
    get: getSMSCampaign,
    create: createSMSCampaign,
    send: sendSMSCampaign,
    analytics: getSMSCampaignAnalytics,
  },
  templates: {
    list: getSMSTemplates,
  },
  providers: {
    list: getSMSProviders,
    create: createSMSProvider,
    test: testSMSProvider,
  },
  tracking: {
    track: trackSMSActivity,
    unsubscribe: unsubscribeContact,
  },
};
