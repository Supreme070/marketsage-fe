/**
 * LeadPulse Alerting System API
 * 
 * Endpoints for managing alerting configurations and sending alerts
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AlertingSystem, type AlertConfig, type Alert, generateAlertId } from '@/lib/leadpulse/integrations/alerting-system';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET: Get alerting configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'config' or 'history'

    if (type === 'history') {
      const hours = Number.parseInt(searchParams.get('hours') || '24');
      
      // Get user's alerting system instance
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { alertingConfig: true },
      });

      if (user?.alertingConfig) {
        const alertingSystem = new AlertingSystem(user.alertingConfig as AlertConfig);
        const history = await alertingSystem.getAlertHistory(hours);
        
        return NextResponse.json({
          success: true,
          history,
          totalAlerts: history.length,
        });
      }

      return NextResponse.json({
        success: true,
        history: [],
        totalAlerts: 0,
      });
    }

    // Get alerting configuration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { alertingConfig: true },
    });

    const config = user?.alertingConfig || {
      email: { enabled: false },
      slack: { enabled: false },
      teams: { enabled: false },
      sms: { enabled: false },
      discord: { enabled: false },
      pagerduty: { enabled: false },
    };

    return NextResponse.json({
      success: true,
      config,
    });

  } catch (error) {
    logger.error('Error getting alerting config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get alerting configuration',
    }, { status: 500 });
  }
}

/**
 * POST: Update alerting configuration or send alert
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, config, alert } = body;

    if (action === 'send_alert') {
      // Send a test or manual alert
      if (!alert) {
        return NextResponse.json({
          success: false,
          error: 'Alert data is required',
        }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { alertingConfig: true },
      });

      if (!user?.alertingConfig) {
        return NextResponse.json({
          success: false,
          error: 'Alerting not configured',
        }, { status: 400 });
      }

      const alertingSystem = new AlertingSystem(user.alertingConfig as AlertConfig);
      
      const alertToSend: Alert = {
        id: generateAlertId(),
        timestamp: new Date(),
        ...alert,
      };

      const result = await alertingSystem.sendAlert(alertToSend);

      return NextResponse.json({
        success: result.success,
        results: result.results,
        alertId: alertToSend.id,
      });
    }

    // Update alerting configuration
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuration is required',
      }, { status: 400 });
    }

    // Validate configuration
    const validationResult = validateAlertingConfig(config);
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: validationResult.error,
      }, { status: 400 });
    }

    // Test the configuration if requested
    if (body.testConfig) {
      const alertingSystem = new AlertingSystem(config);
      const testAlert: Alert = {
        id: generateAlertId(),
        type: 'SYSTEM_HEALTH',
        severity: 'LOW',
        title: 'Test Alert Configuration',
        message: 'This is a test alert to verify your alerting configuration is working correctly.',
        timestamp: new Date(),
        channels: Object.keys(config).filter(channel => config[channel]?.enabled) as any[],
      };

      const testResult = await alertingSystem.sendAlert(testAlert);
      
      if (!testResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Configuration test failed',
          testResults: testResult.results,
        }, { status: 400 });
      }
    }

    // Save configuration
    await prisma.user.update({
      where: { id: session.user.id },
      data: { alertingConfig: config },
    });

    logger.info(`Alerting configuration updated for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Alerting configuration updated successfully',
    });

  } catch (error) {
    logger.error('Error updating alerting config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update alerting configuration',
    }, { status: 500 });
  }
}

/**
 * PUT: Acknowledge an alert
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, acknowledgedBy } = body;

    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required',
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { alertingConfig: true },
    });

    if (!user?.alertingConfig) {
      return NextResponse.json({
        success: false,
        error: 'Alerting not configured',
      }, { status: 400 });
    }

    const alertingSystem = new AlertingSystem(user.alertingConfig as AlertConfig);
    const result = await alertingSystem.acknowledgeAlert(
      alertId, 
      acknowledgedBy || session.user.email || session.user.id
    );

    return NextResponse.json({
      success: result,
      message: result ? 'Alert acknowledged successfully' : 'Failed to acknowledge alert',
    });

  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to acknowledge alert',
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove alerting configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (channel) {
      // Remove specific channel configuration
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { alertingConfig: true },
      });

      if (user?.alertingConfig) {
        const config = { ...user.alertingConfig };
        if (config[channel]) {
          config[channel].enabled = false;
          delete config[channel].credentials;
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { alertingConfig: config },
        });
      }

      return NextResponse.json({
        success: true,
        message: `${channel} alerting disabled`,
      });
    } else {
      // Remove entire alerting configuration
      await prisma.user.update({
        where: { id: session.user.id },
        data: { alertingConfig: null },
      });

      return NextResponse.json({
        success: true,
        message: 'Alerting configuration removed',
      });
    }

  } catch (error) {
    logger.error('Error removing alerting config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove alerting configuration',
    }, { status: 500 });
  }
}

// Configuration validation helper
function validateAlertingConfig(config: AlertConfig): { valid: boolean; error?: string } {
  try {
    // Validate email configuration
    if (config.email?.enabled) {
      if (!config.email.recipients?.length) {
        return { valid: false, error: 'Email recipients are required' };
      }
      if (!config.email.smtpConfig?.host || !config.email.smtpConfig?.auth?.user) {
        return { valid: false, error: 'SMTP configuration is incomplete' };
      }
    }

    // Validate Slack configuration
    if (config.slack?.enabled) {
      if (!config.slack.webhookUrl) {
        return { valid: false, error: 'Slack webhook URL is required' };
      }
      if (!config.slack.channel) {
        return { valid: false, error: 'Slack channel is required' };
      }
    }

    // Validate Teams configuration
    if (config.teams?.enabled) {
      if (!config.teams.webhookUrl) {
        return { valid: false, error: 'Teams webhook URL is required' };
      }
    }

    // Validate SMS configuration
    if (config.sms?.enabled) {
      if (!config.sms.recipients?.length) {
        return { valid: false, error: 'SMS recipients are required' };
      }
      if (config.sms.provider === 'twilio') {
        if (!config.sms.config?.accountSid || !config.sms.config?.authToken) {
          return { valid: false, error: 'Twilio credentials are required' };
        }
      }
    }

    // Validate Discord configuration
    if (config.discord?.enabled) {
      if (!config.discord.webhookUrl) {
        return { valid: false, error: 'Discord webhook URL is required' };
      }
    }

    // Validate PagerDuty configuration
    if (config.pagerduty?.enabled) {
      if (!config.pagerduty.routingKey) {
        return { valid: false, error: 'PagerDuty routing key is required' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid configuration format' };
  }
}