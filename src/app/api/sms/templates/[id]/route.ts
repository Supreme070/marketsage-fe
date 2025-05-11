import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for template update validation
const templateUpdateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  variables: z.string().optional(), // JSON string for variables array
  category: z.string().optional(),
});

// GET SMS template by ID
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
    const template = await prisma.sMSTemplate.findUnique({
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
    console.error("Error fetching SMS template:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS template" },
      { status: 500 }
    );
  }
}

// PATCH/Update SMS template by ID
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
    const existingTemplate = await prisma.sMSTemplate.findUnique({
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
    
    // If variables is provided, validate it
    if (updateData.variables) {
      try {
        const parsedVariables = JSON.parse(updateData.variables);
        if (!Array.isArray(parsedVariables)) {
          return NextResponse.json(
            { error: "Variables must be a valid JSON array" },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Variables must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // Update the template
    const updatedTemplate = await prisma.sMSTemplate.update({
      where: { id: templateId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.content !== undefined && { content: updateData.content }),
        ...(updateData.variables !== undefined && { variables: updateData.variables }),
        ...(updateData.category !== undefined && { category: updateData.category }),
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating SMS template:", error);
    return NextResponse.json(
      { error: "Failed to update SMS template" },
      { status: 500 }
    );
  }
}

// DELETE SMS template by ID
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
    const existingTemplate = await prisma.sMSTemplate.findUnique({
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
    const campaignsUsingTemplate = await prisma.sMSCampaign.count({
      where: { templateId },
    });

    if (campaignsUsingTemplate > 0) {
      return NextResponse.json(
        { error: "Cannot delete template that is used in campaigns" },
        { status: 400 }
      );
    }

    // Delete the template
    await prisma.sMSTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: "SMS template deleted successfully" });
  } catch (error) {
    console.error("Error deleting SMS template:", error);
    return NextResponse.json(
      { error: "Failed to delete SMS template" },
      { status: 500 }
    );
  }
} 