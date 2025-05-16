import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ABTestMetric } from "@prisma/client";
import { z } from "zod";
import { recordABTestResult } from "@/lib/ab-testing";
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from "@/lib/errors";

// Schema for validating test result requests
const resultSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  metric: z.nativeEnum(ABTestMetric),
  value: z.number().min(0).max(1),
  sampleSize: z.number().int().positive()
});

// POST endpoint to record new test results
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const testId = params.id;
    const body = await request.json();
    
    // Validate the request body
    const result = resultSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const { variantId, metric, value, sampleSize } = result.data;
    
    // Record the result
    const success = await recordABTestResult(
      testId,
      variantId,
      metric,
      value,
      sampleSize
    );
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to record test result" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Test result recorded successfully"
    });
  } catch (error) {
    return handleApiError(error, "/api/ab-tests/[id]/results/route.ts [POST]");
  }
} 