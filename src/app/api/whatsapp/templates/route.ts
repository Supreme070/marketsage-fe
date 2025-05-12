import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, WATemplateStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Schema for WhatsApp template validation
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Template content is required"),
  variables: z.string(), // JSON string of variables
  category: z.string().optional(),
  status: z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED"
  ]).optional(),
});

// GET WhatsApp templates endpoint
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
    
    // Build where clause for filtering
    let whereClause: any = {};
    
    // If not admin, only show own templates
    if (!isAdmin) {
      whereClause.createdById = session.user.id;
    }
    
    // Filter by status if provided
    if (statusParam) {
      whereClause.status = statusParam.toUpperCase();
    }
    
    // Search functionality
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    
    const templates = await prisma.whatsAppTemplate.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Transform the response to maintain backward compatibility
    const formattedTemplates = templates.map(template => ({
      ...template,
      createdBy: template.User,
    }));

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp templates" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new WhatsApp template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = templateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid template data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const templateData = validation.data;
    const now = new Date();
    
    // Validate variables is a valid JSON array
    try {
      const variables = JSON.parse(templateData.variables);
      if (!Array.isArray(variables)) {
        throw new Error("Variables must be an array");
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Variables must be a valid JSON array" },
        { status: 400 }
      );
    }
    
    // Create the template
    const newTemplate = await prisma.whatsAppTemplate.create({
      data: {
        id: randomUUID(),
        name: templateData.name,
        content: templateData.content,
        variables: templateData.variables,
        category: templateData.category,
        status: templateData.status || WATemplateStatus.PENDING, // Default to pending
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating WhatsApp template:", error);
    return NextResponse.json(
      { error: "Failed to create WhatsApp template" },
      { status: 500 }
    );
  }
} 