import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, WATemplateStatus, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for template update validation
const templateUpdateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  content: z.string().min(1, "Template content is required").optional(),
  variables: z.string().optional(), // JSON string of variables
  category: z.string().optional(),
  status: z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED"
  ]).optional(),
});

// GET WhatsApp template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: templateId } = await params;

  try {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has access to this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && template.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching WhatsApp template:", error);
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp template" },
      { status: 500 }
    );
  }
}

// PATCH/Update WhatsApp template by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
      include: {
        campaigns: {
          where: { 
            OR: [
              { status: CampaignStatus.SCHEDULED },
              { status: CampaignStatus.SENDING },
              { status: CampaignStatus.DRAFT },
            ]
          },
          select: { id: true }
        }
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has access to update this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingTemplate.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if template is used in any active campaigns
    if (existingTemplate.campaigns && existingTemplate.campaigns.length > 0) {
      return NextResponse.json(
        { error: "Cannot modify a template that is currently used in active campaigns" },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = templateUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid template data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updateData = validation.data;
    
    // If variables is provided, validate that it's a valid JSON array
    if (updateData.variables) {
      try {
        const variables = JSON.parse(updateData.variables);
        if (!Array.isArray(variables)) {
          throw new Error("Variables must be an array");
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Variables must be a valid JSON array" },
          { status: 400 }
        );
      }
    }
    
    // Update the template
    const updatedTemplate = await prisma.whatsAppTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating WhatsApp template:", error);
    return NextResponse.json(
      { error: "Failed to update WhatsApp template" },
      { status: 500 }
    );
  }
}

// DELETE WhatsApp template by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Access params safely in Next.js 15
  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
      include: {
        campaigns: {
          select: { id: true }
        }
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has access to delete this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingTemplate.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if template is used in any campaigns
    if (existingTemplate.campaigns && existingTemplate.campaigns.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete a template that is used in campaigns" },
        { status: 400 }
      );
    }

    // Delete the template
    await prisma.whatsAppTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: "WhatsApp template deleted successfully" });
  } catch (error) {
    console.error("Error deleting WhatsApp template:", error);
    return NextResponse.json(
      { error: "Failed to delete WhatsApp template" },
      { status: 500 }
    );
  }
} 