import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, WorkflowStatus } from "@prisma/client";
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

//  Schema for workflow validation
const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  definition: z.string().optional(), // JSON string containing nodes, edges, etc.
});

// GET endpoint to fetch workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    // Parse query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const searchQuery = url.searchParams.get("search");
    
    // Build where clause for filtering
    const whereClause: any = {};
    
    // If not admin, only show own workflows
    if (!isAdmin) {
      whereClause.createdById = session.user.id;
    }
    
    // Filter by status if provided
    if (statusParam) {
      whereClause.status = statusParam.toUpperCase() as WorkflowStatus;
    }
    
    // Search functionality
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const workflows = await prisma.workflow.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: "desc",
      }
    });

    // Parse definition field from JSON string for each workflow
    const formattedWorkflows = workflows.map(workflow => {
      try {
        return {
          ...workflow,
          definition: JSON.parse(workflow.definition)
        };
      } catch (e) {
        return {
          ...workflow,
          definition: {}
        };
      }
    });

    return NextResponse.json(formattedWorkflows);
  } catch (error) {
    return handleApiError(error, "/api/workflows/route.ts");
  }
}

// POST endpoint to create a new workflow
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // If the body contains nodes and edges, convert to definition
    if (body.nodes || body.edges) {
      body.definition = JSON.stringify({
        nodes: body.nodes || [],
        edges: body.edges || [],
        metadata: body.metadata || {}
      });
      
      // Remove the individual properties
      delete body.nodes;
      delete body.edges;
      delete body.metadata;
    }
    
    // Validate input
    const validation = workflowSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid workflow data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const workflowData = validation.data;
    const now = new Date();
    
    // Create the workflow
    const newWorkflow = await prisma.workflow.create({
      data: {
        id: randomUUID(),
        name: workflowData.name,
        description: workflowData.description || "",
        status: (workflowData.status as WorkflowStatus) || WorkflowStatus.INACTIVE,
        definition: workflowData.definition || "{}",
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Parse the definition field before returning
    let parsedDefinition = {};
    try {
      parsedDefinition = JSON.parse(newWorkflow.definition);
    } catch (e) {
      console.error("Error parsing workflow definition:", e);
    }

    return NextResponse.json({
      ...newWorkflow,
      definition: parsedDefinition
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/workflows/route.ts");
  }
} 