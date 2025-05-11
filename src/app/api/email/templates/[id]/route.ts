import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for template update validation
const templateUpdateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  design: z.string().optional(), // JSON string
  previewText: z.string().optional(),
  category: z.string().optional(),
});

// GET email template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = params.id;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
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
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

// PATCH/Update email template by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = params.id;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has access to update this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingTemplate.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    
    // If design is provided, validate that it's a valid JSON string
    if (updateData.design) {
      try {
        JSON.parse(updateData.design);
      } catch (e) {
        return NextResponse.json(
          { error: "Design must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // Update the template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.subject !== undefined && { subject: updateData.subject }),
        ...(updateData.content !== undefined && { content: updateData.content }),
        ...(updateData.design !== undefined && { design: updateData.design }),
        ...(updateData.previewText !== undefined && { previewText: updateData.previewText }),
        ...(updateData.category !== undefined && { category: updateData.category }),
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}

// DELETE email template by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = params.id;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has access to delete this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingTemplate.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if template is used in any campaigns before deleting
    const campaignsUsingTemplate = await prisma.emailCampaign.count({
      where: { templateId },
    });

    if (campaignsUsingTemplate > 0) {
      return NextResponse.json(
        { error: "Cannot delete template that is used in campaigns" },
        { status: 400 }
      );
    }

    // Delete the template
    await prisma.emailTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: "Email template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    );
  }
} 