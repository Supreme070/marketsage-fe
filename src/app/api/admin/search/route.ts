import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/search
 * Global admin search with enhanced capabilities
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {

    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return Response.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Log the admin search action
    await logAdminAction(user, 'GLOBAL_SEARCH', 'search', {
      query,
      type,
      limit
    });

    const results: any = {
      users: [],
      organizations: [],
      campaigns: [],
      contacts: [],
      securityEvents: []
    };

    const searchQuery = query.toLowerCase();

    // Search Users (if has permission)
    if (permissions.canViewUsers && (type === 'all' || type === 'users')) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { id: { contains: searchQuery } }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastActiveAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionTier: true
            }
          }
        },
        take: Math.min(limit, 10),
        orderBy: { createdAt: 'desc' }
      });

      results.users = users.map(user => ({
        type: 'user',
        id: user.id,
        title: user.name || user.email,
        subtitle: `${user.email} • ${user.role}`,
        metadata: {
          status: user.status,
          organization: user.organization?.name,
          lastActive: user.lastActiveAt
        },
        url: `/admin/users?search=${user.id}`
      }));
    }

    // Search Organizations (if has permission)
    if (permissions.canViewUsers && (type === 'all' || type === 'organizations')) {
      const organizations = await prisma.organization.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { domain: { contains: searchQuery, mode: 'insensitive' } },
            { id: { contains: searchQuery } }
          ]
        },
        select: {
          id: true,
          name: true,
          domain: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        take: Math.min(limit, 10),
        orderBy: { createdAt: 'desc' }
      });

      results.organizations = organizations.map(org => ({
        type: 'organization',
        id: org.id,
        title: org.name,
        subtitle: `${org.domain} • ${org.subscriptionTier}`,
        metadata: {
          status: org.subscriptionStatus,
          userCount: org._count.users,
          createdAt: org.createdAt
        },
        url: `/admin/organizations?search=${org.id}`
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum: number, items: any[]) => sum + items.length, 0);

    // Flatten and sort all results by relevance/recency
    const allResults = Object.values(results).flat().sort((a: any, b: any) => {
      // Prioritize exact matches in title
      const aExactMatch = a.title.toLowerCase().includes(searchQuery);
      const bExactMatch = b.title.toLowerCase().includes(searchQuery);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by recency
      const aDate = new Date(a.metadata?.createdAt || a.metadata?.timestamp || 0);
      const bDate = new Date(b.metadata?.createdAt || b.metadata?.timestamp || 0);
      return bDate.getTime() - aDate.getTime();
    });

    return Response.json({
      success: true,
      data: {
        query,
        type,
        totalResults,
        results: allResults.slice(0, limit),
        breakdown: {
          users: results.users.length,
          organizations: results.organizations.length
        }
      }
    });

  } catch (error) {
    console.error('Admin search API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to perform search',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}