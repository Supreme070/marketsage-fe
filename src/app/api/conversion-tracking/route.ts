import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AttributionModel, EntityType } from "@prisma/client";
import { z } from "zod";
import { 
  trackConversion, 
  ConversionTrackingData, 
  TouchPoint 
} from "@/lib/enhanced-conversions";
import { 
  handleApiError, 
  unauthorized, 
  validationError,
  notFound
} from "@/lib/errors";

// Schema for validating conversion tracking requests
const trackingSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string().min(1, "Entity ID is required"),
  contactId: z.string().optional(),
  value: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  attributionModel: z.nativeEnum(AttributionModel).optional(),
  touchPoints: z.array(
    z.object({
      entityType: z.nativeEnum(EntityType),
      entityId: z.string().min(1),
      timestamp: z.string().transform(val => new Date(val)),
      type: z.string().min(1)
    })
  ).optional()
});

// POST endpoint to track a conversion
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = trackingSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Transform the validated data to the expected format
    const trackingData: ConversionTrackingData = {
      eventId: result.data.eventId,
      entityType: result.data.entityType,
      entityId: result.data.entityId,
      contactId: result.data.contactId,
      value: result.data.value,
      metadata: result.data.metadata,
      attributionModel: result.data.attributionModel,
      touchPoints: result.data.touchPoints as TouchPoint[]
    };
    
    // Track the conversion
    const success = await trackConversion(trackingData);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to track conversion" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "Conversion tracked successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/conversion-tracking/route.ts [POST]");
  }
}

// GET endpoint to retrieve conversion data for an entity
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as EntityType | null;
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Entity type and ID are required" },
        { status: 400 }
      );
    }
    
    // Fetch conversion data from the database
    const conversions = await prisma.conversionTracking.findMany({
      where: {
        entityType,
        entityId,
        ...(startDate && {
          occurredAt: {
            gte: new Date(startDate)
          }
        }),
        ...(endDate && {
          occurredAt: {
            lte: new Date(endDate)
          }
        })
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventType: true,
            category: true,
            valueType: true
          }
        }
      },
      orderBy: {
        occurredAt: 'desc'
      }
    });
    
    return NextResponse.json(conversions);
  } catch (error) {
    return handleApiError(error, "/api/conversion-tracking/route.ts [GET]");
  }
} 