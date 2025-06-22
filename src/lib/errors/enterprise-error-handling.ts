/**
 * Enterprise Error Handling System
 * ================================
 * Enhanced error handling with specific error codes, detailed messaging,
 * and actionable resolutions for enterprise users (banks, fintechs, corporations)
 */

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// Enterprise-specific error categories
export enum EnterpriseErrorCategory {
  DATA_INTEGRATION = "DATA_INTEGRATION",
  AI_INTELLIGENCE = "AI_INTELLIGENCE", 
  PERFORMANCE = "PERFORMANCE",
  COMPLIANCE = "COMPLIANCE",
  SECURITY = "SECURITY",
  MULTI_TENANT = "MULTI_TENANT",
  API_LIMITS = "API_LIMITS",
  CONFIGURATION = "CONFIGURATION"
}

// Detailed enterprise error types
export enum EnterpriseErrorType {
  // Data Integration Errors
  DATA_SOURCE_UNAVAILABLE = "DATA_SOURCE_UNAVAILABLE",
  DATA_QUALITY_ISSUE = "DATA_QUALITY_ISSUE",
  DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED",
  API_INTEGRATION_ERROR = "API_INTEGRATION_ERROR",
  
  // AI Intelligence Errors
  AI_MODEL_UNAVAILABLE = "AI_MODEL_UNAVAILABLE",
  PREDICTION_FAILED = "PREDICTION_FAILED",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
  MODEL_ACCURACY_DEGRADED = "MODEL_ACCURACY_DEGRADED",
  
  // Performance Errors
  API_TIMEOUT = "API_TIMEOUT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  CONCURRENT_LIMIT_REACHED = "CONCURRENT_LIMIT_REACHED",
  
  // Compliance Errors
  GDPR_VIOLATION_DETECTED = "GDPR_VIOLATION_DETECTED",
  DATA_RETENTION_VIOLATION = "DATA_RETENTION_VIOLATION",
  AUDIT_LOG_CORRUPTION = "AUDIT_LOG_CORRUPTION",
  REGULATORY_CONSTRAINT_VIOLATION = "REGULATORY_CONSTRAINT_VIOLATION",
  
  // Security Errors
  UNAUTHORIZED_TENANT_ACCESS = "UNAUTHORIZED_TENANT_ACCESS",
  ENCRYPTION_KEY_ROTATION_FAILED = "ENCRYPTION_KEY_ROTATION_FAILED",
  SUSPICIOUS_ACTIVITY_DETECTED = "SUSPICIOUS_ACTIVITY_DETECTED",
  SECURITY_POLICY_VIOLATION = "SECURITY_POLICY_VIOLATION",
  
  // Multi-tenant Errors
  TENANT_ISOLATION_BREACH = "TENANT_ISOLATION_BREACH",
  TENANT_QUOTA_EXCEEDED = "TENANT_QUOTA_EXCEEDED",
  CROSS_TENANT_DATA_LEAK = "CROSS_TENANT_DATA_LEAK",
  TENANT_CONFIGURATION_ERROR = "TENANT_CONFIGURATION_ERROR",
  
  // Configuration Errors
  FEATURE_FLAG_MISCONFIGURATION = "FEATURE_FLAG_MISCONFIGURATION",
  ENVIRONMENT_MISMATCH = "ENVIRONMENT_MISMATCH",
  LICENSE_VALIDATION_FAILED = "LICENSE_VALIDATION_FAILED",
  
  // Performance Errors (continued)
  PERFORMANCE_DEGRADATION = "PERFORMANCE_DEGRADATION"
}

export interface EnterpriseErrorDetails {
  errorCode: string;
  category: EnterpriseErrorCategory;
  type: EnterpriseErrorType;
  message: string;
  userMessage: string;
  technicalDetails: string;
  actionableSteps: string[];
  escalationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedServices: string[];
  estimatedResolution: string;
  supportTicketPriority: 'P1' | 'P2' | 'P3' | 'P4';
  complianceImpact: boolean;
  tenantId?: string;
  userId?: string;
  timestamp: string;
  correlationId: string;
  context: Record<string, any>;
}

class EnterpriseErrorHandler {
  private static instance: EnterpriseErrorHandler;
  
  private errorDefinitions = new Map<EnterpriseErrorType, Partial<EnterpriseErrorDetails>>([
    [EnterpriseErrorType.DATA_SOURCE_UNAVAILABLE, {
      category: EnterpriseErrorCategory.DATA_INTEGRATION,
      userMessage: "One or more data sources are currently unavailable, affecting real-time insights.",
      technicalDetails: "Failed to establish connection to primary data source. Using cached data where available.",
      actionableSteps: [
        "1. Check data source connectivity status in System Health dashboard",
        "2. Verify API credentials and network connectivity",
        "3. Review recent configuration changes",
        "4. Contact Technical Support if issue persists beyond 15 minutes"
      ],
      escalationLevel: 'HIGH',
      affectedServices: ['AI Intelligence', 'Real-time Analytics', 'Performance Monitoring'],
      estimatedResolution: "5-15 minutes",
      supportTicketPriority: 'P2',
      complianceImpact: false
    }],
    
    [EnterpriseErrorType.AI_MODEL_UNAVAILABLE, {
      category: EnterpriseErrorCategory.AI_INTELLIGENCE,
      userMessage: "AI prediction models are temporarily unavailable. Using statistical fallbacks.",
      technicalDetails: "Primary ML models failed to load. Fallback statistical models are active.",
      actionableSteps: [
        "1. AI predictions will continue with reduced accuracy (70% vs 94%)",
        "2. Historical data analysis remains fully functional",
        "3. Models typically auto-recover within 10 minutes",
        "4. Contact AI Engineering team if accuracy remains degraded after 30 minutes"
      ],
      escalationLevel: 'MEDIUM',
      affectedServices: ['Predictive Analytics', 'Customer Intelligence', 'Market Analysis'],
      estimatedResolution: "10-30 minutes",
      supportTicketPriority: 'P3',
      complianceImpact: false
    }],
    
    [EnterpriseErrorType.RATE_LIMIT_EXCEEDED, {
      category: EnterpriseErrorCategory.PERFORMANCE,
      userMessage: "Your current usage has exceeded enterprise rate limits. Some features may be temporarily restricted.",
      technicalDetails: "API rate limit exceeded for current time window. Enterprise tier allows 10,000 requests/minute.",
      actionableSteps: [
        "1. Current usage will reset in 60 seconds",
        "2. Consider implementing request batching for high-volume operations",
        "3. Review API usage patterns in Performance Monitoring dashboard",
        "4. Contact Account Manager to discuss rate limit increases if needed regularly"
      ],
      escalationLevel: 'LOW',
      affectedServices: ['API Integrations', 'Real-time Processing'],
      estimatedResolution: "1-2 minutes",
      supportTicketPriority: 'P4',
      complianceImpact: false
    }],
    
    [EnterpriseErrorType.GDPR_VIOLATION_DETECTED, {
      category: EnterpriseErrorCategory.COMPLIANCE,
      userMessage: "A potential GDPR compliance issue has been detected and automatically blocked.",
      technicalDetails: "Automated compliance scanner detected potential personal data exposure risk.",
      actionableSteps: [
        "1. IMMEDIATE: Data access has been automatically restricted",
        "2. Review data access logs in Compliance Dashboard",
        "3. Verify data processing purposes align with consent records",
        "4. URGENT: Contact Compliance Officer within 30 minutes"
      ],
      escalationLevel: 'CRITICAL',
      affectedServices: ['Data Processing', 'Customer Data Access', 'Reporting'],
      estimatedResolution: "Requires manual review",
      supportTicketPriority: 'P1',
      complianceImpact: true
    }],
    
    [EnterpriseErrorType.TENANT_ISOLATION_BREACH, {
      category: EnterpriseErrorCategory.MULTI_TENANT,
      userMessage: "A tenant isolation issue has been detected and resolved. No data was compromised.",
      technicalDetails: "Cross-tenant data access attempt was blocked by security systems.",
      actionableSteps: [
        "1. IMMEDIATE: All systems have been automatically secured",
        "2. Security audit has been initiated",
        "3. Review recent user access patterns",
        "4. CRITICAL: Contact Security Team immediately"
      ],
      escalationLevel: 'CRITICAL',
      affectedServices: ['All Tenant Services'],
      estimatedResolution: "Security review required",
      supportTicketPriority: 'P1',
      complianceImpact: true
    }],
    
    [EnterpriseErrorType.PERFORMANCE_DEGRADATION, {
      category: EnterpriseErrorCategory.PERFORMANCE,
      userMessage: "System performance is below SLA thresholds. Engineering team has been automatically notified.",
      technicalDetails: "Response times exceeded 5-second SLA threshold. Auto-scaling initiated.",
      actionableSteps: [
        "1. Current requests may experience 10-15 second delays",
        "2. Non-critical operations have been temporarily throttled",
        "3. Real-time monitoring is tracking recovery progress",
        "4. SLA credits will be automatically applied if impact exceeds 10 minutes"
      ],
      escalationLevel: 'HIGH',
      affectedServices: ['Dashboard Loading', 'API Responses', 'Real-time Analytics'],
      estimatedResolution: "5-20 minutes",
      supportTicketPriority: 'P2',
      complianceImpact: false
    }]
  ]);

  static getInstance(): EnterpriseErrorHandler {
    if (!this.instance) {
      this.instance = new EnterpriseErrorHandler();
    }
    return this.instance;
  }

  createEnterpriseError(
    errorType: EnterpriseErrorType,
    context: Record<string, any> = {},
    tenantId?: string,
    userId?: string
  ): EnterpriseErrorDetails {
    const baseError = this.errorDefinitions.get(errorType);
    const correlationId = this.generateCorrelationId();

    const enterpriseError: EnterpriseErrorDetails = {
      errorCode: `ENT-${errorType}-${Date.now().toString().slice(-6)}`,
      category: baseError?.category || EnterpriseErrorCategory.CONFIGURATION,
      type: errorType,
      message: baseError?.technicalDetails || `Enterprise error: ${errorType}`,
      userMessage: baseError?.userMessage || "An enterprise system error has occurred.",
      technicalDetails: baseError?.technicalDetails || "Technical details not available.",
      actionableSteps: baseError?.actionableSteps || ["Contact Enterprise Support"],
      escalationLevel: baseError?.escalationLevel || 'MEDIUM',
      affectedServices: baseError?.affectedServices || ['Unknown'],
      estimatedResolution: baseError?.estimatedResolution || "Unknown",
      supportTicketPriority: baseError?.supportTicketPriority || 'P3',
      complianceImpact: baseError?.complianceImpact || false,
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      correlationId,
      context
    };

    // Log enterprise error with enhanced details
    this.logEnterpriseError(enterpriseError);

    // Auto-create support ticket for critical errors
    if (enterpriseError.escalationLevel === 'CRITICAL') {
      this.autoCreateSupportTicket(enterpriseError);
    }

    return enterpriseError;
  }

  createErrorResponse(
    errorType: EnterpriseErrorType,
    context: Record<string, any> = {},
    tenantId?: string,
    userId?: string
  ): NextResponse {
    const enterpriseError = this.createEnterpriseError(errorType, context, tenantId, userId);
    
    return NextResponse.json({
      success: false,
      error: {
        code: enterpriseError.errorCode,
        type: enterpriseError.type,
        category: enterpriseError.category,
        message: enterpriseError.userMessage,
        technicalDetails: enterpriseError.technicalDetails,
        actionableSteps: enterpriseError.actionableSteps,
        escalationLevel: enterpriseError.escalationLevel,
        affectedServices: enterpriseError.affectedServices,
        estimatedResolution: enterpriseError.estimatedResolution,
        correlationId: enterpriseError.correlationId,
        supportGuidance: {
          priority: enterpriseError.supportTicketPriority,
          contactInfo: this.getSupportContactInfo(enterpriseError.escalationLevel),
          documentationLinks: this.getRelevantDocumentation(errorType)
        }
      },
      timestamp: enterpriseError.timestamp
    }, { 
      status: this.getHttpStatusForErrorType(errorType),
      headers: {
        'X-Correlation-ID': enterpriseError.correlationId,
        'X-Enterprise-Error-Code': enterpriseError.errorCode
      }
    });
  }

  private logEnterpriseError(error: EnterpriseErrorDetails): void {
    logger.error('Enterprise Error', {
      errorCode: error.errorCode,
      type: error.type,
      category: error.category,
      escalationLevel: error.escalationLevel,
      tenantId: error.tenantId,
      userId: error.userId,
      correlationId: error.correlationId,
      complianceImpact: error.complianceImpact,
      affectedServices: error.affectedServices,
      context: error.context
    });

    // Enhanced logging for compliance-related errors
    if (error.complianceImpact) {
      logger.error('Compliance Impact Error', {
        errorCode: error.errorCode,
        details: error.technicalDetails,
        timestamp: error.timestamp,
        tenantId: error.tenantId,
        complianceImpact: true
      });
    }
  }

  private autoCreateSupportTicket(error: EnterpriseErrorDetails): void {
    // This would integrate with your ticketing system (Zendesk, ServiceNow, etc.)
    logger.info('Auto-creating support ticket for critical error', {
      errorCode: error.errorCode,
      priority: error.supportTicketPriority,
      correlationId: error.correlationId
    });
  }

  private generateCorrelationId(): string {
    return `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHttpStatusForErrorType(errorType: EnterpriseErrorType): number {
    const statusMap: Record<string, number> = {
      [EnterpriseErrorType.DATA_SOURCE_UNAVAILABLE]: 503,
      [EnterpriseErrorType.AI_MODEL_UNAVAILABLE]: 503,
      [EnterpriseErrorType.RATE_LIMIT_EXCEEDED]: 429,
      [EnterpriseErrorType.GDPR_VIOLATION_DETECTED]: 403,
      [EnterpriseErrorType.TENANT_ISOLATION_BREACH]: 403,
      [EnterpriseErrorType.UNAUTHORIZED_TENANT_ACCESS]: 401,
      [EnterpriseErrorType.API_TIMEOUT]: 504,
    };
    return statusMap[errorType] || 500;
  }

  private getSupportContactInfo(escalationLevel: string): object {
    switch (escalationLevel) {
      case 'CRITICAL':
        return {
          phone: '+1-800-ENT-URGENT',
          email: 'critical-support@marketsage.com',
          slackChannel: '#enterprise-critical',
          availabilityHours: '24/7'
        };
      case 'HIGH':
        return {
          phone: '+1-800-ENT-SUPPORT',
          email: 'enterprise-support@marketsage.com',
          slackChannel: '#enterprise-support',
          availabilityHours: '6 AM - 10 PM UTC'
        };
      default:
        return {
          email: 'support@marketsage.com',
          helpDesk: 'https://help.marketsage.com',
          availabilityHours: 'Business hours UTC'
        };
    }
  }

  private getRelevantDocumentation(errorType: EnterpriseErrorType): string[] {
    const docsMap: Record<string, string[]> = {
      [EnterpriseErrorType.DATA_SOURCE_UNAVAILABLE]: [
        'https://docs.marketsage.com/enterprise/data-integration',
        'https://docs.marketsage.com/troubleshooting/connectivity'
      ],
      [EnterpriseErrorType.AI_MODEL_UNAVAILABLE]: [
        'https://docs.marketsage.com/ai/model-management',
        'https://docs.marketsage.com/ai/fallback-strategies'
      ],
      [EnterpriseErrorType.GDPR_VIOLATION_DETECTED]: [
        'https://docs.marketsage.com/compliance/gdpr',
        'https://docs.marketsage.com/security/data-protection'
      ]
    };
    return docsMap[errorType] || ['https://docs.marketsage.com/enterprise'];
  }
}

// Convenience function for creating enterprise errors
export function createEnterpriseError(
  errorType: EnterpriseErrorType,
  context: Record<string, any> = {},
  tenantId?: string,
  userId?: string
): NextResponse {
  return EnterpriseErrorHandler.getInstance().createErrorResponse(
    errorType, 
    context, 
    tenantId, 
    userId
  );
}

export { EnterpriseErrorHandler }; 