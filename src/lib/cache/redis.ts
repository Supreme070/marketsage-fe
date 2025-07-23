/**
 * Redis Caching Layer for LeadPulse Performance
 * 
 * Provides high-performance caching for:
 * - Visitor analytics aggregations
 * - Real-time metrics
 * - Geographic data
 * - Frequent database queries
 */

import Redis from 'ioredis';
import { logger } from '@/lib/logger';

class RedisCacheService {
  private client: Redis | null = null;
  private isConnected = false;
  private isBuildTime = false;

  constructor() {
    // Check if we're in build mode
    this.isBuildTime = process.env.NODE_ENV === 'production' && 
      (process.env.NEXT_PHASE === 'phase-production-build' || 
       process.env.BUILDING === 'true' ||
       process.argv.includes('build'));

    if (!this.isBuildTime) {
      this.initialize();
    } else {
      logger.info('Build time detected - skipping Redis initialization');
    }
  }

  private async initialize() {
    try {
      // Environment-aware Redis configuration
      const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
      const redisHost = isDocker 
        ? (process.env.REDIS_HOST || 'marketsage-valkey')
        : 'localhost';
      
      logger.info(`Initializing IORedis client for ${isDocker ? 'Docker' : 'local'} environment: ${redisHost}:${process.env.REDIS_PORT || '6379'}`);
      
      // Initialize Redis client
      this.client = new Redis({
        host: redisHost,
        port: Number.parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: Number.parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.client = null;
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (this.isBuildTime || !this.client || !this.isConnected) return false;
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    if (this.isBuildTime || !this.client || !this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (this.isBuildTime || !this.client || !this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Increment operations for counters
  async incr(key: string, ttl?: number): Promise<number | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const result = await this.client.incr(key);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return null;
    }
  }

  // Hash operations for structured data
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.hset(key, field, value);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  // List operations for activity feeds
  async lpush(key: string, value: any, maxLength?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.lpush(key, serialized);
      
      if (maxLength) {
        await this.client.ltrim(key, 0, maxLength - 1);
      }
      
      return true;
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return false;
    }
  }

  async lrange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
    if (!this.client || !this.isConnected) return [];

    try {
      const values = await this.client.lrange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations for unique collections
  async sadd(key: string, member: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.sadd(key, member);
      return true;
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error);
      return false;
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];

    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async scard(key: string): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      return await this.client.scard(key);
    } catch (error) {
      logger.error(`Redis SCARD error for key ${key}:`, error);
      return 0;
    }
  }

  // Pattern-based operations
  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis flush pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // Pipeline for batch operations
  async pipeline(operations: Array<{ cmd: string; args: any[] }>): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const pipeline = this.client.pipeline();
      
      operations.forEach(({ cmd, args }) => {
        (pipeline as any)[cmd](...args);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis pipeline error:', error);
      return false;
    }
  }

  // Cleanup
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }
}

// Export singleton instance
export const redis = new RedisCacheService();
export const redisService = redis; // Alias for compatibility