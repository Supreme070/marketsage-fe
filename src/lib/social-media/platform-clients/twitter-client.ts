/**
 * Twitter API v2 Client
 * ======================
 * 
 * Real Twitter API integration using OAuth 2.0
 * Handles tweets, media uploads, and analytics
 */

import { logger } from '@/lib/logger';
import type { SocialMediaConnection } from '../social-media-connection-service';

export interface TwitterPostOptions {
  text: string;
  media_ids?: string[];
  poll?: {
    options: string[];
    duration_minutes: number;
  };
  reply?: {
    in_reply_to_tweet_id: string;
  };
  quote_tweet_id?: string;
  geo?: {
    place_id: string;
  };
}

export interface TwitterPostResult {
  id: string;
  text: string;
  edit_history_tweet_ids: string[];
}

export interface TwitterAnalytics {
  tweet_count: number;
  listed_count: number;
  followers_count: number;
  following_count: number;
  like_count: number;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
}

export class TwitterClient {
  private accessToken: string;
  private userId: string;

  constructor(connection: SocialMediaConnection) {
    this.accessToken = connection.accessToken;
    this.userId = connection.accountId;
  }

  /**
   * Create a tweet
   */
  async createTweet(options: TwitterPostOptions): Promise<TwitterPostResult> {
    try {
      const url = 'https://api.twitter.com/2/tweets';
      
      const payload: any = {
        text: options.text
      };

      if (options.media_ids && options.media_ids.length > 0) {
        payload.media = { media_ids: options.media_ids };
      }

      if (options.poll) {
        payload.poll = {
          options: options.poll.options,
          duration_minutes: options.poll.duration_minutes
        };
      }

      if (options.reply) {
        payload.reply = { in_reply_to_tweet_id: options.reply.in_reply_to_tweet_id };
      }

      if (options.quote_tweet_id) {
        payload.quote_tweet_id = options.quote_tweet_id;
      }

      if (options.geo) {
        payload.geo = { place_id: options.geo.place_id };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter API error: ${error.detail || error.title || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter tweet created successfully', {
        tweetId: result.data.id,
        userId: this.userId
      });

      return result.data;
    } catch (error) {
      logger.error('Failed to create Twitter tweet', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId
      });
      throw error;
    }
  }

  /**
   * Upload media to Twitter
   */
  async uploadMedia(mediaUrl: string, mediaType: 'image' | 'video' | 'gif'): Promise<string> {
    try {
      // First, download the media
      const mediaResponse = await fetch(mediaUrl);
      if (!mediaResponse.ok) {
        throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
      }
      
      const mediaBuffer = await mediaResponse.arrayBuffer();
      const mediaData = new Uint8Array(mediaBuffer);

      // Upload to Twitter using v1.1 API (required for media upload)
      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
      
      const formData = new FormData();
      formData.append('media', new Blob([mediaData]), `media.${this.getFileExtension(mediaType)}`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter media upload error: ${error.errors?.[0]?.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter media uploaded successfully', {
        mediaId: result.media_id_string,
        mediaType,
        userId: this.userId
      });

      return result.media_id_string;
    } catch (error) {
      logger.error('Failed to upload Twitter media', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId,
        mediaUrl,
        mediaType
      });
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<TwitterAnalytics> {
    try {
      const url = `https://api.twitter.com/2/users/${this.userId}`;
      const params = new URLSearchParams({
        'user.fields': 'public_metrics,verified,created_at,description,location,pinned_tweet_id,profile_image_url,protected,url,username,withheld'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter analytics error: ${error.detail || error.title || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter analytics retrieved', {
        userId: this.userId,
        username: result.data.username
      });

      return {
        tweet_count: result.data.public_metrics.tweet_count,
        listed_count: result.data.public_metrics.listed_count,
        followers_count: result.data.public_metrics.followers_count,
        following_count: result.data.public_metrics.following_count,
        like_count: result.data.public_metrics.like_count,
        public_metrics: result.data.public_metrics
      };
    } catch (error) {
      logger.error('Failed to get Twitter analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId
      });
      throw error;
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetAnalytics(tweetId: string): Promise<any> {
    try {
      const url = `https://api.twitter.com/2/tweets/${tweetId}`;
      const params = new URLSearchParams({
        'tweet.fields': 'public_metrics,created_at,author_id,context_annotations,conversation_id,in_reply_to_user_id,referenced_tweets,reply_settings'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter tweet analytics error: ${error.detail || error.title || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter tweet analytics retrieved', {
        tweetId,
        userId: this.userId
      });

      return result.data;
    } catch (error) {
      logger.error('Failed to get Twitter tweet analytics', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId,
        tweetId
      });
      throw error;
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    try {
      const url = `https://api.twitter.com/2/tweets/${tweetId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter delete error: ${error.detail || error.title || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter tweet deleted successfully', {
        tweetId,
        userId: this.userId,
        deleted: result.data.deleted
      });

      return result.data.deleted;
    } catch (error) {
      logger.error('Failed to delete Twitter tweet', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId,
        tweetId
      });
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{
    id: string;
    username: string;
    name: string;
    verified: boolean;
    public_metrics: any;
  }> {
    try {
      const url = `https://api.twitter.com/2/users/${this.userId}`;
      const params = new URLSearchParams({
        'user.fields': 'public_metrics,verified,created_at,description,location,profile_image_url,protected,url,username,name'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter user info error: ${error.detail || error.title || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Twitter user info retrieved', {
        userId: this.userId,
        username: result.data.username
      });

      return result.data;
    } catch (error) {
      logger.error('Failed to get Twitter user info', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId
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
        `https://api.twitter.com/2/users/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.ok;
    } catch (error) {
      logger.error('Failed to validate Twitter token', {
        error: error instanceof Error ? error.message : String(error),
        userId: this.userId
      });
      return false;
    }
  }

  /**
   * Helper method to get file extension based on media type
   */
  private getFileExtension(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'gif': return 'gif';
      default: return 'jpg';
    }
  }

  /**
   * Create a thread (multiple tweets)
   */
  async createThread(tweets: string[]): Promise<TwitterPostResult[]> {
    const results: TwitterPostResult[] = [];
    let previousTweetId: string | undefined;

    for (const [index, text] of tweets.entries()) {
      const options: TwitterPostOptions = { text };
      
      if (previousTweetId && index > 0) {
        options.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      const result = await this.createTweet(options);
      results.push(result);
      previousTweetId = result.id;
    }

    logger.info('Twitter thread created successfully', {
      userId: this.userId,
      threadLength: results.length,
      firstTweetId: results[0]?.id
    });

    return results;
  }
}