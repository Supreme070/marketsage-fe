/**
 * ML Model Monitoring & Drift Detection
 */
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export interface ModelPerformance {
  modelId: string;
  date: Date;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  predictionCount: number;
  avgConfidence: number;
}

export interface DriftAlert {
  type: 'performance' | 'data' | 'concept';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metrics: Record<string, number>;
  recommendedAction: string;
}

export class ModelMonitor {
  private performanceThresholds = {
    accuracy: 0.8,
    precision: 0.75,
    recall: 0.75,
    f1Score: 0.75,
    driftThreshold: 0.1 // 10% performance drop triggers alert
  };

  async monitorModelPerformance(modelId: string): Promise<DriftAlert[]> {
    const alerts: DriftAlert[] = [];
    
    // Get recent performance data
    const recentPerformance = await this.getRecentPerformance(modelId);
    const historicalPerformance = await this.getHistoricalPerformance(modelId);
    
    // Check for performance drift
    const performanceDrift = this.detectPerformanceDrift(recentPerformance, historicalPerformance);
    if (performanceDrift) {
      alerts.push(performanceDrift);
    }
    
    // Check for data drift
    const dataDrift = await this.detectDataDrift(modelId);
    if (dataDrift) {
      alerts.push(dataDrift);
    }
    
    // Check prediction patterns
    const conceptDrift = await this.detectConceptDrift(modelId);
    if (conceptDrift) {
      alerts.push(conceptDrift);
    }
    
    // Log alerts
    for (const alert of alerts) {
      await this.logAlert(modelId, alert);
    }
    
    return alerts;
  }

  private detectPerformanceDrift(
    recent: ModelPerformance[], 
    historical: ModelPerformance[]
  ): DriftAlert | null {
    if (recent.length === 0 || historical.length === 0) return null;
    
    const recentAvg = this.calculateAveragePerformance(recent);
    const historicalAvg = this.calculateAveragePerformance(historical);
    
    const accuracyDrop = historicalAvg.accuracy - recentAvg.accuracy;
    const f1Drop = historicalAvg.f1Score - recentAvg.f1Score;
    
    if (accuracyDrop > this.performanceThresholds.driftThreshold ||
        f1Drop > this.performanceThresholds.driftThreshold) {
      
      const severity = accuracyDrop > 0.2 ? 'high' : accuracyDrop > 0.15 ? 'medium' : 'low';
      
      return {
        type: 'performance',
        severity,
        message: `Model performance has degraded by ${(accuracyDrop * 100).toFixed(1)}% accuracy`,
        metrics: {
          accuracyDrop,
          f1Drop,
          recentAccuracy: recentAvg.accuracy,
          historicalAccuracy: historicalAvg.accuracy
        },
        recommendedAction: severity === 'high' ? 'Immediate retraining required' : 
                          severity === 'medium' ? 'Schedule retraining within 7 days' : 
                          'Monitor closely, consider retraining'
      };
    }
    
    return null;
  }

  private async detectDataDrift(modelId: string): Promise<DriftAlert | null> {
    // Get recent feature distributions
    const recentFeatures = await this.getRecentFeatureDistribution(modelId);
    const historicalFeatures = await this.getHistoricalFeatureDistribution(modelId);
    
    if (!recentFeatures || !historicalFeatures) return null;
    
    // Calculate distribution differences (simplified KL divergence)
    const driftScore = this.calculateDistributionDrift(recentFeatures, historicalFeatures);
    
    if (driftScore > 0.5) { // Threshold for significant drift
      return {
        type: 'data',
        severity: driftScore > 0.8 ? 'high' : driftScore > 0.6 ? 'medium' : 'low',
        message: `Data distribution has shifted significantly (drift score: ${driftScore.toFixed(2)})`,
        metrics: { driftScore },
        recommendedAction: 'Update feature preprocessing pipeline and retrain model'
      };
    }
    
    return null;
  }

  private async detectConceptDrift(modelId: string): Promise<DriftAlert | null> {
    // Analyze prediction patterns over time
    const predictionTrends = await this.getPredictionTrends(modelId);
    
    if (predictionTrends.length < 2) return null;
    
    // Check for sudden changes in prediction distribution
    const recentPredictions = predictionTrends.slice(-7); // Last 7 days
    const previousPredictions = predictionTrends.slice(-14, -7); // Previous 7 days
    
    const recentPositiveRate = recentPredictions.reduce((sum, day) => 
      sum + day.positiveRate, 0) / recentPredictions.length;
    const previousPositiveRate = previousPredictions.reduce((sum, day) => 
      sum + day.positiveRate, 0) / previousPredictions.length;
    
    const conceptShift = Math.abs(recentPositiveRate - previousPositiveRate);
    
    if (conceptShift > 0.2) { // 20% shift in prediction patterns
      return {
        type: 'concept',
        severity: conceptShift > 0.4 ? 'high' : 'medium',
        message: `Concept drift detected: ${(conceptShift * 100).toFixed(1)}% shift in prediction patterns`,
        metrics: { 
          conceptShift,
          recentPositiveRate,
          previousPositiveRate
        },
        recommendedAction: 'Investigate underlying business changes and retrain with recent data'
      };
    }
    
    return null;
  }

  private calculateAveragePerformance(performances: ModelPerformance[]): ModelPerformance {
    if (performances.length === 0) {
      return {
        modelId: '',
        date: new Date(),
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        predictionCount: 0,
        avgConfidence: 0
      };
    }
    
    const totals = performances.reduce((acc, perf) => ({
      accuracy: acc.accuracy + perf.accuracy,
      precision: acc.precision + perf.precision,
      recall: acc.recall + perf.recall,
      f1Score: acc.f1Score + perf.f1Score,
      predictionCount: acc.predictionCount + perf.predictionCount,
      avgConfidence: acc.avgConfidence + perf.avgConfidence
    }), {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      predictionCount: 0,
      avgConfidence: 0
    });
    
    const count = performances.length;
    return {
      modelId: performances[0].modelId,
      date: new Date(),
      accuracy: totals.accuracy / count,
      precision: totals.precision / count,
      recall: totals.recall / count,
      f1Score: totals.f1Score / count,
      predictionCount: totals.predictionCount,
      avgConfidence: totals.avgConfidence / count
    };
  }

  private calculateDistributionDrift(recent: any, historical: any): number {
    // Simplified drift calculation
    // In production, use proper statistical tests like KS test
    let totalDrift = 0;
    let featureCount = 0;
    
    for (const feature in recent) {
      if (historical[feature]) {
        const drift = Math.abs(recent[feature].mean - historical[feature].mean) / 
                     Math.max(historical[feature].std, 0.001);
        totalDrift += drift;
        featureCount++;
      }
    }
    
    return featureCount > 0 ? totalDrift / featureCount : 0;
  }

  async scheduleRetraining(modelId: string, priority: 'low' | 'medium' | 'high'): Promise<void> {
    const delayDays = priority === 'high' ? 0 : priority === 'medium' ? 3 : 7;
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + delayDays);
    
    await prisma.modelRetraining.create({
      data: {
        modelId,
        priority,
        scheduledDate,
        status: 'SCHEDULED',
        createdAt: new Date()
      }
    });
    
    logger.info(`Scheduled retraining for model ${modelId} with ${priority} priority`);
  }

  private async logAlert(modelId: string, alert: DriftAlert): Promise<void> {
    await prisma.modelAlert.create({
      data: {
        modelId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metrics: JSON.stringify(alert.metrics),
        recommendedAction: alert.recommendedAction,
        createdAt: new Date()
      }
    });
    
    logger.warn(`Model alert: ${alert.message}`, { modelId, alert });
  }

  // Placeholder methods - implement based on your database schema
  private async getRecentPerformance(modelId: string): Promise<ModelPerformance[]> {
    // Implement recent performance retrieval
    return [];
  }

  private async getHistoricalPerformance(modelId: string): Promise<ModelPerformance[]> {
    // Implement historical performance retrieval
    return [];
  }

  private async getRecentFeatureDistribution(modelId: string): Promise<any> {
    // Implement feature distribution calculation
    return null;
  }

  private async getHistoricalFeatureDistribution(modelId: string): Promise<any> {
    // Implement historical feature distribution calculation
    return null;
  }

  private async getPredictionTrends(modelId: string): Promise<any[]> {
    // Implement prediction trend analysis
    return [];
  }
}

export const modelMonitor = new ModelMonitor(); 