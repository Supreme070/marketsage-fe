import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Schema for updating test status
const updateTestSchema = z.object({
  action: z.enum(["start", "stop", "select_winner"]),
  winnerVariantId: z.string().optional()
});

/**
 * GET: Retrieve a specific subject line test
 */
export async function GET(
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
  } catch (error) {
    return handleApiError(error, "/api/ai-features/subject-line-test/[id]/route.ts [GET]");
  }
}

/**
 * PATCH: Update a subject line test (start, stop, select winner)
 */
export async function PATCH(
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
    
    // Validate request body
    const result = updateTestSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const { action, winnerVariantId } = result.data;
    
    // Check if the test exists
    const test = await prisma.subjectLineTest.findUnique({
      where: { id: testId },
      select: {
        id: true,
        status: true,
        createdById: true,
        campaignId: true
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
    
    // Handle different actions
    switch (action) {
      case "start": {
        // Ensure test is in DRAFT status
        if (test.status !== 'DRAFT') {
          return NextResponse.json(
            { error: "Only tests in DRAFT status can be started" },
            { status: 400 }
          );
        }
        
        // Update the test status
        await prisma.subjectLineTest.update({
          where: { id: testId },
          data: {
            status: 'RUNNING',
            startedAt: new Date()
          }
        });
        
        return NextResponse.json({
          message: "Subject line test started successfully"
        });
      }
      
      case "stop": {
        // Ensure test is in RUNNING status
        if (test.status !== 'RUNNING') {
          return NextResponse.json(
            { error: "Only tests in RUNNING status can be stopped" },
            { status: 400 }
          );
        }
        
        // Update the test status
        await prisma.subjectLineTest.update({
          where: { id: testId },
          data: {
            status: 'COMPLETED',
            endedAt: new Date()
          }
        });
        
        return NextResponse.json({
          message: "Subject line test stopped successfully"
        });
      }
      
      case "select_winner": {
        // Ensure test is in COMPLETED status
        if (test.status !== 'COMPLETED' && test.status !== 'RUNNING') {
          return NextResponse.json(
            { error: "Only tests in COMPLETED or RUNNING status can have a winner selected" },
            { status: 400 }
          );
        }
        
        // Ensure winner variant ID is provided
        if (!winnerVariantId) {
          return NextResponse.json(
            { error: "Winner variant ID is required" },
            { status: 400 }
          );
        }
        
        // Update the test with the winner
        await prisma.subjectLineTest.update({
          where: { id: testId },
          data: {
            winnerVariantId,
            status: 'COMPLETED',
            endedAt: new Date()
          }
        });
        
        // Apply the winning subject line to the campaign
        const testDetails = await prisma.subjectLineTest.findUnique({
          where: { id: testId }
        });
        
        if (testDetails) {
          const variants = JSON.parse(testDetails.variants);
          const winnerIndex = Number.parseInt(winnerVariantId.split('_')[1], 10);
          const winningSubject = variants[winnerIndex];
          
          // Update the campaign subject
          await prisma.emailCampaign.update({
            where: { id: test.campaignId },
            data: {
              subject: winningSubject
            }
          });
        }
        
        return NextResponse.json({
          message: "Winner selected and applied to campaign"
        });
      }
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error, "/api/ai-features/subject-line-test/[id]/route.ts [PATCH]");
  }
}

/**
 * DELETE: Delete a subject line test
 */
export async function DELETE(
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
    
    // Check if the test exists
    const test = await prisma.subjectLineTest.findUnique({
      where: { id: testId },
      select: {
        id: true,
        createdById: true,
        status: true
      }
    });
    
    if (!test) {
      return notFound("Subject line test not found");
    }
    
    // Check permissions (only admin or creator can delete)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isOwner = test.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return forbidden();
    }
    
    // Prevent deletion of running tests
    if (test.status === 'RUNNING') {
      return NextResponse.json(
        { error: "Cannot delete a running test. Stop the test first." },
        { status: 400 }
      );
    }
    
    // Delete the test (results will be cascade deleted)
    await prisma.subjectLineTest.delete({
      where: { id: testId }
    });
    
    return NextResponse.json({
      message: "Subject line test deleted successfully"
    });
  } catch (error) {
    return handleApiError(error, "/api/ai-features/subject-line-test/[id]/route.ts [DELETE]");
  }
} 