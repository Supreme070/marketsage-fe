import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { sendTrackedEmail } from "@/lib/email-service";
import { randomUUID } from "crypto";

// POST endpoint to manually trigger VIP TESTS workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has appropriate role
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has permission (SUPER_ADMIN, ADMIN, or IT_ADMIN)
    const userRole = session.user.role;
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "IT_ADMIN"];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    console.log(`VIP Workflow triggered by: ${session.user.email} (${userRole})`);

    // Get VIP TESTS list
    const vipTestsList = await prisma.list.findFirst({
      where: { name: "VIP TESTS" },
      include: {
        ListMember: {
          include: {
            Contact: true
          }
        }
      }
    });

    if (!vipTestsList) {
      return NextResponse.json(
        { error: "VIP TESTS list not found. Please ensure the list exists." },
        { status: 404 }
      );
    }

    const vipContacts = vipTestsList.ListMember.map(member => member.Contact);

    if (vipContacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts found in VIP TESTS list" },
        { status: 400 }
      );
    }

    // Get VIP Welcome email template
    const vipTemplate = await prisma.emailTemplate.findFirst({
      where: { name: "VIP Welcome" }
    });

    if (!vipTemplate) {
      return NextResponse.json(
        { error: "VIP Welcome email template not found" },
        { status: 404 }
      );
    }

    // Create a workflow execution record
    const workflowExecution = await prisma.workflowExecution.create({
      data: {
        id: randomUUID(),
        workflowId: "vip-tests-workflow",
        status: "RUNNING",
        startedAt: new Date(),
        metadata: JSON.stringify({
          trigger: "manual",
          triggeredBy: session.user.email,
          listId: vipTestsList.id,
          listName: vipTestsList.name,
          contactCount: vipContacts.length
        })
      }
    });

    console.log(`Starting VIP workflow execution: ${workflowExecution.id}`);

    // Send Step 1: Welcome Email to all VIP contacts
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const contact of vipContacts) {
      try {
        console.log(`Sending VIP welcome email to: ${contact.firstName} ${contact.lastName} (${contact.email})`);

        const result = await sendTrackedEmail(contact, workflowExecution.id, {
          from: process.env.NEXT_PUBLIC_EMAIL_FROM || 'info@marketsage.africa',
          subject: vipTemplate.subject.replace('{{firstName}}', contact.firstName || 'VIP'),
          html: vipTemplate.content
            .replace(/{{firstName}}/g, contact.firstName || 'VIP')
            .replace(/{{lastName}}/g, contact.lastName || '')
            .replace(/{{email}}/g, contact.email),
          text: `Welcome to MarketSage VIP Program, ${contact.firstName}! This is a test email from our VIP workflow.`,
          metadata: {
            workflowStep: "step1-welcome",
            workflowExecutionId: workflowExecution.id,
            contactId: contact.id,
            testEmail: true
          }
        });

        if (result.success) {
          successCount++;
          results.push({
            contactId: contact.id,
            email: contact.email,
            name: `${contact.firstName} ${contact.lastName}`,
            status: "sent",
            messageId: result.messageId
          });
        } else {
          failureCount++;
          results.push({
            contactId: contact.id,
            email: contact.email,
            name: `${contact.firstName} ${contact.lastName}`,
            status: "failed",
            error: result.error?.message
          });
        }
      } catch (error) {
        failureCount++;
        console.error(`Error sending to ${contact.email}:`, error);
        results.push({
          contactId: contact.id,
          email: contact.email,
          name: `${contact.firstName} ${contact.lastName}`,
          status: "failed",
          error: (error as Error).message
        });
      }
    }

    // Update workflow execution status
    await prisma.workflowExecution.update({
      where: { id: workflowExecution.id },
      data: {
        status: failureCount === 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS",
        completedAt: new Date(),
        metadata: JSON.stringify({
          trigger: "manual",
          triggeredBy: session.user.email,
          listId: vipTestsList.id,
          listName: vipTestsList.name,
          contactCount: vipContacts.length,
          successCount,
          failureCount,
          results
        })
      }
    });

    console.log(`VIP workflow execution completed: ${successCount} sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `VIP workflow triggered successfully!`,
      workflowExecutionId: workflowExecution.id,
      summary: {
        totalContacts: vipContacts.length,
        successCount,
        failureCount,
        listName: vipTestsList.name
      },
      results,
      nextSteps: [
        "Step 1 (Welcome emails) sent immediately",
        "Step 2 will trigger based on email opens (24 hour window)",
        "Step 3 (Survey) will send 3 days after Step 2",
        "Check email activity tracking for opens and clicks",
        "Monitor workflow progress in the dashboard"
      ]
    });

  } catch (error) {
    console.error("VIP workflow trigger error:", error);
    return NextResponse.json(
      { 
        error: "Failed to trigger VIP workflow", 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check VIP workflow status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get VIP TESTS list info
    const vipTestsList = await prisma.list.findFirst({
      where: { name: "VIP TESTS" },
      include: {
        ListMember: {
          include: {
            Contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!vipTestsList) {
      return NextResponse.json(
        { error: "VIP TESTS list not found" },
        { status: 404 }
      );
    }

    // Get recent workflow executions
    const recentExecutions = await prisma.workflowExecution.findMany({
      where: {
        workflowId: "vip-tests-workflow"
      },
      orderBy: {
        startedAt: "desc"
      },
      take: 5
    });

    // Get email activities for VIP contacts
    const contactIds = vipTestsList.ListMember.map(member => member.Contact.id);
    const recentEmailActivities = await prisma.emailActivity.findMany({
      where: {
        contactId: {
          in: contactIds
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20,
      include: {
        Contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      vipTestsList: {
        id: vipTestsList.id,
        name: vipTestsList.name,
        description: vipTestsList.description,
        contactCount: vipTestsList.ListMember.length,
        contacts: vipTestsList.ListMember.map(member => ({
          id: member.Contact.id,
          name: `${member.Contact.firstName} ${member.Contact.lastName}`,
          email: member.Contact.email
        }))
      },
      recentExecutions: recentExecutions.map(execution => ({
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        metadata: execution.metadata ? JSON.parse(execution.metadata) : null
      })),
      recentEmailActivities: recentEmailActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        contactName: `${activity.Contact?.firstName} ${activity.Contact?.lastName}`,
        contactEmail: activity.Contact?.email,
        createdAt: activity.createdAt,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null
      })),
      instructions: {
        trigger: "POST /api/workflows/vip-test/trigger",
        permissions: "Requires ADMIN role or higher",
        description: "Manually triggers the 7-step VIP workflow for all contacts in VIP TESTS list"
      }
    });

  } catch (error) {
    console.error("VIP workflow status error:", error);
    return NextResponse.json(
      { error: "Failed to get VIP workflow status" },
      { status: 500 }
    );
  }
}