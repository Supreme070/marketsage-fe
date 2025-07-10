import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { workflowABTestingService } from "@/lib/workflow/ab-testing-service";
import { unauthorized, handleApiError } from "@/lib/errors";

/**
 * GET - Get specific A/B test analysis results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const { testId } = params;

    // Analyze the A/B test
    const analysis = await workflowABTestingService.analyzeWorkflowABTest(testId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Workflow A/B test analysis API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/ab-tests/[testId]/route.ts");
  }
}

/**
 * PATCH - Update A/B test (start/stop/pause)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to control A/B tests
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required to control A/B tests" },
        { status: 403 }
      );
    }

    const { testId } = params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing required field: action" },
        { status: 400 }
      );
    }

    switch (action) {
      case "start":
        await workflowABTestingService.startWorkflowABTest(testId);
        return NextResponse.json({ message: "A/B test started successfully" });

      case "stop":
        await workflowABTestingService.stopWorkflowABTest(testId);
        return NextResponse.json({ message: "A/B test stopped successfully" });

      default:
        return NextResponse.json(
          { error: "Invalid action", message: "Supported actions: start, stop" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Workflow A/B test control API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/ab-tests/[testId]/route.ts");
  }
}