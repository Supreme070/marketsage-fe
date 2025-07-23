/**
 * Enterprise Governance API Endpoint
 * ==================================
 * Comprehensive API for governance policy management, compliance reporting,
 * exemption handling, and audit controls for the MarketSage platform.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { enterpriseGovernanceFramework } from '@/lib/ai/enterprise-governance-framework';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const PolicyCreationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  version: z.string().min(1),
  category: z.enum(['security', 'compliance', 'operational', 'risk', 'data_protection', 'business']),
  scope: z.enum(['global', 'user_group', 'task_type', 'risk_level', 'data_classification']),
  priority: z.number().min(1).max(100),
  active: z.boolean().default(true),
  expirationDate: z.string().datetime().optional(),
  regulations: z.array(z.object({
    name: z.enum(['GDPR', 'SOX', 'HIPAA', 'PCI_DSS', 'ISO_27001', 'CCPA', 'PIPEDA', 'Custom']),
    version: z.string(),
    requirements: z.array(z.string()),
    evidence: z.array(z.string()),
    controls: z.array(z.string())
  })),
  rules: z.array(z.object({
    id: z.string(),
    type: z.enum(['requirement', 'prohibition', 'permission', 'recommendation']),
    condition: z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'regex']),
      value: z.any(),
      logicalOperator: z.enum(['AND', 'OR', 'NOT']).optional(),
      nestedConditions: z.array(z.any()).optional()
    }),
    action: z.object({
      type: z.enum(['block', 'require_approval', 'log_warning', 'notify', 'modify_parameters', 'delay_execution']),
      parameters: z.record(z.any()),
      notifications: z.array(z.object({
        type: z.enum(['email', 'slack', 'webhook', 'dashboard']),
        recipients: z.array(z.string()),
        template: z.string(),
        urgency: z.enum(['low', 'medium', 'high', 'critical'])
      })).optional(),
      escalation: z.object({
        levels: z.array(z.object({
          order: z.number(),
          approvers: z.array(z.string()),
          timeoutMinutes: z.number(),
          required: z.boolean()
        })),
        timeoutMinutes: z.number(),
        autoApprove: z.boolean()
      }).optional()
    }),
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    message: z.string(),
    documentation: z.string(),
    exceptions: z.array(z.string())
  }))
});

const ExemptionSchema = z.object({
  policyId: z.string(),
  ruleId: z.string().optional(),
  userId: z.string(),
  reason: z.string().min(10).max(500),
  expirationDate: z.string().datetime(),
  conditions: z.array(z.string()).optional(),
  maxUsage: z.number().positive().optional()
});

const ComplianceReportSchema = z.object({
  framework: z.enum(['GDPR', 'SOX', 'HIPAA', 'PCI_DSS', 'ISO_27001', 'CCPA', 'PIPEDA']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime()
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'create-policy';

    // Check admin permissions for policy management
    if (['create-policy', 'update-policy', 'grant-exemption'].includes(action) && 
        session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Administrative privileges required' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'create-policy':
        return await handlePolicyCreation(request, session);
        
      case 'update-policy':
        return await handlePolicyUpdate(request, session);
        
      case 'grant-exemption':
        return await handleExemptionGrant(request, session);
        
      case 'evaluate-governance':
        return await handleGovernanceEvaluation(request, session);
        
      case 'generate-report':
        return await handleComplianceReportGeneration(request, session);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Enterprise Governance API error', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'dashboard';
    const policyId = url.searchParams.get('policyId');
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const framework = url.searchParams.get('framework');

    switch (action) {
      case 'dashboard':
        const metrics = enterpriseGovernanceFramework.getGovernanceMetrics();
        const frameworkStatus = enterpriseGovernanceFramework.getFrameworkStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            metrics,
            frameworkStatus,
            capabilities: {
              policyManagement: true,
              complianceReporting: true,
              auditLogging: true,
              exemptionManagement: true,
              realTimeEvaluation: true,
              multiFrameworkSupport: true
            },
            summary: {
              totalPolicies: metrics.policies.total,
              activePolicies: metrics.policies.active,
              complianceScore: metrics.compliance.overallScore,
              recentViolations: metrics.policies.violations,
              systemHealth: metrics.compliance.riskLevel
            }
          }
        });

      case 'policies':
        let policies;
        if (policyId) {
          const policy = await enterpriseGovernanceFramework.getPolicyById(policyId);
          if (!policy) {
            return NextResponse.json(
              { error: 'Policy not found' },
              { status: 404 }
            );
          }
          policies = [policy];
        } else {
          policies = await enterpriseGovernanceFramework.getAllPolicies(true);
        }

        return NextResponse.json({
          success: true,
          data: {
            policies: policies.map(policy => ({
              id: policy.id,
              name: policy.name,
              description: policy.description,
              version: policy.version,
              category: policy.category,
              scope: policy.scope,
              priority: policy.priority,
              active: policy.active,
              effectiveDate: policy.effectiveDate,
              expirationDate: policy.expirationDate,
              regulations: policy.regulations.map(r => r.name),
              rulesCount: policy.rules.length,
              lastReviewed: policy.metadata.lastReviewed,
              nextReview: policy.metadata.nextReview
            })),
            totalPolicies: policies.length
          }
        });

      case 'compliance-frameworks':
        const frameworks = [
          {
            name: 'GDPR',
            displayName: 'General Data Protection Regulation',
            version: '2018',
            description: 'EU data protection regulation',
            requirements: ['Consent Management', 'Data Minimization', 'Right to Deletion'],
            status: 'active'
          },
          {
            name: 'SOX',
            displayName: 'Sarbanes-Oxley Act',
            version: '2002',
            description: 'US financial reporting compliance',
            requirements: ['Internal Controls', 'Financial Reporting', 'Audit Requirements'],
            status: 'active'
          },
          {
            name: 'HIPAA',
            displayName: 'Health Insurance Portability and Accountability Act',
            version: '1996',
            description: 'US healthcare data protection',
            requirements: ['PHI Protection', 'Access Controls', 'Audit Logging'],
            status: 'active'
          },
          {
            name: 'ISO_27001',
            displayName: 'ISO 27001 Information Security',
            version: '2013',
            description: 'International information security standard',
            requirements: ['Risk Assessment', 'Control Implementation', 'Continuous Monitoring'],
            status: 'active'
          }
        ];

        return NextResponse.json({
          success: true,
          data: {
            frameworks,
            supported: frameworks.length,
            compliance: enterpriseGovernanceFramework.getGovernanceMetrics().compliance
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Enterprise Governance GET API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handlePolicyCreation(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = PolicyCreationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid policy data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const policyData = validation.data;

  try {
    const policyId = await enterpriseGovernanceFramework.createPolicy({
      ...policyData,
      effectiveDate: new Date(),
      expirationDate: policyData.expirationDate ? new Date(policyData.expirationDate) : undefined,
      enforcement: [],
      exemptions: []
    });

    logger.info('Governance policy created via API', {
      policyId,
      name: policyData.name,
      category: policyData.category,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        policyId,
        message: 'Policy created successfully',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Policy creation failed';
    
    logger.error('Failed to create governance policy', {
      userId: session.user.id,
      error: errorMessage,
      policyName: policyData.name
    });

    return NextResponse.json(
      { 
        error: 'Failed to create policy',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function handlePolicyUpdate(request: NextRequest, session: any) {
  const body = await request.json();
  const { policyId, updates } = body;

  if (!policyId) {
    return NextResponse.json(
      { error: 'Policy ID required' },
      { status: 400 }
    );
  }

  try {
    const success = await enterpriseGovernanceFramework.updatePolicy(policyId, updates);
    
    if (success) {
      logger.info('Governance policy updated via API', {
        policyId,
        updatedBy: session.user.id,
        updatedFields: Object.keys(updates)
      });

      return NextResponse.json({
        success: true,
        data: {
          policyId,
          message: 'Policy updated successfully',
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    logger.error('Failed to update governance policy', {
      policyId,
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to update policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleExemptionGrant(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = ExemptionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid exemption data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const exemptionData = validation.data;

  try {
    const exemptionId = await enterpriseGovernanceFramework.grantExemption(
      exemptionData.policyId,
      exemptionData.ruleId || '',
      exemptionData.userId,
      exemptionData.reason,
      session.user.id,
      new Date(exemptionData.expirationDate),
      exemptionData.conditions || [],
      exemptionData.maxUsage
    );

    logger.info('Policy exemption granted via API', {
      exemptionId,
      policyId: exemptionData.policyId,
      userId: exemptionData.userId,
      grantedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        exemptionId,
        message: 'Exemption granted successfully',
        grantedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to grant policy exemption', {
      policyId: exemptionData.policyId,
      userId: exemptionData.userId,
      grantedBy: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to grant exemption',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleGovernanceEvaluation(request: NextRequest, session: any) {
  const body = await request.json();
  
  const { taskId, taskType, parameters, riskLevel, dataClassification, businessContext } = body;

  if (!taskId || !taskType || !parameters) {
    return NextResponse.json(
      { error: 'Task ID, type, and parameters required' },
      { status: 400 }
    );
  }

  try {
    const taskRequest = {
      taskId,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      taskType,
      parameters,
      riskLevel: riskLevel || 'medium',
      dataClassification,
      businessContext: businessContext || {}
    };

    const evaluation = await enterpriseGovernanceFramework.evaluateGovernance(taskRequest);

    logger.info('Governance evaluation completed via API', {
      taskId,
      userId: session.user.id,
      allowed: evaluation.allowed,
      violations: evaluation.violations.length,
      warnings: evaluation.warnings.length
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        evaluation: {
          allowed: evaluation.allowed,
          requiresApproval: evaluation.requiresApproval,
          violations: evaluation.violations.map(v => ({
            severity: v.severity,
            message: v.message,
            documentation: v.documentation
          })),
          warnings: evaluation.warnings.map(w => ({
            severity: w.severity,
            message: w.message,
            documentation: w.documentation
          })),
          recommendations: evaluation.recommendations,
          complianceFrameworks: evaluation.complianceFrameworks,
          exemptionsUsed: evaluation.exemptionsUsed.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to evaluate governance', {
      taskId,
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to evaluate governance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleComplianceReportGeneration(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = ComplianceReportSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid report parameters',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const reportData = validation.data;

  try {
    const framework = {
      name: reportData.framework as any,
      version: '2023',
      requirements: [], // Would be populated from framework definition
      evidence: [],
      controls: []
    };

    const report = await enterpriseGovernanceFramework.generateComplianceReport(
      framework,
      new Date(reportData.periodStart),
      new Date(reportData.periodEnd)
    );

    logger.info('Compliance report generated via API', {
      reportId: report.id,
      framework: reportData.framework,
      periodStart: reportData.periodStart,
      periodEnd: reportData.periodEnd,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        framework: report.framework.name,
        overallStatus: report.overallStatus,
        generatedAt: report.generatedAt,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        summary: {
          totalFindings: report.findings.length,
          criticalFindings: report.findings.filter(f => f.severity === 'critical').length,
          recommendations: report.recommendations.length,
          complianceScore: report.metrics.controlEffectiveness * 100
        },
        downloadUrl: `/api/ai/governance/reports/${report.id}` // For future implementation
      }
    });

  } catch (error) {
    logger.error('Failed to generate compliance report', {
      framework: reportData.framework,
      requestedBy: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate compliance report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

