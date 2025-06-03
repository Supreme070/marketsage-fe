import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { 
  createConversionFunnel, 
  generateFunnelReport 
} from "@/lib/enhanced-conversions";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Schema for validating funnel creation requests
const funnelSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  stages: z.array(z.string()).min(2, "At least two stages are required")
});

// Schema for validating funnel report requests
const reportSchema = z.object({
  funnelId: z.string().min(1, "Funnel ID is required"),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val))
});

// GET endpoint to list all funnels or get a specific funnel by ID
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("id");
    
    // If funnel ID is provided, return that specific funnel
    if (funnelId) {
      const funnel = await prisma.conversionFunnel.findUnique({
        where: { id: funnelId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (!funnel) {
        return notFound("Conversion funnel not found");
      }
      
      // Parse the stages from JSON
      const stages = JSON.parse(funnel.stages);
      
      // Fetch event details for each stage
      const events = await prisma.conversionEvent.findMany({
        where: {
          id: { in: stages }
        },
        select: {
          id: true,
          name: true,
          eventType: true,
          category: true
        }
      });
      
      // Map the events to their corresponding stage IDs
      const eventMap = new Map(events.map(event => [event.id, event]));
      const stagesWithDetails = stages.map(stageId => ({
        id: stageId,
        ...eventMap.get(stageId)
      }));
      
      return NextResponse.json({
        ...funnel,
        stages: stagesWithDetails
      });
    }
    
    // Otherwise, return a list of all funnels
    // Limit results to funnels created by the user unless they're an admin
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const where = !isAdmin ? { createdById: session.user.id } : {};
    
    const funnels = await prisma.conversionFunnel.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        reports: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });
    
    return NextResponse.json(funnels);
  } catch (error) {
    return handleApiError(error, "/api/conversion-funnels/route.ts [GET]");
  }
}

// POST endpoint to create a new conversion funnel
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = funnelSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    // Verify all stages exist
    const stageIds = result.data.stages;
    const events = await prisma.conversionEvent.findMany({
      where: {
        id: { in: stageIds }
      },
      select: { id: true }
    });
    
    if (events.length !== stageIds.length) {
      return NextResponse.json(
        { error: "One or more stage IDs do not exist" },
        { status: 400 }
      );
    }
    
    // Create the funnel
    const funnelId = await createConversionFunnel(
      result.data.name,
      stageIds,
      session.user.id,
      result.data.description
    );
    
    return NextResponse.json(
      { id: funnelId, message: "Conversion funnel created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/conversion-funnels/route.ts [POST]");
  }
} 