import { type NextRequest, NextResponse } from 'next/server';
import { leadPulseAttributionService } from '@/lib/leadpulse/attribution-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schemas
const calculateAttributionSchema = z.object({
  conversionId: z.string().min(1),
  conversionType: z.string().min(1),
  conversionValue: z.number().optional(),
  conversionData: z.any().optional(),
  conversionTime: z.string().datetime(),
  visitorId: z.string().optional(),
  anonymousVisitorId: z.string().optional(),
  sessionId: z.string().optional(),
  configId: z.string().optional()
});

const bulkCalculateSchema = z.object({
  conversions: z.array(calculateAttributionSchema).min(1).max(100), // Limit bulk requests
  configId: z.string().optional()
});

const recalculateSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  configId: z.string().optional()
});

const getAttributionSchema = z.object({
  conversionId: z.string().optional(),
  visitorId: z.string().optional(),
  anonymousVisitorId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  configId: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

// Calculate attribution for conversion
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'calculate';

    switch (action) {
      case 'calculate':
        return await handleCalculateAttribution(request);
      case 'bulk_calculate':
        return await handleBulkCalculateAttribution(request);
      case 'recalculate':
        return await handleRecalculateAttribution(request);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Attribution calculation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get attribution data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      conversionId: searchParams.get('conversionId'),
      visitorId: searchParams.get('visitorId'),
      anonymousVisitorId: searchParams.get('anonymousVisitorId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      configId: searchParams.get('configId'),
      limit: searchParams.get('limit') ? Number.parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? Number.parseInt(searchParams.get('offset')!) : 0
    };

    const validatedData = getAttributionSchema.parse(queryParams);

    const whereConditions: any = {};

    if (validatedData.conversionId) {
      whereConditions.conversionId = validatedData.conversionId;
    }

    if (validatedData.visitorId) {
      whereConditions.visitorId = validatedData.visitorId;
    }

    if (validatedData.anonymousVisitorId) {
      whereConditions.anonymousVisitorId = validatedData.anonymousVisitorId;
    }

    if (validatedData.configId) {
      whereConditions.configId = validatedData.configId;
    }

    if (validatedData.startDate || validatedData.endDate) {
      whereConditions.conversionTime = {};
      if (validatedData.startDate) {
        whereConditions.conversionTime.gte = new Date(validatedData.startDate);
      }
      if (validatedData.endDate) {
        whereConditions.conversionTime.lte = new Date(validatedData.endDate);
      }
    }

    const [attributions, total] = await Promise.all([
      prisma.leadPulseAttribution.findMany({
        where: whereConditions,
        include: {
          config: {
            select: {
              name: true,
              attributionModel: true
            }
          },
          touchpoints: {
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { conversionTime: 'desc' },
        take: validatedData.limit,
        skip: validatedData.offset
      }),
      prisma.leadPulseAttribution.count({
        where: whereConditions
      })
    ]);

    const formattedAttributions = attributions.map(attribution => ({
      id: attribution.id,
      conversionId: attribution.conversionId,
      conversionType: attribution.conversionType,
      conversionTime: attribution.conversionTime,
      conversionValue: attribution.conversionValue,
      conversionData: attribution.conversionData ? JSON.parse(attribution.conversionData as string) : null,
      visitorId: attribution.visitorId,
      anonymousVisitorId: attribution.anonymousVisitorId,
      sessionId: attribution.sessionId,
      configId: attribution.configId,
      configName: attribution.config?.name,
      attributionModel: attribution.attributionModel,
      touchpointsCount: attribution.touchpointsCount,
      totalCredit: attribution.totalCredit,
      attributionData: attribution.attributionData ? JSON.parse(attribution.attributionData as string) : null,
      firstTouch: attribution.firstTouch ? JSON.parse(attribution.firstTouch as string) : null,
      lastTouch: attribution.lastTouch ? JSON.parse(attribution.lastTouch as string) : null,
      channelBreakdown: attribution.channelBreakdown ? JSON.parse(attribution.channelBreakdown as string) : {},
      journeyDuration: attribution.journeyDuration,
      touchpointCount: attribution.touchpointCount,
      uniqueChannels: attribution.uniqueChannels,
      touchpoints: attribution.touchpoints.map(tp => ({
        id: tp.id,
        touchpointId: tp.touchpointId,
        credit: tp.credit,
        position: tp.position,
        timeToConversion: tp.timeToCconv,
        touchpointType: tp.touchpointType,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        content: tp.content,
        url: tp.url,
        decayFactor: tp.decayFactor,
        positionWeight: tp.positionWeight,
        channelWeight: tp.channelWeight,
        timestamp: tp.timestamp
      })),
      version: attribution.version,
      calculatedAt: attribution.calculatedAt,
      recalculatedAt: attribution.recalculatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        attributions: formattedAttributions,
        pagination: {
          total,
          limit: validatedData.limit,
          offset: validatedData.offset,
          hasMore: validatedData.offset + validatedData.limit < total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching attribution data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch attribution data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCalculateAttribution(request: NextRequest) {
  const body = await request.json();
  const validatedData = calculateAttributionSchema.parse(body);

  const conversionEvent = {
    conversionId: validatedData.conversionId,
    conversionType: validatedData.conversionType,
    conversionValue: validatedData.conversionValue,
    conversionData: validatedData.conversionData,
    conversionTime: new Date(validatedData.conversionTime),
    visitorId: validatedData.visitorId,
    anonymousVisitorId: validatedData.anonymousVisitorId,
    sessionId: validatedData.sessionId
  };

  const attributionResult = await leadPulseAttributionService.calculateAttribution(
    conversionEvent,
    validatedData.configId
  );

  return NextResponse.json({
    success: true,
    data: {
      attribution: attributionResult,
      message: 'Attribution calculated successfully'
    }
  });
}

async function handleBulkCalculateAttribution(request: NextRequest) {
  const body = await request.json();
  const validatedData = bulkCalculateSchema.parse(body);

  const results = [];
  const errors = [];

  for (let i = 0; i < validatedData.conversions.length; i++) {
    const conversion = validatedData.conversions[i];
    
    try {
      const conversionEvent = {
        conversionId: conversion.conversionId,
        conversionType: conversion.conversionType,
        conversionValue: conversion.conversionValue,
        conversionData: conversion.conversionData,
        conversionTime: new Date(conversion.conversionTime),
        visitorId: conversion.visitorId,
        anonymousVisitorId: conversion.anonymousVisitorId,
        sessionId: conversion.sessionId
      };

      const attributionResult = await leadPulseAttributionService.calculateAttribution(
        conversionEvent,
        validatedData.configId
      );

      results.push({
        index: i,
        conversionId: conversion.conversionId,
        success: true,
        attribution: attributionResult
      });

    } catch (error) {
      errors.push({
        index: i,
        conversionId: conversion.conversionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      processed: validatedData.conversions.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors,
      message: `Processed ${validatedData.conversions.length} conversions: ${results.length} succeeded, ${errors.length} failed`
    }
  });
}

async function handleRecalculateAttribution(request: NextRequest) {
  const body = await request.json();
  const validatedData = recalculateSchema.parse(body);

  const recalculationResult = await leadPulseAttributionService.recalculateAttribution(
    new Date(validatedData.startDate),
    new Date(validatedData.endDate),
    validatedData.configId
  );

  return NextResponse.json({
    success: true,
    data: {
      ...recalculationResult,
      message: `Recalculation completed: ${recalculationResult.processed} processed, ${recalculationResult.succeeded} succeeded, ${recalculationResult.failed} failed`
    }
  });
}