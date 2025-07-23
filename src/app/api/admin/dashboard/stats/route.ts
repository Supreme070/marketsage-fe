import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics for admin overview
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    // Log the admin action
    await logAdminAction(user, 'VIEW_DASHBOARD_STATS', 'dashboard');

    // Get basic counts from database
    const [
      totalUsers,
      totalOrganizations,
      activeCampaigns,
      totalRevenue,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Total organizations count  
      prisma.organization.count(),
      
      // Active campaigns count (you might need to adjust based on your schema)
      prisma.campaign?.count?.() || 0,
      
      // Total revenue (this would need to be calculated based on your billing schema)
      // For now, returning a placeholder
      Promise.resolve(0),
    ]);

    // Get recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
    });

    // System health indicators
    const systemHealth = {
      database: 'healthy',
      redis: 'healthy', // You can add actual Redis health check here
      messageQueue: 'healthy', // Add actual queue health check
      apiStatus: 'operational',
    };

    // Mock data for demonstration - replace with real data
    const stats = {
      overview: {
        totalUsers,
        totalOrganizations,
        activeCampaigns,
        totalRevenue: 250000, // Mock revenue in Naira
        recentSignups,
        activeSessionsNow: 45, // Mock active sessions
      },
      systemHealth,
      alerts: [
        // Mock alerts - replace with real alert system
        {
          id: '1',
          type: 'warning',
          message: 'Queue processing delay detected',
          count: 23,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2', 
          type: 'info',
          message: 'Scheduled maintenance in 2 hours',
          timestamp: new Date().toISOString(),
        },
      ],
      recentActivity: [
        // Mock recent activity - replace with real activity logs
        {
          id: '1',
          type: 'user_signup',
          description: 'New user registration',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'payment_received',
          description: 'Payment processed successfully',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return Response.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS
 */
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