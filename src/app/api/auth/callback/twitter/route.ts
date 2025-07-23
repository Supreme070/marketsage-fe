/**
 * Twitter OAuth Callback Handler
 * ==============================
 * 
 * Handles OAuth callback from Twitter API v2
 * Stores access tokens for organization's Twitter account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { socialMediaConnectionService } from '@/lib/social-media/social-media-connection-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      logger.warn('Twitter OAuth error', { error, userId: session.user.id });
      return NextResponse.redirect(
        new URL(`/social-media?error=twitter_auth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/social-media?error=no_code', request.url)
      );
    }

    // Exchange code for access token using PKCE
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback/twitter`,
        code: code,
        code_verifier: 'challenge' // In production, this should be stored and retrieved
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Twitter token exchange failed', { error: errorText });
      throw new Error(`Twitter token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Twitter API error: ${tokenData.error_description || tokenData.error}`);
    }

    // Get user profile information
    const profileResponse = await fetch('https://api.twitter.com/2/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error(`Twitter profile fetch failed: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();
    const userData = profile.data;

    // Store the connection
    await socialMediaConnectionService.storeConnection({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      platform: 'twitter',
      accountId: userData.id,
      accountName: userData.username || userData.name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      scope: tokenData.scope ? tokenData.scope.split(' ') : ['tweet.read', 'tweet.write', 'users.read'],
      metadata: {
        username: userData.username,
        name: userData.name,
        verified: userData.verified || false,
        publicMetrics: userData.public_metrics
      }
    });

    logger.info('Twitter account connected successfully', {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      accountId: userData.id,
      username: userData.username
    });

    return NextResponse.redirect(
      new URL('/social-media?success=twitter_connected', request.url)
    );

  } catch (error) {
    logger.error('Twitter OAuth callback error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.redirect(
      new URL(`/social-media?error=twitter_connection_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`, request.url)
    );
  }
}