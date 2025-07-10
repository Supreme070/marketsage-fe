/**
 * Centralized Redis Connection Pool
 * 
 * Provides a single Redis connection pool to reduce resource usage
 * and improve performance across the application.
 */

import Redis from 'ioredis';
import { createClient, type RedisClientType } from 'redis';
import { logger } from '@/lib/logger';

interface RedisPoolConfig {
  maxConnections: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  lazyConnect: boolean;
}

class RedisConnectionPool {
  private ioredisClient: Redis | null = null;
  private nodeRedisClient: RedisClientType | null = null;
  private connected = false;
  private connectionAttempts = 0;
  private readonly maxRetries = 3;
  private readonly isBuildTime: boolean;

  private readonly config: RedisPoolConfig = {
    maxConnections: 20, // Limit total connections
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    lazyConnect: true
  };

  constructor() {
    // Detect build time to avoid Redis connections during build
    this.isBuildTime = process.env.NODE_ENV === 'production' && 
      (process.env.NEXT_PHASE === 'phase-production-build' || 
       process.env.BUILDING === 'true' ||
       process.argv.includes('build'));

    if (!this.isBuildTime) {
      this.initialize();
    } else {
      logger.info('Build time detected - skipping Redis pool initialization');
    }
  }

  /**
   * Initialize Redis connections
   */
  private async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://marketsage-valkey:6379';
      
      // Initialize IORedis client (for advanced operations)
      this.ioredisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        connectTimeout: this.config.connectTimeout,
        lazyConnect: this.config.lazyConnect,
        enableOfflineQueue: false,
        keepAlive: 30000,
        family: 4,
        maxmemoryPolicy: 'allkeys-lru'
      });

      // Initialize Node Redis client (for standard operations)
      this.nodeRedisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: this.config.connectTimeout,
          lazyConnect: this.config.lazyConnect,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error('Redis max retries exceeded');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Connect both clients
      await Promise.all([
        this.ioredisClient.connect(),
        this.nodeRedisClient.connect()
      ]);

      this.connected = true;
      this.connectionAttempts = 0;
      logger.info('Redis connection pool initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Redis connection pool:', error);
      this.connected = false;
    }
  }

  /**
   * Setup event handlers for both clients
   */
  private setupEventHandlers(): void {
    // IORedis events
    if (this.ioredisClient) {
      this.ioredisClient.on('connect', () => {
        logger.debug('IORedis client connected');
        this.connected = true;
      });

      this.ioredisClient.on('error', (err) => {
        logger.error('IORedis client error:', err);
        this.connected = false;
      });

      this.ioredisClient.on('close', () => {
        logger.debug('IORedis client disconnected');
        this.connected = false;
      });
    }

    // Node Redis events
    if (this.nodeRedisClient) {
      this.nodeRedisClient.on('connect', () => {
        logger.debug('Node Redis client connected');
      });

      this.nodeRedisClient.on('error', (err) => {
        logger.error('Node Redis client error:', err);
      });

      this.nodeRedisClient.on('disconnect', () => {
        logger.debug('Node Redis client disconnected');
      });
    }
  }

  /**
   * Get IORedis client for advanced operations (pipelines, pub/sub, etc.)
   */
  public getIORedisClient(): Redis | null {
    if (this.isBuildTime) {
      return null;
    }

    if (!this.connected || !this.ioredisClient) {
      logger.warn('IORedis client not available, attempting reconnection');
      this.ensureConnection();
      return this.ioredisClient;
    }

    return this.ioredisClient;
  }

  /**
   * Get Node Redis client for standard operations
   */
  public getNodeRedisClient(): RedisClientType | null {
    if (this.isBuildTime) {
      return null;
    }

    if (!this.connected || !this.nodeRedisClient) {
      logger.warn('Node Redis client not available, attempting reconnection');
      this.ensureConnection();
      return this.nodeRedisClient;
    }

    return this.nodeRedisClient;
  }

  /**
   * Ensure connection is available
   */
  private async ensureConnection(): Promise<boolean> {
    if (this.connected && this.ioredisClient && this.nodeRedisClient) {
      return true;
    }

    if (this.connectionAttempts >= this.maxRetries) {
      logger.error('Redis connection max retries exceeded');
      return false;
    }

    this.connectionAttempts++;
    
    try {
      await this.initialize();
      return this.connected;
    } catch (error) {
      logger.error('Failed to reconnect Redis pool:', error);
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  public isConnected(): boolean {
    return this.connected && !this.isBuildTime;
  }

  /**
   * Ping Redis servers to check health
   */
  public async ping(): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.ioredisClient) {
        return false;
      }

      const response = await this.ioredisClient.ping();
      return response === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Get Redis memory and performance info
   */
  public async getInfo(section?: string): Promise<string | null> {
    try {
      if (!this.isConnected() || !this.ioredisClient) {
        return null;
      }

      return await this.ioredisClient.info(section);
    } catch (error) {
      logger.error('Redis info failed:', error);
      return null;
    }
  }

  /**
   * Gracefully close all connections
   */
  public async disconnect(): Promise<void> {
    try {
      const promises = [];
      
      if (this.ioredisClient) {
        promises.push(this.ioredisClient.disconnect());
      }
      
      if (this.nodeRedisClient) {
        promises.push(this.nodeRedisClient.disconnect());
      }

      await Promise.all(promises);
      this.connected = false;
      logger.info('Redis connection pool disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis pool:', error);
    }
  }

  /**
   * Get pool statistics
   */
  public getPoolStats() {
    return {
      connected: this.connected,
      connectionAttempts: this.connectionAttempts,
      maxRetries: this.maxRetries,
      config: this.config,
      isBuildTime: this.isBuildTime
    };
  }
}

// Export singleton instance
export const redisPool = new RedisConnectionPool();

// Convenience exports for backward compatibility
export const getIORedisClient = () => redisPool.getIORedisClient();
export const getNodeRedisClient = () => redisPool.getNodeRedisClient();
export const isRedisConnected = () => redisPool.isConnected();