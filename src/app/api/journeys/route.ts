import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  createJourney,
  getJourney,
  getJourneys,
  updateJourney,
  deleteJourney,
  JourneyData
} from "@/lib/journey-mapping";
import { handleApiError, unauthorized, validationError } from "@/lib/errors";

// Schema for creating/updating journeys
const journeySchema = z.object({
  name: z.string().min(1, "Journey name is required"),
  description: z.string().optional(),
  stages: z.array(
    z.object({
      name: z.string().min(1, "Stage name is required"),
      description: z.string().optional(),
      order: z.number().optional(),
      expectedDuration: z.number().optional(),
      conversionGoal: z.number().optional(),
      isEntryPoint: z.boolean().optional(),
      isExitPoint: z.boolean().optional()
    })
  ).optional()
});

/**
 * GET: Retrieve all journeys or a specific journey
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("id");
    const isActive = searchParams.get("isActive");
    const limit = searchParams.get("limit");
    
    // If journey ID is provided, return that specific journey
    if (journeyId) {
      const journey = await getJourney(journeyId);
      return NextResponse.json(journey);
    }
    
    // Otherwise, return all journeys with optional filters
    const options: any = {
      createdById: session.user.id
    };
    
    if (isActive !== null) {
      options.isActive = isActive === "true";
    }
    
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    
    const journeys = await getJourneys(options);
    return NextResponse.json(journeys);
  } catch (error) {
    return handleApiError(error, "/api/journeys [GET]");
  }
}

/**
 * POST: Create a new journey
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = journeySchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Create the journey
    const journey = await createJourney({
      ...result.data,
      createdById: session.user.id
    });
    
    return NextResponse.json(journey, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/journeys [POST]");
  }
}

/**
 * PUT: Update an existing journey
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get journey ID from query params
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("id");
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = journeySchema.partial().safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Update the journey
    const updatedJourney = await updateJourney(journeyId, result.data);
    
    return NextResponse.json(updatedJourney);
  } catch (error) {
    return handleApiError(error, "/api/journeys [PUT]");
  }
}

/**
 * DELETE: Delete a journey
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get journey ID from query params
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("id");
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the journey
    await deleteJourney(journeyId);
    
    return NextResponse.json(
      { success: true, message: "Journey deleted successfully" }
    );
  } catch (error) {
    return handleApiError(error, "/api/journeys [DELETE]");
  }
} 