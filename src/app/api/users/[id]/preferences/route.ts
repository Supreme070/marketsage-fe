import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Default preferences to use when a user doesn't have preferences yet
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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = params.id;

  // Users can only access their own preferences
  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Find user preference
    const userPreference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // If no preferences exist yet, return default preferences
    if (!userPreference) {
      return NextResponse.json(defaultPreferences);
    }

    // Parse the stored JSON preferences
    const preferences = JSON.parse(userPreference.preferences);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch user preferences" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = params.id;

  // Users can only update their own preferences
  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
} 