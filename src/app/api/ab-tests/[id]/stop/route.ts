import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// External reference to the shared data store
//@ts-ignore - This is a reference to the data in the main route file
import { abTests } from '../../../ab-tests/route';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Properly await the params object
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Get the test from our mock data store
    const test = abTests.get(id);
    
    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }
    
    // Update the test status
    abTests.set(id, {
      ...test,
      status: "COMPLETED",
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: "A/B test stopped successfully" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 