import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

//  Schema for segment validation
const segmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().optional(),
  rules: z.string().min(2, "Rules are required for a segment"), // JSON string
});

// GET segments endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    
    const segments = await prisma.segment.findMany({
      where: isAdmin 
        ? {} // Empty filter to get all segments for admins
        : { createdById: session.user.id }, // Filter by user ID for non-admins
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return the segments data
    return NextResponse.json(segments);
  } catch (error) {
    return handleApiError(error, "/api/segments/route.ts");
  }
}

// POST endpoint to create a new segment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = segmentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid segment data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const segmentData = validation.data;
    
    // Validate that rules is a valid JSON string
    try {
      JSON.parse(segmentData.rules);
    } catch (e) {
      return NextResponse.json(
        { error: "Rules must be a valid JSON string" },
        { status: 400 }
      );
    }
    
    // Create the segment
    const newSegment = await prisma.segment.create({
      data: {
        name: segmentData.name,
        description: segmentData.description,
        rules: segmentData.rules,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newSegment, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/segments/route.ts");
  }
} 