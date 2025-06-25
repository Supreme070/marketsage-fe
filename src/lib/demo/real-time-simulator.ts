/**
 * Real-Time Demo Magic Simulator
 * 
 * Creates live demo magic by simulating real-time visitor activity,
 * form submissions, alerts, and notifications to make LeadPulse demos
 * feel dynamic and engaging during presentations.
 */

import { faker } from '@faker-js/faker';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface SimulatorConfig {
  duration: number; // minutes
  visitorsPerMinute: number;
  formSubmissionRate: number; // percentage of visitors who submit forms
  alertFrequency: number; // alerts per hour
  enableNotifications: boolean;
  enableAlerts: boolean;
  enableLiveVisitors: boolean;
}

export class RealTimeDemoSimulator {
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];
  private config: SimulatorConfig;

  constructor(config: Partial<SimulatorConfig> = {}) {
    this.config = {
      duration: 30, // 30 minutes default
      visitorsPerMinute: 8,
      formSubmissionRate: 12,
      alertFrequency: 6,
      enableNotifications: true,
      enableAlerts: true,
      enableLiveVisitors: true,
      ...config
    };
  }

  /**
   * Start the real-time demo simulation
   */
  async startSimulation(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ Demo simulator is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🎬 Starting real-time demo magic simulation...');
    logger.info(`📊 Configuration:`);
    logger.info(`   • Duration: ${this.config.duration} minutes`);
    logger.info(`   • Visitors per minute: ${this.config.visitorsPerMinute}`);
    logger.info(`   • Form submission rate: ${this.config.formSubmissionRate}%`);
    logger.info(`   • Alert frequency: ${this.config.alertFrequency}/hour`);
    logger.info('');

    // Start live visitor simulation
    if (this.config.enableLiveVisitors) {
      this.startLiveVisitorSimulation();
    }

    // Start form submission simulation
    this.startFormSubmissionSimulation();

    // Start alert simulation
    if (this.config.enableAlerts) {
      this.startAlertSimulation();
    }

    // Start notification simulation
    if (this.config.enableNotifications) {
      this.startNotificationSimulation();
    }

    // Auto-stop after duration
    setTimeout(() => {
      this.stopSimulation();
    }, this.config.duration * 60 * 1000);

    logger.info('✨ Real-time demo magic is now active!');
  }

  /**
   * Stop the simulation
   */
  stopSimulation(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    logger.info('🛑 Demo simulation stopped');
  }

  /**
   * Simulate live visitors arriving
   */
  private startLiveVisitorSimulation(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Generate random number of visitors (within range)
        const baseVisitors = this.config.visitorsPerMinute;
        const variance = Math.floor(baseVisitors * 0.5);
        const visitorCount = baseVisitors + Math.floor(Math.random() * variance) - Math.floor(variance / 2);

        for (let i = 0; i < visitorCount; i++) {
          await this.simulateNewVisitor();
        }

        logger.info(`👥 ${visitorCount} live visitors simulated`);
      } catch (error) {
        logger.error('❌ Error simulating live visitors:', error);
      }
    }, 60000); // Every minute

    this.intervals.push(interval);
  }

  /**
   * Simulate form submissions
   */
  private startFormSubmissionSimulation(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Check if we should generate a form submission
        if (Math.random() * 100 < this.config.formSubmissionRate) {
          await this.simulateFormSubmission();
        }
      } catch (error) {
        logger.error('❌ Error simulating form submission:', error);
      }
    }, 15000); // Every 15 seconds

    this.intervals.push(interval);
  }

  /**
   * Simulate alerts and notifications
   */
  private startAlertSimulation(): void {
    const alertInterval = (60 / this.config.alertFrequency) * 60 * 1000; // Convert to milliseconds

    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.simulateAlert();
      } catch (error) {
        logger.error('❌ Error simulating alert:', error);
      }
    }, alertInterval);

    this.intervals.push(interval);
  }

  /**
   * Simulate system notifications
   */
  private startNotificationSimulation(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Randomly generate notifications
        if (Math.random() < 0.3) { // 30% chance every interval
          await this.simulateNotification();
        }
      } catch (error) {
        logger.error('❌ Error simulating notification:', error);
      }
    }, 45000); // Every 45 seconds

    this.intervals.push(interval);
  }

  /**
   * Generate a realistic new visitor
   */
  private async simulateNewVisitor(): Promise<void> {
    const visitor = {
      fingerprint: this.generateFingerprint(),
      engagementScore: Math.floor(Math.random() * 100),
      city: this.selectRandomCity(),
      country: this.selectRandomCountry(),
      device: this.selectRandomDevice(),
      browser: this.selectRandomBrowser(),
      score: Math.floor(Math.random() * 100),
      metadata: {
        company: 'TechFlow Solutions',
        industry: 'SaaS',
        segment: this.selectRandomSegment(),
        source: this.selectRandomSource(),
        isLiveDemo: true,
        simulatedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.leadPulseVisitor.create({
      data: visitor,
      skipDuplicates: true
    });

    // Generate a few touchpoints for this visitor
    await this.simulateVisitorTouchpoints(visitor.fingerprint);
  }

  /**
   * Simulate form submission
   */
  private async simulateFormSubmission(): Promise<void> {
    // Get a random recent visitor
    const recentVisitor = await this.getRandomRecentVisitor();
    if (!recentVisitor) return;

    // Get available forms
    const forms = await prisma.leadPulseForm.findMany({
      where: { status: 'ACTIVE' },
      take: 5
    });

    if (forms.length === 0) return;

    const randomForm = forms[Math.floor(Math.random() * forms.length)];

    const submission = {
      id: faker.string.uuid(),
      formId: randomForm.id,
      visitorId: recentVisitor.id,
      status: 'COMPLETED',
      submittedAt: new Date(),
      score: Math.floor(Math.random() * 100),
      metadata: {
        isLiveDemo: true,
        simulatedAt: new Date().toISOString(),
        formName: randomForm.name,
        completionTime: Math.floor(Math.random() * 180) + 30, // 30-210 seconds
      }
    };

    await prisma.leadPulseFormSubmission.create({
      data: submission
    });

    logger.info(`📝 Live form submission: ${randomForm.name}`);
  }

  /**
   * Simulate system alerts
   */
  private async simulateAlert(): Promise<void> {
    const alertTypes = [
      {
        type: 'high_value_visitor',
        title: 'High-Value Visitor Detected',
        message: 'Enterprise visitor from Lagos exploring pricing page',
        priority: 'high'
      },
      {
        type: 'form_abandonment',
        title: 'Form Abandonment Alert',
        message: 'Visitor abandoned demo request form at 80% completion',
        priority: 'medium'
      },
      {
        type: 'conversion_spike',
        title: 'Conversion Spike',
        message: 'Trial signups increased 40% in the last hour',
        priority: 'info'
      },
      {
        type: 'geographic_interest',
        title: 'Geographic Interest Alert',
        message: 'Unusual activity from Nairobi tech hub detected',
        priority: 'info'
      },
      {
        type: 'competitor_analysis',
        title: 'Competitor Research Detected',
        message: 'Visitor comparing features with competitor tools',
        priority: 'medium'
      }
    ];

    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    await prisma.leadPulseAlert.create({
      data: {
        id: faker.string.uuid(),
        type: alert.type,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        status: 'ACTIVE',
        metadata: {
          isLiveDemo: true,
          simulatedAt: new Date().toISOString(),
          source: 'real_time_simulator'
        },
        createdAt: new Date(),
        triggeredAt: new Date(),
      }
    });

    logger.info(`🚨 Alert triggered: ${alert.title}`);
  }

  /**
   * Simulate system notifications
   */
  private async simulateNotification(): Promise<void> {
    const notifications = [
      {
        title: 'CRM Sync Complete',
        message: '47 new leads synced to Salesforce',
        type: 'success',
        category: 'integration'
      },
      {
        title: 'Weekly Report Ready',
        message: 'TechFlow Solutions performance report is available',
        type: 'info',
        category: 'reports'
      },
      {
        title: 'API Rate Limit Warning',
        message: 'Approaching API rate limit for HubSpot integration',
        type: 'warning',
        category: 'system'
      },
      {
        title: 'New High-Score Visitor',
        message: 'Visitor achieved engagement score of 95/100',
        type: 'success',
        category: 'visitors'
      }
    ];

    const notification = notifications[Math.floor(Math.random() * notifications.length)];

    // Try to find a demo user, or create a default one
    let userId = 'demo-user-001';
    try {
      const demoUser = await prisma.user.findFirst({
        where: { email: { contains: 'demo' } }
      });
      if (demoUser) userId = demoUser.id;
    } catch (error) {
      // Use default demo user ID
    }

    await prisma.notification.create({
      data: {
        id: faker.string.uuid(),
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        read: false,
        timestamp: new Date(),
      }
    });

    logger.info(`🔔 Notification: ${notification.title}`);
  }

  /**
   * Simulate visitor touchpoints
   */
  private async simulateVisitorTouchpoints(visitorFingerprint: string): Promise<void> {
    const touchpointCount = Math.floor(Math.random() * 5) + 1; // 1-5 touchpoints

    for (let i = 0; i < touchpointCount; i++) {
      const pages = [
        { url: '/features', title: 'Features - AI-Powered Project Management' },
        { url: '/pricing', title: 'Pricing - TechFlow Solutions' },
        { url: '/demo', title: 'Request Demo - TechFlow Solutions' },
        { url: '/case-studies', title: 'Case Studies - Success Stories' },
        { url: '/api-docs', title: 'API Documentation' }
      ];

      const page = pages[Math.floor(Math.random() * pages.length)];
      const timeOnPage = Math.floor(Math.random() * 300) + 30; // 30-330 seconds

      await prisma.leadPulsePageView.create({
        data: {
          id: faker.string.uuid(),
          visitorId: visitorFingerprint,
          url: `https://techflowsolutions.com${page.url}`,
          title: page.title,
          timestamp: new Date(Date.now() - Math.random() * 300000), // Within last 5 minutes
          timeOnPage,
          metadata: {
            isLiveDemo: true,
            simulatedAt: new Date().toISOString(),
          }
        }
      });
    }
  }

  // Helper methods
  private generateFingerprint(): string {
    return `fp_live_${faker.string.alphanumeric(16)}`;
  }

  private selectRandomCity(): string {
    const cities = ['Lagos', 'Nairobi', 'Accra', 'Cape Town', 'Cairo', 'Johannesburg', 'Abuja', 'Kumasi'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  private selectRandomCountry(): string {
    const countries = ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt', 'Tanzania'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  private selectRandomDevice(): string {
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const weights = [60, 35, 5];
    return this.weightedRandomSelect(devices, weights);
  }

  private selectRandomBrowser(): string {
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const weights = [65, 20, 10, 5];
    return this.weightedRandomSelect(browsers, weights);
  }

  private selectRandomSegment(): string {
    const segments = ['enterprise', 'midmarket', 'smallbusiness', 'freelancer'];
    const weights = [15, 35, 45, 5];
    return this.weightedRandomSelect(segments, weights);
  }

  private selectRandomSource(): string {
    const sources = ['organic', 'linkedin', 'direct', 'referral', 'twitter', 'github'];
    const weights = [35, 25, 15, 10, 8, 7];
    return this.weightedRandomSelect(sources, weights);
  }

  private weightedRandomSelect(items: string[], weights: number[]): string {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return items[i];
      }
    }
    
    return items[0];
  }

  private async getRandomRecentVisitor(): Promise<any> {
    try {
      const visitors = await prisma.leadPulseVisitor.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });

      if (visitors.length === 0) return null;
      return visitors[Math.floor(Math.random() * visitors.length)];
    } catch (error) {
      logger.error('Error getting random visitor:', error);
      return null;
    }
  }

  /**
   * Get simulation status
   */
  getStatus(): { isRunning: boolean; config: SimulatorConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

// Export default instance
export const demoSimulator = new RealTimeDemoSimulator();