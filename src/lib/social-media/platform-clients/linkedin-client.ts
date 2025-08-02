/**
 * LinkedIn API Client
 * ===================
 * 
 * Real LinkedIn API integration for company pages and personal profiles
 * Handles posts, articles, and analytics
 */

import { logger } from '@/lib/logger';
import type { SocialMediaConnection } from '../social-media-connection-service';

export interface LinkedInPostOptions {
  text: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  content?: {
    article?: {
      source: string;
      thumbnail?: string;
      title: string;
      description: string;
    };
    media?: {
      id: string;
      title?: string;
      description?: string;
    };
  };
  commentary?: string;
}

export interface LinkedInPostResult {
  id: string;
  activity: string;
}

export interface LinkedInAnalytics {
  followerCount: number;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

export class LinkedInClient {
  private accessToken: string;
  private profileId: string;
  private isCompanyPage: boolean;

  constructor(connection: SocialMediaConnection) {
    this.accessToken = connection.accessToken;
    this.profileId = connection.accountId;
    this.isCompanyPage = connection.metadata?.isCompanyPage || false;
  }

  /**
   * Create LinkedIn post
   */
  async createPost(options: LinkedInPostOptions): Promise<LinkedInPostResult> {
    try {
      const url = 'https://api.linkedin.com/v2/ugcPosts';
      
      const author = this.isCompanyPage 
        ? `urn:li:organization:${this.profileId}`
        : `urn:li:person:${this.profileId}`;

      const payload: any = {
        author: author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: options.text
            },
            shareMediaCategory: options.content ? 'ARTICLE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': options.visibility
        }
      };

      // Add article content if provided
      if (options.content?.article) {
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: options.content.article.description
          },
          media: options.content.article.source,
          title: {
            text: options.content.article.title
          }
        }];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LinkedIn API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('LinkedIn post created successfully', {
        postId: result.id,
        profileId: this.profileId,
        isCompanyPage: this.isCompanyPage
      });

      return {
        id: result.id,
        activity: result.activity || result.id
      };
    } catch (error) {
      logger.error('Failed to create LinkedIn post', {
        error: error instanceof Error ? error.message : String(error),
        profileId: this.profileId
      });
      throw error;
    }
  }

  /**
   * Upload media to LinkedIn
   */
  async uploadMedia(mediaUrl: string, mediaType: 'image' | 'video' | 'document'): Promise<string> {
    try {
      // Step 1: Register upload
      const registerUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';
      
      const owner = this.isCompanyPage 
        ? `urn:li:organization:${this.profileId}`
        : `urn:li:person:${this.profileId}`;

      const registerPayload = {
        registerUploadRequest: {
          recipes: [
            mediaType === 'image' ? 'urn:li:digitalmediaRecipe:feedshare-image' :
            mediaType === 'video' ? 'urn:li:digitalmediaRecipe:feedshare-video' :
            'urn:li:digitalmediaRecipe:feedshare-document'
          ],
          owner: owner,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      };

      const registerResponse = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerPayload)
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(`LinkedIn media register error: ${error.message || registerResponse.statusText}`);
      }

      const registerResult = await registerResponse.json();
      const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResult.value.asset;

      // Step 2: Download media from URL
      const mediaResponse = await fetch(mediaUrl);
      if (!mediaResponse.ok) {
        throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
      }
      
      const mediaBuffer = await mediaResponse.arrayBuffer();

      // Step 3: Upload media to LinkedIn
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: mediaBuffer
      });

      if (!uploadResponse.ok) {
        throw new Error(`LinkedIn media upload error: ${uploadResponse.statusText}`);
      }

      logger.info('LinkedIn media uploaded successfully', {
        asset,
        mediaType,
        profileId: this.profileId
      });

      return asset;
    } catch (error) {
      logger.error('Failed to upload LinkedIn media', {
        error: error instanceof Error ? error.message : String(error),
        profileId: this.profileId,
        mediaUrl,
        mediaType
      });
      throw error;
    }
  }

  /**
   * Get profile/company analytics
   */
  async getAnalytics(isCompanyPage = false, startDate?: Date, endDate?: Date): Promise<LinkedInAnalytics> {
    try {
      if (isCompanyPage) {
        return await this.getCompanyAnalytics(startDate, endDate);
      } else {
        return await this.getProfileAnalytics();
      }
    } catch (error) {
      logger.error('Failed to get LinkedIn analytics', {
        error: error instanceof Error ? error.message : String(error),
        profileId: this.profileId,
        isCompanyPage
      });
      throw error;
    }
  }

  /**
   * Get company page analytics
   */
  private async getCompanyAnalytics(startDate?: Date, endDate?: Date): Promise<LinkedInAnalytics> {
    const url = `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics`;
    const params = new URLSearchParams({
      q: 'organizationalEntity',
      organizationalEntity: `urn:li:organization:${this.profileId}`
    });

    if (startDate && endDate) {
      params.append('timeIntervals.timeGranularityType', 'DAY');
      params.append('timeIntervals.timeRange.start', Math.floor(startDate.getTime()).toString());
      params.append('timeIntervals.timeRange.end', Math.floor(endDate.getTime()).toString());
    }

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn company analytics error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Process analytics data
    const analytics: LinkedInAnalytics = {
      followerCount: 0,
      impressions: 0,
      clicks: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagement: 0
    };

    if (result.elements && result.elements.length > 0) {
      const latestData = result.elements[result.elements.length - 1];
      analytics.followerCount = latestData.followerGains?.organicFollowerGains || 0;
      analytics.impressions = latestData.impressionCount || 0;
      analytics.clicks = latestData.clickCount || 0;
    }

    logger.info('LinkedIn company analytics retrieved', {
      profileId: this.profileId,
      followerCount: analytics.followerCount
    });

    return analytics;
  }

  /**
   * Get personal profile analytics
   */
  private async getProfileAnalytics(): Promise<LinkedInAnalytics> {
    // Note: Personal profile analytics are limited in LinkedIn API
    // This is a simplified version - real implementation would need LinkedIn Marketing API
    
    const url = `https://api.linkedin.com/v2/people/(id:${this.profileId})`;
    const params = new URLSearchParams({
      projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
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
      throw new Error(`LinkedIn profile analytics error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Return basic analytics (LinkedIn limits personal profile metrics)
    const analytics: LinkedInAnalytics = {
      followerCount: 0, // Not available for personal profiles
      impressions: 0,   // Limited access
      clicks: 0,        // Limited access
      likes: 0,         // Limited access
      comments: 0,      // Limited access
      shares: 0,        // Limited access
      engagement: 0     // Limited access
    };

    logger.info('LinkedIn profile analytics retrieved', {
      profileId: this.profileId,
      name: `${result.localizedFirstName} ${result.localizedLastName}`
    });

    return analytics;
  }

  /**
   * Get profile/company information
   */
  async getProfileInfo(): Promise<{
    id: string;
    name: string;
    type: 'person' | 'company';
    profileUrl?: string;
    followerCount?: number;
  }> {
    try {
      if (this.isCompanyPage) {
        return await this.getCompanyInfo();
      } else {
        return await this.getPersonInfo();
      }
    } catch (error) {
      logger.error('Failed to get LinkedIn profile info', {
        error: error instanceof Error ? error.message : String(error),
        profileId: this.profileId
      });
      throw error;
    }
  }

  /**
   * Get company information
   */
  private async getCompanyInfo(): Promise<any> {
    const url = `https://api.linkedin.com/v2/organizations/${this.profileId}`;
    const params = new URLSearchParams({
      projection: '(id,localizedName,localizedWebsite,logoV2,followerCount)'
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
      throw new Error(`LinkedIn company info error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      name: result.localizedName,
      type: 'company',
      profileUrl: result.localizedWebsite,
      followerCount: result.followerCount
    };
  }

  /**
   * Get person information
   */
  private async getPersonInfo(): Promise<any> {
    const url = `https://api.linkedin.com/v2/people/(id:${this.profileId})`;
    const params = new URLSearchParams({
      projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
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
      throw new Error(`LinkedIn person info error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      name: `${result.localizedFirstName} ${result.localizedLastName}`,
      type: 'person',
      profileUrl: `https://linkedin.com/in/${result.id}`
    };
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://api.linkedin.com/v2/me',
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
      logger.error('Failed to validate LinkedIn token', {
        error: error instanceof Error ? error.message : String(error),
        profileId: this.profileId
      });
      return false;
    }
  }
}