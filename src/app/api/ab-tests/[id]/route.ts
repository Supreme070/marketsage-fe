import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// External reference to the shared data store
//@ts-ignore - This is a reference to the data in the main route file
import { abTests, abTestVariants } from '../../ab-tests/route';

// GET endpoint to retrieve a specific A/B test's details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const resolvedParams = await params;
    const testId = resolvedParams.id;
    
    // Check if the test exists in our mock data store
    const test = abTests.get(testId);
    
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }
    
    // Get test variants
    const variants = Array.from(abTestVariants.values())
      .filter((v: any) => v.testId === testId);
    
    return NextResponse.json({
      ...test,
      variants
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update test status (start/stop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const resolvedParams = await params;
    const testId = resolvedParams.id;
    const body = await request.json();
    const { action } = body;
    
    // Check if the test exists
    const test = abTests.get(testId);
    
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }
    
    // Handle different actions
    if (action === "start") {
      // Update the test status to RUNNING
      abTests.set(testId, {
        ...test,
        status: "RUNNING",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (action === "stop") {
      // Update the test status to COMPLETED
      abTests.set(testId, {
        ...test,
        status: "COMPLETED",
        endedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Supported actions: start, stop" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: `A/B test ${action === "start" ? "started" : "stopped"} successfully`
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete an A/B test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const resolvedParams = await params;
    const testId = resolvedParams.id;
    
    // Check if the test exists
    const test = abTests.get(testId);
    
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }
    
    // Delete the test
    abTests.delete(testId);
    
    // Remove associated variants
    for (const [variantId, variant] of abTestVariants.entries()) {
      if (variant.testId === testId) {
        abTestVariants.delete(variantId);
      }
    }
    
    return NextResponse.json({
      message: "A/B test deleted successfully"
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 