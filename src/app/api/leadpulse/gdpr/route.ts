import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automatedGDPRService } from '@/lib/leadpulse/automated-gdpr-service';
import { z } from 'zod';

// Request schemas
const recordConsentSchema = z.object({
  email: z.string().email(),
  consentType: z.enum(['MARKETING', 'ANALYTICS', 'FUNCTIONAL', 'NECESSARY', 'THIRD_PARTY_SHARING']),
  purpose: z.string(),
  granted: z.boolean(),
  source: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  evidenceUrl: z.string().optional()
});

const dataSubjectRequestSchema = z.object({
  type: z.enum(['ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'PORTABILITY', 'OBJECTION']),
  email: z.string().email(),
  requestDetails: z.string().optional(),
  verificationMethod: z.string().optional()
});

const retentionRuleSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  dataType: z.enum(['visitor', 'contact', 'touchpoint', 'form_submission', 'consent']),
  retentionPeriod: z.number().min(1),
  conditions: z.object({
    hasConsent: z.boolean().optional(),
    consentType: z.string().optional(),
    lastActivity: z.number().optional(),
    dataCategory: z.string().optional(),
    region: z.string().optional()
  }),
  actions: z.object({
    notify: z.boolean().optional(),
    anonymize: z.boolean().optional(),
    delete: z.boolean().optional(),
    archive: z.boolean().optional()
  }),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string()
  })
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'dashboard':
        const dashboardData = await automatedGDPRService.getComplianceDashboard();
        return NextResponse.json(dashboardData);

      case 'consent-summary':
        const email = searchParams.get('email');
        if (!email) {
          return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
        }

        const { gdprComplianceManager } = await import('@/lib/leadpulse/gdpr-compliance');
        const consentSummary = await gdprComplianceManager.getConsentSummary(email);
        return NextResponse.json(consentSummary);

      case 'retention-rules':
        // Get all retention rules (this would be loaded from database)
        const rules = []; // Placeholder - implement database query
        return NextResponse.json({ rules });

      case 'processing-status':
        const status = {
          lastProcessingRun: new Date().toISOString(),
          nextScheduledRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isRunning: false,
          totalRules: 0,
          activeRules: 0
        };
        return NextResponse.json({ status });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('GDPR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    const { gdprComplianceManager } = await import('@/lib/leadpulse/gdpr-compliance');

    switch (action) {
      case 'record-consent':
        const consentData = recordConsentSchema.parse(body);
        const consentResult = await gdprComplianceManager.recordConsent(consentData);
        return NextResponse.json(consentResult);

      case 'data-subject-request':
        const requestData = dataSubjectRequestSchema.parse(body);
        
        switch (requestData.type) {
          case 'ACCESS':
            const accessResult = await gdprComplianceManager.handleAccessRequest(requestData.email);
            return NextResponse.json(accessResult);
            
          case 'ERASURE':
            const erasureResult = await gdprComplianceManager.handleErasureRequest(
              requestData.email,
              requestData.requestDetails || 'Data subject erasure request'
            );
            return NextResponse.json(erasureResult);
            
          case 'PORTABILITY':
            const portabilityResult = await gdprComplianceManager.handlePortabilityRequest(requestData.email);
            return NextResponse.json(portabilityResult);
            
          default:
            return NextResponse.json({ error: 'Request type not yet implemented' }, { status: 400 });
        }

      case 'add-retention-rule':
        const ruleData = retentionRuleSchema.parse(body);
        const ruleId = await automatedGDPRService.addRetentionRule(ruleData);
        return NextResponse.json({ success: true, ruleId });

      case 'process-retention':
        const retentionResult = await automatedGDPRService.processDataRetention();
        return NextResponse.json(retentionResult);

      case 'process-consent-reminders':
        const reminderResult = await automatedGDPRService.processConsentReminders();
        return NextResponse.json(reminderResult);

      case 'start-service':
        await automatedGDPRService.start();
        return NextResponse.json({ success: true, message: 'GDPR service started' });

      case 'stop-service':
        await automatedGDPRService.stop();
        return NextResponse.json({ success: true, message: 'GDPR service stopped' });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('GDPR API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}