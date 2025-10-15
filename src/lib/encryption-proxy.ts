/**
 * Encryption Frontend Proxy
 * =========================
 *
 * SECURITY: This file proxies all encryption operations through the backend.
 * NO encryption keys are exposed in the frontend.
 *
 * Backend API: http://localhost:3006/encryption
 *
 * Migration Date: October 11, 2025
 *
 * ⚠️ IMPORTANT: The old encryption files with hardcoded master keys
 * should be DELETED after this migration is verified.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

// ==================== FIELD-LEVEL ENCRYPTION ====================

/**
 * Encrypt a single field value
 *
 * ✅ SECURE: Proxies through backend - NO keys in frontend
 * Backend endpoint: POST /encryption/field/encrypt
 */
export const encryptField = async (text: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/field/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Field encryption failed');
    }

    const data = await response.json();
    return data.encrypted;
  } catch (error) {
    console.error('Field encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt a single field value
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/field/decrypt
 */
export const decryptField = async (encryptedText: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/field/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ encryptedText }),
    });

    if (!response.ok) {
      throw new Error('Field decryption failed');
    }

    const data = await response.json();
    return data.decrypted;
  } catch (error) {
    console.error('Field decryption error:', error);
    throw error;
  }
};

// ==================== ENTERPRISE ENCRYPTION ====================

/**
 * Advanced encryption with key rotation support
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/advanced/encrypt
 */
export const encryptAdvanced = async (
  plaintext: string,
  context?: Record<string, string>
): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/advanced/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ plaintext, context }),
    });

    if (!response.ok) {
      throw new Error('Advanced encryption failed');
    }

    const data = await response.json();
    return data.encrypted;
  } catch (error) {
    console.error('Advanced encryption error:', error);
    throw error;
  }
};

/**
 * Advanced decryption
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/advanced/decrypt
 */
export const decryptAdvanced = async (
  encryptedPayload: string,
  context?: Record<string, string>
): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/advanced/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ encryptedPayload, context }),
    });

    if (!response.ok) {
      throw new Error('Advanced decryption failed');
    }

    const data = await response.json();
    return data.decrypted;
  } catch (error) {
    console.error('Advanced decryption error:', error);
    throw error;
  }
};

// ==================== PII DATA ENCRYPTION ====================

/**
 * Encrypt object's PII fields (field-level)
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/pii/encrypt
 */
export const encryptPIIFields = async (data: any): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/pii/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('PII encryption failed');
    }

    const result = await response.json();
    return result.encrypted;
  } catch (error) {
    console.error('PII encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt object's PII fields (field-level)
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/pii/decrypt
 */
export const decryptPIIFields = async (data: any): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/pii/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('PII decryption failed');
    }

    const result = await response.json();
    return result.decrypted;
  } catch (error) {
    console.error('PII decryption error:', error);
    throw error;
  }
};

/**
 * Encrypt customer data (enterprise-level)
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/customer/encrypt
 */
export const encryptCustomerData = async (customerData: any): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/customer/encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data: customerData }),
    });

    if (!response.ok) {
      throw new Error('Customer data encryption failed');
    }

    const result = await response.json();
    return result.encrypted;
  } catch (error) {
    console.error('Customer data encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt customer data (enterprise-level)
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/customer/decrypt
 */
export const decryptCustomerData = async (encryptedData: any): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/customer/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data: encryptedData }),
    });

    if (!response.ok) {
      throw new Error('Customer data decryption failed');
    }

    const result = await response.json();
    return result.decrypted;
  } catch (error) {
    console.error('Customer data decryption error:', error);
    throw error;
  }
};

// ==================== SEARCH & INTEGRITY ====================

/**
 * Hash field for secure searching
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/hash-for-search
 */
export const hashForSearch = async (text: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/hash-for-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Hash generation failed');
    }

    const data = await response.json();
    return data.hash;
  } catch (error) {
    console.error('Hash generation error:', error);
    throw error;
  }
};

/**
 * Generate integrity proof for data
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/integrity/generate
 */
export const generateIntegrityProof = async (data: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/integrity/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('Integrity proof generation failed');
    }

    const result = await response.json();
    return result.proof;
  } catch (error) {
    console.error('Integrity proof generation error:', error);
    throw error;
  }
};

/**
 * Verify data integrity
 *
 * ✅ SECURE: Proxies through backend
 * Backend endpoint: POST /encryption/integrity/verify
 */
export const verifyIntegrity = async (data: string, proof: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/encryption/integrity/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ data, proof }),
    });

    if (!response.ok) {
      throw new Error('Integrity verification failed');
    }

    const result = await response.json();
    return result.isValid;
  } catch (error) {
    console.error('Integrity verification error:', error);
    throw error;
  }
};

// ==================== CONVENIENCE FUNCTIONS ====================

export const encryptEmail = async (email: string): Promise<string> => {
  return encryptField(email);
};

export const decryptEmail = async (encryptedEmail: string): Promise<string> => {
  return decryptField(encryptedEmail);
};

export const encryptPhone = async (phone: string): Promise<string> => {
  return encryptField(phone);
};

export const decryptPhone = async (encryptedPhone: string): Promise<string> => {
  return decryptField(encryptedPhone);
};

export const hashEmailForSearch = async (email: string): Promise<string> => {
  return hashForSearch(email);
};

/**
 * ⚠️ DEPRECATED: Legacy exports for backward compatibility
 * These should be removed in next major version
 */
export default {
  field: {
    encrypt: encryptField,
    decrypt: decryptField,
  },
  advanced: {
    encrypt: encryptAdvanced,
    decrypt: decryptAdvanced,
  },
  pii: {
    encrypt: encryptPIIFields,
    decrypt: decryptPIIFields,
  },
  customer: {
    encrypt: encryptCustomerData,
    decrypt: decryptCustomerData,
  },
  search: {
    hash: hashForSearch,
  },
  integrity: {
    generate: generateIntegrityProof,
    verify: verifyIntegrity,
  },
  helpers: {
    encryptEmail,
    decryptEmail,
    encryptPhone,
    decryptPhone,
    hashEmailForSearch,
  },
};
