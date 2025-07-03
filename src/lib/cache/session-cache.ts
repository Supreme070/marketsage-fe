import { redisCache, CACHE_KEYS, CACHE_TTL } from './redis-client';
import type { Session } from 'next-auth';

/**
 * Session caching utilities for improved performance
 * Caches user sessions in Redis to reduce database queries
 */

interface CachedSession {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    organizationId: string;
    organizationName: string;
  };
  expires: string;
  lastAccessed: string;
}

/**
 * Cache a user session in Redis
 */
export async function cacheSession(sessionToken: string, session: Session): Promise<boolean> {
  try {
    const cachedSession: CachedSession = {
      user: session.user,
      expires: session.expires,
      lastAccessed: new Date().toISOString()
    };

    const key = CACHE_KEYS.SESSION(sessionToken);
    return await redisCache.set(key, cachedSession, CACHE_TTL.SESSION);
  } catch (error) {
    console.error('Failed to cache session:', error);
    return false;
  }
}

/**
 * Retrieve a cached session from Redis
 */
export async function getCachedSession(sessionToken: string): Promise<Session | null> {
  try {
    const key = CACHE_KEYS.SESSION(sessionToken);
    const cachedSession = await redisCache.get<CachedSession>(key);
    
    if (!cachedSession) {
      return null;
    }

    // Check if session is expired
    const expiresAt = new Date(cachedSession.expires);
    if (expiresAt <= new Date()) {
      await redisCache.delete(key);
      return null;
    }

    // Update last accessed time
    cachedSession.lastAccessed = new Date().toISOString();
    await redisCache.set(key, cachedSession, CACHE_TTL.SESSION);

    return {
      user: cachedSession.user,
      expires: cachedSession.expires
    };
  } catch (error) {
    console.error('Failed to get cached session:', error);
    return null;
  }
}

/**
 * Invalidate a cached session
 */
export async function invalidateSession(sessionToken: string): Promise<boolean> {
  try {
    const key = CACHE_KEYS.SESSION(sessionToken);
    return await redisCache.delete(key);
  } catch (error) {
    console.error('Failed to invalidate session:', error);
    return false;
  }
}

/**
 * Cache user data for quick access
 */
export async function cacheUserData(userId: string, userData: any): Promise<boolean> {
  try {
    const key = CACHE_KEYS.USER(userId);
    return await redisCache.set(key, userData, CACHE_TTL.MEDIUM);
  } catch (error) {
    console.error('Failed to cache user data:', error);
    return false;
  }
}

/**
 * Get cached user data
 */
export async function getCachedUserData(userId: string): Promise<any | null> {
  try {
    const key = CACHE_KEYS.USER(userId);
    return await redisCache.get(key);
  } catch (error) {
    console.error('Failed to get cached user data:', error);
    return null;
  }
}

/**
 * Invalidate user cache when data changes
 */
export async function invalidateUserCache(userId: string): Promise<boolean> {
  try {
    const userKey = CACHE_KEYS.USER(userId);
    return await redisCache.delete(userKey);
  } catch (error) {
    console.error('Failed to invalidate user cache:', error);
    return false;
  }
}

/**
 * Cache analytics data for dashboard performance
 */
export async function cacheAnalytics(
  organizationId: string, 
  period: string, 
  data: any
): Promise<boolean> {
  try {
    const key = CACHE_KEYS.ANALYTICS(organizationId, period);
    return await redisCache.set(key, data, CACHE_TTL.MEDIUM);
  } catch (error) {
    console.error('Failed to cache analytics:', error);
    return false;
  }
}

/**
 * Get cached analytics data
 */
export async function getCachedAnalytics(
  organizationId: string, 
  period: string
): Promise<any | null> {
  try {
    const key = CACHE_KEYS.ANALYTICS(organizationId, period);
    return await redisCache.get(key);
  } catch (error) {
    console.error('Failed to get cached analytics:', error);
    return null;
  }
}

/**
 * Cache AI responses to avoid repeated processing
 */
export async function cacheAIResponse(
  inputHash: string, 
  response: any
): Promise<boolean> {
  try {
    const key = CACHE_KEYS.AI_RESPONSE(inputHash);
    return await redisCache.set(key, response, CACHE_TTL.LONG);
  } catch (error) {
    console.error('Failed to cache AI response:', error);
    return false;
  }
}

/**
 * Get cached AI response
 */
export async function getCachedAIResponse(inputHash: string): Promise<any | null> {
  try {
    const key = CACHE_KEYS.AI_RESPONSE(inputHash);
    return await redisCache.get(key);
  } catch (error) {
    console.error('Failed to get cached AI response:', error);
    return null;
  }
}

/**
 * Cache email templates for faster rendering
 */
export async function cacheEmailTemplate(
  templateId: string, 
  template: any
): Promise<boolean> {
  try {
    const key = CACHE_KEYS.EMAIL_TEMPLATE(templateId);
    return await redisCache.set(key, template, CACHE_TTL.DAY);
  } catch (error) {
    console.error('Failed to cache email template:', error);
    return false;
  }
}

/**
 * Get cached email template
 */
export async function getCachedEmailTemplate(templateId: string): Promise<any | null> {
  try {
    const key = CACHE_KEYS.EMAIL_TEMPLATE(templateId);
    return await redisCache.get(key);
  } catch (error) {
    console.error('Failed to get cached email template:', error);
    return null;
  }
}

/**
 * Batch cache multiple items for efficiency
 */
export async function batchCacheData(
  items: Array<{ key: string; data: any; ttl?: number }>
): Promise<boolean> {
  try {
    const cacheItems: Record<string, any> = {};
    let commonTTL = CACHE_TTL.MEDIUM;

    for (const item of items) {
      cacheItems[item.key] = item.data;
      if (item.ttl) {
        commonTTL = item.ttl; // Use the last TTL specified
      }
    }

    return await redisCache.mset(cacheItems, commonTTL);
  } catch (error) {
    console.error('Failed to batch cache data:', error);
    return false;
  }
}

/**
 * Get multiple cached items at once
 */
export async function batchGetCachedData(keys: string[]): Promise<Record<string, any | null>> {
  try {
    return await redisCache.mget(keys);
  } catch (error) {
    console.error('Failed to batch get cached data:', error);
    return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
  }
}