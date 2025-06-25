// Initialize Paystack with direct API calls to avoid SDK issues in Docker builds
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_6163652dff5c670d55907f429ea732ef22a98cf9';

// Mock paystack object for build compatibility
const paystack = {
  transaction: {
    initialize: async (params: any) => {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return response.json();
    },
    verify: async (reference: string) => {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      return response.json();
    },
    list: async (params: any) => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`https://api.paystack.co/transaction?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      return response.json();
    }
  },
  misc: {
    listBanks: async () => {
      const response = await fetch('https://api.paystack.co/bank', {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      return response.json();
    }
  },
  subscription: {
    create: async (params: any) => {
      const response = await fetch('https://api.paystack.co/subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return response.json();
    }
  }
};

// Get public key from environment variables
export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_e4503e5c8cb178e928507653093bec0be389422e';

// Helper function to format amount for Paystack (convert to kobo)
export const formatAmount = (amount: number) => Math.round(amount * 100);

// Helper function to format amount from Paystack (convert from kobo to naira)
export const formatAmountFromKobo = (amount: number) => amount / 100;

// Initialize transaction
export const initializeTransaction = async ({
  email,
  amount,
  reference,
  metadata = {},
  callback_url
}: {
  email: string;
  amount: number;
  reference: string;
  metadata?: any;
  callback_url?: string;
}) => {
  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: formatAmount(amount),
      reference,
      metadata: {
        ...metadata,
        cancel_action: process.env.PAYMENT_CANCEL_URL || '/dashboard/billing/cancel',
      },
      callback_url: callback_url || process.env.PAYMENT_SUCCESS_URL || '/dashboard/billing/success',
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      currency: 'NGN'
    });

    return response;
  } catch (error) {
    console.error('Paystack transaction initialization failed:', error);
    throw error;
  }
};

// Verify transaction
export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystack.transaction.verify(reference);
    return response;
  } catch (error) {
    console.error('Paystack transaction verification failed:', error);
    throw error;
  }
};

// List banks
export const listBanks = async () => {
  try {
    const response = await paystack.misc.listBanks();
    return response;
  } catch (error) {
    console.error('Failed to fetch banks:', error);
    throw error;
  }
};

// Create subscription
export const createSubscription = async ({
  customer,
  plan,
  authorization
}: {
  customer: string;
  plan: string;
  authorization: string;
}) => {
  try {
    const response = await paystack.subscription.create({
      customer,
      plan,
      authorization
    });
    return response;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
};

// List transactions
export const listTransactions = async (params: any = {}) => {
  try {
    const response = await paystack.transaction.list(params);
    return response;
  } catch (error) {
    console.error('Failed to list transactions:', error);
    throw error;
  }
};

export default paystack; 