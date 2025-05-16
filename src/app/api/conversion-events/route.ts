import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { ConversionCategory, ConversionValueType } from "@prisma/client";
import { z } from "zod";
import { 
  createConversionEvent, 
  getConversionEvents, 
  ConversionEventData 
} from "@/lib/enhanced-conversions";
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from "@/lib/errors";

// Schema for validating conversion event creation requests
const conversionEventSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  category: z.nativeEnum(ConversionCategory),
  valueType: z.nativeEnum(ConversionValueType)
});

// GET endpoint to retrieve all conversion events
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const events = await getConversionEvents();
    
    return NextResponse.json(events);
  } catch (error) {
    return handleApiError(error, "/api/conversion-events/route.ts [GET]");
  }
}

// POST endpoint to create a new conversion event
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = conversionEventSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const eventData: ConversionEventData = {
      name: result.data.name,
      description: result.data.description,
      eventType: result.data.eventType,
      category: result.data.category,
      valueType: result.data.valueType,
      isSystem: false // User-created events are never system events
    };
    
    // Create the event
    const eventId = await createConversionEvent(eventData, session.user.id);
    
    return NextResponse.json(
      { id: eventId, message: "Conversion event created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/conversion-events/route.ts [POST]");
  }
} 