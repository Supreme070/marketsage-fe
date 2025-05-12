import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { EntityType, AnalyticsPeriod } from "@prisma/client";
import { randomUUID } from "crypto";

// Initialize Prisma client directly in this file to avoid import errors
const prisma = new PrismaClient();

interface ConversionMetrics {
  conversions: {
    [key: string]: {
      count: number;
      value: number;
    };
  };
  totalConversions: {
    count: number;
    value: number;
  };
  metadata?: Array<{
    timestamp: string;
    conversionType: string;
    conversionValue: number | null;
    [key: string]: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const payload = await request.json();
    const { 
      entityType, 
      entityId, 
      conversionType, 
      conversionValue, 
      metadata 
    } = payload;
    
    if (!entityType || !entityId || !conversionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate entityType is a valid enum value
    if (!Object.values(EntityType).includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }
    
    // Get current date in YYYY-MM-DD format for daily tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today's analytics record exists
    const existingAnalytics = await prisma.analytics.findUnique({
      where: {
        entityType_entityId_period: {
          entityType: entityType as EntityType,
          entityId,
          period: AnalyticsPeriod.DAILY
        }
      }
    });
    
    let metrics: ConversionMetrics = {
      conversions: {},
      totalConversions: {
        count: 0,
        value: 0
      }
    };
    
    if (existingAnalytics) {
      // Parse existing metrics
      metrics = JSON.parse(existingAnalytics.metrics) as ConversionMetrics;
      
      // Update conversion metrics
      if (!metrics.conversions) {
        metrics.conversions = {};
      }
      
      if (!metrics.conversions[conversionType]) {
        metrics.conversions[conversionType] = {
          count: 0,
          value: 0
        };
      }
      
      metrics.conversions[conversionType].count += 1;
      
      if (conversionValue) {
        metrics.conversions[conversionType].value += Number(conversionValue);
      }
      
      // Update total conversions
      if (!metrics.totalConversions) {
        metrics.totalConversions = {
          count: 0,
          value: 0
        };
      }
      
      metrics.totalConversions.count += 1;
      
      if (conversionValue) {
        metrics.totalConversions.value += Number(conversionValue);
      }
      
      // Store additional metadata if provided
      if (metadata) {
        if (!metrics.metadata) {
          metrics.metadata = [];
        }
        
        metrics.metadata.push({
          timestamp: new Date().toISOString(),
          conversionType,
          conversionValue: conversionValue ? Number(conversionValue) : null,
          ...metadata
        });
      }
      
      // Update the analytics record
      await prisma.analytics.update({
        where: {
          id: existingAnalytics.id
        },
        data: {
          metrics: JSON.stringify(metrics),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new metrics object
      metrics = {
        conversions: {
          [conversionType]: {
            count: 1,
            value: conversionValue ? Number(conversionValue) : 0
          }
        },
        totalConversions: {
          count: 1,
          value: conversionValue ? Number(conversionValue) : 0
        }
      };
      
      // Add metadata if provided
      if (metadata) {
        metrics.metadata = [{
          timestamp: new Date().toISOString(),
          conversionType,
          conversionValue: conversionValue ? Number(conversionValue) : null,
          ...metadata
        }];
      }
      
      // Create new analytics record with a generated ID
      await prisma.analytics.create({
        data: {
          id: randomUUID(),
          entityType: entityType as EntityType,
          entityId,
          period: AnalyticsPeriod.DAILY,
          metrics: JSON.stringify(metrics),
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Conversion tracked successfully"
    });
    
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
} 