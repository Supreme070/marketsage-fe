import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { workflowABTestingService } from "@/lib/workflow/ab-testing-service";
import { unauthorized, handleApiError } from "@/lib/errors";

/**
 * GET - Get A/B tests for a specific workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const workflowId = params.id;

    // Get A/B tests for the workflow
    const abTests = await workflowABTestingService.getWorkflowABTestResults(workflowId);

    return NextResponse.json(abTests);
  } catch (error) {
    console.error("Workflow A/B tests API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/ab-tests/route.ts");
  }
}

/**
 * POST - Create a new A/B test for a workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to create A/B tests
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required to create A/B tests" },
        { status: 403 }
      );
    }

    const workflowId = params.id;
    const body = await request.json();

    // Validate required fields
    const { name, testType, winnerMetric, variants } = body;
    
    if (!name || !testType || !winnerMetric || !variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing required fields: name, testType, winnerMetric, variants" },
        { status: 400 }
      );
    }

    if (variants.length < 2) {
      return NextResponse.json(
        { error: "Invalid request", message: "At least 2 variants are required for A/B testing" },
        { status: 400 }
      );
    }

    // Validate traffic percentages
    const totalTraffic = variants.reduce((sum: number, v: any) => sum + (v.trafficPercent || 0), 0);
    if (Math.abs(totalTraffic - 1.0) > 0.01) {
      return NextResponse.json(
        { error: "Invalid request", message: "Variant traffic percentages must sum to 100%" },
        { status: 400 }
      );
    }

    // Create the A/B test
    const testId = await workflowABTestingService.createWorkflowABTest({
      name,
      description: body.description,
      workflowId,
      testType,
      winnerMetric,
      winnerThreshold: body.winnerThreshold || 0.95,
      distributionPercent: body.distributionPercent || 1.0,
      variants,
      createdById: session.user.id,
    });

    return NextResponse.json({
      id: testId,
      message: "A/B test created successfully",
    });
  } catch (error) {
    console.error("Create workflow A/B test API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/ab-tests/route.ts");
  }
}