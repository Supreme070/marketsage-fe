/**
 * LeadPulse CRM Integration API
 * Proxies to backend /api/v2/users/:userId/crm-integrations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

/**
 * GET: List CRM integrations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // Call backend endpoint
    const url = `${BACKEND_URL}/api/v2/users/${session.user.id}/crm-integrations${platform ? `?platform=${platform}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('CRM integration GET error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to list CRM integrations' },
    }, { status: 500 });
  }
}

/**
 * POST: Add new CRM integration
 * Note: Backend expects PUT for updates, so we route POST to PUT
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, credentials, mappings, syncSettings } = body;

    if (!platform || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Platform and credentials are required',
      }, { status: 400 });
    }

    const settings = {
      credentials,
      mappings: mappings || {},
      syncSettings: syncSettings || {
        autoSync: false,
        syncInterval: 60,
        syncDirection: 'to_crm',
        conflictResolution: 'leadpulse_wins',
      },
    };

    // Call backend PUT endpoint
    const url = `${BACKEND_URL}/api/v2/users/${session.user.id}/crm-integrations`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform, settings }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `${platform} integration added successfully`,
        platform,
      });
    } else {
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error('CRM integration POST error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'ADD_ERROR', message: 'Failed to add CRM integration' },
    }, { status: 500 });
  }
}

/**
 * PUT: Update CRM integration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, settings } = body;

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }

    // Call backend PUT endpoint
    const url = `${BACKEND_URL}/api/v2/users/${session.user.id}/crm-integrations`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform, settings }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `${platform} integration updated successfully`,
      });
    } else {
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error('CRM integration PUT error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update CRM integration' },
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove CRM integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }

    // Call backend DELETE endpoint
    const url = `${BACKEND_URL}/api/v2/users/${session.user.id}/crm-integrations/${platform}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `${platform} integration removed successfully`,
      });
    } else {
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error('CRM integration DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to remove CRM integration' },
    }, { status: 500 });
  }
}
