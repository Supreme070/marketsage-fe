import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  createJourneyStage,
  updateJourneyStage,
  deleteJourneyStage,
  validateJourney
} from "@/lib/journey-mapping";
import { handleApiError, unauthorized, validationError } from "@/lib/errors";

// Schema for creating/updating journey stages
const stageSchema = z.object({
  journeyId: z.string().min(1, "Journey ID is required"),
  name: z.string().min(1, "Stage name is required"),
  description: z.string().optional(),
  order: z.number().optional(),
  expectedDuration: z.number().optional(),
  conversionGoal: z.number().optional(),
  isEntryPoint: z.boolean().optional(),
  isExitPoint: z.boolean().optional()
});

/**
 * POST: Create a new journey stage
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
    const result = stageSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Verify journey exists and user has access
    await validateJourney(result.data.journeyId);
    
    // Create the journey stage
    const stage = await createJourneyStage(result.data);
    
    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/journeys/stages [POST]");
  }
}

/**
 * PUT: Update an existing journey stage
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get stage ID from query params
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("id");
    
    if (!stageId) {
      return NextResponse.json(
        { error: "Stage ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = stageSchema.omit({ journeyId: true }).partial().safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Update the journey stage
    const updatedStage = await updateJourneyStage(stageId, result.data);
    
    return NextResponse.json(updatedStage);
  } catch (error) {
    return handleApiError(error, "/api/journeys/stages [PUT]");
  }
}

/**
 * DELETE: Delete a journey stage
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get stage ID from query params
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("id");
    
    if (!stageId) {
      return NextResponse.json(
        { error: "Stage ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the journey stage
    await deleteJourneyStage(stageId);
    
    return NextResponse.json(
      { success: true, message: "Journey stage deleted successfully" }
    );
  } catch (error) {
    return handleApiError(error, "/api/journeys/stages [DELETE]");
  }
} 