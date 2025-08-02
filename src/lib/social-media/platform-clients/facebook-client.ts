/**
 * Facebook/Instagram Graph API Client
 * ====================================
 * 
 * Real Facebook and Instagram API integration
 * Handles posting, analytics, and account management
 */

import { logger } from '@/lib/logger';
import type { SocialMediaConnection } from '../social-media-connection-service';

export interface FacebookPostOptions {
  message: string;
  link?: string;
  picture?: string;
  video?: string;
  published?: boolean;
  scheduled_publish_time?: number;
}

export interface FacebookPostResult {
  id: string;
  post_id: string;
}

export interface FacebookPageInsights {
  page_impressions: number;
  page_reach: number;
  page_engaged_users: number;
  page_followers_count: number;
  page_posts_impressions: number;
}

export class FacebookClient {
  private accessToken: string;
  private pageId: string;

  constructor(connection: SocialMediaConnection) {
    this.accessToken = connection.accessToken;
    this.pageId = connection.accountId;
  }

  /**
   * Post to Facebook Page
   */
  async createPost(options: FacebookPostOptions): Promise<FacebookPostResult> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.pageId}/feed`;
      
      const body = new URLSearchParams({
        access_token: this.accessToken,
        message: options.message
      });

      if (options.link) body.append('link', options.link);
      if (options.picture) body.append('picture', options.picture);
      if (options.published !== undefined) body.append('published', options.published.toString());
      if (options.scheduled_publish_time) body.append('scheduled_publish_time', options.scheduled_publish_time.toString());

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Facebook post created successfully', {
        postId: result.id,
        pageId: this.pageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to create Facebook post', {
        error: error instanceof Error ? error.message : String(error),
        pageId: this.pageId
      });
      throw error;
    }
  }

  /**
   * Upload photo to Facebook
   */
  async uploadPhoto(imageUrl: string, caption?: string): Promise<FacebookPostResult> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.pageId}/photos`;
      
      const body = new URLSearchParams({
        access_token: this.accessToken,
        url: imageUrl
      });

      if (caption) body.append('caption', caption);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook photo upload error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Facebook photo uploaded successfully', {
        photoId: result.id,
        pageId: this.pageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload Facebook photo', {
        error: error instanceof Error ? error.message : String(error),
        pageId: this.pageId,
        imageUrl
      });
      throw error;
    }
  }

  /**
   * Get page insights (analytics)
   */
  async getPageInsights(since: Date, until: Date): Promise<FacebookPageInsights> {
    try {
      const metrics = [
        'page_impressions',
        'page_reach', 
        'page_engaged_users',
        'page_followers_count',
        'page_posts_impressions'
      ];

      const url = `https://graph.facebook.com/v18.0/${this.pageId}/insights`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        metric: metrics.join(','),
        since: Math.floor(since.getTime() / 1000).toString(),
        until: Math.floor(until.getTime() / 1000).toString(),
        period: 'day'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook insights error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Process insights data
      const insights: Partial<FacebookPageInsights> = {};
      
      result.data?.forEach((metric: any) => {
        if (metric.values && metric.values.length > 0) {
          const latestValue = metric.values[metric.values.length - 1];
          insights[metric.name as keyof FacebookPageInsights] = latestValue.value || 0;
        }
      });

      logger.info('Facebook insights retrieved', {
        pageId: this.pageId,
        metricsCount: Object.keys(insights).length
      });

      return insights as FacebookPageInsights;
    } catch (error) {
      logger.error('Failed to get Facebook insights', {
        error: error instanceof Error ? error.message : String(error),
        pageId: this.pageId
      });
      throw error;
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(): Promise<{
    id: string;
    name: string;
    category: string;
    followers_count: number;
    fan_count: number;
  }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.pageId}`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'id,name,category,followers_count,fan_count'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook page info error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Facebook page info retrieved', {
        pageId: this.pageId,
        pageName: result.name
      });

      return result;
    } catch (error) {
      logger.error('Failed to get Facebook page info', {
        error: error instanceof Error ? error.message : String(error),
        pageId: this.pageId
      });
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${this.accessToken}`
      );
      
      return response.ok;
    } catch (error) {
      logger.error('Failed to validate Facebook token', {
        error: error instanceof Error ? error.message : String(error),
        pageId: this.pageId
      });
      return false;
    }
  }
}