/**
 * Analytics Web Worker
 * 
 * Handles heavy data processing for analytics computations
 * including visitor segmentation, statistical analysis, and ML predictions.
 */

// Worker types
interface AnalyticsWorkerMessage {
  id: string;
  type: 'segment_visitors' | 'calculate_stats' | 'predict_churn' | 'analyze_patterns' | 'process_funnel';
  data: unknown;
  options?: {
    batchSize?: number;
    parallel?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
}

interface AnalyticsWorkerResponse {
  id: string;
  type: string;
  result: unknown;
  error?: string;
  progress?: number;
  timestamp: number;
}

interface VisitorData {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  visitCount: number;
  lastVisit: string;
  isActive: boolean;
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
  source: string;
  campaign?: string;
  deviceType: string;
  engagementScore: number;
  tags: string[];
  customAttributes: Record<string, unknown>;
}

interface SegmentationCriteria {
  behavioral: {
    minEngagement: number;
    minPageViews: number;
    minSessionDuration: number;
    maxBounceRate: number;
  };
  demographic: {
    countries: string[];
    cities: string[];
    devices: string[];
  };
  temporal: {
    recency: number; // days
    frequency: number; // visits per month
  };
  value: {
    minConversionRate: number;
    sources: string[];
  };
}

interface StatisticalAnalysis {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  percentiles: { p25: number; p50: number; p75: number; p95: number; p99: number };
  distribution: { [key: string]: number };
  outliers: any[];
  trends: {
    slope: number;
    correlation: number;
    seasonality: number;
  };
}

interface ChurnPrediction {
  visitorId: string;
  churnProbability: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
  timeToChurn: number; // days
}

interface PatternAnalysis {
  commonPaths: Array<{
    path: string[];
    frequency: number;
    conversionRate: number;
  }>;
  dropOffPoints: Array<{
    step: string;
    dropOffRate: number;
    impact: number;
  }>;
  timePatterns: Array<{
    hour: number;
    day: number;
    month: number;
    activity: number;
  }>;
  geographicPatterns: Array<{
    region: string;
    behavior: string;
    strength: number;
  }>;
}

interface FunnelAnalysis {
  steps: Array<{
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    dropOffRate: number;
    averageTime: number;
  }>;
  overall: {
    totalVisitors: number;
    totalConversions: number;
    overallConversionRate: number;
    averageCompletionTime: number;
  };
  bottlenecks: Array<{
    step: string;
    severity: number;
    impact: number;
    recommendations: string[];
  }>;
}

// Machine Learning utilities
class MLUtils {
  static kMeansCluster(data: number[][], k: number, maxIterations = 100): number[][] {
    const centroids: number[][] = [];
    const assignments: number[] = [];
    
    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      centroids.push(data[Math.floor(Math.random() * data.length)].slice());
    }
    
    let iteration = 0;
    let converged = false;
    
    while (iteration < maxIterations && !converged) {
      // Assign points to nearest centroid
      const newAssignments: number[] = [];
      for (let i = 0; i < data.length; i++) {
        let minDistance = Number.POSITIVE_INFINITY;
        let nearestCentroid = 0;
        
        for (let j = 0; j < centroids.length; j++) {
          const distance = this.euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = j;
          }
        }
        
        newAssignments.push(nearestCentroid);
      }
      
      // Update centroids
      const newCentroids: number[][] = [];
      for (let i = 0; i < k; i++) {
        const clusterPoints = data.filter((_, idx) => newAssignments[idx] === i);
        if (clusterPoints.length > 0) {
          const centroid = new Array(data[0].length).fill(0);
          for (const point of clusterPoints) {
            for (let j = 0; j < point.length; j++) {
              centroid[j] += point[j];
            }
          }
          for (let j = 0; j < centroid.length; j++) {
            centroid[j] /= clusterPoints.length;
          }
          newCentroids.push(centroid);
        } else {
          newCentroids.push(centroids[i]);
        }
      }
      
      // Check convergence
      converged = this.centroidsEqual(centroids, newCentroids);
      centroids.splice(0, centroids.length, ...newCentroids);
      assignments.splice(0, assignments.length, ...newAssignments);
      
      iteration++;
    }
    
    return centroids;
  }
  
  static euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, idx) => sum + Math.pow(val - point2[idx], 2), 0)
    );
  }
  
  static centroidsEqual(centroids1: number[][], centroids2: number[][], tolerance = 1e-4): boolean {
    for (let i = 0; i < centroids1.length; i++) {
      for (let j = 0; j < centroids1[i].length; j++) {
        if (Math.abs(centroids1[i][j] - centroids2[i][j]) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }
  
  static calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      denomX += deltaX * deltaX;
      denomY += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = Math.min(x.length, y.length);
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      numerator += deltaX * (y[i] - meanY);
      denominator += deltaX * deltaX;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;
    
    // Calculate R-squared
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      ssRes += Math.pow(y[i] - predicted, 2);
      ssTot += Math.pow(y[i] - meanY, 2);
    }
    
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2 };
  }
}

// Analytics processing functions
class AnalyticsProcessor {
  static segmentVisitors(visitors: VisitorData[], criteria: SegmentationCriteria): Array<{
    segment: string;
    visitors: VisitorData[];
    characteristics: Record<string, any>;
  }> {
    const segments = new Map<string, VisitorData[]>();
    
    visitors.forEach(visitor => {
      const segmentNames: string[] = [];
      
      // Behavioral segmentation
      if (visitor.engagementScore >= criteria.behavioral.minEngagement) {
        segmentNames.push('high-engagement');
      }
      if (visitor.pageViews >= criteria.behavioral.minPageViews) {
        segmentNames.push('high-activity');
      }
      if (visitor.sessionDuration >= criteria.behavioral.minSessionDuration) {
        segmentNames.push('long-session');
      }
      if (visitor.bounceRate <= criteria.behavioral.maxBounceRate) {
        segmentNames.push('low-bounce');
      }
      
      // Value segmentation
      if (visitor.conversionRate >= criteria.value.minConversionRate) {
        segmentNames.push('high-value');
      }
      
      // Demographic segmentation
      if (criteria.demographic.countries.includes(visitor.country)) {
        segmentNames.push('target-geo');
      }
      if (criteria.demographic.devices.includes(visitor.deviceType)) {
        segmentNames.push('target-device');
      }
      
      // Temporal segmentation
      const daysSinceLastVisit = (Date.now() - new Date(visitor.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastVisit <= criteria.temporal.recency) {
        segmentNames.push('recent');
      }
      if (visitor.visitCount >= criteria.temporal.frequency) {
        segmentNames.push('frequent');
      }
      
      // Assign to segments
      const segmentKey = segmentNames.length > 0 ? segmentNames.join('-') : 'other';
      if (!segments.has(segmentKey)) {
        segments.set(segmentKey, []);
      }
      segments.get(segmentKey)!.push(visitor);
    });
    
    // Calculate segment characteristics
    return Array.from(segments.entries()).map(([segment, segmentVisitors]) => ({
      segment,
      visitors: segmentVisitors,
      characteristics: {
        size: segmentVisitors.length,
        averageEngagement: segmentVisitors.reduce((sum, v) => sum + v.engagementScore, 0) / segmentVisitors.length,
        averageConversion: segmentVisitors.reduce((sum, v) => sum + v.conversionRate, 0) / segmentVisitors.length,
        topCountries: this.getTopValues(segmentVisitors.map(v => v.country)),
        topSources: this.getTopValues(segmentVisitors.map(v => v.source)),
        deviceDistribution: this.getDistribution(segmentVisitors.map(v => v.deviceType))
      }
    }));
  }
  
  static calculateStatistics(data: number[]): StatisticalAnalysis {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    
    // Basic statistics
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Percentiles
    const percentiles = {
      p25: sorted[Math.floor(n * 0.25)],
      p50: median,
      p75: sorted[Math.floor(n * 0.75)],
      p95: sorted[Math.floor(n * 0.95)],
      p99: sorted[Math.floor(n * 0.99)]
    };
    
    // Distribution
    const distribution: { [key: string]: number } = {};
    const binCount = Math.min(20, Math.sqrt(n));
    const binSize = (Math.max(...data) - Math.min(...data)) / binCount;
    
    data.forEach(val => {
      const bin = Math.floor(val / binSize) * binSize;
      const key = `${bin}-${bin + binSize}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    
    // Outliers (using IQR method)
    const q1 = percentiles.p25;
    const q3 = percentiles.p75;
    const iqr = q3 - q1;
    const outliers = data.filter(val => val < q1 - 1.5 * iqr || val > q3 + 1.5 * iqr);
    
    // Trends (simplified)
    const indices = data.map((_, idx) => idx);
    const trend = MLUtils.linearRegression(indices, data);
    
    return {
      mean,
      median,
      standardDeviation,
      variance,
      percentiles,
      distribution,
      outliers,
      trends: {
        slope: trend.slope,
        correlation: trend.r2,
        seasonality: 0 // Would need time series analysis
      }
    };
  }
  
  static predictChurn(visitors: VisitorData[]): ChurnPrediction[] {
    return visitors.map(visitor => {
      const features = [
        visitor.engagementScore,
        visitor.sessionDuration,
        visitor.pageViews,
        visitor.bounceRate,
        visitor.visitCount,
        Date.now() - new Date(visitor.lastVisit).getTime()
      ];
      
      // Simplified churn prediction model
      const daysSinceLastVisit = (Date.now() - new Date(visitor.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
      const engagementFactor = Math.max(0, 1 - visitor.engagementScore / 100);
      const recencyFactor = Math.min(1, daysSinceLastVisit / 30);
      const activityFactor = Math.max(0, 1 - visitor.pageViews / 10);
      
      const churnProbability = Math.min(1, (engagementFactor + recencyFactor + activityFactor) / 3);
      
      const riskFactors = [];
      if (visitor.engagementScore < 30) riskFactors.push('Low engagement');
      if (daysSinceLastVisit > 14) riskFactors.push('Long absence');
      if (visitor.bounceRate > 0.7) riskFactors.push('High bounce rate');
      if (visitor.pageViews < 3) riskFactors.push('Low activity');
      
      const recommendations = [];
      if (churnProbability > 0.7) {
        recommendations.push('Send re-engagement campaign');
        recommendations.push('Offer personalized incentive');
      } else if (churnProbability > 0.4) {
        recommendations.push('Increase content relevance');
        recommendations.push('Improve user experience');
      }
      
      return {
        visitorId: visitor.id,
        churnProbability,
        riskFactors,
        recommendations,
        confidence: 0.8, // Would be calculated by actual ML model
        timeToChurn: churnProbability * 30 // days
      };
    });
  }
  
  static analyzePatterns(visitors: VisitorData[]): PatternAnalysis {
    // Common paths analysis (simplified)
    const pathCounts = new Map<string, number>();
    const pathConversions = new Map<string, number>();
    
    visitors.forEach(visitor => {
      const path = visitor.tags.join(' -> ');
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
      if (visitor.conversionRate > 0.5) {
        pathConversions.set(path, (pathConversions.get(path) || 0) + 1);
      }
    });
    
    const commonPaths = Array.from(pathCounts.entries())
      .filter(([, count]) => count >= 5)
      .map(([path, count]) => ({
        path: path.split(' -> '),
        frequency: count,
        conversionRate: (pathConversions.get(path) || 0) / count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    // Drop-off analysis
    const dropOffPoints = [
      { step: 'Landing', dropOffRate: 0.3, impact: 0.8 },
      { step: 'Product View', dropOffRate: 0.4, impact: 0.6 },
      { step: 'Cart', dropOffRate: 0.6, impact: 0.9 },
      { step: 'Checkout', dropOffRate: 0.2, impact: 0.95 }
    ];
    
    // Time patterns
    const timePatterns = [];
    for (let hour = 0; hour < 24; hour++) {
      const activity = Math.random() * 100; // Would be calculated from actual data
      timePatterns.push({
        hour,
        day: Math.floor(hour / 24),
        month: 1,
        activity
      });
    }
    
    // Geographic patterns
    const geographicPatterns = [
      { region: 'North America', behavior: 'High engagement', strength: 0.8 },
      { region: 'Europe', behavior: 'Long sessions', strength: 0.7 },
      { region: 'Asia', behavior: 'Mobile-first', strength: 0.9 },
      { region: 'Africa', behavior: 'Price-sensitive', strength: 0.6 }
    ];
    
    return {
      commonPaths,
      dropOffPoints,
      timePatterns,
      geographicPatterns
    };
  }
  
  static processFunnel(visitors: VisitorData[], steps: string[]): FunnelAnalysis {
    const stepData = steps.map((step, index) => {
      const visitorsAtStep = visitors.filter(v => v.tags.includes(step));
      const conversions = index < steps.length - 1 ? 
        visitorsAtStep.filter(v => v.tags.includes(steps[index + 1])).length : 
        visitorsAtStep.filter(v => v.conversionRate > 0.5).length;
      
      return {
        name: step,
        visitors: visitorsAtStep.length,
        conversions,
        conversionRate: visitorsAtStep.length > 0 ? conversions / visitorsAtStep.length : 0,
        dropOffRate: visitorsAtStep.length > 0 ? 1 - (conversions / visitorsAtStep.length) : 0,
        averageTime: visitorsAtStep.reduce((sum, v) => sum + v.sessionDuration, 0) / visitorsAtStep.length
      };
    });
    
    const overall = {
      totalVisitors: stepData[0]?.visitors || 0,
      totalConversions: stepData[stepData.length - 1]?.conversions || 0,
      overallConversionRate: stepData[0]?.visitors > 0 ? 
        (stepData[stepData.length - 1]?.conversions || 0) / stepData[0].visitors : 0,
      averageCompletionTime: stepData.reduce((sum, step) => sum + step.averageTime, 0) / stepData.length
    };
    
    const bottlenecks = stepData
      .map((step, index) => ({
        step: step.name,
        severity: step.dropOffRate,
        impact: step.dropOffRate * step.visitors,
        recommendations: step.dropOffRate > 0.5 ? 
          ['Optimize user experience', 'Reduce friction', 'A/B test alternatives'] : 
          ['Monitor performance', 'Maintain current approach']
      }))
      .filter(bottleneck => bottleneck.severity > 0.3)
      .sort((a, b) => b.impact - a.impact);
    
    return {
      steps: stepData,
      overall,
      bottlenecks
    };
  }
  
  private static getTopValues(values: string[], limit = 5): Array<{ value: string; count: number }> {
    const counts = new Map<string, number>();
    values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  }
  
  private static getDistribution(values: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    values.forEach(value => {
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }
}

// Worker message handler
self.onmessage = async (event: MessageEvent<AnalyticsWorkerMessage>) => {
  const { id, type, data, options = {} } = event.data;
  
  try {
    let result: any;
    const startTime = performance.now();
    
    // Send progress update
    const sendProgress = (progress: number) => {
      self.postMessage({
        id,
        type,
        progress,
        timestamp: Date.now()
      } as AnalyticsWorkerResponse);
    };
    
    switch (type) {
      case 'segment_visitors':
        sendProgress(10);
        result = AnalyticsProcessor.segmentVisitors(data.visitors, data.criteria);
        sendProgress(100);
        break;
        
      case 'calculate_stats':
        sendProgress(20);
        result = AnalyticsProcessor.calculateStatistics(data.values);
        sendProgress(100);
        break;
        
      case 'predict_churn':
        sendProgress(30);
        result = AnalyticsProcessor.predictChurn(data.visitors);
        sendProgress(100);
        break;
        
      case 'analyze_patterns':
        sendProgress(40);
        result = AnalyticsProcessor.analyzePatterns(data.visitors);
        sendProgress(100);
        break;
        
      case 'process_funnel':
        sendProgress(50);
        result = AnalyticsProcessor.processFunnel(data.visitors, data.steps);
        sendProgress(100);
        break;
        
      default:
        throw new Error(`Unknown analytics operation: ${type}`);
    }
    
    const processingTime = performance.now() - startTime;
    
    // Send result
    self.postMessage({
      id,
      type,
      result: {
        ...result,
        processingTime,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    } as AnalyticsWorkerResponse);
    
  } catch (error) {
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    } as AnalyticsWorkerResponse);
  }
};

// Export for TypeScript
export type { AnalyticsWorkerMessage, AnalyticsWorkerResponse, VisitorData, SegmentationCriteria };
export { AnalyticsProcessor, MLUtils };