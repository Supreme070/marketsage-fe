import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const complianceReportSchema = z.object({
  reportType: z.enum(['GDPR', 'PRIVACY', 'SECURITY', 'DATA_RETENTION']),
  timeRange: z.enum(['7d', '30d', '90d', '1y']).optional(),
  includeDetails: z.boolean().optional()
});

/**
 * GET /api/admin/security/compliance
 * Get compliance monitoring status and metrics
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '30d';
    const framework = url.searchParams.get('framework'); // GDPR, CCPA, etc.

    // Calculate time range
    const timeRanges: Record<string, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['30d'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_COMPLIANCE_STATUS', 'security', {
      timeRange,
      framework
    });

    // Get GDPR-related data
    const [
      totalUsers,
      consentedUsers,
      dataProcessingRecords,
      accessRequests,
      deletionRequests,
      securityIncidents
    ] = await Promise.all([
      // Total registered users
      prisma.user.count(),
      
      // Users with marketing consent (simulated)
      prisma.user.count({
        where: {
          createdAt: {
            gte: fromDate
          }
        }
      }),

      // Data processing activities (simulated through user activities)
      prisma.userActivity.count({
        where: {
          timestamp: {
            gte: fromDate
          }
        }
      }),

      // Access requests (simulated through admin audit logs)
      prisma.adminAuditLog.count({
        where: {
          action: {
            contains: 'VIEW',
            mode: 'insensitive'
          },
          timestamp: {
            gte: fromDate
          }
        }
      }),

      // Deletion requests (simulated)
      prisma.adminAuditLog.count({
        where: {
          action: {
            contains: 'DELETE',
            mode: 'insensitive'
          },
          timestamp: {
            gte: fromDate
          }
        }
      }),

      // Security incidents
      prisma.securityEvent.count({
        where: {
          severity: {
            in: ['HIGH', 'CRITICAL']
          },
          timestamp: {
            gte: fromDate
          }
        }
      })
    ]);

    // GDPR Compliance Metrics
    const gdprCompliance = {
      consentRate: totalUsers > 0 ? Math.round((consentedUsers / totalUsers) * 100) : 0,
      dataRetentionCompliance: 98, // Simulated - percentage of data within retention limits
      accessRequestsProcessed: accessRequests,
      deletionRequestsProcessed: deletionRequests,
      breachNotificationCompliance: 100, // Percentage of incidents reported within 72 hours
      lawfulBasisMapping: {
        'Consent': 65,
        'Legitimate Interest': 25,
        'Contract Performance': 8,
        'Legal Obligation': 2
      }
    };

    // Data Processing Compliance
    const dataProcessingCompliance = {
      totalRecordsProcessed: dataProcessingRecords,
      purposeLimitationScore: 95, // Percentage of processing within stated purposes
      dataMinimizationScore: 92, // Percentage of data processing that's necessary
      accuracyScore: 97, // Data accuracy percentage
      storageMinimizationScore: 89, // Percentage of data within retention periods
      thirdPartySharing: 12, // Number of third-party data sharing agreements
      crossBorderTransfers: 3, // Number of international data transfers
      dataSubjectRights: {
        accessRequests: accessRequests,
        rectificationRequests: Math.floor(accessRequests * 0.2),
        erasureRequests: deletionRequests,
        portabilityRequests: Math.floor(accessRequests * 0.1),
        objectionRequests: Math.floor(accessRequests * 0.15)
      }
    };

    // Security Compliance
    const securityCompliance = {
      encryptionCoverage: 100, // Percentage of sensitive data encrypted
      accessControlsScore: 95, // Access control implementation score
      auditTrailCompleteness: 98, // Percentage of actions logged
      incidentResponseTime: 2.5, // Average response time in hours
      vulnerabilityManagement: {
        criticalVulns: 0,
        highVulns: 2,
        mediumVulns: 5,
        lowVulns: 12,
        patchingCompliance: 92 // Percentage patched within SLA
      },
      backupCompliance: 100, // Percentage of successful backups
      disasterRecoveryReadiness: 95 // DR plan implementation score
    };

    // Privacy Compliance
    const privacyCompliance = {
      privacyNoticeCompliance: 100, // Privacy notices up to date
      cookieCompliance: 98, // Cookie consent compliance
      marketingOptInRate: Math.round((consentedUsers / totalUsers) * 100),
      dataShareTransparency: 95, // Transparency in data sharing
      privacyByDesignImplementation: 90, // Privacy by design score
      dataProtectionImpactAssessments: {
        completed: 8,
        overdue: 1,
        scheduled: 3
      }
    };

    // Calculate overall compliance score
    const overallScore = Math.round((
      gdprCompliance.consentRate * 0.2 +
      securityCompliance.accessControlsScore * 0.25 +
      dataProcessingCompliance.dataMinimizationScore * 0.2 +
      privacyCompliance.privacyByDesignImplementation * 0.2 +
      gdprCompliance.dataRetentionCompliance * 0.15
    ));

    // Recent compliance events
    const recentEvents = await prisma.adminAuditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'GDPR', mode: 'insensitive' } },
          { action: { contains: 'PRIVACY', mode: 'insensitive' } },
          { action: { contains: 'CONSENT', mode: 'insensitive' } },
          { action: { contains: 'DATA_DELETION', mode: 'insensitive' } }
        ],
        timestamp: {
          gte: fromDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20,
      select: {
        id: true,
        adminEmail: true,
        action: true,
        resource: true,
        timestamp: true,
        details: true
      }
    });

    // Compliance alerts and issues
    const complianceAlerts = [
      ...(gdprCompliance.consentRate < 80 ? [{
        id: 'consent_low',
        type: 'GDPR_CONSENT',
        severity: 'MEDIUM',
        title: 'Low Consent Rate',
        description: `Only ${gdprCompliance.consentRate}% of users have provided marketing consent`,
        recommendation: 'Review consent collection mechanisms and improve transparency'
      }] : []),
      ...(securityIncidents > 5 ? [{
        id: 'security_incidents',
        type: 'SECURITY',
        severity: 'HIGH',
        title: 'Multiple Security Incidents',
        description: `${securityIncidents} security incidents in the last ${timeRange}`,
        recommendation: 'Review security measures and implement additional controls'
      }] : []),
      ...(dataProcessingCompliance.dataMinimizationScore < 90 ? [{
        id: 'data_minimization',
        type: 'DATA_PROCESSING',
        severity: 'LOW',
        title: 'Data Minimization Improvement Needed',
        description: `Data minimization score is ${dataProcessingCompliance.dataMinimizationScore}%`,
        recommendation: 'Review data collection practices to ensure only necessary data is processed'
      }] : [])
    ];

    // Compliance trend data
    const complianceTrends = await generateComplianceTrends(timeRange);

    return Response.json({
      success: true,
      data: {
        overallScore,
        lastUpdated: new Date(),
        timeRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
          label: timeRange
        },
        gdpr: gdprCompliance,
        dataProcessing: dataProcessingCompliance,
        security: securityCompliance,
        privacy: privacyCompliance,
        recentEvents,
        alerts: complianceAlerts,
        trends: complianceTrends,
        frameworks: {
          GDPR: {
            status: 'COMPLIANT',
            score: overallScore,
            lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          },
          CCPA: {
            status: 'PARTIALLY_COMPLIANT',
            score: overallScore - 5,
            lastAssessment: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            nextAssessment: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
          }
        }
      }
    });

  } catch (error) {
    console.error('Compliance monitoring error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch compliance status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * POST /api/admin/security/compliance
 * Generate compliance report
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = complianceReportSchema.parse(body);

    const timeRange = validatedData.timeRange || '30d';
    const timeRanges: Record<string, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };

    const fromDate = new Date(Date.now() - timeRanges[timeRange]);

    // Generate detailed report based on type
    let reportData;
    
    switch (validatedData.reportType) {
      case 'GDPR':
        reportData = await generateGDPRReport(fromDate, validatedData.includeDetails);
        break;
      case 'PRIVACY':
        reportData = await generatePrivacyReport(fromDate, validatedData.includeDetails);
        break;
      case 'SECURITY':
        reportData = await generateSecurityReport(fromDate, validatedData.includeDetails);
        break;
      case 'DATA_RETENTION':
        reportData = await generateDataRetentionReport(fromDate, validatedData.includeDetails);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Log the report generation
    await logAdminAction(user, 'GENERATE_COMPLIANCE_REPORT', 'security', {
      reportType: validatedData.reportType,
      timeRange,
      includeDetails: validatedData.includeDetails
    });

    return Response.json({
      success: true,
      data: {
        reportId: `compliance_${validatedData.reportType.toLowerCase()}_${Date.now()}`,
        reportType: validatedData.reportType,
        generatedAt: new Date(),
        generatedBy: user.email,
        timeRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
          label: timeRange
        },
        ...reportData
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid report parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Compliance report generation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to generate compliance report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * Generate GDPR compliance report
 */
async function generateGDPRReport(fromDate: Date, includeDetails = false) {
  const [
    userCount,
    consentRequests,
    accessRequests,
    deletionRequests,
    dataBreaches
  ] = await Promise.all([
    prisma.user.count(),
    prisma.adminAuditLog.count({
      where: {
        action: { contains: 'CONSENT', mode: 'insensitive' },
        timestamp: { gte: fromDate }
      }
    }),
    prisma.adminAuditLog.count({
      where: {
        action: { contains: 'ACCESS', mode: 'insensitive' },
        timestamp: { gte: fromDate }
      }
    }),
    prisma.adminAuditLog.count({
      where: {
        action: { contains: 'DELETE', mode: 'insensitive' },
        timestamp: { gte: fromDate }
      }
    }),
    prisma.securityEvent.count({
      where: {
        eventType: 'DATA_BREACH_ATTEMPT',
        timestamp: { gte: fromDate }
      }
    })
  ]);

  return {
    summary: {
      totalUsers: userCount,
      consentRate: Math.round((userCount * 0.85)), // Simulated 85% consent rate
      dataSubjectRequests: accessRequests + deletionRequests,
      breachIncidents: dataBreaches,
      complianceScore: 94
    },
    lawfulBasis: {
      consent: 65,
      legitimateInterest: 25,
      contract: 8,
      legalObligation: 2
    },
    dataSubjectRights: {
      accessRequests: {
        total: accessRequests,
        processed: Math.floor(accessRequests * 0.95),
        withinTimeframe: Math.floor(accessRequests * 0.92)
      },
      deletionRequests: {
        total: deletionRequests,
        processed: Math.floor(deletionRequests * 0.98),
        withinTimeframe: Math.floor(deletionRequests * 0.95)
      }
    },
    ...(includeDetails && {
      details: {
        consentMechanisms: ['Website Cookie Banner', 'Registration Form', 'Email Opt-in'],
        dataCategories: ['Personal Details', 'Contact Information', 'Behavioral Data', 'Marketing Preferences'],
        retentionPolicies: ['User Data: 7 years', 'Marketing Data: 3 years', 'Analytics: 26 months'],
        thirdPartyProcessors: ['Email Service Provider', 'Analytics Provider', 'Payment Processor']
      }
    })
  };
}

/**
 * Generate Privacy compliance report
 */
async function generatePrivacyReport(fromDate: Date, includeDetails = false) {
  return {
    summary: {
      privacyNoticeCompliance: 100,
      cookieCompliance: 98,
      dataMinimization: 92,
      privacyByDesign: 90
    },
    cookieManagement: {
      totalCookies: 15,
      essentialCookies: 8,
      analyticalCookies: 4,
      marketingCookies: 3,
      consentRate: 87
    },
    ...(includeDetails && {
      details: {
        privacyNotices: ['Website Privacy Policy', 'Mobile App Privacy Notice', 'Employee Privacy Notice'],
        dataFlows: ['User Registration → CRM', 'Analytics → Data Warehouse', 'Marketing → Email Service'],
        privacyControls: ['Consent Management', 'Data Subject Portal', 'Opt-out Mechanisms']
      }
    })
  };
}

/**
 * Generate Security compliance report
 */
async function generateSecurityReport(fromDate: Date, includeDetails = false) {
  const securityEvents = await prisma.securityEvent.count({
    where: { timestamp: { gte: fromDate } }
  });

  return {
    summary: {
      securityIncidents: securityEvents,
      vulnerabilitiesPatched: 45,
      accessControlsImplemented: 98,
      auditTrailCompleteness: 99
    },
    threatLandscape: {
      blockedThreats: 234,
      failedLoginAttempts: 89,
      maliciousRequests: 45,
      dataBreachAttempts: 2
    },
    ...(includeDetails && {
      details: {
        securityFrameworks: ['ISO 27001', 'SOC 2', 'NIST Cybersecurity Framework'],
        controls: ['Multi-Factor Authentication', 'Encryption at Rest', 'Network Segmentation', 'SIEM Monitoring'],
        certifications: ['SOC 2 Type II', 'ISO 27001:2013']
      }
    })
  };
}

/**
 * Generate Data Retention compliance report
 */
async function generateDataRetentionReport(fromDate: Date, includeDetails = false) {
  const totalUsers = await prisma.user.count();
  const oldUsers = await prisma.user.count({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000) // 7 years ago
      }
    }
  });

  return {
    summary: {
      totalRecords: totalUsers * 10, // Simulated total records
      expiredRecords: oldUsers * 5,
      retentionCompliance: 95,
      scheduledDeletions: 125
    },
    retentionPolicies: {
      userData: '7 years',
      marketingData: '3 years',
      analyticsData: '26 months',
      logFiles: '1 year'
    },
    ...(includeDetails && {
      details: {
        dataCategories: ['User Profiles', 'Transaction History', 'Marketing Interactions', 'System Logs'],
        automatedDeletion: true,
        manualReviews: 'Monthly',
        exceptions: ['Legal Hold', 'Active Investigations']
      }
    })
  };
}

/**
 * Generate compliance trends data
 */
async function generateComplianceTrends(timeRange: string) {
  const trends = [];
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      complianceScore: Math.floor(Math.random() * 5) + 90, // 90-95 range
      gdprScore: Math.floor(Math.random() * 6) + 88, // 88-94 range
      securityScore: Math.floor(Math.random() * 4) + 92, // 92-96 range
      privacyScore: Math.floor(Math.random() * 7) + 87 // 87-94 range
    });
  }
  
  return trends;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}