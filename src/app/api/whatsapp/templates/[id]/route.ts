import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, WATemplateStatus, CampaignStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Create a single instance of PrismaClient to avoid multiple connections
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  } else {
  // Prevent multiple instances during development
  if (!(global as any).prisma) {
    (}
  prisma = (global as any).prisma;
}

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
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely in Next.js 15
    const templateId = params.id;

    try {
      // First get the template
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId },
        include: {
          WhatsAppCampaign: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          }
        }
      });

      if (!template) {
        return notFound("Template not found");
      }

      // Check if user has access to this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
      if (!isAdmin && template.createdById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Get creator information separately
      const creator = await prisma.user.findUnique({
        where: { id: template.createdById },
        select: {
          id: true,
          name: true,
          email: true,
        }
      });

      // Format the response to maintain backwards compatibility
      const formattedTemplate = {
        ...template,
        createdBy: creator,
        campaigns: template.WhatsAppCampaign
      };

      return NextResponse.json(formattedTemplate);
    } catch (dbError: any) {
      console.error("Database error fetching WhatsApp template:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/templates/[id]/route.ts");
  }
}

// PATCH/Update WhatsApp template by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely in Next.js 15
    const templateId = params.id;

    try {
      // First check if template exists and user has access
      const existingTemplate = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId },
        include: {
          WhatsAppCampaign: {
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
        return notFound("Template not found");
      }

      // Check if user has access to update this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
      if (!isAdmin && existingTemplate.createdById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if template is used in any active campaigns
      if (existingTemplate.WhatsAppCampaign && existingTemplate.WhatsAppCampaign.length > 0) {
        return NextResponse.json(
          { error: "Cannot modify a template that is currently used in active campaigns" },
          { status: 400 }
        );
      }

      try {
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
        try {
          const updatedTemplate = await prisma.whatsAppTemplate.update({
            where: { id: templateId },
            data: updateData,
          });

          // Get creator info separately
          const creator = await prisma.user.findUnique({
            where: { id: updatedTemplate.createdById },
            select: {
              id: true,
              name: true,
              email: true,
            }
          });

          // Format the response to maintain backwards compatibility
          const formattedResponse = {
            ...updatedTemplate,
            createdBy: creator
          };

          return NextResponse.json(formattedResponse);
        } catch (updateError: any) {
          console.error("Error updating WhatsApp template:", updateError);
          return NextResponse.json(
            { error: `Failed to update template: ${updateError.message}` },
            { status: 500 }
          );
        }
      } catch (parseError) {
        console.error("Error parsing request body:", parseError);
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        );
      }
    } catch (dbError: any) {
      console.error("Database error checking template:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/templates/[id]/route.ts");
  }
}

// DELETE WhatsApp template by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely in Next.js 15
    const templateId = params.id;

    try {
      // First check if template exists and user has access
      const existingTemplate = await prisma.whatsAppTemplate.findUnique({
        where: { id: templateId },
        include: {
          WhatsAppCampaign: {
            select: { id: true }
          }
        }
      });

      if (!existingTemplate) {
        return notFound("Template not found");
      }

      // Check if user has access to delete this template
      const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
      if (!isAdmin && existingTemplate.createdById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if template is used in any campaigns
      if (existingTemplate.WhatsAppCampaign && existingTemplate.WhatsAppCampaign.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete a template that is used in campaigns" },
          { status: 400 }
        );
      }

      // Delete the template
      try {
        await prisma.whatsAppTemplate.delete({
          where: { id: templateId },
        });

        return NextResponse.json({ message: "WhatsApp template deleted successfully" });
      } catch (deleteError: any) {
        console.error("Error deleting WhatsApp template:", deleteError);
        return NextResponse.json(
          { error: `Failed to delete template: ${deleteError.message}` },
          { status: 500 }
        );
      }
    } catch (dbError: any) {
      console.error("Database error checking template:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/templates/[id]/route.ts");
  }
} 