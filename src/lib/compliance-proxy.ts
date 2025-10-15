/**
 * Compliance Services Proxy
 * =========================
 * ALL compliance operations now go through the backend API
 * NO business logic in frontend - security-first approach
 *
 * Migration Date: October 11, 2025
 * Backend Implementation: /Users/supreme/Desktop/marketsage-backend/src/compliance/
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

export interface ComplianceCheckOptions {
  organizationId: string;
  type?: 'data_protection' | 'financial_services' | 'telecommunications' | 'consumer_protection' | 'anti_money_laundering';
  includeRecommendations?: boolean;
}

export interface ComplianceScanOptions {
  organizationId: string;
  frequency?: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  autoRemediate?: boolean;
}

export interface AfricanRegulationsQuery {
  country: 'NG' | 'KE' | 'ZA' | 'GH' | 'EG';
  category?: 'data_protection' | 'financial_services' | 'telecommunications' | 'consumer_protection';
}

export interface GDPRAccessRequest {
  email: string;
  organizationId: string;
}

export interface GDPRErasureRequest {
  email: string;
  organizationId: string;
  reason: string;
}

export interface GDPRPortabilityRequest {
  email: string;
  organizationId: string;
  format?: 'json' | 'csv' | 'xml';
}

export interface GDPRConsentRecord {
  email: string;
  organizationId: string;
  purpose: string;
  consentGiven: boolean;
  granularity: Record<string, boolean>;
  ipAddress: string;
  userAgent: string;
  method: 'website' | 'email' | 'phone' | 'paper';
}

/**
 * ========================================
 * AFRICAN REGULATIONS
 * ========================================
 */

export const getAfricanRegulations = async (
  country: string,
  token: string,
  category?: string,
): Promise<any> => {
  const url = new URL(`${BACKEND_URL}/admin/compliance/african/${country}`);
  if (category) url.searchParams.append('category', category);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch African regulations: ${response.statusText}`);
  }

  return await response.json();
};

export const initializeAfricanComplianceRules = async (
  token: string,
  forceUpdate?: boolean,
  specificCountry?: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/african/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ forceUpdate, specificCountry }),
  });

  if (!response.ok) {
    throw new Error(`Failed to initialize African compliance rules: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * ========================================
 * AUTONOMOUS COMPLIANCE MONITORING
 * ========================================
 */

export const runComplianceScan = async (
  options: ComplianceScanOptions,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/scan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`Failed to run compliance scan: ${response.statusText}`);
  }

  return await response.json();
};

export const getComplianceViolations = async (
  organizationId: string,
  token: string,
  status?: string,
  severity?: string,
  includeResolved?: boolean,
): Promise<any> => {
  const url = new URL(`${BACKEND_URL}/admin/compliance/violations/${organizationId}`);
  url.searchParams.append('organizationId', organizationId);
  if (status) url.searchParams.append('status', status);
  if (severity) url.searchParams.append('severity', severity);
  if (includeResolved !== undefined) url.searchParams.append('includeResolved', String(includeResolved));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance violations: ${response.statusText}`);
  }

  return await response.json();
};

export const getComplianceScore = async (
  organizationId: string,
  token: string,
  framework?: string,
): Promise<any> => {
  const url = new URL(`${BACKEND_URL}/admin/compliance/score/${organizationId}`);
  url.searchParams.append('organizationId', organizationId);
  if (framework) url.searchParams.append('framework', framework);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance score: ${response.statusText}`);
  }

  return await response.json();
};

export const getComplianceReport = async (
  organizationId: string,
  token: string,
  frameworkId?: string,
): Promise<any> => {
  const url = new URL(`${BACKEND_URL}/admin/compliance/report/${organizationId}`);
  url.searchParams.append('organizationId', organizationId);
  if (frameworkId) url.searchParams.append('frameworkId', frameworkId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance report: ${response.statusText}`);
  }

  return await response.json();
};

export const performAutonomousRemediation = async (
  violationId: string,
  token: string,
  confirmAutoRemediation?: boolean,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/remediate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ violationId, confirmAutoRemediation }),
  });

  if (!response.ok) {
    throw new Error(`Failed to perform remediation: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * ========================================
 * GDPR COMPLIANCE
 * ========================================
 */

export const processDataSubjectAccessRequest = async (
  request: GDPRAccessRequest,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/gdpr/access-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to process access request: ${response.statusText}`);
  }

  return await response.json();
};

export const processErasureRequest = async (
  request: GDPRErasureRequest,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/gdpr/erasure-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to process erasure request: ${response.statusText}`);
  }

  return await response.json();
};

export const processDataPortabilityRequest = async (
  request: GDPRPortabilityRequest,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/gdpr/portability-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to process portability request: ${response.statusText}`);
  }

  return await response.json();
};

export const recordGDPRConsent = async (
  consent: GDPRConsentRecord,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/gdpr/consent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(consent),
  });

  if (!response.ok) {
    throw new Error(`Failed to record GDPR consent: ${response.statusText}`);
  }

  return await response.json();
};

export const generateGDPRComplianceReport = async (
  organizationId: string,
  token: string,
): Promise<any> => {
  const url = new URL(`${BACKEND_URL}/admin/compliance/gdpr/report/${organizationId}`);
  url.searchParams.append('organizationId', organizationId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate GDPR compliance report: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * ========================================
 * SOC2 COMPLIANCE (existing endpoints)
 * ========================================
 */

export const getComplianceStatus = async (token: string): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance status: ${response.statusText}`);
  }

  return await response.json();
};

export const generateSOC2Report = async (
  startDate: string,
  endDate: string,
  token: string,
  includeDetailedLogs?: boolean,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/reports/soc2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate, includeDetailedLogs }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate SOC2 report: ${response.statusText}`);
  }

  return await response.json();
};

export const generateGDPRReport = async (
  startDate: string,
  endDate: string,
  token: string,
): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/reports/gdpr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate GDPR report: ${response.statusText}`);
  }

  return await response.json();
};

export const exportUserData = async (
  userId: string,
  token: string,
  format: 'json' | 'csv' = 'json',
): Promise<Blob> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/export/user-data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, format }),
  });

  if (!response.ok) {
    throw new Error(`Failed to export user data: ${response.statusText}`);
  }

  return await response.blob();
};

export const exportAuditLogs = async (
  startDate: string,
  endDate: string,
  token: string,
  format: 'json' | 'csv' = 'json',
  logType: 'admin' | 'security' | 'both' = 'both',
): Promise<Blob> => {
  const response = await fetch(`${BACKEND_URL}/admin/compliance/export/audit-logs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate, format, logType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to export audit logs: ${response.statusText}`);
  }

  return await response.blob();
};
