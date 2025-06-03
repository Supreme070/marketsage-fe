import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
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

// POST endpoint to duplicate an SMS campaign
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
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      include: {
        lists: true,
        segments: true,
      }
    });

    if (!existingCampaign) {
      return notFound("Campaign not found");
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
    return handleApiError(error, "/api/sms/campaigns/[id]/duplicate/route.ts");
  }
} 