import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Schema for email template validation
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required"),
  content: z.string().min(1, "Content is required"),
  design: z.string().optional(), // JSON string
  previewText: z.string().optional(),
  category: z.string().optional(),
});

// GET email templates endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    // Filter by category if provided in query
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const searchQuery = url.searchParams.get("search");
    
    const templates = await prisma.emailTemplate.findMany({
      where: {
        ...(isAdmin ? {} : { createdById: session.user.id }),
        ...(category ? { category } : {}),
        ...(searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new email template
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
    
    // If design is provided, validate that it's a valid JSON string
    if (templateData.design) {
      try {
        JSON.parse(templateData.design);
      } catch (e) {
        return NextResponse.json(
          { error: "Design must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // Create the email template
    const newTemplate = await prisma.emailTemplate.create({
      data: {
        id: randomUUID(),
        name: templateData.name,
        description: templateData.description,
        subject: templateData.subject,
        content: templateData.content,
        design: templateData.design,
        previewText: templateData.previewText,
        category: templateData.category,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
} 