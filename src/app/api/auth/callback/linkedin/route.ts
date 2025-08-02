/**
 * LinkedIn OAuth Callback Handler
 * ================================
 * 
 * Handles OAuth callback from LinkedIn API
 * Stores access tokens for organization's LinkedIn account
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
      logger.warn('LinkedIn OAuth error', { error, userId: session.user.id });
      return NextResponse.redirect(
        new URL(`/social-media?error=linkedin_auth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/social-media?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback/linkedin`,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`LinkedIn token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`LinkedIn API error: ${tokenData.error_description || tokenData.error}`);
    }

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error(`LinkedIn profile fetch failed: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();

    // Check if user has access to company pages
    let companyPages: any[] = [];
    try {
      const companiesResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        companyPages = companiesData.elements || [];
      }
    } catch (error) {
      logger.warn('Failed to fetch LinkedIn company pages', { error });
    }

    // Use company page if available, otherwise personal profile
    let accountId = profile.id;
    let accountName = `${profile.localizedFirstName} ${profile.localizedLastName}`;
    let isCompanyPage = false;

    if (companyPages.length > 0) {
      const firstCompany = companyPages[0];
      if (firstCompany.organization) {
        // Extract organization ID from URN
        const orgMatch = firstCompany.organization.match(/urn:li:organization:(\d+)/);
        if (orgMatch) {
          accountId = orgMatch[1];
          isCompanyPage = true;
          
          // Get company info
          try {
            const companyResponse = await fetch(`https://api.linkedin.com/v2/organizations/${accountId}?projection=(id,localizedName)`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
              }
            });

            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              accountName = companyData.localizedName || accountName;
            }
          } catch (error) {
            logger.warn('Failed to fetch LinkedIn company info', { error });
          }
        }
      }
    }

    // Store the connection
    await socialMediaConnectionService.storeConnection({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      platform: 'linkedin',
      accountId: accountId,
      accountName: accountName,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      scope: tokenData.scope ? tokenData.scope.split(' ') : ['r_liteprofile', 'w_member_social'],
      metadata: {
        profileId: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        isCompanyPage: isCompanyPage,
        companyPages: companyPages.map(page => ({
          organization: page.organization,
          role: page.role
        }))
      }
    });

    logger.info('LinkedIn account connected successfully', {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      accountId: accountId,
      accountName: accountName,
      isCompanyPage
    });

    return NextResponse.redirect(
      new URL('/social-media?success=linkedin_connected', request.url)
    );

  } catch (error) {
    logger.error('LinkedIn OAuth callback error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.redirect(
      new URL(`/social-media?error=linkedin_connection_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`, request.url)
    );
  }
}