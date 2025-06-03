import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus, ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// POST endpoint to initiate sending of a WhatsApp campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: {
          include: {
            members: {
              include: {
                contact: true,
              }
            }
          }
        },
        segments: true,
      }
    });

    if (!campaign) {
      return notFound("Campaign not found");
    }

    // Check if user has access to send this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if campaign is in a state that allows sending
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return NextResponse.json(
        { error: `Cannot send campaign with status: ${campaign.status}` },
        { status: 400 }
      );
    }

    // Ensure campaign has content or a template
    if (!campaign.content && !campaign.templateId) {
      return NextResponse.json(
        { error: "Campaign must have content or a template to send" },
        { status: 400 }
      );
    }

    // Get all unique contacts from lists
    const contactsFromLists = campaign.lists.flatMap(list => 
      list.members.map(member => member.contact)
    );

    // For simplicity, we'll just use list contacts for now
    // In a full implementation, you would also process segments
    const uniqueContacts = Array.from(
      new Map(contactsFromLists.map(contact => [contact.id, contact])).values()
    );

    if (uniqueContacts.length === 0) {
      return NextResponse.json(
        { error: "Campaign has no recipients" },
        { status: 400 }
      );
    }

    // Update campaign status to SENDING and record sent time
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENDING,
        sentAt: new Date(),
      }
    });

    // Create activity records for each contact (this simulates the actual sending)
    // In a production environment, this would likely be handled by a queue/worker system
    const activityRecords = uniqueContacts.map(contact => ({
      campaignId,
      contactId: contact.id,
      type: ActivityType.SENT,
      timestamp: new Date(),
      metadata: JSON.stringify({ 
        status: "queued",
        timestamp: new Date().toISOString() 
      })
    }));

    // Create activity records in batches to avoid overwhelming the database
    await prisma.whatsAppActivity.createMany({
      data: activityRecords
    });

    // In a real implementation, you would now:
    // 1. Queue the messages for delivery
    // 2. Process them through a background worker
    // 3. Update the activity records as they are processed
    
    // For demonstration purposes, we'll just update the campaign to SENT
    // This is highly simplified; in production, you'd monitor the actual delivery
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
      }
    });

    return NextResponse.json({
      message: "Campaign sending initiated",
      recipientCount: uniqueContacts.length
    });
  } catch (error) {
    console.error("Error sending WhatsApp campaign:", error);
    
    // Attempt to revert the campaign status to DRAFT if an error occurred
    try {
      await prisma.whatsAppCampaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.DRAFT,
        }
      });
    } catch (revertError) {
      console.error("Error reverting campaign status:", revertError);
    }
    
    return NextResponse.json(
      { error: "Failed to send WhatsApp campaign" },
      { status: 500 }
    );
  }
} 