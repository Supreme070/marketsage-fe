import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

//  Default preferences to use when a user doesn't have preferences yet
const defaultPreferences = {
  theme: "system",
  compactMode: false,
  notifications: {
    email: true,
    marketing: false,
    browser: true,
  },
  timezone: "Africa/Lagos",
  language: "en"
};

// GET endpoint to fetch user preferences
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely in Next.js 15
    const params = await context.params;
    const { id: userId } = params;

    // Users can only access their own preferences
    if (session.user.id !== userId) {
      return forbidden("You can only access your own preferences");
    }
    // Find user preference
    const userPreference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // If no preferences exist yet, return default preferences
    if (!userPreference) {
      return NextResponse.json(defaultPreferences);
    }

    // Parse the stored JSON preferences
    let preferences;
    try {
      preferences = JSON.parse(userPreference.preferences);
    } catch (parseError) {
      console.error('Error parsing preferences JSON:', parseError);
      // If preferences JSON is invalid, return defaults
      return NextResponse.json(defaultPreferences);
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in GET /api/users/[id]/preferences:', error);
    return handleApiError(error, "/api/users/[id]/preferences/route.ts");
  } finally {
    // Always wrap the end of the try block
  }
}

// PUT endpoint to update user preferences
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely in Next.js 15
    const params = await context.params;
    const { id: userId } = params;

    // Users can only update their own preferences
    if (session.user.id !== userId) {
      return forbidden("You can only update your own preferences");
    }
    const body = await request.json();
    
    // Validate preferences object (basic validation)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    // Try to find existing preference
    let userPreference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // Update or create preferences
    if (userPreference) {
      userPreference = await prisma.userPreference.update({
        where: { userId },
        data: {
          preferences: JSON.stringify(body),
          updatedAt: new Date(),
        },
      });
    } else {
      userPreference = await prisma.userPreference.create({
        data: {
          userId,
          preferences: JSON.stringify(body),
        },
      });
    }

    // Parse the stored JSON preferences
    const preferences = JSON.parse(userPreference.preferences);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in PUT /api/users/[id]/preferences:', error);
    return handleApiError(error, "/api/users/[id]/preferences/route.ts");
  }
} 