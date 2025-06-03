import { type NextRequest, NextResponse } from "next/server";
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    const template = await prisma.emailTemplate.findUnique({
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
    return handleApiError(error, "/api/email/templates/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.emailTemplate.findUnique({
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
    return handleApiError(error, "/api/email/templates/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    // First check if template exists and user has access
    const existingTemplate = await prisma.emailTemplate.findUnique({
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
    return handleApiError(error, "/api/email/templates/[id]/route.ts");
  }
} 