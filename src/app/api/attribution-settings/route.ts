import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AttributionModel } from "@prisma/client";
import { z } from "zod";
import { 
  getAttributionSettings, 
  updateAttributionSettings 
} from "@/lib/enhanced-conversions";
import { 
  handleApiError, 
  unauthorized,
  validationError
} from "@/lib/errors";

// Schema for validating attribution settings updates
const attributionSettingsSchema = z.object({
  defaultModel: z.nativeEnum(AttributionModel),
  lookbackWindow: z.number().int().min(1).max(90),
  customWeights: z.object({
    first: z.number().min(0).max(1),
    middle: z.number().min(0).max(1),
    last: z.number().min(0).max(1)
  }).optional()
});

// GET endpoint to retrieve attribution settings
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  // Check if user has permission to view attribution settings
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  
  if (!isAdmin) {
    return unauthorized();
  }
  
  try {
    const settings = await getAttributionSettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, "/api/attribution-settings/route.ts [GET]");
  }
}

// PUT endpoint to update attribution settings
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  // Check if user has permission to update attribution settings
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  
  if (!isAdmin) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = attributionSettingsSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Update the settings
    const success = await updateAttributionSettings(
      result.data.defaultModel,
      result.data.lookbackWindow,
      result.data.customWeights
    );
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update attribution settings" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "Attribution settings updated successfully" }
    );
  } catch (error) {
    return handleApiError(error, "/api/attribution-settings/route.ts [PUT]");
  }
} 