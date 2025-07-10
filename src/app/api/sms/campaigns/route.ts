import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";
import { smsService } from "@/lib/sms-providers/sms-service";

//  Schema for SMS campaign validation with phone number validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required").refine(
    (phone) => smsService.validatePhoneNumber(phone),
    {
      message: "Invalid sender phone number format. Must be a valid African phone number (e.g., +234XXXXXXXXX, 0XXXXXXXXXX)"
    }
  ),
  templateId: z.string().optional(),
  content: z.string().optional(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

// GET SMS campaigns endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    
    // Parse query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const searchQuery = url.searchParams.get("search");
    
    // Pagination parameters
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    
    // Convert status string to CampaignStatus enum if provided
    let status: CampaignStatus | undefined;
    if (statusParam) {
      try {
        status = statusParam.toUpperCase() as CampaignStatus;
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid status parameter" },
          { status: 400 }
        );
      }
    }
    
    const whereClause = {
      ...(isAdmin ? {} : { createdById: session.user.id }),
      ...(status ? { status } : {}),
      ...(searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ]
      } : {}),
    };

    // Get total count and campaigns in parallel
    const [campaigns, totalCount] = await Promise.all([
      prisma.sMSCampaign.findMany({
        where: whereClause,
        orderBy: {
          updatedAt: "desc",
        },
        skip: offset,
        take: limit,
        include: {
        template: {
          select: {
            id: true,
            name: true,
          }
        },
        lists: {
          select: {
            id: true,
            name: true,
          }
        },
        segments: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { 
            activities: true 
          }
        }
        }
      }),
      prisma.sMSCampaign.count({ where: whereClause })
    ]);

    // Transform the response
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      from: campaign.from,
      status: campaign.status,
      scheduledFor: campaign.scheduledFor,
      sentAt: campaign.sentAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      template: campaign.template,
      lists: campaign.lists,
      segments: campaign.segments,
      statistics: {
        totalRecipients: campaign._count.activities,
      }
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    return handleApiError(error, "/api/sms/campaigns/route.ts");
  }
}

// POST endpoint to create a new SMS campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = campaignSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid campaign data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const campaignData = validation.data;
    const { listIds, segmentIds, ...mainData } = campaignData;
    
    // If templateId is provided, check if it exists
    if (mainData.templateId) {
      const template = await prisma.sMSTemplate.findUnique({
        where: { id: mainData.templateId },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 400 }
        );
      }

      // Check if user has access to this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "No access to the selected template" }, { status: 403 });
      }
    }
    
    // Either content or templateId must be provided
    if (!mainData.content && !mainData.templateId) {
      return NextResponse.json(
        { error: "Either content or template must be provided" },
        { status: 400 }
      );
    }
    
    // Transaction to create campaign with relationships
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Create the SMS campaign
      const campaign = await tx.sMSCampaign.create({
        data: {
          id: randomUUID(),
          ...mainData,
          createdById: session.user.id,
          status: CampaignStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Connect lists if provided
          ...(listIds && listIds.length > 0 ? {
            lists: {
              connect: listIds.map(id => ({ id })),
            },
          } : {}),
          // Connect segments if provided
          ...(segmentIds && segmentIds.length > 0 ? {
            segments: {
              connect: segmentIds.map(id => ({ id })),
            },
          } : {}),
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
  } catch (error: any) {
    console.error("Error creating SMS campaign:", error);
    
    // Special error handling for foreign key constraints
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "One or more lists or segments not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create SMS campaign" },
      { status: 500 }
    );
  }
} 