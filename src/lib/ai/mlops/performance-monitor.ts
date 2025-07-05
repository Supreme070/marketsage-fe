/**
 * Performance Monitoring System
 * Real-time monitoring and alerting for ML models
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import { errorBoundary } from '../utils/error-boundary';
import { NeuralNetworkPredictor } from '../supreme-ai-engine';

interface PerformanceMetrics {
  accuracy: number;
  loss: number;
  latency: number;
  throughput: number;
  memoryUsage: number;
  timestamp: Date;
}

interface DataDriftMetrics {
  driftScore: number;
  featureImportance: Record<string, number>;
  timestamp: Date;
}

interface AlertConfig {
  metricThresholds: {
    minAccuracy: number;
    maxLoss: number;
    maxLatency: number;
    minThroughput: number;
    maxDrift: number;
  };
  alertChannels: ('email' | 'slack' | 'webhook')[];
  cooldownPeriod: number; // milliseconds
}

interface Alert {
  modelId: string;
  type: 'performance' | 'drift' | 'resource';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metrics: Partial<PerformanceMetrics & DataDriftMetrics>;
  timestamp: Date;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private driftMetrics: Map<string, DataDriftMetrics[]> = new Map();
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private lastAlerts: Map<string, Date> = new Map();
  private readonly metricsRetention = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    super();
    // Start periodic cleanup
    setInterval(() => this.cleanupOldMetrics(), 24 * 60 * 60 * 1000);
  }

  async recordPrediction(
    modelId: string,
    input: any,
    output: any,
    groundTruth?: any
  ): Promise<void> {
    try {
      const startTime = Date.now();
      const metrics = await this.calculateMetrics(modelId, input, output, groundTruth);
      
      // Store metrics
      if (!this.metrics.has(modelId)) {
        this.metrics.set(modelId, []);
      }
      this.metrics.get(modelId)!.push(metrics);

      // Check for drift
      const drift = await this.calculateDataDrift(modelId, input);
      if (!this.driftMetrics.has(modelId)) {
        this.driftMetrics.set(modelId, []);
      }
      this.driftMetrics.get(modelId)!.push(drift);

      // Check alerts
      await this.checkAlerts(modelId, metrics, drift);

      logger.info('Recorded model prediction', {
        modelId,
        accuracy: metrics.accuracy,
        latency: metrics.latency
      });
    } catch (error) {
      throw errorBoundary.handleError(error, 'PerformanceMonitor.recordPrediction');
    }
  }

  async getModelPerformance(
    modelId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<PerformanceMetrics> {
    try {
      const metrics = this.metrics.get(modelId) || [];
      const filteredMetrics = timeRange
        ? metrics.filter(m =>
            m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
          )
        : metrics;

      if (filteredMetrics.length === 0) {
        return {
          accuracy: 0,
          loss: 0,
          latency: 0,
          throughput: 0,
          memoryUsage: 0,
          timestamp: new Date()
        };
      }

      // Calculate averages
      return {
        accuracy: this.average(filteredMetrics.map(m => m.accuracy)),
        loss: this.average(filteredMetrics.map(m => m.loss)),
        latency: this.average(filteredMetrics.map(m => m.latency)),
        throughput: this.average(filteredMetrics.map(m => m.throughput)),
        memoryUsage: this.average(filteredMetrics.map(m => m.memoryUsage)),
        timestamp: new Date()
      };
    } catch (error) {
      throw errorBoundary.handleError(error, 'PerformanceMonitor.getModelPerformance');
    }
  }

  async getDataDrift(modelId: string): Promise<number> {
    try {
      const drifts = this.driftMetrics.get(modelId) || [];
      if (drifts.length === 0) return 0;

      // Return latest drift score
      return drifts[drifts.length - 1].driftScore;
    } catch (error) {
      throw errorBoundary.handleError(error, 'PerformanceMonitor.getDataDrift');
    }
  }

  setAlertConfig(modelId: string, config: AlertConfig): void {
    this.alertConfigs.set(modelId, config);
  }

  private async calculateMetrics(
    modelId: string,
    input: any,
    output: any,
    groundTruth?: any
  ): Promise<PerformanceMetrics> {
    const startTime = process.hrtime();
    const memUsage = process.memoryUsage();

    // Calculate basic metrics
    const metrics: PerformanceMetrics = {
      accuracy: groundTruth ? this.calculateAccuracy(output, groundTruth) : 1,
      loss: groundTruth ? this.calculateLoss(output, groundTruth) : 0,
      latency: process.hrtime(startTime)[1] / 1000000, // Convert to ms
      throughput: 1000 / (process.hrtime(startTime)[1] / 1000000), // Requests per second
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // MB
      timestamp: new Date()
    };

    return metrics;
  }

  private async calculateDataDrift(
    modelId: string,
    input: any
  ): Promise<DataDriftMetrics> {
    // Implement drift detection logic
    // This is a placeholder implementation
    return {
      driftScore: Math.random() * 0.1, // Example drift score
      featureImportance: {},
      timestamp: new Date()
    };
  }

  private async checkAlerts(
    modelId: string,
    metrics: PerformanceMetrics,
    drift: DataDriftMetrics
  ): Promise<void> {
    const config = this.alertConfigs.get(modelId);
    if (!config) return;

    const lastAlert = this.lastAlerts.get(modelId);
    if (lastAlert && Date.now() - lastAlert.getTime() < config.cooldownPeriod) {
      return;
    }

    const alerts: Alert[] = [];

    // Check performance metrics
    if (metrics.accuracy < config.metricThresholds.minAccuracy) {
      alerts.push({
        modelId,
        type: 'performance',
        severity: 'critical',
        message: `Model accuracy below threshold: ${metrics.accuracy}`,
        metrics,
        timestamp: new Date()
      });
    }

    if (metrics.loss > config.metricThresholds.maxLoss) {
      alerts.push({
        modelId,
        type: 'performance',
        severity: 'warning',
        message: `Model loss above threshold: ${metrics.loss}`,
        metrics,
        timestamp: new Date()
      });
    }

    // Check drift
    if (drift.driftScore > config.metricThresholds.maxDrift) {
      alerts.push({
        modelId,
        type: 'drift',
        severity: 'warning',
        message: `Data drift detected: ${drift.driftScore}`,
        metrics: drift,
        timestamp: new Date()
      });
    }

    // Send alerts
    if (alerts.length > 0) {
      await this.sendAlerts(alerts, config.alertChannels);
      this.lastAlerts.set(modelId, new Date());
      
      // Emit performance degradation event
      const performanceAlert = alerts.find(a => a.type === 'performance');
      if (performanceAlert) {
        this.emit('performanceDegraded', {
          modelId,
          metrics: avgMetrics,
          alert: performanceAlert
        });
      }
    }
  }

  private async sendAlerts(alerts: Alert[], channels: AlertConfig['alertChannels']): Promise<void> {
    for (const alert of alerts) {
      logger.warn('Model alert', {
        modelId: alert.modelId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message
      });

      // Implement actual alert sending logic here
      // This is a placeholder implementation
      for (const channel of channels) {
        switch (channel) {
          case 'email':
            // Send email alert
            break;
          case 'slack':
            // Send Slack notification
            break;
          case 'webhook':
            // Send webhook notification
            break;
        }
      }
    }
  }

  private calculateAccuracy(output: any, groundTruth: any): number {
    // Implement accuracy calculation
    // This is a placeholder implementation
    return 0.95;
  }

  private calculateLoss(output: any, groundTruth: any): number {
    // Implement loss calculation
    // This is a placeholder implementation
    return 0.05;
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetention;

    for (const [modelId, metrics] of this.metrics.entries()) {
      this.metrics.set(
        modelId,
        metrics.filter(m => m.timestamp.getTime() > cutoff)
      );
    }

    for (const [modelId, drifts] of this.driftMetrics.entries()) {
      this.driftMetrics.set(
        modelId,
        drifts.filter(d => d.timestamp.getTime() > cutoff)
      );
    }
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor(); 