import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Schema for email campaign validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required"),
  from: z.string().min(1, "From address is required"),
  replyTo: z.string().email().optional(),
  templateId: z.string().optional(),
  content: z.string().optional(),
  design: z.string().optional(), // JSON string
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

// GET email campaigns endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    // Parse query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const searchQuery = url.searchParams.get("search");
    
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
    
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        ...(isAdmin ? {} : { createdById: session.user.id }),
        ...(status ? { status } : {}),
        ...(searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { subject: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        EmailTemplate: {
          select: {
            id: true,
            name: true,
          }
        },
        List: {
          select: {
            id: true,
            name: true,
          }
        },
        Segment: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { 
            EmailActivity: true 
          }
        }
      },
    });

    // Transform the response
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      subject: campaign.subject,
      from: campaign.from,
      replyTo: campaign.replyTo,
      status: campaign.status,
      scheduledFor: campaign.scheduledFor,
      sentAt: campaign.sentAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      template: campaign.EmailTemplate,
      lists: campaign.List,
      segments: campaign.Segment,
      statistics: {
        totalRecipients: campaign._count.EmailActivity,
      }
    }));

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    console.error("Error fetching email campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch email campaigns" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new email campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const now = new Date();
    
    // If design is provided, validate that it's a valid JSON string
    if (mainData.design) {
      try {
        JSON.parse(mainData.design);
      } catch (e) {
        return NextResponse.json(
          { error: "Design must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // If templateId is provided, check if it exists
    if (mainData.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: mainData.templateId },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 400 }
        );
      }

      // Check if user has access to this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "No access to the selected template" }, { status: 403 });
      }
    }
    
    // Transaction to create campaign with relationships
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Create the email campaign
      const campaign = await tx.emailCampaign.create({
        data: {
          id: randomUUID(),
          ...mainData,
          createdById: session.user.id,
          status: CampaignStatus.DRAFT,
          createdAt: now,
          updatedAt: now,
          // Connect lists if provided
          ...(listIds && listIds.length > 0 ? {
            List: {
              connect: listIds.map(id => ({ id })),
            },
          } : {}),
          // Connect segments if provided
          ...(segmentIds && segmentIds.length > 0 ? {
            Segment: {
              connect: segmentIds.map(id => ({ id })),
            },
          } : {}),
        },
        include: {
          EmailTemplate: true,
          List: true,
          Segment: true,
        },
      });
      
      return campaign;
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error: any) {
    console.error("Error creating email campaign:", error);
    
    // Special error handling for foreign key constraints
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "One or more lists or segments not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create email campaign" },
      { status: 500 }
    );
  }
} 