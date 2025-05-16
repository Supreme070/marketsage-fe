import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { createSubjectLineTest } from "@/lib/email-ab-testing";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Schema for validating email A/B test creation requests
const emailTestSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  testType: z.enum(["subject", "content", "send_time"]),
  distributionPercent: z.number().min(0.1).max(1),
  variants: z.array(z.string()).min(2, "At least two variants are required")
});

// POST endpoint to create a new email A/B test
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = emailTestSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const { campaignId, testType, distributionPercent, variants } = result.data;
    
    // Check if the campaign exists and the user has permission
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        createdById: true
      }
    });
    
    if (!campaign) {
      return notFound("Email campaign not found");
    }
    
    // Check permissions
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isOwner = campaign.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return forbidden();
    }
    
    // Ensure the campaign is in DRAFT status
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: "A/B tests can only be created for campaigns in DRAFT status" },
        { status: 400 }
      );
    }
    
    let testId = null;
    
    // Create the appropriate type of test
    if (testType === 'subject') {
      testId = await createSubjectLineTest(
        campaignId, 
        variants, 
        distributionPercent,
        session.user.id
      );
    } else if (testType === 'content') {
      // Not yet implemented
      return NextResponse.json(
        { error: "Content A/B testing is not yet implemented" },
        { status: 501 }
      );
    } else if (testType === 'send_time') {
      // Not yet implemented
      return NextResponse.json(
        { error: "Send time A/B testing is not yet implemented" },
        { status: 501 }
      );
    }
    
    if (!testId) {
      return NextResponse.json(
        { error: "Failed to create A/B test" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        id: testId, 
        message: `Email ${testType} A/B test created successfully`
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/email/campaigns/ab-tests/route.ts [POST]");
  }
} 