/**
 * Facebook OAuth Callback Handler
 * ===============================
 * 
 * Handles OAuth callback from Facebook/Instagram
 * Stores access tokens for organization's social media account
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
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      logger.warn('Facebook OAuth error', { error, userId: session.user.id });
      return NextResponse.redirect(
        new URL(`/social-media?error=facebook_auth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/social-media?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback/facebook`,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Facebook token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Facebook API error: ${tokenData.error.message}`);
    }

    // Get user profile information
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${tokenData.access_token}`
    );

    if (!profileResponse.ok) {
      throw new Error(`Facebook profile fetch failed: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();

    // Check if this is for a Facebook Page (business account)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );

    let pageAccessToken = tokenData.access_token;
    let accountId = profile.id;
    let accountName = profile.name;

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      if (pagesData.data && pagesData.data.length > 0) {
        // Use the first page if available
        const page = pagesData.data[0];
        pageAccessToken = page.access_token;
        accountId = page.id;
        accountName = page.name;
      }
    }

    // Store the connection
    await socialMediaConnectionService.storeConnection({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      platform: 'facebook',
      accountId: accountId,
      accountName: accountName,
      accessToken: pageAccessToken,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      metadata: {
        profileId: profile.id,
        profileName: profile.name,
        profileEmail: profile.email,
        isPage: accountId !== profile.id
      }
    });

    logger.info('Facebook account connected successfully', {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      accountId,
      accountName
    });

    return NextResponse.redirect(
      new URL('/social-media?success=facebook_connected', request.url)
    );

  } catch (error) {
    logger.error('Facebook OAuth callback error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.redirect(
      new URL(`/social-media?error=facebook_connection_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`, request.url)
    );
  }
}