import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, List, Segment, CampaignStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const campaignId = context.params.id;

    // Get the campaign to duplicate
    const originalCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: true,
        segments: true,
      },
    });

    if (!originalCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Create a duplicate campaign with a "Copy of" prefix
    const newCampaign = await prisma.sMSCampaign.create({
      data: {
        name: `Copy of ${originalCampaign.name}`,
        description: originalCampaign.description,
        content: originalCampaign.content,
        from: originalCampaign.from,
        templateId: originalCampaign.templateId,
        status: CampaignStatus.DRAFT, // Always start as draft
        createdById: session.user.id,
        lists: {
          connect: originalCampaign.lists.map((list: List) => ({ id: list.id })),
        },
        segments: {
          connect: originalCampaign.segments.map((segment: Segment) => ({ id: segment.id })),
        },
      },
    });

    return NextResponse.json(newCampaign);
  } catch (error) {
    console.error("Error duplicating SMS campaign:", error);
    return NextResponse.json(
      { error: "Failed to duplicate campaign" },
      { status: 500 }
    );
  }
} 