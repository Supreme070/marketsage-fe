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
import { getBirthdayAutoDetectionSystem } from "@/lib/campaigns/birthday-auto-detection";

//  Schema for email campaign validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required"),
  from: z.string().min(1, "From address is required"),
  replyTo: z.string().optional().refine(val => !val || val === "" || z.string().email().safeParse(val).success, "Must be a valid email address"),
  templateId: z.string().optional(),
  content: z.string().optional(),
  design: z.string().optional(), // JSON string
  listIds: z.array(z.string()).min(1, "At least one list is required"),
  segmentIds: z.array(z.string()).optional(),
  // A/B Testing
  enableABTesting: z.boolean().default(false),
  // Geo-targeting
  enableGeoTargeting: z.boolean().default(false),
  targetCountries: z.array(z.string()).default([]),
  targetStates: z.array(z.string()).default([]),
  targetCities: z.array(z.string()).default([]),
  // Birthday targeting
  enableBirthdayTargeting: z.boolean().default(false),
  birthdayTiming: z.enum(['on_birthday', 'day_before', 'week_before']).default('on_birthday'),
  birthdayOfferType: z.enum(['discount', 'freebie', 'exclusive_access', 'personalized_gift']).default('discount'),
  birthdayOfferValue: z.number().min(0).max(100).default(15),
});

// GET email campaigns endpoint
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
      template: campaign.template,
      lists: campaign.lists,
      segments: campaign.segments,
      statistics: {
        totalRecipients: campaign._count.activities,
      }
    }));

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    return handleApiError(error, "/api/email/campaigns/route.ts");
  }
}

// POST endpoint to create a new email campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    console.log("Campaign creation request body:", JSON.stringify(body, null, 2));
    
    // Validate input
    const validation = campaignSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("Validation failed:", validation.error.format());
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
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "No access to the selected template" }, { status: 403 });
      }
    }
    
    // Validate that all lists exist and user has access
    if (listIds && listIds.length > 0) {
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
      const accessibleLists = await prisma.list.findMany({
        where: {
          id: { in: listIds },
          ...(isAdmin ? {} : { createdById: session.user.id })
        },
        select: { id: true }
      });
      
      if (accessibleLists.length !== listIds.length) {
        const foundIds = accessibleLists.map(l => l.id);
        const missingIds = listIds.filter(id => !foundIds.includes(id));
        console.error("Lists not found or no access:", missingIds);
        return NextResponse.json(
          { error: `Lists not found or no access: ${missingIds.join(", ")}` },
          { status: 400 }
        );
      }
    }
    
    // Create campaign directly (without transaction for now)
    const newCampaign = await prisma.emailCampaign.create({
      data: {
        id: randomUUID(),
        ...mainData,
        createdById: session.user.id,
        status: CampaignStatus.DRAFT,
        createdAt: now,
        updatedAt: now,
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

    // If birthday targeting is enabled, trigger birthday detection for the organization
    if (campaignData.enableBirthdayTargeting) {
      try {
        const birthdaySystem = getBirthdayAutoDetectionSystem();
        
        // Run birthday detection to identify upcoming birthdays and automatically
        // create birthday campaigns based on the template settings from this campaign
        await birthdaySystem.runDailyBirthdayDetection(session.user.organizationId);
        
        console.log(`Birthday detection triggered for campaign: ${newCampaign.id}`);
      } catch (birthdayError) {
        // Log birthday detection error but don't fail the campaign creation
        console.error("Birthday detection failed:", birthdayError);
      }
    }

    return NextResponse.json({
      ...newCampaign,
      birthdayIntegration: campaignData.enableBirthdayTargeting ? {
        enabled: true,
        timing: campaignData.birthdayTiming,
        offerType: campaignData.birthdayOfferType,
        offerValue: campaignData.birthdayOfferValue,
        message: "Birthday detection has been triggered for this campaign"
      } : null
    }, { status: 201 });
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