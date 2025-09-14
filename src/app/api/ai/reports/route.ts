/**
 * AI-Powered Reports API
 * ======================
 * Natural language report generation with advanced export capabilities
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schema
const reportRequestSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters').max(500, 'Query too long'),
  options: z.object({
    format: z.enum(['CSV', 'Excel', 'PDF', 'JSON']).optional(),
    includeCharts: z.boolean().default(false),
    schedule: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      recipients: z.array(z.string().email()).min(1).max(10)
    }).optional()
  }).default({})
});

// POST: Generate AI report from natural language
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = reportRequestSchema.parse(body);

    try {
      // Dynamic import
      const { intelligentReportingEngine } = await import('@/lib/ai/intelligent-reporting-engine');
      type ReportRequest = any; // Type imported as interface
      
      const reportRequest: ReportRequest = {
        query: validatedData.query,
        userId: user.id,
        userRole: user.role,
        organizationId: user.organizationId,
        options: validatedData.options
      };

      logger.info('AI report generation requested', {
        query: validatedData.query.substring(0, 100),
        userId: user.id,
        organizationId: user.organizationId,
        format: validatedData.options.format
      });

      const result = await intelligentReportingEngine.generateReport(reportRequest);

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.message,
            suggestions: result.suggestions,
            details: result.error
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          reportId: result.reportId,
          message: result.message,
          estimatedRows: result.estimatedRows,
          format: result.format,
          downloadUrl: result.downloadUrl,
          status: 'processing'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('AI report generation failed', {
        error: errorMessage,
        userId: user.id,
        query: validatedData.query
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Reports API POST error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get available report types and status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    try {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      const reportId = url.searchParams.get('reportId');

      if (action === 'types') {
        // Dynamic import and get available report types
        const { intelligentReportingEngine } = await import('@/lib/ai/intelligent-reporting-engine');
        const reportTypes = intelligentReportingEngine.getAvailableReportTypes();

        return NextResponse.json({
          success: true,
          data: {
            reportTypes,
            capabilities: {
              naturalLanguage: true,
              scheduledReports: true,
              multipleFormats: ['CSV', 'Excel', 'PDF', 'JSON'],
              maxRows: {
                contacts: 50000,
                campaigns: 25000,
                analytics: 100000,
                workflows: 25000
              }
            },
            examples: [
              {
                query: "Export all active contacts to Excel",
                description: "Generates Excel report of all active contacts"
              },
              {
                query: "Create campaign performance report as PDF",
                description: "PDF report with campaign metrics and charts"
              },
              {
                query: "Generate analytics summary for last month",
                description: "Monthly analytics data in Excel format"
              },
              {
                query: "Export workflow execution data with charts",
                description: "Workflow performance report with visualizations"
              }
            ]
          }
        });
      }

      if (reportId) {
        // Dynamic import and get report status
        const { intelligentReportingEngine } = await import('@/lib/ai/intelligent-reporting-engine');
        const reportJob = await intelligentReportingEngine.exportManager?.getExportJob(reportId);
        
        if (!reportJob) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }

        // Check if user can access this report
        if (reportJob.requestedBy.userId !== user.id && user.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            reportId: reportJob.id,
            status: reportJob.status,
            progress: reportJob.progress,
            startTime: reportJob.startTime,
            endTime: reportJob.endTime,
            downloadUrl: reportJob.downloadUrl,
            fileSize: reportJob.fileSize,
            rowCount: reportJob.rowCount,
            error: reportJob.error
          }
        });
      }

      // Default: Return user's recent reports
      return NextResponse.json({
        success: true,
        data: {
          recentReports: [],
          message: 'Report history not yet implemented'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to get report data', {
        error: errorMessage,
        userId: user.id
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Reports API GET error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel report generation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const deleteSchema = z.object({
      reportId: z.string().min(1, 'Report ID required')
    });
    const validatedData = deleteSchema.parse(body);

    try {
      const { reportId } = validatedData;

      // Dynamic import
      const { intelligentReportingEngine } = await import('@/lib/ai/intelligent-reporting-engine');
      const cancelled = await intelligentReportingEngine.exportManager?.cancelExportJob(reportId);

      if (!cancelled) {
        return NextResponse.json(
          { error: 'Report not found or cannot be cancelled' },
          { status: 404 }
        );
      }

      logger.info('AI report cancelled', {
        reportId,
        userId: user.id
      });

      return NextResponse.json({
        success: true,
        data: {
          reportId,
          cancelled: true,
          message: 'Report generation cancelled successfully'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to cancel report', {
        error: errorMessage,
        userId: user.id,
        reportId: validatedData.reportId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Reports API DELETE error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}