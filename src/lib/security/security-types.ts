/**
 * Security Types and Interfaces for MarketSage Security Center
 */

export interface SecurityThreat {
  id: string;
  type: 'BRUTE_FORCE' | 'DDoS' | 'SQL_INJECTION' | 'XSS' | 'SUSPICIOUS_PATTERN' | 'API_ABUSE' | 'MALWARE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  location?: string;
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
  blocked: boolean;
  riskScore: number;
  description: string;
  patterns: string[];
  userAgent?: string;
}

export interface IPBlocklistEntry {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: Date;
  blockedBy: string; // Admin user ID
  expiresAt?: Date;
  isActive: boolean;
  threatType: string;
  metadata?: Record<string, any>;
}

export interface SecurityStats {
  totalEvents: number;
  totalThreats: number;
  blockedIPs: number;
  failedLogins: number;
  suspiciousActivity: number;
  apiAbuse: number;
  securityScore: number;
  trendData: {
    date: string;
    events: number;
    threats: number;
    blocked: number;
  }[];
}

export interface AccessLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

export interface ComplianceMetrics {
  gdprCompliance: {
    consentRate: number;
    dataRetentionCompliance: number;
    accessRequestsProcessed: number;
    deletionRequestsProcessed: number;
    breachNotificationTime: number; // in hours
  };
  dataProcessing: {
    totalRecordsProcessed: number;
    lawfulBasisMapping: Record<string, number>;
    thirdPartySharing: number;
    dataMinimizationScore: number;
  };
  security: {
    encryptionCoverage: number;
    accessControlsScore: number;
    auditTrailCompleteness: number;
    incidentResponseTime: number; // in hours
  };
}

export interface APIKeyInfo {
  id: string;
  name: string;
  keyPrefix: string; // First 8 chars for identification
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  createdBy: string; // Admin user ID
}