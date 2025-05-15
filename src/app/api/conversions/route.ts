import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EntityType, AnalyticsPeriod } from "@prisma/client";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Initialize Prisma client directly in this file to avoid import errors
import prisma from "@/lib/db/prisma";

// Define interfaces for the metrics structure
interface ConversionMetric {
  count: number;
  value: number;
}

interface ConversionsData {
  totalConversions?: ConversionMetric;
  conversions?: Record<string, ConversionMetric>;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return unauthorized();
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
      let parsedMetrics: ConversionsData = {};
      
      try {
        // Only attempt to parse if metrics is a non-empty string
        if (record.metrics && typeof record.metrics === 'string' && record.metrics.trim() !== '') {
          const parsed = JSON.parse(record.metrics);
          
          // Ensure the result is an object
          if (typeof parsed === 'object' && parsed !== null) {
            parsedMetrics = parsed as ConversionsData;
          } else {
            console.error(`Invalid metrics format for record ${record.id}: not an object`);
          }
        }
      } catch (error) {
        console.error(`Error parsing metrics for record ${record.id}:`, error);
      }
      
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
    let aggregatedStats: {
      totalConversions?: ConversionMetric;
      conversionsByType?: Record<string, ConversionMetric>;
    } | null = null;
    
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
        if (metrics.conversions && typeof metrics.conversions === 'object') {
          if (!stats.conversionsByType) {
            stats.conversionsByType = {};
          }
          
          Object.keys(metrics.conversions).forEach(type => {
            if (!stats.conversionsByType[type]) {
              stats.conversionsByType[type] = { count: 0, value: 0 };
            }
            const conversion = metrics.conversions?.[type];
            if (conversion) {
              stats.conversionsByType[type].count += conversion.count || 0;
              stats.conversionsByType[type].value += conversion.value || 0;
            }
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
    return handleApiError(error, "/api/conversions/route.ts");
  }
} 