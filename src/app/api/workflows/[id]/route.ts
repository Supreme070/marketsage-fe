import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, type WorkflowStatus } from "@prisma/client";
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

//  Schema for workflow update validation
const workflowUpdateSchema = z.object({
  name: z.string().min(1, "Workflow name is required").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  definition: z.string().optional(), // JSON string
});

// GET workflow by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: workflowId } = await params;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return notFound("Workflow not found");
    }

    // Check if user has access to this workflow
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && workflow.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse definition JSON
    let parsedDefinition = {};
    try {
      parsedDefinition = JSON.parse(workflow.definition);
    } catch (e) {
      console.error("Error parsing workflow definition:", e);
    }

    // Return workflow with parsed definition
    const parsedWorkflow = {
      ...workflow,
      definition: parsedDefinition
    };

    return NextResponse.json(parsedWorkflow);
  } catch (error) {
    return handleApiError(error, "/api/workflows/[id]/route.ts");
  }
}

// PATCH endpoint to update a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: workflowId } = await params;

  try {
    // First, check if the workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!existingWorkflow) {
      return notFound("Workflow not found");
    }

    // Check if user has access to this workflow
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingWorkflow.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // If the body contains nodes and edges, convert to definition
    if (body.nodes || body.edges) {
      // Get the existing definition to merge with
      let existingDefinition = {};
      try {
        existingDefinition = JSON.parse(existingWorkflow.definition);
      } catch (e) {
        console.error("Error parsing existing definition:", e);
      }

      body.definition = JSON.stringify({
        ...existingDefinition,
        nodes: body.nodes || (existingDefinition as any).nodes || [],
        edges: body.edges || (existingDefinition as any).edges || [],
        metadata: body.metadata || (existingDefinition as any).metadata || {}
      });
      
      // Remove the individual properties
      delete body.nodes;
      delete body.edges;
      delete body.metadata;
    }
    
    // Validate input
    const validation = workflowUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid workflow data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const workflowData = validation.data;
    
    // Update the workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        ...(workflowData.name !== undefined && { name: workflowData.name }),
        ...(workflowData.description !== undefined && { description: workflowData.description }),
        ...(workflowData.status !== undefined && { status: workflowData.status as WorkflowStatus }),
        ...(workflowData.definition !== undefined && { definition: workflowData.definition }),
        updatedAt: new Date(),
      },
    });

    // Parse the definition for the response
    let parsedDefinition = {};
    try {
      parsedDefinition = JSON.parse(updatedWorkflow.definition);
    } catch (e) {
      console.error("Error parsing updated workflow definition:", e);
    }

    // Return workflow with parsed definition
    const parsedWorkflow = {
      ...updatedWorkflow,
      definition: parsedDefinition
    };

    return NextResponse.json(parsedWorkflow);
  } catch (error) {
    return handleApiError(error, "/api/workflows/[id]/route.ts");
  }
}

// DELETE endpoint to delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: workflowId } = await params;

  try {
    // First, check if the workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!existingWorkflow) {
      return notFound("Workflow not found");
    }

    // Check if user has access to this workflow
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingWorkflow.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the workflow
    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    return NextResponse.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    return handleApiError(error, "/api/workflows/[id]/route.ts");
  }
} 