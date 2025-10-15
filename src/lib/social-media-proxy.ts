/**
 * Social Media Frontend Proxy - Thin API Wrapper
 * ===============================================
 *
 * NO BUSINESS LOGIC - Only API calls to backend
 * All social media operations secured server-side
 *
 * Phase 3 Migration: Social Media Platform Clients
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

// ============================================
// Type Definitions
// ============================================

export interface InstagramPostOptions {
  caption: string;
  image_url?: string;
  video_url?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  children?: string[];
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

export interface InstagramAccountInfo {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count: number;
  follows_count: number;
}

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

export interface FacebookPageInfo {
  id: string;
  name: string;
  category: string;
  followers_count: number;
  fan_count: number;
}

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

export interface TwitterUserInfo {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  public_metrics: any;
}

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

export interface LinkedInProfileInfo {
  id: string;
  name: string;
  type: 'person' | 'company';
  profileUrl?: string;
  followerCount?: number;
}

export interface SocialMediaConnection {
  id: string;
  organizationId: string;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
  isActive: boolean;
  lastSync?: Date;
  metadata: any;
}

export interface ConnectionStats {
  totalConnections: number;
  platforms: Record<string, number>;
  connectedPlatforms: string[];
}

// ============================================
// Instagram Service Functions
// ============================================

/**
 * Create Instagram post
 */
export async function createInstagramPost(
  connectionId: string,
  options: InstagramPostOptions,
  token: string
): Promise<InstagramPostResult> {
  const response = await fetch(`${BACKEND_URL}/social-media/instagram/${connectionId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Instagram post: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload Instagram media
 */
export async function uploadInstagramMedia(
  connectionId: string,
  mediaUrl: string,
  mediaType: 'IMAGE' | 'VIDEO',
  caption: string | undefined,
  token: string
): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/social-media/instagram/${connectionId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mediaUrl, mediaType, caption }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload Instagram media: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.mediaId;
}

/**
 * Get Instagram insights
 */
export async function getInstagramInsights(
  connectionId: string,
  since: Date,
  until: Date,
  token: string
): Promise<InstagramInsights> {
  const params = new URLSearchParams({
    since: since.toISOString(),
    until: until.toISOString(),
  });

  const response = await fetch(`${BACKEND_URL}/social-media/instagram/${connectionId}/insights?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Instagram insights: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get Instagram account info
 */
export async function getInstagramAccountInfo(
  connectionId: string,
  token: string
): Promise<InstagramAccountInfo> {
  const response = await fetch(`${BACKEND_URL}/social-media/instagram/${connectionId}/account`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Instagram account info: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Validate Instagram token
 */
export async function validateInstagramToken(
  connectionId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/instagram/${connectionId}/validate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to validate Instagram token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.valid;
}

// ============================================
// Facebook Service Functions
// ============================================

/**
 * Create Facebook post
 */
export async function createFacebookPost(
  connectionId: string,
  options: FacebookPostOptions,
  token: string
): Promise<FacebookPostResult> {
  const response = await fetch(`${BACKEND_URL}/social-media/facebook/${connectionId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Facebook post: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload Facebook photo
 */
export async function uploadFacebookPhoto(
  connectionId: string,
  imageUrl: string,
  caption: string | undefined,
  token: string
): Promise<FacebookPostResult> {
  const response = await fetch(`${BACKEND_URL}/social-media/facebook/${connectionId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrl, caption }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload Facebook photo: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get Facebook page insights
 */
export async function getFacebookPageInsights(
  connectionId: string,
  since: Date,
  until: Date,
  token: string
): Promise<FacebookPageInsights> {
  const params = new URLSearchParams({
    since: since.toISOString(),
    until: until.toISOString(),
  });

  const response = await fetch(`${BACKEND_URL}/social-media/facebook/${connectionId}/insights?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Facebook insights: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get Facebook page info
 */
export async function getFacebookPageInfo(
  connectionId: string,
  token: string
): Promise<FacebookPageInfo> {
  const response = await fetch(`${BACKEND_URL}/social-media/facebook/${connectionId}/page`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Facebook page info: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Validate Facebook token
 */
export async function validateFacebookToken(
  connectionId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/facebook/${connectionId}/validate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to validate Facebook token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.valid;
}

// ============================================
// Twitter Service Functions
// ============================================

/**
 * Create tweet
 */
export async function createTweet(
  connectionId: string,
  options: TwitterPostOptions,
  token: string
): Promise<TwitterPostResult> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/tweets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create tweet: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload Twitter media
 */
export async function uploadTwitterMedia(
  connectionId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'gif',
  token: string
): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mediaUrl, mediaType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload Twitter media: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.mediaId;
}

/**
 * Get Twitter user analytics
 */
export async function getTwitterUserAnalytics(
  connectionId: string,
  token: string
): Promise<TwitterAnalytics> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/analytics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Twitter analytics: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get tweet analytics
 */
export async function getTweetAnalytics(
  connectionId: string,
  tweetId: string,
  token: string
): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/tweets/${tweetId}/analytics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get tweet analytics: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete tweet
 */
export async function deleteTweet(
  connectionId: string,
  tweetId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/tweets/${tweetId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete tweet: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.deleted;
}

/**
 * Get Twitter user info
 */
export async function getTwitterUserInfo(
  connectionId: string,
  token: string
): Promise<TwitterUserInfo> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/user`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Twitter user info: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Validate Twitter token
 */
export async function validateTwitterToken(
  connectionId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/validate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to validate Twitter token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.valid;
}

/**
 * Create Twitter thread
 */
export async function createTwitterThread(
  connectionId: string,
  tweets: string[],
  token: string
): Promise<TwitterPostResult[]> {
  const response = await fetch(`${BACKEND_URL}/social-media/twitter/${connectionId}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ tweets }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Twitter thread: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// LinkedIn Service Functions
// ============================================

/**
 * Create LinkedIn post
 */
export async function createLinkedInPost(
  connectionId: string,
  options: LinkedInPostOptions,
  token: string
): Promise<LinkedInPostResult> {
  const response = await fetch(`${BACKEND_URL}/social-media/linkedin/${connectionId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create LinkedIn post: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload LinkedIn media
 */
export async function uploadLinkedInMedia(
  connectionId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document',
  token: string
): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/social-media/linkedin/${connectionId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mediaUrl, mediaType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload LinkedIn media: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.asset;
}

/**
 * Get LinkedIn analytics
 */
export async function getLinkedInAnalytics(
  connectionId: string,
  startDate: Date | undefined,
  endDate: Date | undefined,
  token: string
): Promise<LinkedInAnalytics> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const url = params.toString()
    ? `${BACKEND_URL}/social-media/linkedin/${connectionId}/analytics?${params}`
    : `${BACKEND_URL}/social-media/linkedin/${connectionId}/analytics`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get LinkedIn analytics: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get LinkedIn profile info
 */
export async function getLinkedInProfileInfo(
  connectionId: string,
  token: string
): Promise<LinkedInProfileInfo> {
  const response = await fetch(`${BACKEND_URL}/social-media/linkedin/${connectionId}/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get LinkedIn profile info: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Validate LinkedIn token
 */
export async function validateLinkedInToken(
  connectionId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/linkedin/${connectionId}/validate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to validate LinkedIn token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.valid;
}

// ============================================
// Connection Management Functions
// ============================================

/**
 * Get all social media connections
 */
export async function getOrganizationConnections(
  token: string
): Promise<SocialMediaConnection[]> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get connections: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get platform connection
 */
export async function getPlatformConnection(
  platform: string,
  token: string
): Promise<SocialMediaConnection | null> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/platform/${platform}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get platform connection: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Check if platform is connected
 */
export async function isPlatformConnected(
  platform: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/check/${platform}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check platform connection: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.connected;
}

/**
 * Store new social media connection
 */
export async function storeConnection(
  data: {
    platform: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope: string[];
    metadata?: any;
  },
  token: string
): Promise<SocialMediaConnection> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to store connection: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update social media connection
 */
export async function updateConnection(
  connectionId: string,
  data: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    lastSync?: Date;
    isActive?: boolean;
    metadata?: any;
  },
  token: string
): Promise<SocialMediaConnection> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/${connectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update connection: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Refresh access token
 */
export async function refreshConnectionToken(
  connectionId: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/${connectionId}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.refreshed;
}

/**
 * Remove platform connection
 */
export async function removeConnection(
  platform: string,
  token: string
): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/platform/${platform}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove connection: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.removed;
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(
  token: string
): Promise<ConnectionStats> {
  const response = await fetch(`${BACKEND_URL}/social-media/connections/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get connection stats: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}
