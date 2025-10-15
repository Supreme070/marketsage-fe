/**
 * Paystack Frontend Proxy
 * =======================
 *
 * SECURITY: This file proxies all Paystack operations through the backend.
 * NO secret keys are exposed in the frontend.
 *
 * Backend API: http://localhost:3006/payments
 *
 * Migration Date: October 11, 2025
 *
 * ⚠️ IMPORTANT: The old paystack.ts file with hardcoded secret keys
 * should be DELETED after this migration is verified.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

// ✅ Public key is SAFE to keep in frontend (used by Paystack.js SDK)
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
                                   process.env.PAYSTACK_PUBLIC_KEY ||
                                   'pk_test_e4503e5c8cb178e928507653093bec0be389422e';

/**
 * Helper function to format amount for Paystack (convert to kobo)
 */
export const formatAmount = (amount: number) => Math.round(amount * 100);

/**
 * Helper function to format amount from Paystack (convert from kobo to naira)
 */
export const formatAmountFromKobo = (amount: number) => amount / 100;

/**
 * Initialize a payment transaction
 *
 * ✅ SECURE: Proxies through backend - NO secret keys in frontend
 *
 * Backend endpoint: POST /payments/initialize
 */
export const initializeTransaction = async ({
  email,
  amount,
  reference,
  metadata = {},
  callback_url
}: {
  email: string;
  amount: number;
  reference?: string;
  metadata?: any;
  callback_url?: string;
}) => {
  try {
    const token = localStorage.getItem('auth_token'); // Get JWT token

    const response = await fetch(`${BACKEND_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        email,
        amount: formatAmount(amount), // Convert to kobo
        reference,
        metadata,
        callback_url: callback_url || process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL || '/dashboard/billing/success',
        currency: 'NGN',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment initialization failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Paystack transaction initialization failed:', error);
    throw error;
  }
};

/**
 * Verify a payment transaction
 *
 * ✅ SECURE: Proxies through backend - NO secret keys in frontend
 *
 * Backend endpoint: GET /payments/verify/:reference
 */
export const verifyTransaction = async (reference: string) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/payments/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Paystack transaction verification failed:', error);
    throw error;
  }
};

/**
 * List transactions for current organization
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /payments/transactions
 */
export const listTransactions = async (params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(
      `${BACKEND_URL}/payments/transactions?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to list transactions:', error);
    throw error;
  }
};

/**
 * Create a Paystack customer
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: POST /payments/customers
 */
export const createCustomer = async ({
  email,
  first_name,
  last_name,
  phone,
  metadata = {}
}: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: any;
}) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BACKEND_URL}/payments/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        email,
        first_name,
        last_name,
        phone,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
};

/**
 * Get customer details
 *
 * ✅ SECURE: Proxies through backend
 *
 * Backend endpoint: GET /payments/customers/:emailOrCode
 */
export const getCustomer = async (emailOrCode: string) => {
  try {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(
      `${BACKEND_URL}/payments/customers/${encodeURIComponent(emailOrCode)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Customer not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get customer:', error);
    throw error;
  }
};

/**
 * Health check for Paystack backend integration
 *
 * Backend endpoint: GET /payments/health
 */
export const paystackHealthCheck = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/payments/health`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('Paystack health check failed:', error);
    return { success: false, message: 'Failed to connect to backend' };
  }
};

/**
 * ⚠️ DEPRECATED: Legacy function signatures for backward compatibility
 * These should be removed in next major version
 */
export default {
  transaction: {
    initialize: initializeTransaction,
    verify: verifyTransaction,
    list: listTransactions,
  },
  customer: {
    create: createCustomer,
    get: getCustomer,
  },
  health: paystackHealthCheck,
};
