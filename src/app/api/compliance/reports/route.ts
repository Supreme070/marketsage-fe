import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowComplianceChecker } from '@/lib/workflow/compliance-checker';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schema for report generation
const generateReportSchema = z.object({
  workflowId: z.string().optional(), // null for global reports
  reportType: z.enum(['DAILY_SUMMARY', 'WEEKLY_DIGEST', 'MONTHLY_REPORT', 'QUARTERLY_ASSESSMENT', 'ANNUAL_REVIEW', 'INCIDENT_REPORT', 'REGULATORY_FILING', 'AUDIT_REPORT']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeRecommendations: z.boolean().default(true),
  includeTrends: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const reportType = searchParams.get('reportType');
    const isPublished = searchParams.get('published');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where condition
    const whereCondition: any = {};

    if (workflowId) {
      whereCondition.workflowId = workflowId;
    }

    if (reportType) {
      whereCondition.reportType = reportType;
    }

    if (isPublished !== null && isPublished !== undefined) {
      whereCondition.isPublished = isPublished === 'true';
    }

    const reports = await prisma.workflowComplianceReport.findMany({
      where: whereCondition,
      include: {
        workflow: {
          select: {
            name: true
          }
        },
        generator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: reports.map(report => ({
        id: report.id,
        workflowId: report.workflowId,
        workflowName: report.workflow?.name,
        reportType: report.reportType,
        period: report.period,
        startDate: report.startDate,
        endDate: report.endDate,
        summary: report.summary,
        overallScore: report.overallScore,
        totalChecks: report.totalChecks,
        compliantChecks: report.compliantChecks,
        violationsFound: report.violationsFound,
        highRiskViolations: report.highRiskViolations,
        generatedAt: report.generatedAt,
        generatedBy: report.generator.name,
        isPublished: report.isPublished,
        publishedAt: report.publishedAt,
        format: report.format
      }))
    });

  } catch (error) {
    logger.error('Error getting compliance reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get compliance reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only ADMIN or OWNER can generate compliance reports
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Generate compliance report
    const reportId = await workflowComplianceChecker.generateComplianceReport(
      validatedData.workflowId || null,
      validatedData.reportType,
      validatedData.period,
      new Date(validatedData.startDate),
      new Date(validatedData.endDate),
      session.user.id
    );

    // Get the generated report
    const report = await prisma.workflowComplianceReport.findUnique({
      where: { id: reportId },
      include: {
        workflow: {
          select: {
            name: true
          }
        }
      }
    });

    if (!report) {
      throw new Error('Failed to retrieve generated report');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        workflowId: report.workflowId,
        workflowName: report.workflow?.name,
        reportType: report.reportType,
        period: report.period,
        startDate: report.startDate,
        endDate: report.endDate,
        overallScore: report.overallScore,
        totalChecks: report.totalChecks,
        compliantChecks: report.compliantChecks,
        violationsFound: report.violationsFound,
        highRiskViolations: report.highRiskViolations,
        summary: report.summary,
        findings: report.findings,
        recommendations: report.recommendations,
        trends: report.trends,
        generatedAt: report.generatedAt,
        format: report.format
      },
      message: 'Compliance report generated successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error generating compliance report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate compliance report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}