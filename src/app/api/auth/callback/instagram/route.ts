/**
 * Instagram OAuth Callback Handler
 * =================================
 * 
 * Handles OAuth callback from Instagram Basic Display API
 * Stores access tokens for organization's Instagram account
 */

import { type NextRequest, NextResponse } from 'next/server';
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

    // Handle OAuth errors
    if (error) {
      logger.warn('Instagram OAuth error', { error, userId: session.user.id });
      return NextResponse.redirect(
        new URL(`/social-media?error=instagram_auth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/social-media?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback/instagram`,
        grant_type: 'authorization_code',
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Instagram token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error_type) {
      throw new Error(`Instagram API error: ${tokenData.error_message}`);
    }

    // Get user profile information
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`
    );

    if (!profileResponse.ok) {
      throw new Error(`Instagram profile fetch failed: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();

    // Store the connection
    await socialMediaConnectionService.storeConnection({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      platform: 'instagram',
      accountId: profile.id,
      accountName: profile.username || `Instagram User ${profile.id}`,
      accessToken: tokenData.access_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      scope: ['user_profile', 'user_media'],
      metadata: {
        username: profile.username,
        accountType: profile.account_type
      }
    });

    logger.info('Instagram account connected successfully', {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      accountId: profile.id,
      username: profile.username
    });

    return NextResponse.redirect(
      new URL('/social-media?success=instagram_connected', request.url)
    );

  } catch (error) {
    logger.error('Instagram OAuth callback error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.redirect(
      new URL(`/social-media?error=instagram_connection_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`, request.url)
    );
  }
}