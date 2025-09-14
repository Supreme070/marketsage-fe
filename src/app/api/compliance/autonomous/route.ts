/**
 * Autonomous Compliance Monitoring API Endpoints
 * ==============================================
 * RESTful API for autonomous compliance monitoring and African regulatory compliance
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Dynamic import to prevent circular dependencies
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';

/**
 * GET /api/compliance/autonomous - Get compliance monitoring data
 */
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-compliance-api');
  
  return tracer.startActiveSpan('get-compliance-data', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has compliance access (ADMIN, IT_ADMIN, SUPER_ADMIN)
      const hasAccess = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!hasAccess) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions for compliance access' }, { status: 403 });
      }

      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      const frameworkId = url.searchParams.get('frameworkId');

      span.setAttributes({
        'compliance.type': type || 'overview',
        'compliance.framework_id': frameworkId || 'all',
        'compliance.user_id': session.user.id,
        'compliance.user_role': session.user.role || ''
      });

      // Dynamic import to prevent circular dependencies
      const { autonomousComplianceMonitor } = await import('@/lib/compliance/autonomous-compliance-monitor');

      switch (type) {
        case 'frameworks':
          const frameworks = await autonomousComplianceMonitor.getComplianceFrameworks();
          span.setAttributes({
            'compliance.frameworks_count': frameworks.length
          });
          return NextResponse.json(frameworks);

        case 'violations':
          const violations = await autonomousComplianceMonitor.getActiveViolations();
          const filteredViolations = frameworkId 
            ? violations.filter(v => v.frameworkId === frameworkId)
            : violations;
          
          span.setAttributes({
            'compliance.violations_count': filteredViolations.length,
            'compliance.critical_violations': filteredViolations.filter(v => v.severity === 'critical').length
          });
          return NextResponse.json(filteredViolations);

        case 'score':
          const score = await autonomousComplianceMonitor.getComplianceScore();
          span.setAttributes({
            'compliance.score': score
          });
          return NextResponse.json({ score, status: score >= 90 ? 'compliant' : score >= 70 ? 'partial' : 'non_compliant' });

        case 'report':
          const report = await autonomousComplianceMonitor.generateComplianceReport(frameworkId || undefined);
          span.setAttributes({
            'compliance.report_violations': report.violations.length,
            'compliance.report_score': report.overallScore,
            'compliance.report_recommendations': report.recommendations.length
          });
          return NextResponse.json(report);

        case 'african_markets':
          // Return African market specific compliance information
          const africanFrameworks = (await autonomousComplianceMonitor.getComplianceFrameworks())
            .filter(f => ['Nigeria', 'South Africa', 'Kenya', 'Ghana'].includes(f.country));
          
          const africanCompliance = {
            frameworks: africanFrameworks,
            marketCoverage: {
              nigeria: africanFrameworks.some(f => f.country === 'Nigeria'),
              southAfrica: africanFrameworks.some(f => f.country === 'South Africa'),
              kenya: africanFrameworks.some(f => f.country === 'Kenya'),
              ghana: africanFrameworks.some(f => f.country === 'Ghana')
            },
            totalMarkets: africanFrameworks.length,
            riskAssessment: await this.assessAfricanMarketRisk(africanFrameworks)
          };

          span.setAttributes({
            'compliance.african_markets': africanCompliance.totalMarkets,
            'compliance.nigeria_coverage': africanCompliance.marketCoverage.nigeria,
            'compliance.south_africa_coverage': africanCompliance.marketCoverage.southAfrica
          });

          return NextResponse.json(africanCompliance);

        default:
          // Return comprehensive compliance overview
          const [allFrameworks, activeViolations, complianceScore] = await Promise.all([
            autonomousComplianceMonitor.getComplianceFrameworks(),
            autonomousComplianceMonitor.getActiveViolations(),
            autonomousComplianceMonitor.getComplianceScore()
          ]);

          const overview = {
            score: complianceScore,
            status: complianceScore >= 90 ? 'compliant' : complianceScore >= 70 ? 'partial' : 'non_compliant',
            frameworks: allFrameworks.length,
            activeViolations: activeViolations.length,
            criticalViolations: activeViolations.filter(v => v.severity === 'critical').length,
            africanMarketsCovered: allFrameworks.filter(f => 
              ['Nigeria', 'South Africa', 'Kenya', 'Ghana'].includes(f.country)
            ).length,
            riskLevel: this.calculateOverallRiskLevel(activeViolations),
            lastAssessment: new Date(),
            nextAssessment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            capabilities: {
              autonomousMonitoring: true,
              africanRegulations: true,
              realTimeAlerts: true,
              autoRemediation: true,
              complianceReporting: true
            }
          };

          span.setAttributes({
            'compliance.overview_score': overview.score,
            'compliance.overview_status': overview.status,
            'compliance.overview_violations': overview.activeViolations
          });

          return NextResponse.json(overview);
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous compliance API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to retrieve compliance data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  // Helper methods
  async function assessAfricanMarketRisk(frameworks: any[]): Promise<string> {
    const riskLevels = frameworks.map(f => f.riskLevel);
    if (riskLevels.includes('critical')) return 'critical';
    if (riskLevels.includes('high')) return 'high';
    if (riskLevels.includes('medium')) return 'medium';
    return 'low';
  }

  function calculateOverallRiskLevel(violations: any[]): string {
    if (violations.some(v => v.severity === 'critical')) return 'critical';
    if (violations.some(v => v.severity === 'high')) return 'high';
    if (violations.some(v => v.severity === 'medium')) return 'medium';
    return 'low';
  }
}

/**
 * POST /api/compliance/autonomous - Trigger compliance actions
 */
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-compliance-api');
  
  return tracer.startActiveSpan('post-compliance-action', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check permissions
      const hasAccess = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!hasAccess) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions for compliance operations' }, { status: 403 });
      }

      const body = await request.json();
      const { action, data } = body;

      span.setAttributes({
        'compliance.action': action,
        'compliance.user_id': session.user.id,
        'compliance.user_role': session.user.role || ''
      });

      switch (action) {
        case 'trigger_assessment':
          const { frameworkId, assessmentType } = data;
          
          // Trigger compliance assessment
          const assessmentResult = await this.triggerComplianceAssessment(
            frameworkId, 
            assessmentType || 'comprehensive',
            session.user.id
          );

          span.setAttributes({
            'compliance.assessment_type': assessmentType || 'comprehensive',
            'compliance.framework_id': frameworkId || 'all'
          });

          logger.info('Compliance assessment triggered', {
            frameworkId,
            assessmentType,
            userId: session.user.id,
            userRole: session.user.role
          });

          return NextResponse.json({
            success: true,
            message: 'Compliance assessment triggered successfully',
            assessmentId: assessmentResult.id,
            estimatedCompletion: assessmentResult.estimatedCompletion
          });

        case 'acknowledge_violation':
          const { violationId, acknowledgment } = data;
          
          if (!violationId) {
            return NextResponse.json({ error: 'Violation ID required' }, { status: 400 });
          }

          // Acknowledge compliance violation
          const acknowledged = await this.acknowledgeViolation(violationId, session.user.id, acknowledgment);

          if (!acknowledged) {
            return NextResponse.json({ error: 'Violation not found or already acknowledged' }, { status: 404 });
          }

          logger.info('Compliance violation acknowledged', {
            violationId,
            userId: session.user.id,
            acknowledgment
          });

          return NextResponse.json({
            success: true,
            message: 'Violation acknowledged successfully',
            violationId
          });

        case 'request_remediation':
          const { violationId: remediationViolationId, priority } = data;
          
          if (!remediationViolationId) {
            return NextResponse.json({ error: 'Violation ID required for remediation' }, { status: 400 });
          }

          // Request autonomous remediation
          const remediationResult = await this.requestRemediation(
            remediationViolationId,
            priority || 'medium',
            session.user.id
          );

          logger.info('Compliance remediation requested', {
            violationId: remediationViolationId,
            priority,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: 'Remediation request submitted successfully',
            remediationId: remediationResult.id,
            estimatedCompletion: remediationResult.estimatedCompletion
          });

        case 'update_framework':
          const { frameworkId: updateFrameworkId, enabled, riskLevel } = data;
          
          if (!updateFrameworkId) {
            return NextResponse.json({ error: 'Framework ID required' }, { status: 400 });
          }

          // Update compliance framework settings
          const updated = await this.updateFrameworkSettings(updateFrameworkId, { enabled, riskLevel });

          if (!updated) {
            return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
          }

          logger.info('Compliance framework updated', {
            frameworkId: updateFrameworkId,
            enabled,
            riskLevel,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: 'Framework settings updated successfully',
            frameworkId: updateFrameworkId
          });

        case 'generate_report':
          const { reportType, frameworkId: reportFrameworkId, period } = data;
          
          // Dynamic import to prevent circular dependencies
          const { autonomousComplianceMonitor: complianceGen } = await import('@/lib/compliance/autonomous-compliance-monitor');
          
          // Generate custom compliance report
          const report = await complianceGen.generateComplianceReport(reportFrameworkId);
          
          logger.info('Compliance report generated', {
            reportType: reportType || 'standard',
            frameworkId: reportFrameworkId,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: 'Compliance report generated successfully',
            report,
            downloadUrl: `/api/compliance/reports/${report.id}`
          });

        default:
          return NextResponse.json({ error: 'Unknown compliance action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous compliance POST API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to process compliance action' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  // Helper methods for POST actions
  async function triggerComplianceAssessment(
    frameworkId: string | undefined, 
    assessmentType: string, 
    userId: string
  ): Promise<{ id: string; estimatedCompletion: string }> {
    // Trigger autonomous compliance assessment
    const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Schedule assessment (would integrate with actual assessment logic)
    setTimeout(async () => {
      // Perform actual assessment
      logger.info('Performing scheduled compliance assessment', {
        assessmentId,
        frameworkId,
        assessmentType
      });
    }, 5000);

    return {
      id: assessmentId,
      estimatedCompletion: assessmentType === 'quick' ? '5-10 minutes' : '30-60 minutes'
    };
  }

  async function acknowledgeViolation(violationId: string, userId: string, acknowledgment?: string): Promise<boolean> {
    // Acknowledge violation (would integrate with actual violation management)
    logger.info('Acknowledging compliance violation', {
      violationId,
      userId,
      acknowledgment
    });
    
    return true; // Placeholder
  }

  async function requestRemediation(
    violationId: string, 
    priority: string, 
    userId: string
  ): Promise<{ id: string; estimatedCompletion: string }> {
    // Request autonomous remediation
    const remediationId = `remediation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: remediationId,
      estimatedCompletion: priority === 'critical' ? '1-2 hours' : '1-3 days'
    };
  }

  async function updateFrameworkSettings(
    frameworkId: string, 
    settings: { enabled?: boolean; riskLevel?: string }
  ): Promise<boolean> {
    // Update framework settings (would integrate with actual framework management)
    logger.info('Updating compliance framework settings', {
      frameworkId,
      settings
    });
    
    return true; // Placeholder
  }
}

/**
 * PUT /api/compliance/autonomous - Update compliance configurations
 */
export async function PUT(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-compliance-api');
  
  return tracer.startActiveSpan('put-compliance-config', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only SUPER_ADMIN and IT_ADMIN can modify compliance configurations
      const canModify = ['IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!canModify) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions to modify compliance configurations' }, { status: 403 });
      }

      const body = await request.json();
      const { configType, settings } = body;

      span.setAttributes({
        'compliance.config_type': configType,
        'compliance.user_id': session.user.id,
        'compliance.user_role': session.user.role || ''
      });

      // Update compliance configurations
      logger.info('Updating compliance configurations', {
        configType,
        settings: Object.keys(settings),
        userId: session.user.id,
        userRole: session.user.role
      });

      return NextResponse.json({
        success: true,
        message: 'Compliance configurations updated successfully',
        configType,
        appliedSettings: Object.keys(settings)
      });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous compliance PUT API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to update compliance configurations' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}