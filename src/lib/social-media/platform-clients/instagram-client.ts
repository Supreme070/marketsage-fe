/**
 * Instagram Graph API Client
 * ===========================
 * 
 * Real Instagram API integration for business accounts
 * Handles posting, stories, and analytics
 */

import { logger } from '@/lib/logger';
import { SocialMediaConnection } from '../social-media-connection-service';

export interface InstagramPostOptions {
  caption: string;
  image_url?: string;
  video_url?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  children?: string[]; // For carousel posts
  location_id?: string;
  user_tags?: Array<{
    username: string;
    x: number;
    y: number;
  }>;
}

export interface InstagramPostResult {
  id: string;
  permalink?: string;
}

export interface InstagramInsights {
  reach: number;
  impressions: number;
  profile_views: number;
  follower_count: number;
  website_clicks: number;
}

export class InstagramClient {
  private accessToken: string;
  private accountId: string;

  constructor(connection: SocialMediaConnection) {
    this.accessToken = connection.accessToken;
    this.accountId = connection.accountId;
  }

  /**
   * Create Instagram post (two-step process: create media, then publish)
   */
  async createPost(options: InstagramPostOptions): Promise<InstagramPostResult> {
    try {
      // Step 1: Create media object
      const mediaId = await this.createMediaObject(options);
      
      // Step 2: Publish the media
      const publishResult = await this.publishMedia(mediaId);
      
      logger.info('Instagram post created successfully', {
        mediaId,
        publishedId: publishResult.id,
        accountId: this.accountId
      });

      return publishResult;
    } catch (error) {
      logger.error('Failed to create Instagram post', {
        error: error instanceof Error ? error.message : String(error),
        accountId: this.accountId
      });
      throw error;
    }
  }

  /**
   * Step 1: Create media object
   */
  private async createMediaObject(options: InstagramPostOptions): Promise<string> {
    const url = `https://graph.facebook.com/v18.0/${this.accountId}/media`;
    
    const body = new URLSearchParams({
      access_token: this.accessToken,
      caption: options.caption,
      media_type: options.media_type
    });

    if (options.image_url) body.append('image_url', options.image_url);
    if (options.video_url) body.append('video_url', options.video_url);
    if (options.location_id) body.append('location_id', options.location_id);
    
    // Add user tags if provided
    if (options.user_tags && options.user_tags.length > 0) {
      body.append('user_tags', JSON.stringify(options.user_tags));
    }

    // For carousel posts
    if (options.children && options.children.length > 0) {
      body.append('children', options.children.join(','));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram media creation error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Step 2: Publish media
   */
  private async publishMedia(mediaId: string): Promise<InstagramPostResult> {
    const url = `https://graph.facebook.com/v18.0/${this.accountId}/media_publish`;
    
    const body = new URLSearchParams({
      access_token: this.accessToken,
      creation_id: mediaId
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram publish error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Get permalink for the published post
    try {
      const permalink = await this.getPostPermalink(result.id);
      return {
        id: result.id,
        permalink
      };
    } catch (error) {
      logger.warn('Failed to get Instagram post permalink', { error });
      return { id: result.id };
    }
  }

  /**
   * Get post permalink
   */
  private async getPostPermalink(postId: string): Promise<string> {
    const url = `https://graph.facebook.com/v18.0/${postId}`;
    const params = new URLSearchParams({
      access_token: this.accessToken,
      fields: 'permalink'
    });

    const response = await fetch(`${url}?${params}`);
    
    if (response.ok) {
      const result = await response.json();
      return result.permalink;
    }
    
    return `https://instagram.com/p/${postId}`;
  }

  /**
   * Upload media for carousel or later use
   */
  async uploadMedia(mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO', caption?: string): Promise<string> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.accountId}/media`;
      
      const body = new URLSearchParams({
        access_token: this.accessToken,
        media_type: mediaType,
        is_carousel_item: 'true'
      });

      if (mediaType === 'IMAGE') {
        body.append('image_url', mediaUrl);
      } else {
        body.append('video_url', mediaUrl);
      }

      if (caption) body.append('caption', caption);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Instagram media upload error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Instagram media uploaded successfully', {
        mediaId: result.id,
        mediaType,
        accountId: this.accountId
      });

      return result.id;
    } catch (error) {
      logger.error('Failed to upload Instagram media', {
        error: error instanceof Error ? error.message : String(error),
        accountId: this.accountId,
        mediaUrl,
        mediaType
      });
      throw error;
    }
  }

  /**
   * Get Instagram insights (analytics)
   */
  async getInsights(since: Date, until: Date): Promise<InstagramInsights> {
    try {
      // Get account insights
      const accountMetrics = [
        'reach',
        'impressions', 
        'profile_views',
        'follower_count',
        'website_clicks'
      ];

      const url = `https://graph.facebook.com/v18.0/${this.accountId}/insights`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        metric: accountMetrics.join(','),
        since: Math.floor(since.getTime() / 1000).toString(),
        until: Math.floor(until.getTime() / 1000).toString(),
        period: 'day'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Instagram insights error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Process insights data
      const insights: Partial<InstagramInsights> = {};
      
      result.data?.forEach((metric: any) => {
        if (metric.values && metric.values.length > 0) {
          const latestValue = metric.values[metric.values.length - 1];
          insights[metric.name as keyof InstagramInsights] = latestValue.value || 0;
        }
      });

      logger.info('Instagram insights retrieved', {
        accountId: this.accountId,
        metricsCount: Object.keys(insights).length
      });

      return insights as InstagramInsights;
    } catch (error) {
      logger.error('Failed to get Instagram insights', {
        error: error instanceof Error ? error.message : String(error),
        accountId: this.accountId
      });
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<{
    id: string;
    username: string;
    account_type: string;
    media_count: number;
    followers_count: number;
    follows_count: number;
  }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.accountId}`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'id,username,account_type,media_count,followers_count,follows_count'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Instagram account info error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Instagram account info retrieved', {
        accountId: this.accountId,
        username: result.username
      });

      return result;
    } catch (error) {
      logger.error('Failed to get Instagram account info', {
        error: error instanceof Error ? error.message : String(error),
        accountId: this.accountId
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
        `https://graph.facebook.com/v18.0/${this.accountId}?access_token=${this.accessToken}&fields=id`
      );
      
      return response.ok;
    } catch (error) {
      logger.error('Failed to validate Instagram token', {
        error: error instanceof Error ? error.message : String(error),
        accountId: this.accountId
      });
      return false;
    }
  }
}