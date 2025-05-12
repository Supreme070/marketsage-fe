import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { EntityType, AnalyticsPeriod } from "@prisma/client";

// Initialize Prisma client directly in this file to avoid import errors
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") as EntityType | null;
    const entityId = searchParams.get("entityId");
    const period = searchParams.get("period") as AnalyticsPeriod | null || AnalyticsPeriod.DAILY;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Build the where clause
    const where: any = {};
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (entityId) {
      where.entityId = entityId;
    }
    
    if (period) {
      where.period = period;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    // Fetch analytics data
    const analyticsData = await prisma.analytics.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Process and format the data
    const formattedData = analyticsData.map(record => {
      const parsedMetrics = JSON.parse(record.metrics);
      
      return {
        id: record.id,
        entityType: record.entityType,
        entityId: record.entityId,
        period: record.period,
        metrics: parsedMetrics,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });
    
    // Aggregate conversion data if no specific entity is requested
    let aggregatedStats = null;
    
    if (!entityId) {
      aggregatedStats = formattedData.reduce((stats: any, record) => {
        const metrics = record.metrics;
        
        // Sum up total conversions
        if (metrics.totalConversions) {
          if (!stats.totalConversions) {
            stats.totalConversions = { count: 0, value: 0 };
          }
          stats.totalConversions.count += metrics.totalConversions.count || 0;
          stats.totalConversions.value += metrics.totalConversions.value || 0;
        }
        
        // Sum up conversions by type
        if (metrics.conversions) {
          if (!stats.conversionsByType) {
            stats.conversionsByType = {};
          }
          
          Object.keys(metrics.conversions).forEach(type => {
            if (!stats.conversionsByType[type]) {
              stats.conversionsByType[type] = { count: 0, value: 0 };
            }
            stats.conversionsByType[type].count += metrics.conversions[type].count || 0;
            stats.conversionsByType[type].value += metrics.conversions[type].value || 0;
          });
        }
        
        return stats;
      }, {});
    }
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      aggregatedStats
    });
    
  } catch (error) {
    console.error("Error fetching conversion data:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion data" },
      { status: 500 }
    );
  }
} 