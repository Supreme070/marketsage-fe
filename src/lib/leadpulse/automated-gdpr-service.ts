/**
 * Automated GDPR Service for LeadPulse
 * 
 * Provides automated data retention, consent management, and compliance monitoring
 * Built on top of the existing GDPR compliance manager
 */

import { EventEmitter } from 'events';
import prisma from '@/lib/db/prisma';
import { gdprComplianceManager } from './gdpr-compliance';
import { logger } from '@/lib/logger';
import { leadPulseSecurityManager } from './security-manager';

interface RetentionRule {
  id: string;
  name: string;
  enabled: boolean;
  dataType: 'visitor' | 'contact' | 'touchpoint' | 'form_submission' | 'consent';
  retentionPeriod: number; // days
  conditions: {
    hasConsent?: boolean;
    consentType?: string;
    lastActivity?: number; // days since last activity
    dataCategory?: string;
    region?: string;
  };
  actions: {
    notify?: boolean;
    anonymize?: boolean;
    delete?: boolean;
    archive?: boolean;
  };
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    timezone: string;
  };
}

interface ConsentReminder {
  id: string;
  email: string;
  consentType: string;
  purpose: string;
  grantedAt: Date;
  reminderDate: Date;
  remindersSent: number;
  maxReminders: number;
  status: 'pending' | 'sent' | 'renewed' | 'expired';
}

interface ComplianceAlert {
  id: string;
  type: 'data_retention' | 'consent_expiry' | 'data_breach' | 'access_request' | 'erasure_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

class AutomatedGDPRService extends EventEmitter {
  private static instance: AutomatedGDPRService;
  private retentionRules: Map<string, RetentionRule> = new Map();
  private isRunning = false;
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private complianceAlerts: Map<string, ComplianceAlert> = new Map();
  private consentReminders: Map<string, ConsentReminder> = new Map();
  private lastProcessingRun: Date | null = null;

  static getInstance(): AutomatedGDPRService {
    if (!AutomatedGDPRService.instance) {
      AutomatedGDPRService.instance = new AutomatedGDPRService();
    }
    return AutomatedGDPRService.instance;
  }

  private constructor() {
    super();
    this.setupDefaultRetentionRules();
    this.setupPeriodicTasks();
  }

  /**
   * Start the automated GDPR service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Automated GDPR service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting automated GDPR service');

    try {
      // Load existing retention rules from database
      await this.loadRetentionRules();
      
      // Load pending consent reminders
      await this.loadConsentReminders();
      
      // Schedule retention tasks
      await this.scheduleRetentionTasks();
      
      // Start compliance monitoring
      this.startComplianceMonitoring();
      
      // Initial processing run
      await this.processDataRetention();
      
      this.emit('service_started');
      logger.info('Automated GDPR service started successfully');
      
    } catch (error) {
      logger.error('Failed to start automated GDPR service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the automated GDPR service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping automated GDPR service');

    // Clear all scheduled tasks
    for (const [taskId, timeout] of this.scheduledTasks) {
      clearTimeout(timeout);
    }
    this.scheduledTasks.clear();

    this.emit('service_stopped');
    logger.info('Automated GDPR service stopped');
  }

  /**
   * Add a new retention rule
   */
  async addRetentionRule(rule: Omit<RetentionRule, 'id'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: RetentionRule = {
      id: ruleId,
      ...rule
    };

    // Store in database
    await prisma.leadPulseRetentionRule.create({
      data: {
        id: ruleId,
        name: rule.name,
        enabled: rule.enabled,
        dataType: rule.dataType,
        retentionPeriod: rule.retentionPeriod,
        conditions: rule.conditions,
        actions: rule.actions,
        schedule: rule.schedule
      }
    });

    this.retentionRules.set(ruleId, fullRule);
    
    // Reschedule tasks if service is running
    if (this.isRunning) {
      await this.scheduleRetentionTasks();
    }

    this.emit('rule_added', fullRule);
    logger.info(`Retention rule added: ${rule.name}`);
    
    return ruleId;
  }

  /**
   * Process data retention according to rules
   */
  async processDataRetention(): Promise<{
    processed: number;
    deleted: number;
    anonymized: number;
    archived: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const results = {
      processed: 0,
      deleted: 0,
      anonymized: 0,
      archived: 0,
      errors: [] as string[]
    };

    try {
      logger.info('Starting automated data retention processing');

      for (const rule of this.retentionRules.values()) {
        if (!rule.enabled) continue;

        try {
          const ruleResults = await this.processRetentionRule(rule);
          results.processed += ruleResults.processed;
          results.deleted += ruleResults.deleted;
          results.anonymized += ruleResults.anonymized;
          results.archived += ruleResults.archived;
          
        } catch (error) {
          const errorMsg = `Error processing rule ${rule.name}: ${error}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg, error);
        }
      }

      // Process base retention from existing system
      const baseResults = await gdprComplianceManager.processDataRetention();
      results.processed += baseResults.processed;
      results.deleted += baseResults.processed;

      this.lastProcessingRun = new Date();
      
      const duration = Date.now() - startTime;
      logger.info(`Data retention processing completed in ${duration}ms`, results);

      // Create compliance alert if significant activity
      if (results.processed > 0) {
        await this.createComplianceAlert({
          type: 'data_retention',
          severity: 'low',
          message: `Automated data retention processed ${results.processed} items`,
          details: results
        });
      }

      this.emit('retention_processed', results);
      return results;

    } catch (error) {
      logger.error('Error in automated data retention processing:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  /**
   * Process consent renewal reminders
   */
  async processConsentReminders(): Promise<{
    reminders: number;
    renewed: number;
    expired: number;
  }> {
    const results = {
      reminders: 0,
      renewed: 0,
      expired: 0
    };

    try {
      const now = new Date();
      
      // Find consents that need renewal reminders
      const expiringSoonConsents = await prisma.leadPulseConsent.findMany({
        where: {
          granted: true,
          withdrawnAt: null,
          consentType: 'MARKETING', // Marketing consents expire after 2 years
          grantedAt: {
            lte: new Date(now.getTime() - 630 * 24 * 60 * 60 * 1000) // 21 months ago
          }
        }
      });

      for (const consent of expiringSoonConsents) {
        const reminderKey = `${consent.email}_${consent.consentType}_${consent.purpose}`;
        
        if (!this.consentReminders.has(reminderKey)) {
          // Create new reminder
          const reminder: ConsentReminder = {
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: consent.email,
            consentType: consent.consentType,
            purpose: consent.purpose,
            grantedAt: consent.grantedAt!,
            reminderDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            remindersSent: 0,
            maxReminders: 3,
            status: 'pending'
          };

          this.consentReminders.set(reminderKey, reminder);
          results.reminders++;
        }
      }

      // Process pending reminders
      for (const [key, reminder] of this.consentReminders) {
        if (reminder.status === 'pending' && now >= reminder.reminderDate) {
          if (reminder.remindersSent < reminder.maxReminders) {
            await this.sendConsentReminder(reminder);
            reminder.remindersSent++;
            reminder.reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next reminder in 7 days
            
            if (reminder.remindersSent >= reminder.maxReminders) {
              reminder.status = 'expired';
              results.expired++;
            }
            
            results.reminders++;
          }
        }
      }

      this.emit('consent_reminders_processed', results);
      return results;

    } catch (error) {
      logger.error('Error processing consent reminders:', error);
      return results;
    }
  }

  /**
   * Monitor compliance and create alerts
   */
  async monitorCompliance(): Promise<void> {
    try {
      const now = new Date();
      
      // Check for data retention violations
      const retentionViolations = await prisma.leadPulseVisitor.count({
        where: {
          createdAt: {
            lt: new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000) // 3 years old
          }
        }
      });

      if (retentionViolations > 0) {
        await this.createComplianceAlert({
          type: 'data_retention',
          severity: 'high',
          message: `${retentionViolations} visitor records exceed 3-year retention limit`,
          details: { count: retentionViolations, type: 'visitor' }
        });
      }

      // Check for consent expiry
      const expiredConsents = await prisma.leadPulseConsent.count({
        where: {
          granted: true,
          withdrawnAt: null,
          consentType: 'MARKETING',
          grantedAt: {
            lt: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000) // 2 years old
          }
        }
      });

      if (expiredConsents > 0) {
        await this.createComplianceAlert({
          type: 'consent_expiry',
          severity: 'medium',
          message: `${expiredConsents} marketing consents have expired`,
          details: { count: expiredConsents, type: 'marketing' }
        });
      }

      // Check for unprocessed data subject requests
      const pendingRequests = await prisma.leadPulseDataSubjectRequest.count({
        where: {
          status: 'pending',
          createdAt: {
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days old
          }
        }
      });

      if (pendingRequests > 0) {
        await this.createComplianceAlert({
          type: 'access_request',
          severity: 'critical',
          message: `${pendingRequests} data subject requests are overdue`,
          details: { count: pendingRequests, overdueThreshold: 30 }
        });
      }

      this.emit('compliance_monitored');

    } catch (error) {
      logger.error('Error in compliance monitoring:', error);
    }
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(): Promise<{
    summary: {
      totalConsents: number;
      activeConsents: number;
      expiredConsents: number;
      pendingRequests: number;
      retentionRules: number;
      alertsCount: number;
    };
    alerts: ComplianceAlert[];
    recentActivity: any[];
    retentionStats: any;
  }> {
    try {
      const [
        totalConsents,
        activeConsents,
        expiredConsents,
        pendingRequests,
        recentActivity
      ] = await Promise.all([
        prisma.leadPulseConsent.count(),
        prisma.leadPulseConsent.count({
          where: {
            granted: true,
            withdrawnAt: null
          }
        }),
        prisma.leadPulseConsent.count({
          where: {
            granted: true,
            withdrawnAt: null,
            consentType: 'MARKETING',
            grantedAt: {
              lt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.leadPulseDataSubjectRequest.count({
          where: { status: 'pending' }
        }),
        prisma.leadPulseAuditLog.findMany({
          where: {
            action: {
              in: ['DATA_RETENTION', 'CONSENT_GRANTED', 'CONSENT_WITHDRAWN', 'DATA_DELETED']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      const summary = {
        totalConsents,
        activeConsents,
        expiredConsents,
        pendingRequests,
        retentionRules: this.retentionRules.size,
        alertsCount: this.complianceAlerts.size
      };

      const alerts = Array.from(this.complianceAlerts.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20);

      const retentionStats = {
        lastProcessingRun: this.lastProcessingRun,
        activeRules: Array.from(this.retentionRules.values()).filter(r => r.enabled).length,
        scheduledTasks: this.scheduledTasks.size
      };

      return {
        summary,
        alerts,
        recentActivity,
        retentionStats
      };

    } catch (error) {
      logger.error('Error getting compliance dashboard data:', error);
      throw error;
    }
  }

  /**
   * Create a compliance alert
   */
  private async createComplianceAlert(alertData: Omit<ComplianceAlert, 'id' | 'createdAt' | 'resolved'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: ComplianceAlert = {
      id: alertId,
      createdAt: new Date(),
      resolved: false,
      ...alertData
    };

    this.complianceAlerts.set(alertId, alert);

    // Store in database
    await prisma.leadPulseComplianceAlert.create({
      data: {
        id: alertId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        resolved: false
      }
    });

    this.emit('alert_created', alert);
    logger.warn(`Compliance alert created: ${alert.message}`, alert);

    return alertId;
  }

  /**
   * Process a single retention rule
   */
  private async processRetentionRule(rule: RetentionRule): Promise<{
    processed: number;
    deleted: number;
    anonymized: number;
    archived: number;
  }> {
    const results = {
      processed: 0,
      deleted: 0,
      anonymized: 0,
      archived: 0
    };

    const cutoffDate = new Date(Date.now() - rule.retentionPeriod * 24 * 60 * 60 * 1000);
    
    try {
      switch (rule.dataType) {
        case 'visitor':
          const visitors = await prisma.leadPulseVisitor.findMany({
            where: {
              createdAt: { lt: cutoffDate },
              ...this.buildWhereClause(rule.conditions)
            },
            take: 100 // Process in batches
          });

          for (const visitor of visitors) {
            await this.processDataItem(visitor, rule.actions);
            results.processed++;
          }
          break;

        case 'contact':
          const contacts = await prisma.contact.findMany({
            where: {
              createdAt: { lt: cutoffDate },
              ...this.buildWhereClause(rule.conditions)
            },
            take: 100
          });

          for (const contact of contacts) {
            if (rule.actions.delete) {
              await gdprComplianceManager.handleErasureRequest(contact.email, `Automatic retention rule: ${rule.name}`);
              results.deleted++;
            }
            results.processed++;
          }
          break;

        case 'touchpoint':
          const touchpoints = await prisma.leadPulseTouchpoint.findMany({
            where: {
              createdAt: { lt: cutoffDate },
              ...this.buildWhereClause(rule.conditions)
            },
            take: 100
          });

          for (const touchpoint of touchpoints) {
            await this.processDataItem(touchpoint, rule.actions);
            results.processed++;
          }
          break;
      }

      return results;

    } catch (error) {
      logger.error(`Error processing retention rule ${rule.name}:`, error);
      throw error;
    }
  }

  /**
   * Process a single data item according to actions
   */
  private async processDataItem(item: any, actions: RetentionRule['actions']): Promise<void> {
    try {
      if (actions.delete) {
        // Delete the item
        await this.deleteDataItem(item);
      } else if (actions.anonymize) {
        // Anonymize the item
        await this.anonymizeDataItem(item);
      } else if (actions.archive) {
        // Archive the item
        await this.archiveDataItem(item);
      }
    } catch (error) {
      logger.error(`Error processing data item ${item.id}:`, error);
    }
  }

  /**
   * Send consent renewal reminder
   */
  private async sendConsentReminder(reminder: ConsentReminder): Promise<void> {
    try {
      // In a real implementation, this would send an email
      logger.info(`Sending consent reminder to ${reminder.email}`, reminder);
      
      // Log the reminder activity
      await leadPulseSecurityManager.logDataProcessingActivity({
        type: 'PROCESSING',
        dataSubject: reminder.email,
        dataTypes: ['consent'],
        purpose: 'Consent renewal reminder',
        legalBasis: 'legitimate_interest'
      });

      this.emit('consent_reminder_sent', reminder);
      
    } catch (error) {
      logger.error('Error sending consent reminder:', error);
    }
  }

  /**
   * Setup default retention rules
   */
  private setupDefaultRetentionRules(): void {
    // Default rules will be loaded from database
    // This is just a placeholder for initialization
  }

  /**
   * Setup periodic tasks
   */
  private setupPeriodicTasks(): void {
    // Daily data retention processing
    this.scheduleTask('daily_retention', () => {
      this.processDataRetention();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Weekly consent reminder processing
    this.scheduleTask('weekly_consent_reminders', () => {
      this.processConsentReminders();
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

    // Hourly compliance monitoring
    this.scheduleTask('hourly_compliance', () => {
      this.monitorCompliance();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Schedule a recurring task
   */
  private scheduleTask(taskId: string, task: () => void, interval: number): void {
    const existingTask = this.scheduledTasks.get(taskId);
    if (existingTask) {
      clearTimeout(existingTask);
    }

    const timeout = setTimeout(() => {
      task();
      this.scheduleTask(taskId, task, interval); // Reschedule
    }, interval);

    this.scheduledTasks.set(taskId, timeout);
  }

  /**
   * Load retention rules from database
   */
  private async loadRetentionRules(): Promise<void> {
    try {
      const rules = await prisma.leadPulseRetentionRule.findMany({
        where: { enabled: true }
      });

      for (const rule of rules) {
        this.retentionRules.set(rule.id, rule as RetentionRule);
      }

      logger.info(`Loaded ${rules.length} retention rules`);
    } catch (error) {
      logger.error('Error loading retention rules:', error);
    }
  }

  /**
   * Load consent reminders from database
   */
  private async loadConsentReminders(): Promise<void> {
    // Implementation would load from database
    // For now, starting fresh each time
  }

  /**
   * Schedule retention tasks based on rules
   */
  private async scheduleRetentionTasks(): Promise<void> {
    // Clear existing scheduled tasks
    for (const [taskId, timeout] of this.scheduledTasks) {
      if (taskId.startsWith('retention_')) {
        clearTimeout(timeout);
        this.scheduledTasks.delete(taskId);
      }
    }

    // Schedule new tasks based on rules
    for (const rule of this.retentionRules.values()) {
      if (rule.enabled) {
        const taskId = `retention_${rule.id}`;
        const interval = this.getScheduleInterval(rule.schedule);
        
        this.scheduleTask(taskId, () => {
          this.processRetentionRule(rule);
        }, interval);
      }
    }
  }

  /**
   * Start compliance monitoring
   */
  private startComplianceMonitoring(): void {
    // Initial monitoring run
    this.monitorCompliance();
    
    // Schedule regular monitoring
    this.scheduleTask('compliance_monitoring', () => {
      this.monitorCompliance();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Build where clause for retention conditions
   */
  private buildWhereClause(conditions: RetentionRule['conditions']): any {
    const whereClause: any = {};
    
    // Add condition logic here based on the conditions object
    // This is a simplified implementation
    
    return whereClause;
  }

  /**
   * Get schedule interval in milliseconds
   */
  private getScheduleInterval(schedule: RetentionRule['schedule']): number {
    switch (schedule.frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Helper methods for data operations
   */
  private async deleteDataItem(item: any): Promise<void> {
    // Implementation depends on item type
  }

  private async anonymizeDataItem(item: any): Promise<void> {
    // Implementation depends on item type
  }

  private async archiveDataItem(item: any): Promise<void> {
    // Implementation depends on item type
  }
}

export const automatedGDPRService = AutomatedGDPRService.getInstance();
export default automatedGDPRService;