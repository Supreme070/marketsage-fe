import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { randomUUID } from "crypto";
import { createSampleTests } from "./sample-data";

// In-memory storage for A/B tests during demo
export const abTests = new Map<string, any>();
export const abTestVariants = new Map<string, any>();
export const abTestResults = new Map<string, any>();

// Load sample data
const { sampleTests, sampleVariants } = createSampleTests();
sampleTests.forEach(test => abTests.set(test.id, test));
sampleVariants.forEach(variant => abTestVariants.set(variant.id, variant));

// GET /api/ab-tests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const testId = searchParams.get("id");
    
    // If test ID is provided, get details for that specific test
    if (testId) {
      const test = abTests.get(testId);
      
      if (!test) {
        return NextResponse.json(
          { error: "A/B test not found" },
          { status: 404 }
        );
      }
      
      const variants = Array.from(abTestVariants.values())
        .filter((v: any) => v.testId === testId);
      
      return NextResponse.json({
        ...test,
        variants
      });
    }
    
    // Otherwise, get a list of tests with filtering
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const status = searchParams.get("status");
    
    // Filter tests based on query parameters
    let tests = Array.from(abTests.values());
    
    if (entityType) {
      tests = tests.filter((test: any) => test.entityType === entityType);
    }
    
    if (entityId) {
      tests = tests.filter((test: any) => test.entityId === entityId);
    }
    
    if (status) {
      tests = tests.filter((test: any) => test.status === status);
    }
    
    // Add variants to each test
    const testsWithVariants = tests.map((test: any) => {
      const variants = Array.from(abTestVariants.values())
        .filter((v: any) => v.testId === test.id);
      
      return {
        ...test,
        variants,
        _count: {
          results: 0 // Mock count
        }
      };
    });

    return NextResponse.json(testsWithVariants);
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/ab-tests
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.entityType || !data.entityId) {
      return NextResponse.json(
        { error: "Missing required fields: name, entityType, entityId" },
        { status: 400 }
      );
    }
    
    // Validate variants if provided
    if (data.variants && data.variants.length > 0) {
      const totalTrafficPercent = data.variants.reduce(
        (sum: number, variant: any) => sum + (variant.trafficPercent || 0), 
        0
      );
      
      if (Math.abs(totalTrafficPercent - 1) > 0.01) {
        return NextResponse.json(
          { error: "Variant traffic percentages must sum to 1" },
          { status: 400 }
        );
      }
    }

    // Create the A/B test
    const testId = randomUUID();
    const newTest = {
      id: testId,
      name: data.name,
      description: data.description,
      entityType: data.entityType,
      entityId: data.entityId,
      status: "DRAFT",
      testType: data.testType || "SIMPLE_AB",
      testElements: data.testElements || [],
      winnerMetric: data.winnerMetric || "CLICK_RATE",
      winnerThreshold: data.winnerThreshold || 0.95,
      distributionPercent: data.distributionPercent || 0.5,
      createdById: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    abTests.set(testId, newTest);
    
    // Create variants
    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        const variantId = randomUUID();
        abTestVariants.set(variantId, {
          id: variantId,
          testId,
          name: variant.name,
          description: variant.description,
          content: variant.content,
          trafficPercent: variant.trafficPercent,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      { id: testId, message: "A/B test created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PUT /api/ab-tests
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }
    
    // Get existing test
    const existingTest = abTests.get(data.id);
    if (!existingTest) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }
    
    // Update the test
    const updatedTest = {
      ...existingTest,
      name: data.name || existingTest.name,
      description: data.description !== undefined ? data.description : existingTest.description,
      status: data.status || existingTest.status,
      winnerMetric: data.winnerMetric || existingTest.winnerMetric,
      winnerThreshold: data.winnerThreshold || existingTest.winnerThreshold,
      distributionPercent: data.distributionPercent || existingTest.distributionPercent,
      testElements: data.testElements || existingTest.testElements,
      updatedAt: new Date().toISOString()
    };
    
    abTests.set(data.id, updatedTest);
    
    // Update variants if provided
    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        if (variant.id) {
          // Update existing variant
          const existingVariant = abTestVariants.get(variant.id);
          if (existingVariant) {
            abTestVariants.set(variant.id, {
              ...existingVariant,
              name: variant.name || existingVariant.name,
              description: variant.description !== undefined ? variant.description : existingVariant.description,
              content: variant.content || existingVariant.content,
              trafficPercent: variant.trafficPercent || existingVariant.trafficPercent
            });
          }
        } else {
          // Create new variant
          const variantId = randomUUID();
          abTestVariants.set(variantId, {
            id: variantId,
            testId: data.id,
            name: variant.name || "Unnamed Variant",
            description: variant.description,
            content: variant.content || {},
            trafficPercent: variant.trafficPercent || 0.5,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json({ message: "A/B test updated successfully" });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE /api/ab-tests
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    if (!abTests.has(id)) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    // Remove test
    abTests.delete(id);
    
    // Remove variants
    for (const [variantId, variant] of abTestVariants.entries()) {
      if (variant.testId === id) {
        abTestVariants.delete(variantId);
      }
    }
    
    // Remove results
    for (const [resultId, result] of abTestResults.entries()) {
      if (result.testId === id) {
        abTestResults.delete(resultId);
      }
    }

    return NextResponse.json({ message: "A/B test deleted successfully" });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 