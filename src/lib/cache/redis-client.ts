import { createClient, type RedisClientType } from 'redis';

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Redis caching client for MarketSage
 * Provides session storage, API caching, and performance optimization
 */
class RedisCacheClient {
  private client: RedisClientType | null = null;
  private connected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://marketsage-valkey:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              console.error('Redis max retries exceeded');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.connected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.connected = false;
      });

      this.client.on('disconnect', () => {
        console.log('Redis client disconnected');
        this.connected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.connected = false;
    }
  }

  /**
   * Ensure Redis connection is available
   */
  private async ensureConnection(): Promise<boolean> {
    if (this.connected && this.client) {
      return true;
    }

    if (this.connectionAttempts >= this.maxRetries) {
      return false;
    }

    this.connectionAttempts++;
    
    try {
      await this.initialize();
      return this.connected;
    } catch (error) {
      console.error('Failed to reconnect to Redis:', error);
      return false;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      const cacheItem: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds
      };

      await this.client.setEx(key, ttlSeconds, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return null;
      }

      const cached = await this.client.get(key);
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired (additional safety check)
      const age = (Date.now() - cacheItem.timestamp) / 1000;
      if (age > cacheItem.ttl) {
        await this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(items: Record<string, any>, ttlSeconds = 3600): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      const pipeline = this.client.multi();
      
      for (const [key, value] of Object.entries(items)) {
        const cacheItem: CacheItem = {
          data: value,
          timestamp: Date.now(),
          ttl: ttlSeconds
        };
        pipeline.setEx(key, ttlSeconds, JSON.stringify(cacheItem));
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
      }

      const values = await this.client.mGet(keys);
      const result: Record<string, T | null> = {};

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];

        if (value) {
          try {
            const cacheItem: CacheItem<T> = JSON.parse(value);
            
            // Check if expired
            const age = (Date.now() - cacheItem.timestamp) / 1000;
            if (age <= cacheItem.ttl) {
              result[key] = cacheItem.data;
            } else {
              result[key] = null;
              // Delete expired key
              this.delete(key);
            }
          } catch {
            result[key] = null;
          }
        } else {
          result[key] = null;
        }
      }

      return result;
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by = 1): Promise<number | null> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return null;
      }

      const result = await this.client.incrBy(key, by);
      return result;
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return null;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      const result = await this.client.expire(key, seconds);
      return result;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Get Redis connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get Redis memory information and health metrics
   */
  async getMemoryInfo(): Promise<{
    used_memory: number;
    used_memory_human: string;
    used_memory_peak: number;
    used_memory_peak_human: string;
    maxmemory: number;
    maxmemory_human: string;
    memory_usage_percentage: number;
    connected_clients: number;
    keyspace_hits: number;
    keyspace_misses: number;
    hit_rate: number;
    uptime_in_seconds: number;
  } | null> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return null;
      }

      const info = await this.client.info('memory');
      const stats = await this.client.info('stats');
      const server = await this.client.info('server');
      const clients = await this.client.info('clients');

      // Parse memory info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryHumanMatch = info.match(/used_memory_human:(.+)/);
      const memoryPeakMatch = info.match(/used_memory_peak:(\d+)/);
      const memoryPeakHumanMatch = info.match(/used_memory_peak_human:(.+)/);
      const maxMemoryMatch = info.match(/maxmemory:(\d+)/);
      const maxMemoryHumanMatch = info.match(/maxmemory_human:(.+)/);

      // Parse stats
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);

      // Parse clients info
      const connectedClientsMatch = clients.match(/connected_clients:(\d+)/);

      // Parse uptime
      const uptimeMatch = server.match(/uptime_in_seconds:(\d+)/);

      const usedMemory = memoryMatch ? Number.parseInt(memoryMatch[1]) : 0;
      const maxMemory = maxMemoryMatch ? Number.parseInt(maxMemoryMatch[1]) : 0;
      const hits = hitsMatch ? Number.parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? Number.parseInt(missesMatch[1]) : 0;

      return {
        used_memory: usedMemory,
        used_memory_human: memoryHumanMatch ? memoryHumanMatch[1].trim() : '0B',
        used_memory_peak: memoryPeakMatch ? Number.parseInt(memoryPeakMatch[1]) : 0,
        used_memory_peak_human: memoryPeakHumanMatch ? memoryPeakHumanMatch[1].trim() : '0B',
        maxmemory: maxMemory,
        maxmemory_human: maxMemoryHumanMatch ? maxMemoryHumanMatch[1].trim() : '0B',
        memory_usage_percentage: maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0,
        connected_clients: connectedClientsMatch ? Number.parseInt(connectedClientsMatch[1]) : 0,
        keyspace_hits: hits,
        keyspace_misses: misses,
        hit_rate: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
        uptime_in_seconds: uptimeMatch ? Number.parseInt(uptimeMatch[1]) : 0,
      };
    } catch (error) {
      console.error('Redis memory info error:', error);
      return null;
    }
  }

  /**
   * Ping Redis server to check connectivity
   */
  async ping(): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.connected = false;
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Flush all data from Redis (use with caution)
   */
  async flushAll(): Promise<boolean> {
    try {
      if (!(await this.ensureConnection()) || !this.client) {
        return false;
      }

      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCacheClient();

// Cache key prefixes for different data types
export const CACHE_KEYS = {
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER: (userId: string) => `user:${userId}`,
  CONTACT: (contactId: string) => `contact:${contactId}`,
  CAMPAIGN: (campaignId: string) => `campaign:${campaignId}`,
  ANALYTICS: (orgId: string, period: string) => `analytics:${orgId}:${period}`,
  API_RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  AI_RESPONSE: (hash: string) => `ai_response:${hash}`,
  EMAIL_TEMPLATE: (templateId: string) => `email_template:${templateId}`,
  SMS_TEMPLATE: (templateId: string) => `sms_template:${templateId}`,
  WORKFLOW: (workflowId: string) => `workflow:${workflowId}`,
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  DAY: 86400,      // 24 hours
  WEEK: 604800,    // 7 days
  SESSION: 1800,   // 30 minutes for sessions
} as const;