import { NextRequest, NextResponse } from "next/server";
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

//  Schema for template update validation
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    const template = await prisma.sMSTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return notFound("Template not found");
    }

    // Check if user has access to this template
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && template.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error, "/api/sms/templates/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.sMSTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return notFound("Template not found");
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
    return handleApiError(error, "/api/sms/templates/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.sMSTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return notFound("Template not found");
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
    return handleApiError(error, "/api/sms/templates/[id]/route.ts");
  }
} 