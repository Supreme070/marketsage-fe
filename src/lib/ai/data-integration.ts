/**
 * Data Integration Module
 * Handles external data source connections and real-time streaming
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import { RawDataPoint } from '@/lib/ml/data-pipeline';
import { featureEngineer } from '@/lib/ml/feature-engineering';

// Data source types
export type DataSourceType = 'api' | 'database' | 'file' | 'stream';

export interface DataSourceConfig {
  type: DataSourceType;
  name: string;
  config: {
    url?: string;
    apiKey?: string;
    database?: {
      host: string;
      port: number;
      name: string;
      user: string;
      password: string;
    };
    filePath?: string;
    streamConfig?: {
      batchSize: number;
      windowSize: number; // in seconds
      maxBuffer: number;
    };
  };
  schema?: Record<string, string>; // Expected data schema
  transformations?: Array<(data: any) => any>; // Data transformation pipeline
}

export interface StreamingStats {
  totalProcessed: number;
  batchesProcessed: number;
  avgProcessingTime: number;
  errorRate: number;
  lastProcessed: Date;
}

class DataSourceManager extends EventEmitter {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private streamingBuffers: Map<string, any[]> = new Map();
  private streamingStats: Map<string, StreamingStats> = new Map();
  private activeStreams: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Register a new data source
   */
  async registerDataSource(config: DataSourceConfig): Promise<string> {
    const sourceId = `${config.type}_${config.name}_${Date.now()}`;
    
    try {
      // Validate configuration
      await this.validateDataSourceConfig(config);
      
      // Store configuration
      this.dataSources.set(sourceId, config);
      
      // Initialize streaming buffer if needed
      if (config.type === 'stream') {
        this.streamingBuffers.set(sourceId, []);
        this.streamingStats.set(sourceId, {
          totalProcessed: 0,
          batchesProcessed: 0,
          avgProcessingTime: 0,
          errorRate: 0,
          lastProcessed: new Date()
        });
      }
      
      logger.info('Data source registered successfully', { sourceId, type: config.type });
      return sourceId;
    } catch (error) {
      logger.error('Failed to register data source', {
        error: error instanceof Error ? error.message : String(error),
        config
      });
      throw error;
    }
  }

  /**
   * Start streaming from a data source
   */
  async startStreaming(sourceId: string): Promise<void> {
    const config = this.dataSources.get(sourceId);
    if (!config || config.type !== 'stream') {
      throw new Error('Invalid streaming source');
    }

    try {
      // Set up streaming interval
      const interval = setInterval(async () => {
        await this.processStreamingBatch(sourceId);
      }, (config.config.streamConfig?.windowSize || 60) * 1000);

      this.activeStreams.set(sourceId, interval);
      
      logger.info('Streaming started', { sourceId });
    } catch (error) {
      logger.error('Failed to start streaming', {
        error: error instanceof Error ? error.message : String(error),
        sourceId
      });
      throw error;
    }
  }

  /**
   * Stop streaming from a data source
   */
  async stopStreaming(sourceId: string): Promise<void> {
    const interval = this.activeStreams.get(sourceId);
    if (interval) {
      clearInterval(interval);
      this.activeStreams.delete(sourceId);
      logger.info('Streaming stopped', { sourceId });
    }
  }

  /**
   * Process a batch of streaming data
   */
  private async processStreamingBatch(sourceId: string): Promise<void> {
    const config = this.dataSources.get(sourceId);
    const buffer = this.streamingBuffers.get(sourceId);
    const stats = this.streamingStats.get(sourceId);
    
    if (!config || !buffer || !stats) return;

    try {
      const batchSize = config.config.streamConfig?.batchSize || 100;
      const batch = buffer.splice(0, batchSize);
      
      if (batch.length > 0) {
        const startTime = Date.now();
        
        // Transform data
        const transformedBatch = await this.transformBatch(batch, config.transformations);
        
        // Generate features
        const processedBatch = await featureEngineer.generateFeatures(transformedBatch);
        
        // Update stats
        stats.totalProcessed += batch.length;
        stats.batchesProcessed += 1;
        stats.lastProcessed = new Date();
        stats.avgProcessingTime = (stats.avgProcessingTime * (stats.batchesProcessed - 1) + 
          (Date.now() - startTime)) / stats.batchesProcessed;
        
        // Emit processed batch
        this.emit('batchProcessed', {
          sourceId,
          data: processedBatch,
          stats: { ...stats }
        });
      }
    } catch (error) {
      logger.error('Failed to process streaming batch', {
        error: error instanceof Error ? error.message : String(error),
        sourceId
      });
      
      // Update error rate
      if (stats) {
        stats.errorRate = (stats.errorRate * stats.batchesProcessed + 1) / (stats.batchesProcessed + 1);
      }
    }
  }

  /**
   * Add data to streaming buffer
   */
  async addToStream(sourceId: string, data: any): Promise<void> {
    const buffer = this.streamingBuffers.get(sourceId);
    const config = this.dataSources.get(sourceId);
    
    if (!buffer || !config) {
      throw new Error('Invalid streaming source');
    }

    try {
      // Validate data against schema
      if (config.schema) {
        await this.validateDataAgainstSchema(data, config.schema);
      }
      
      // Add to buffer
      buffer.push(data);
      
      // Check buffer size
      const maxBuffer = config.config.streamConfig?.maxBuffer || 10000;
      if (buffer.length > maxBuffer) {
        buffer.splice(0, buffer.length - maxBuffer);
        logger.warn('Streaming buffer overflow, dropping old data', { sourceId });
      }
    } catch (error) {
      logger.error('Failed to add data to stream', {
        error: error instanceof Error ? error.message : String(error),
        sourceId
      });
      throw error;
    }
  }

  /**
   * Transform a batch of data
   */
  private async transformBatch(
    batch: any[],
    transformations: Array<(data: any) => any> = []
  ): Promise<any[]> {
    return batch.map(item => 
      transformations.reduce((data, transform) => transform(data), item)
    );
  }

  /**
   * Validate data source configuration
   */
  private async validateDataSourceConfig(config: DataSourceConfig): Promise<void> {
    // Add validation logic based on source type
    switch (config.type) {
      case 'api':
        if (!config.config.url || !config.config.apiKey) {
          throw new Error('API configuration requires URL and API key');
        }
        break;
      case 'database':
        if (!config.config.database) {
          throw new Error('Database configuration missing');
        }
        break;
      case 'file':
        if (!config.config.filePath) {
          throw new Error('File path missing');
        }
        break;
      case 'stream':
        if (!config.config.streamConfig) {
          throw new Error('Stream configuration missing');
        }
        break;
    }
  }

  /**
   * Validate data against schema
   */
  private async validateDataAgainstSchema(
    data: any,
    schema: Record<string, string>
  ): Promise<void> {
    for (const [field, type] of Object.entries(schema)) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
      
      const value = data[field];
      const actualType = typeof value;
      
      if (actualType !== type) {
        throw new Error(`Invalid type for field ${field}: expected ${type}, got ${actualType}`);
      }
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      logger.error('Data source error', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }

  /**
   * Get streaming statistics
   */
  getStreamingStats(sourceId: string): StreamingStats | null {
    return this.streamingStats.get(sourceId) || null;
  }
}

// Export singleton instance
export const dataSourceManager = new DataSourceManager(); 