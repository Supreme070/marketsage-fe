import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// POST endpoint to duplicate an SMS campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignId = params.id;

  try {
    // First check if campaign exists and user has access
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: true,
        segments: true,
      }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if user has access to duplicate this campaign
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingCampaign.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a duplicate of the campaign
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Create the duplicated SMS campaign
      const campaign = await tx.sMSCampaign.create({
        data: {
          name: `${existingCampaign.name} (Copy)`,
          description: existingCampaign.description,
          from: existingCampaign.from,
          templateId: existingCampaign.templateId,
          content: existingCampaign.content,
          status: CampaignStatus.DRAFT, // Always start as DRAFT
          createdById: session.user.id,
          // Connect the same lists
          lists: {
            connect: existingCampaign.lists.map(list => ({ id: list.id })),
          },
          // Connect the same segments
          segments: {
            connect: existingCampaign.segments.map(segment => ({ id: segment.id })),
          },
        },
        include: {
          template: true,
          lists: true,
          segments: true,
        },
      });
      
      return campaign;
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error("Error duplicating SMS campaign:", error);
    return NextResponse.json(
      { error: "Failed to duplicate SMS campaign" },
      { status: 500 }
    );
  }
} 