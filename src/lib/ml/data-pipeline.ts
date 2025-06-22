/**
 * Data Preprocessing Pipeline
 * Handles data cleaning, transformation, and validation for ML models
 */

import { z } from 'zod'; // We'll use Zod for runtime type validation
import { logger } from '@/lib/logger';
import { featureEngineer, type ScalingMethod, type SelectionMethod } from './feature-engineering';

// Core data types
export interface RawDataPoint {
  [key: string]: unknown;
}

export interface ProcessedDataPoint {
  features: number[];
  label?: number;
  metadata: {
    id: string;
    timestamp: Date;
    source: string;
    quality: number; // 0-1 score indicating data quality
  };
}

export interface DatasetStats {
  totalSamples: number;
  validSamples: number;
  invalidSamples: number;
  missingValueCounts: Record<string, number>;
  featureStats: Record<string, {
    min: number;
    max: number;
    mean: number;
    std: number;
    nullCount: number;
    uniqueCount: number;
  }>;
}

// Data validation schemas
const baseDataSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  source: z.string(),
});

export class DataPreprocessor {
  private featureColumns: string[];
  private targetColumn?: string;
  private categoricalColumns: Set<string>;
  private numericalColumns: Set<string>;
  private schema: z.ZodType<any>;
  private scalingMethod: ScalingMethod;
  private featureSelectionMethod: SelectionMethod;
  private selectedFeatures: string[] = [];

  constructor(config: {
    featureColumns: string[];
    targetColumn?: string;
    categoricalColumns?: string[];
    numericalColumns?: string[];
    customSchema?: z.ZodType<any>;
    scalingMethod?: ScalingMethod;
    featureSelectionMethod?: SelectionMethod;
  }) {
    this.featureColumns = config.featureColumns;
    this.targetColumn = config.targetColumn;
    this.categoricalColumns = new Set(config.categoricalColumns || []);
    this.numericalColumns = new Set(config.numericalColumns || []);
    this.schema = config.customSchema || baseDataSchema;
    this.scalingMethod = config.scalingMethod || 'standard';
    this.featureSelectionMethod = config.featureSelectionMethod || 'correlation';
  }

  /**
   * Main preprocessing pipeline
   */
  async process(rawData: RawDataPoint[]): Promise<{
    processedData: ProcessedDataPoint[];
    stats: DatasetStats;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    const stats: DatasetStats = this.initializeStats();

    try {
      // Step 1: Validate data structure
      const validatedData = await this.validateData(rawData, stats, errors);

      // Step 2: Clean data
      const cleanedData = await this.cleanData(validatedData, stats, errors);

      // Step 3: Handle missing values
      const imputedData = await this.handleMissingValues(cleanedData, stats);

      // Step 4: Transform features
      const transformedData = await this.transformFeatures(imputedData, stats);

      // Step 5: Convert to final format
      const processedData = await this.convertToProcessedFormat(transformedData, stats);

      // Update final statistics
      this.updateFinalStats(stats, processedData);

      return { processedData, stats, errors };
    } catch (error) {
      logger.error('Data preprocessing failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Validate incoming data structure and types
   */
  private async validateData(
    data: RawDataPoint[],
    stats: DatasetStats,
    errors: Error[]
  ): Promise<RawDataPoint[]> {
    const validData: RawDataPoint[] = [];

    for (const item of data) {
      try {
        // Validate against schema
        const validated = this.schema.parse(item);
        
        // Check required columns
        const hasAllFeatures = this.featureColumns.every(col => col in item);
        const hasTarget = !this.targetColumn || this.targetColumn in item;

        if (hasAllFeatures && hasTarget) {
          validData.push(validated);
          stats.validSamples++;
        } else {
          const error = new Error(`Missing required columns in data point: ${JSON.stringify(item)}`);
          errors.push(error);
          stats.invalidSamples++;
        }
      } catch (error) {
        errors.push(error as Error);
        stats.invalidSamples++;
      }
    }

    return validData;
  }

  /**
   * Clean data by removing outliers and invalid values
   */
  private async cleanData(
    data: RawDataPoint[],
    stats: DatasetStats,
    errors: Error[]
  ): Promise<RawDataPoint[]> {
    return data.filter(item => {
      try {
        // Check numerical columns for valid numbers
        for (const col of this.numericalColumns) {
          const value = item[col];
          if (value !== undefined && value !== null) {
            const num = Number(value);
            if (isNaN(num) || !isFinite(num)) {
              errors.push(new Error(`Invalid numerical value in column ${col}: ${value}`));
              stats.invalidSamples++;
              return false;
            }
          }
        }

        // Check categorical columns for valid categories
        for (const col of this.categoricalColumns) {
          const value = item[col];
          if (value !== undefined && value !== null && typeof value !== 'string') {
            errors.push(new Error(`Invalid categorical value in column ${col}: ${value}`));
            stats.invalidSamples++;
            return false;
          }
        }

        return true;
      } catch (error) {
        errors.push(error as Error);
        stats.invalidSamples++;
        return false;
      }
    });
  }

  /**
   * Handle missing values through imputation
   */
  private async handleMissingValues(
    data: RawDataPoint[],
    stats: DatasetStats
  ): Promise<RawDataPoint[]> {
    // Calculate column statistics for imputation
    const columnStats = this.calculateColumnStats(data);

    return data.map(item => {
      const processed = { ...item };

      for (const col of this.featureColumns) {
        if (processed[col] === undefined || processed[col] === null) {
          stats.missingValueCounts[col] = (stats.missingValueCounts[col] || 0) + 1;

          if (this.numericalColumns.has(col)) {
            // Use mean for numerical values
            processed[col] = columnStats[col].mean;
          } else if (this.categoricalColumns.has(col)) {
            // Use mode for categorical values
            processed[col] = columnStats[col].mode;
          }
        }
      }

      return processed;
    });
  }

  /**
   * Transform features (scaling, encoding, etc.)
   */
  private async transformFeatures(
    data: RawDataPoint[],
    stats: DatasetStats
  ): Promise<RawDataPoint[]> {
    try {
      // Extract numerical features for scaling
      const numericalData: number[][] = [];
      for (let i = 0; i < this.featureColumns.length; i++) {
        const col = this.featureColumns[i];
        if (col) {
          numericalData[i] = data.map(item => Number(item[col]));
        }
      }

      // Scale features using the feature engineer
      const scaledData = featureEngineer.scaleFeatures(
        numericalData,
        this.scalingMethod,
        this.featureColumns
      );

      // If we have a target column, perform feature selection
      if (this.targetColumn) {
        const target = data.map(item => Number(item[this.targetColumn]));
        
        const { selectedIndices, importance } = await featureEngineer.selectFeatures(
          scaledData,
          target,
          this.featureColumns,
          this.featureSelectionMethod
        );

        // Update selected features
        this.selectedFeatures = selectedIndices
          .map(i => this.featureColumns[i])
          .filter((col): col is string => col !== undefined);

        // Log feature importance
        logger.info('Feature importance scores', {
          importance: importance.map(imp => ({
            feature: imp.featureName,
            score: imp.importance
          }))
        });

        // Only keep selected features
        return data.map((item, rowIndex) => {
          const transformed = { ...item };
          this.selectedFeatures.forEach((col, colIndex) => {
            const dataIndex = this.featureColumns.indexOf(col);
            if (dataIndex >= 0 && scaledData[dataIndex]) {
              transformed[col] = scaledData[dataIndex][rowIndex];
            }
          });
          return transformed;
        });
      }

      // If no target column, return all scaled features
      return data.map((item, rowIndex) => {
        const transformed = { ...item };
        this.featureColumns.forEach((col, colIndex) => {
          if (col && scaledData[colIndex] && typeof rowIndex === 'number') {
            transformed[col] = scaledData[colIndex][rowIndex];
          }
        });
        return transformed;
      });
    } catch (error) {
      logger.error('Feature transformation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Convert to final ProcessedDataPoint format
   */
  private async convertToProcessedFormat(
    data: RawDataPoint[],
    stats: DatasetStats
  ): Promise<ProcessedDataPoint[]> {
    return data.map(item => {
      // Extract features in correct order
      const features = this.featureColumns.map(col => Number(item[col]));
      
      // Calculate data quality score
      const quality = this.calculateQualityScore(item);

      // Safely convert timestamp
      const timestamp = item.timestamp instanceof Date 
        ? item.timestamp 
        : new Date(String(item.timestamp));

      return {
        features,
        label: this.targetColumn ? Number(item[this.targetColumn]) : undefined,
        metadata: {
          id: String(item.id),
          timestamp,
          source: String(item.source),
          quality
        }
      };
    });
  }

  /**
   * Helper methods
   */
  private initializeStats(): DatasetStats {
    return {
      totalSamples: 0,
      validSamples: 0,
      invalidSamples: 0,
      missingValueCounts: {},
      featureStats: {}
    };
  }

  private calculateColumnStats(data: RawDataPoint[]): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const col of this.featureColumns) {
      const values = data
        .map(item => item[col])
        .filter(val => val !== undefined && val !== null);

      if (this.numericalColumns.has(col)) {
        const numbers = values.map(Number);
        stats[col] = {
          mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
          std: this.calculateStd(numbers),
          min: Math.min(...numbers),
          max: Math.max(...numbers)
        };
      } else if (this.categoricalColumns.has(col)) {
        const frequencies: Record<string, number> = {};
        values.forEach(val => {
          frequencies[String(val)] = (frequencies[String(val)] || 0) + 1;
        });
        stats[col] = {
          mode: Object.entries(frequencies)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0]
        };
      }
    }

    return stats;
  }

  private calculateScalingFactors(data: RawDataPoint[]): Record<string, { min: number; max: number }> {
    const factors: Record<string, { min: number; max: number }> = {};

    for (const col of this.numericalColumns) {
      const values = data
        .map(item => Number(item[col]))
        .filter(val => !isNaN(val) && isFinite(val));

      factors[col] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return factors;
  }

  private scaleValue(value: number, factor: { min: number; max: number }): number {
    const range = factor.max - factor.min;
    return range === 0 ? 0 : (value - factor.min) / range;
  }

  private encodeCategorical(value: string, column: string): number {
    // Simple label encoding - in production, use more sophisticated encoding
    const categories = new Set(this.categoricalColumns);
    return Array.from(categories).indexOf(value);
  }

  private calculateStd(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squareDiffs = numbers.map(x => Math.pow(x - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  }

  private calculateQualityScore(item: RawDataPoint): number {
    let score = 1;
    let checks = 0;

    // Check for missing values
    this.featureColumns.forEach(col => {
      if (item[col] === undefined || item[col] === null) {
        score -= 0.1;
      }
      checks++;
    });

    // Check for numerical validity
    this.numericalColumns.forEach(col => {
      const value = Number(item[col]);
      if (isNaN(value) || !isFinite(value)) {
        score -= 0.1;
      }
      checks++;
    });

    // Normalize score
    return Math.max(0, Math.min(1, score));
  }

  private updateFinalStats(stats: DatasetStats, processedData: ProcessedDataPoint[]): void {
    stats.totalSamples = processedData.length + stats.invalidSamples;
    
    // Update feature statistics
    this.featureColumns.forEach((col, index) => {
      const values = processedData.map(d => d.features[index]);
      stats.featureStats[col] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        std: this.calculateStd(values),
        nullCount: stats.missingValueCounts[col] || 0,
        uniqueCount: new Set(values).size
      };
    });
  }

  /**
   * Get selected features after processing
   */
  getSelectedFeatures(): string[] {
    return this.selectedFeatures;
  }

  /**
   * Get feature importance scores
   */
  getFeatureImportance(featureName: string) {
    return featureEngineer.getFeatureImportance(featureName);
  }
}

// Export singleton instance
export const dataPreprocessor = new DataPreprocessor({
  featureColumns: [],
  categoricalColumns: [],
  numericalColumns: [],
  scalingMethod: 'standard',
  featureSelectionMethod: 'correlation'
}); 