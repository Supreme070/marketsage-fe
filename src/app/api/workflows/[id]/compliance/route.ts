import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowComplianceChecker } from '@/lib/workflow/compliance-checker';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schema for compliance check request
const complianceCheckSchema = z.object({
  country: z.string().min(2).max(3), // ISO country code
  userLocation: z.string().optional(),
  contactLocation: z.string().optional(),
  dataTypes: z.array(z.string()).default([]),
  communicationChannels: z.array(z.string()).default([]),
  consentStatus: z.record(z.boolean()).optional(),
  marketingFrequency: z.record(z.number()).optional(),
  executionId: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const body = await request.json();
    const validatedData = complianceCheckSchema.parse(body);

    // Create compliance context
    const complianceContext = {
      country: validatedData.country,
      userLocation: validatedData.userLocation,
      contactLocation: validatedData.contactLocation,
      dataTypes: validatedData.dataTypes,
      communicationChannels: validatedData.communicationChannels,
      consentStatus: validatedData.consentStatus,
      marketingFrequency: validatedData.marketingFrequency
    };

    // Run compliance check
    const results = await workflowComplianceChecker.checkWorkflowCompliance(
      workflowId,
      complianceContext,
      validatedData.executionId
    );

    // Calculate overall compliance score
    const totalChecks = results.length;
    const compliantChecks = results.filter(r => r.isCompliant).length;
    const overallScore = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;
    const averageRiskScore = totalChecks > 0 ? results.reduce((sum, r) => sum + r.riskScore, 0) / totalChecks : 0;

    // Group findings by severity
    const allFindings = results.flatMap(r => r.findings);
    const findingsBySeverity = allFindings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        workflowId,
        checkDate: new Date().toISOString(),
        complianceContext,
        overallCompliance: {
          isCompliant: overallScore >= 80,
          score: parseFloat(overallScore.toFixed(1)),
          riskScore: parseFloat(averageRiskScore.toFixed(1)),
          totalChecks,
          compliantChecks,
          nonCompliantChecks: totalChecks - compliantChecks
        },
        findingsSummary: {
          total: allFindings.length,
          bySeverity: findingsBySeverity,
          requiresImmediateAction: allFindings.filter(f => f.severity === 'CRITICAL').length
        },
        detailedResults: results.map(result => ({
          ruleId: result.ruleId,
          isCompliant: result.isCompliant,
          riskScore: result.riskScore,
          findingsCount: result.findings.length,
          recommendationsCount: result.recommendations.length,
          criticalFindings: result.findings.filter(f => f.severity === 'CRITICAL').length,
          highFindings: result.findings.filter(f => f.severity === 'HIGH').length
        })),
        fullResults: results // Include full results for detailed analysis
      }
    });

  } catch (error) {
    logger.error('Error checking workflow compliance:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to check workflow compliance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    // Get recent compliance checks for this workflow
    const whereCondition: any = { workflowId };
    
    if (status) {
      whereCondition.status = status;
    }

    const checks = await prisma.workflowComplianceCheck.findMany({
      where: whereCondition,
      include: {
        rule: {
          select: {
            name: true,
            category: true,
            country: true,
            regulation: true,
            severity: true
          }
        }
      },
      orderBy: { checkDate: 'desc' },
      take: limit
    });

    // Get recent violations
    const violationWhere: any = { workflowId };
    if (severity) {
      violationWhere.severity = severity;
    }

    const violations = await prisma.workflowComplianceViolation.findMany({
      where: violationWhere,
      include: {
        rule: {
          select: {
            name: true,
            category: true,
            country: true,
            regulation: true
          }
        }
      },
      orderBy: { detectedAt: 'desc' },
      take: limit
    });

    // Calculate summary statistics
    const totalChecks = checks.length;
    const compliantChecks = checks.filter(c => c.isCompliant).length;
    const activeViolations = violations.filter(v => v.status === 'OPEN').length;
    const overallScore = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalChecks,
          compliantChecks,
          complianceRate: parseFloat(((compliantChecks / totalChecks) * 100).toFixed(1)),
          activeViolations,
          overallScore: parseFloat(overallScore.toFixed(1))
        },
        recentChecks: checks.map(check => ({
          id: check.id,
          checkDate: check.checkDate,
          ruleName: check.rule.name,
          ruleCategory: check.rule.category,
          country: check.rule.country,
          regulation: check.rule.regulation,
          status: check.status,
          isCompliant: check.isCompliant,
          riskScore: check.riskScore,
          requiresAction: check.requiresAction,
          remediationStatus: check.remediationStatus
        })),
        recentViolations: violations.map(violation => ({
          id: violation.id,
          detectedAt: violation.detectedAt,
          ruleName: violation.rule.name,
          ruleCategory: violation.rule.category,
          violationType: violation.violationType,
          severity: violation.severity,
          title: violation.title,
          description: violation.description,
          riskLevel: violation.riskLevel,
          status: violation.status,
          financialImpact: violation.financialImpact,
          resolved: violation.status === 'RESOLVED'
        }))
      }
    });

  } catch (error) {
    logger.error('Error getting workflow compliance data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get compliance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}