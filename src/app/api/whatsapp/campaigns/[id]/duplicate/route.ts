import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// POST endpoint to duplicate a WhatsApp campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: campaignId } = await params;

  try {
    // First check if campaign exists and user has access
    const existingCampaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: true,
        segments: true,
      }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a new campaign with similar data but as a draft
    const duplicatedCampaign = await prisma.whatsAppCampaign.create({
      data: {
        name: `${existingCampaign.name} (Copy)`,
        description: existingCampaign.description,
        from: existingCampaign.from,
        content: existingCampaign.content,
        templateId: existingCampaign.templateId,
        createdById: session.user.id,
        status: CampaignStatus.DRAFT,
        // Link the same lists
        lists: {
          connect: existingCampaign.lists.map(list => ({ id: list.id }))
        },
        // Link the same segments
        segments: {
          connect: existingCampaign.segments.map(segment => ({ id: segment.id }))
        }
      },
      include: {
        template: true,
        lists: true,
        segments: true,
      }
    });

    return NextResponse.json(duplicatedCampaign);
  } catch (error) {
    console.error("Error duplicating WhatsApp campaign:", error);
    return NextResponse.json(
      { error: "Failed to duplicate WhatsApp campaign" },
      { status: 500 }
    );
  }
} 