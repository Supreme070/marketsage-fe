import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { workflowEngine } from "@/lib/workflow/execution-engine";
import { triggerContactAddedToList } from "@/lib/workflow/trigger-manager";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound 
} from "@/lib/errors";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/middleware/rate-limit";

// Schema for workflow execution request
const executeWorkflowSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  triggerData: z.record(z.any()).optional(),
});

// POST endpoint to manually trigger workflow execution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Check API rate limit
  const rateLimitResult = await checkApiRateLimit(session.user.id);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Too many API requests. Please try again later.',
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  const { id: workflowId } = await params;

  try {
    const body = await request.json();
    
    // Validate input
    const validation = executeWorkflowSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid execution data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { contactId, triggerData } = validation.data;

    // Check if workflow exists and user has access
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return notFound("Workflow not found");
    }

    // Check if user has access to this workflow
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && workflow.createdById !== session.user.id) {
      return forbidden("Access denied");
    }

    // Check if workflow is active
    if (workflow.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Workflow is not active" },
        { status: 400 }
      );
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Start workflow execution (rate limiting is handled inside the engine)
    const executionId = await workflowEngine.startWorkflowExecution(
      workflowId,
      contactId,
      triggerData
    );

    const response = NextResponse.json({
      success: true,
      executionId,
      message: "Workflow execution started",
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;

  } catch (error) {
    return handleApiError(error, "/api/workflows/[id]/execute/route.ts");
  }
}

// GET endpoint to get workflow execution status
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
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');

  try {
    // Check if workflow exists and user has access
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return notFound("Workflow not found");
    }

    // Check if user has access to this workflow
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && workflow.createdById !== session.user.id) {
      return forbidden("Access denied");
    }

    // Get workflow executions
    const whereClause: any = { workflowId };
    if (contactId) {
      whereClause.contactId = contactId;
    }

    const executions = await prisma.workflowExecution.findMany({
      where: whereClause,
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results
    });

    // Calculate summary statistics
    const summary = {
      total: executions.length,
      running: executions.filter((e: any) => e.status === 'RUNNING').length,
      completed: executions.filter((e: any) => e.status === 'COMPLETED').length,
      failed: executions.filter((e: any) => e.status === 'FAILED').length,
      paused: executions.filter((e: any) => e.status === 'PAUSED').length,
    };

    return NextResponse.json({
      executions,
      summary,
    });

  } catch (error) {
    return handleApiError(error, "/api/workflows/[id]/execute/route.ts");
  }
} 