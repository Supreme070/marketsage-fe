/**
 * Autonomous Segmentation Helper Functions
 * =======================================
 * 
 * Helper functions for the Autonomous Customer Segmentation Engine
 */

import { logger } from '@/lib/logger';
import type { SupremeAI } from '@/lib/ai/supreme-ai-engine';
import { 
  AutonomousSegmentDiscovery, 
  type DiscoveredPattern, 
  type SuggestedSegment, 
  SegmentationFeatures,
  SegmentPerformanceMetrics,
  MicroSegment,
  PersonalizedAction,
  SegmentTransition
} from '@/lib/ml/customer-segmentation-engine';

/**
 * Clustering algorithms implementation
 */
export class ClusteringAlgorithms {
  
  /**
   * K-Means clustering implementation
   */
  static async kMeansCluster(
    featureMatrix: number[][],
    k = 5,
    maxIterations = 100
  ): Promise<{
    clusters: number;
    labels: number[];
    centroids: number[][];
    silhouetteScore: number;
  }> {
    try {
      // Initialize centroids randomly
      const centroids = this.initializeCentroids(featureMatrix, k);
      let labels = new Array(featureMatrix.length).fill(0);
      let converged = false;
      let iterations = 0;

      while (!converged && iterations < maxIterations) {
        const newLabels = this.assignClusters(featureMatrix, centroids);
        const newCentroids = this.updateCentroids(featureMatrix, newLabels, k);
        
        // Check convergence
        converged = this.checkConvergence(labels, newLabels);
        labels = newLabels;
        centroids.splice(0, centroids.length, ...newCentroids);
        iterations++;
      }

      // Calculate silhouette score
      const silhouetteScore = this.calculateSilhouetteScore(featureMatrix, labels);

      return {
        clusters: k,
        labels,
        centroids,
        silhouetteScore
      };

    } catch (error) {
      logger.error('K-means clustering failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * DBSCAN clustering implementation
   */
  static async dbscanCluster(
    featureMatrix: number[][],
    eps = 0.5,
    minPts = 5
  ): Promise<{
    clusters: number;
    labels: number[];
    silhouetteScore: number;
  }> {
    try {
      const labels = new Array(featureMatrix.length).fill(-1);
      let clusterId = 0;

      for (let i = 0; i < featureMatrix.length; i++) {
        if (labels[i] !== -1) continue;

        const neighbors = this.findNeighbors(featureMatrix, i, eps);
        
        if (neighbors.length < minPts) {
          labels[i] = -1; // Mark as noise
        } else {
          labels[i] = clusterId;
          this.expandCluster(featureMatrix, labels, i, neighbors, clusterId, eps, minPts);
          clusterId++;
        }
      }

      // Calculate silhouette score (excluding noise points)
      const silhouetteScore = this.calculateSilhouetteScore(
        featureMatrix, 
        labels.map(l => l === -1 ? 0 : l)
      );

      return {
        clusters: clusterId,
        labels,
        silhouetteScore
      };

    } catch (error) {
      logger.error('DBSCAN clustering failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Helper methods for clustering
  private static initializeCentroids(data: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    const dataLength = data.length;
    const featureLength = data[0].length;

    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * dataLength);
      centroids.push([...data[randomIndex]]);
    }

    return centroids;
  }

  private static assignClusters(data: number[][], centroids: number[][]): number[] {
    return data.map(point => {
      let minDistance = Number.POSITIVE_INFINITY;
      let clusterLabel = 0;

      centroids.forEach((centroid, index) => {
        const distance = this.euclideanDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          clusterLabel = index;
        }
      });

      return clusterLabel;
    });
  }

  private static updateCentroids(data: number[][], labels: number[], k: number): number[][] {
    const centroids: number[][] = [];
    const featureLength = data[0].length;

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => labels[index] === i);
      
      if (clusterPoints.length === 0) {
        centroids.push(new Array(featureLength).fill(0));
        continue;
      }

      const centroid = new Array(featureLength).fill(0);
      clusterPoints.forEach(point => {
        point.forEach((value, index) => {
          centroid[index] += value;
        });
      });

      centroids.push(centroid.map(sum => sum / clusterPoints.length));
    }

    return centroids;
  }

  private static checkConvergence(oldLabels: number[], newLabels: number[]): boolean {
    return oldLabels.every((label, index) => label === newLabels[index]);
  }

  private static euclideanDistance(point1: number[], point2: number[]): number {
    const sum = point1.reduce((acc, val, index) => {
      return acc + Math.pow(val - point2[index], 2);
    }, 0);
    return Math.sqrt(sum);
  }

  private static findNeighbors(data: number[][], pointIndex: number, eps: number): number[] {
    const neighbors: number[] = [];
    const targetPoint = data[pointIndex];

    data.forEach((point, index) => {
      if (index !== pointIndex) {
        const distance = this.euclideanDistance(targetPoint, point);
        if (distance <= eps) {
          neighbors.push(index);
        }
      }
    });

    return neighbors;
  }

  private static expandCluster(
    data: number[][],
    labels: number[],
    pointIndex: number,
    neighbors: number[],
    clusterId: number,
    eps: number,
    minPts: number
  ): void {
    const queue = [...neighbors];

    while (queue.length > 0) {
      const currentPoint = queue.shift()!;
      
      if (labels[currentPoint] === -1) {
        labels[currentPoint] = clusterId;
      }

      if (labels[currentPoint] !== -1) continue;

      labels[currentPoint] = clusterId;
      const currentNeighbors = this.findNeighbors(data, currentPoint, eps);

      if (currentNeighbors.length >= minPts) {
        queue.push(...currentNeighbors);
      }
    }
  }

  private static calculateSilhouetteScore(data: number[][], labels: number[]): number {
    const uniqueLabels = [...new Set(labels)];
    if (uniqueLabels.length < 2) return 0;

    let totalScore = 0;
    let validPoints = 0;

    for (let i = 0; i < data.length; i++) {
      const currentLabel = labels[i];
      if (currentLabel === -1) continue; // Skip noise points

      // Calculate a(i) - average distance to points in same cluster
      const sameClusterPoints = data.filter((_, index) => labels[index] === currentLabel && index !== i);
      const a = sameClusterPoints.length > 0 
        ? sameClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / sameClusterPoints.length
        : 0;

      // Calculate b(i) - minimum average distance to points in other clusters
      let b = Number.POSITIVE_INFINITY;
      for (const otherLabel of uniqueLabels) {
        if (otherLabel === currentLabel || otherLabel === -1) continue;

        const otherClusterPoints = data.filter((_, index) => labels[index] === otherLabel);
        const avgDistance = otherClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / otherClusterPoints.length;
        b = Math.min(b, avgDistance);
      }

      // Calculate silhouette score for this point
      const silhouette = b === Number.POSITIVE_INFINITY ? 0 : (b - a) / Math.max(a, b);
      totalScore += silhouette;
      validPoints++;
    }

    return validPoints > 0 ? totalScore / validPoints : 0;
  }
}

/**
 * Pattern analysis utilities
 */
export class PatternAnalyzer {
  
  /**
   * Analyze discovered patterns from clustering results
   */
  static async analyzePatterns(
    customers: any[],
    clusteringResult: any,
    organizationId: string
  ): Promise<DiscoveredPattern[]> {
    try {
      const patterns: DiscoveredPattern[] = [];
      const uniqueLabels = [...new Set(clusteringResult.labels)];

      for (const label of uniqueLabels) {
        if (label === -1) continue; // Skip noise points

        const clusterCustomers = customers.filter((_, index) => clusteringResult.labels[index] === label);
        
        if (clusterCustomers.length < 5) continue; // Skip small clusters

        // Analyze behavioral patterns
        const behavioralPattern = await this.analyzeBehavioralPattern(clusterCustomers);
        if (behavioralPattern) patterns.push(behavioralPattern);

        // Analyze temporal patterns
        const temporalPattern = await this.analyzeTemporalPattern(clusterCustomers);
        if (temporalPattern) patterns.push(temporalPattern);

        // Analyze channel patterns
        const channelPattern = await this.analyzeChannelPattern(clusterCustomers);
        if (channelPattern) patterns.push(channelPattern);

        // Analyze value patterns
        const valuePattern = await this.analyzeValuePattern(clusterCustomers);
        if (valuePattern) patterns.push(valuePattern);
      }

      return patterns;

    } catch (error) {
      logger.error('Pattern analysis failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  private static async analyzeBehavioralPattern(customers: any[]): Promise<DiscoveredPattern | null> {
    try {
      // Analyze common behavioral traits
      const features = customers.map(c => c.features);
      const avgEngagement = features.reduce((sum, f) => sum + f.emailEngagement, 0) / features.length;
      const avgActivity = features.reduce((sum, f) => sum + f.websiteActivity, 0) / features.length;
      const avgSupport = features.reduce((sum, f) => sum + (f.supportInteraction === 'high' ? 1 : 0), 0) / features.length;

      // Determine pattern strength
      const strength = this.calculatePatternStrength([avgEngagement, avgActivity, avgSupport]);
      
      if (strength < 0.3) return null;

      const pattern: DiscoveredPattern = {
        patternId: `behavioral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'behavioral',
        description: this.generateBehavioralDescription(avgEngagement, avgActivity, avgSupport),
        features: ['emailEngagement', 'websiteActivity', 'supportInteraction'],
        strength,
        frequency: customers.length,
        customers: customers.map(c => c.id),
        actionableInsights: this.generateBehavioralInsights(avgEngagement, avgActivity, avgSupport),
        businessImpact: {
          revenueOpportunity: this.calculateRevenueOpportunity(customers),
          riskMitigation: this.calculateRiskMitigation(customers),
          engagementPotential: avgEngagement * 1000
        }
      };

      return pattern;

    } catch (error) {
      logger.error('Behavioral pattern analysis failed', {
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  private static async analyzeTemporalPattern(customers: any[]): Promise<DiscoveredPattern | null> {
    try {
      // Analyze temporal behavior patterns
      const accountAges = customers.map(c => c.features.accountAge);
      const avgAccountAge = accountAges.reduce((sum, age) => sum + age, 0) / accountAges.length;
      const purchasePatterns = customers.map(c => c.features.purchasePattern);
      
      // Find dominant purchase pattern
      const patternCounts = purchasePatterns.reduce((counts, pattern) => {
        counts[pattern] = (counts[pattern] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const dominantPattern = Object.entries(patternCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (!dominantPattern || dominantPattern[1] < customers.length * 0.6) return null;

      const pattern: DiscoveredPattern = {
        patternId: `temporal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'temporal',
        description: `Customers with ${dominantPattern[0]} purchase pattern, average account age ${Math.round(avgAccountAge)} days`,
        features: ['accountAge', 'purchasePattern'],
        strength: dominantPattern[1] / customers.length,
        frequency: customers.length,
        customers: customers.map(c => c.id),
        actionableInsights: this.generateTemporalInsights(dominantPattern[0], avgAccountAge),
        businessImpact: {
          revenueOpportunity: this.calculateRevenueOpportunity(customers),
          riskMitigation: this.calculateRiskMitigation(customers),
          engagementPotential: 500
        }
      };

      return pattern;

    } catch (error) {
      logger.error('Temporal pattern analysis failed', {
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  private static async analyzeChannelPattern(customers: any[]): Promise<DiscoveredPattern | null> {
    try {
      // Analyze channel preference patterns
      const channelPreferences = customers.map(c => c.features.channelPreference);
      const channelCounts = channelPreferences.reduce((counts, channel) => {
        counts[channel] = (counts[channel] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const dominantChannel = Object.entries(channelCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (!dominantChannel || dominantChannel[1] < customers.length * 0.5) return null;

      const pattern: DiscoveredPattern = {
        patternId: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'channel',
        description: `Customers with strong ${dominantChannel[0]} channel preference`,
        features: ['channelPreference'],
        strength: dominantChannel[1] / customers.length,
        frequency: customers.length,
        customers: customers.map(c => c.id),
        actionableInsights: this.generateChannelInsights(dominantChannel[0]),
        businessImpact: {
          revenueOpportunity: this.calculateRevenueOpportunity(customers),
          riskMitigation: this.calculateRiskMitigation(customers),
          engagementPotential: 750
        }
      };

      return pattern;

    } catch (error) {
      logger.error('Channel pattern analysis failed', {
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  private static async analyzeValuePattern(customers: any[]): Promise<DiscoveredPattern | null> {
    try {
      // Analyze value-based patterns
      const clvValues = customers.map(c => c.features.lifetimeValue);
      const avgClv = clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length;
      const churnRisks = customers.map(c => c.features.churnRisk);
      const avgChurnRisk = churnRisks.reduce((sum, risk) => sum + risk, 0) / churnRisks.length;

      // Determine value segment
      let valueSegment = 'low_value';
      if (avgClv > 1000) valueSegment = 'high_value';
      else if (avgClv > 500) valueSegment = 'medium_value';

      const pattern: DiscoveredPattern = {
        patternId: `value_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternType: 'value',
        description: `${valueSegment} customers with average CLV $${Math.round(avgClv)}, churn risk ${Math.round(avgChurnRisk * 100)}%`,
        features: ['lifetimeValue', 'churnRisk'],
        strength: this.calculateValuePatternStrength(avgClv, avgChurnRisk),
        frequency: customers.length,
        customers: customers.map(c => c.id),
        actionableInsights: this.generateValueInsights(valueSegment, avgClv, avgChurnRisk),
        businessImpact: {
          revenueOpportunity: avgClv * customers.length,
          riskMitigation: (avgChurnRisk * avgClv * customers.length),
          engagementPotential: 1000
        }
      };

      return pattern;

    } catch (error) {
      logger.error('Value pattern analysis failed', {
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  // Helper methods for pattern analysis
  private static calculatePatternStrength(values: number[]): number {
    const variance = this.calculateVariance(values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return mean / (1 + variance); // Lower variance = higher strength
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private static calculateValuePatternStrength(avgClv: number, avgChurnRisk: number): number {
    // Higher CLV and lower churn risk = stronger pattern
    const clvScore = Math.min(avgClv / 1000, 1); // Normalize to 0-1
    const churnScore = 1 - avgChurnRisk; // Invert churn risk
    return (clvScore + churnScore) / 2;
  }

  private static calculateRevenueOpportunity(customers: any[]): number {
    const totalClv = customers.reduce((sum, c) => sum + c.features.lifetimeValue, 0);
    const avgEngagement = customers.reduce((sum, c) => sum + c.features.emailEngagement, 0) / customers.length;
    return totalClv * (1 + avgEngagement); // Revenue opportunity with engagement improvement
  }

  private static calculateRiskMitigation(customers: any[]): number {
    const totalClv = customers.reduce((sum, c) => sum + c.features.lifetimeValue, 0);
    const avgChurnRisk = customers.reduce((sum, c) => sum + c.features.churnRisk, 0) / customers.length;
    return totalClv * avgChurnRisk; // Potential loss from churn
  }

  private static generateBehavioralDescription(engagement: number, activity: number, support: number): string {
    const engagementLevel = engagement > 0.3 ? 'high' : engagement > 0.1 ? 'medium' : 'low';
    const activityLevel = activity > 0.5 ? 'high' : activity > 0.2 ? 'medium' : 'low';
    const supportLevel = support > 0.3 ? 'high' : support > 0.1 ? 'medium' : 'low';
    
    return `Customers with ${engagementLevel} engagement, ${activityLevel} activity, and ${supportLevel} support interaction`;
  }

  private static generateBehavioralInsights(engagement: number, activity: number, support: number): string[] {
    const insights: string[] = [];
    
    if (engagement > 0.3) {
      insights.push('High engagement customers - good candidates for upselling');
    } else if (engagement < 0.1) {
      insights.push('Low engagement - needs re-engagement campaigns');
    }
    
    if (activity > 0.5) {
      insights.push('High activity indicates strong product interest');
    } else if (activity < 0.2) {
      insights.push('Low activity - may need product education');
    }
    
    if (support > 0.3) {
      insights.push('High support interaction - monitor for satisfaction issues');
    }
    
    return insights;
  }

  private static generateTemporalInsights(pattern: string, avgAge: number): string[] {
    const insights: string[] = [];
    
    switch (pattern) {
      case 'regular':
        insights.push('Regular purchase pattern - good for subscription offers');
        break;
      case 'seasonal':
        insights.push('Seasonal buyers - target during peak seasons');
        break;
      case 'sporadic':
        insights.push('Sporadic buyers - use trigger-based campaigns');
        break;
      case 'first_time':
        insights.push('First-time buyers - focus on onboarding and retention');
        break;
    }
    
    if (avgAge > 365) {
      insights.push('Long-term customers - loyalty program candidates');
    } else if (avgAge < 30) {
      insights.push('New customers - focus on activation and engagement');
    }
    
    return insights;
  }

  private static generateChannelInsights(channel: string): string[] {
    const insights: string[] = [];
    
    switch (channel) {
      case 'email':
        insights.push('Email-first users - optimize email campaigns');
        insights.push('Good candidates for newsletter content');
        break;
      case 'sms':
        insights.push('SMS-first users - use for urgent notifications');
        insights.push('Mobile-optimized content works best');
        break;
      case 'whatsapp':
        insights.push('WhatsApp users - conversational marketing approach');
        insights.push('Good for personalized customer service');
        break;
      case 'push':
        insights.push('App-engaged users - use for real-time notifications');
        insights.push('Good for location-based offers');
        break;
    }
    
    return insights;
  }

  private static generateValueInsights(segment: string, avgClv: number, avgChurnRisk: number): string[] {
    const insights: string[] = [];
    
    switch (segment) {
      case 'high_value':
        insights.push('High-value customers - prioritize retention');
        insights.push('Good candidates for premium services');
        break;
      case 'medium_value':
        insights.push('Medium-value customers - focus on growth');
        insights.push('Upselling opportunities available');
        break;
      case 'low_value':
        insights.push('Low-value customers - improve engagement');
        insights.push('Cost-effective communication channels');
        break;
    }
    
    if (avgChurnRisk > 0.3) {
      insights.push('High churn risk - implement retention campaigns');
    }
    
    return insights;
  }
}

/**
 * Segment suggestion generator
 */
export class SegmentSuggestionGenerator {
  
  /**
   * Generate segment suggestions from discovered patterns
   */
  static async generateSuggestions(
    patterns: DiscoveredPattern[],
    organizationId: string,
    supremeAI: SupremeAI
  ): Promise<SuggestedSegment[]> {
    try {
      const suggestions: SuggestedSegment[] = [];

      for (const pattern of patterns) {
        // Generate AI-powered segment suggestions
        const aiSuggestions = await supremeAI.executeTask({
          task: 'generate_segment_suggestions',
          context: {
            pattern,
            organizationId,
            businessGoals: ['engagement', 'conversion', 'retention', 'revenue']
          },
          options: {
            model: 'gpt-4',
            temperature: 0.4,
            reasoning: true
          }
        });

        // Parse and validate AI suggestions
        const parsedSuggestions = await this.parseAISuggestions(aiSuggestions, pattern);
        suggestions.push(...parsedSuggestions);
      }

      // Rank suggestions by priority and ROI
      const rankedSuggestions = this.rankSuggestions(suggestions);

      return rankedSuggestions;

    } catch (error) {
      logger.error('Segment suggestion generation failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  private static async parseAISuggestions(
    aiResponse: any,
    pattern: DiscoveredPattern
  ): Promise<SuggestedSegment[]> {
    try {
      // Parse AI response and create structured suggestions
      const suggestions: SuggestedSegment[] = [];
      
      // Example implementation - in real scenario, would parse actual AI response
      const baseSuggestion: SuggestedSegment = {
        suggestionId: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `AI-Generated Segment: ${pattern.patternType}`,
        description: `Segment based on ${pattern.description}`,
        criteria: {
          rules: pattern.features.map(feature => ({
            field: feature as any,
            operator: 'gte' as const,
            value: 0.1
          })),
          logic: 'AND' as const
        },
        justification: `This segment shows ${pattern.strength} strength in ${pattern.patternType} patterns`,
        estimatedSize: pattern.frequency,
        estimatedValue: pattern.businessImpact.revenueOpportunity,
        confidence: pattern.strength,
        priority: this.calculatePriority(pattern),
        implementationComplexity: 'moderate',
        expectedROI: pattern.businessImpact.revenueOpportunity / Math.max(pattern.frequency * 10, 1),
        riskLevel: this.calculateRiskLevel(pattern)
      };

      suggestions.push(baseSuggestion);
      return suggestions;

    } catch (error) {
      logger.error('AI suggestion parsing failed', {
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }

  private static calculatePriority(pattern: DiscoveredPattern): 'low' | 'medium' | 'high' | 'critical' {
    const impact = pattern.businessImpact.revenueOpportunity;
    const strength = pattern.strength;
    const score = (impact / 1000) * strength;

    if (score > 5) return 'critical';
    if (score > 2) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
  }

  private static calculateRiskLevel(pattern: DiscoveredPattern): 'low' | 'medium' | 'high' {
    const risk = pattern.businessImpact.riskMitigation;
    const opportunity = pattern.businessImpact.revenueOpportunity;
    const riskRatio = risk / Math.max(opportunity, 1);

    if (riskRatio > 0.3) return 'high';
    if (riskRatio > 0.1) return 'medium';
    return 'low';
  }

  private static rankSuggestions(suggestions: SuggestedSegment[]): SuggestedSegment[] {
    return suggestions.sort((a, b) => {
      // Sort by priority first, then by expected ROI
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.expectedROI - a.expectedROI;
    });
  }
}

/**
 * Export utility functions
 */
export { ClusteringAlgorithms, PatternAnalyzer, SegmentSuggestionGenerator };