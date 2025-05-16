import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Schema for creating a subject line test
const createTestSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  originalSubject: z.string().min(1, "Original subject is required"),
  variants: z.array(z.string()).min(1, "At least one variant is required")
});

/**
 * POST: Create a new subject line test
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    const result = createTestSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const { campaignId, originalSubject, variants } = result.data;
    
    // Check if the campaign exists and user has permission
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        createdById: true,
        status: true
      }
    });
    
    if (!campaign) {
      return notFound("Campaign not found");
    }
    
    // Check permissions
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isOwner = campaign.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return forbidden();
    }
    
    // Ensure campaign is in DRAFT status
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: "Subject line tests can only be created for campaigns in DRAFT status" },
        { status: 400 }
      );
    }
    
    // Create all variants including the original subject
    const allVariants = [originalSubject, ...variants];
    
    // Create the subject line test
    const test = await prisma.subjectLineTest.create({
      data: {
        id: randomUUID(),
        campaignId,
        originalSubject,
        variants: JSON.stringify(allVariants),
        status: 'DRAFT',
        createdById: session.user.id,
        createdAt: new Date()
      }
    });
    
    // Create result placeholders for each variant
    await Promise.all(allVariants.map(async (_, index) => {
      await prisma.subjectLineTestResult.create({
        data: {
          id: randomUUID(),
          testId: test.id,
          variantId: `variant_${index}`,
          opens: 0,
          clicks: 0,
          sent: 0,
          openRate: 0,
          clickRate: 0
        }
      });
    }));
    
    return NextResponse.json(
      { id: test.id, message: "Subject line test created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/ai-features/subject-line-test/route.ts [POST]");
  }
}

/**
 * GET: Retrieve subject line tests
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("id");
    const campaignId = searchParams.get("campaignId");
    
    // If test ID is provided, return that specific test
    if (testId) {
      const test = await prisma.subjectLineTest.findUnique({
        where: { id: testId },
        include: {
          results: true,
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      if (!test) {
        return notFound("Subject line test not found");
      }
      
      // Check permissions
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
      const isOwner = test.createdById === session.user.id;
      
      if (!isAdmin && !isOwner) {
        return forbidden();
      }
      
      // Parse variants
      const parsedTest = {
        ...test,
        variants: JSON.parse(test.variants)
      };
      
      return NextResponse.json(parsedTest);
    }
    
    // If campaign ID is provided, return tests for that campaign
    if (campaignId) {
      const tests = await prisma.subjectLineTest.findMany({
        where: { campaignId },
        include: {
          results: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      
      // Parse variants for each test
      const parsedTests = tests.map(test => ({
        ...test,
        variants: JSON.parse(test.variants)
      }));
      
      return NextResponse.json(parsedTests);
    }
    
    // Otherwise, return tests created by the user or all if admin
    const where = !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
      ? { createdById: session.user.id }
      : {};
    
    const tests = await prisma.subjectLineTest.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        results: true
      },
      take: 20
    });
    
    // Parse variants for each test
    const parsedTests = tests.map(test => ({
      ...test,
      variants: JSON.parse(test.variants)
    }));
    
    return NextResponse.json(parsedTests);
  } catch (error) {
    return handleApiError(error, "/api/ai-features/subject-line-test/route.ts [GET]");
  }
} 