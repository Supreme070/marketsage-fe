import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Helper function to check if Prisma is available
function isPrismaAvailable() {
  return prisma && typeof prisma.list === 'object' && prisma.list !== null;
}

//  Schema for list validation
const listSchema = z.object({
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  type: z.enum(["STATIC", "DYNAMIC"]).optional().default("STATIC"),
});

// GET lists endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Check if Prisma client is properly initialized
    if (!isPrismaAvailable()) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json(
        { error: 'Database connection unavailable', lists: [] },
        { status: 503 }
      );
    }
    
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    
    try {
      const lists = await prisma.list.findMany({
        where: isAdmin 
          ? {} // Empty filter to get all lists for admins
          : { createdById: session.user.id }, // Filter by user ID for non-admins
        orderBy: {
          createdAt: "desc",
        },
        include: {
          members: true, // Use "members" instead of "ListMember"
        },
      });

      // Transform the response to include member count
      const formattedLists = lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        type: list.type,
        memberCount: list.members.length, // Use "members" instead of "ListMember"
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        createdById: list.createdById,
      }));

      return NextResponse.json(formattedLists);
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database query failed', details: dbError?.message || 'Unknown database error', lists: [] },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/lists/route.ts");
  }
}

// POST endpoint to create a new list
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Check if Prisma client is properly initialized
    if (!isPrismaAvailable()) {
      console.error('Prisma client not properly initialized');
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = listSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid list data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const listData = validation.data;
    const now = new Date();
    
    try {
      // Create the list
      const newList = await prisma.list.create({
        data: {
          id: randomUUID(),
          name: listData.name,
          description: listData.description,
          type: listData.type || "STATIC",
          createdById: session.user.id,
          createdAt: now,
          updatedAt: now
        },
      });

      return NextResponse.json(newList, { status: 201 });
    } catch (dbError: any) {
      console.error('Database error creating list:', dbError);
      return NextResponse.json(
        { error: 'Failed to create list', details: dbError?.message || 'Unknown database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/lists/route.ts");
  }
} 