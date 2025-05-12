import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Schema for SMS template validation
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Content is required"),
  variables: z.string().optional(), // JSON string for variables array
  category: z.string().optional(),
});

// GET SMS templates endpoint
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
    const category = url.searchParams.get("category");
    const searchQuery = url.searchParams.get("search");
    
    const templates = await prisma.sMSTemplate.findMany({
      where: {
        ...(isAdmin ? {} : { createdById: session.user.id }),
        ...(category ? { category } : {}),
        ...(searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching SMS templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS templates" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new SMS template
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
    
    // If variables is not provided, initialize it as an empty array
    if (!templateData.variables) {
      templateData.variables = JSON.stringify([]);
    } else {
      // Validate that variables is a valid JSON array
      try {
        const parsedVariables = JSON.parse(templateData.variables);
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
    
    // Create the SMS template
    const now = new Date();
    const newTemplate = await prisma.sMSTemplate.create({
      data: {
        id: randomUUID(),
        name: templateData.name,
        content: templateData.content,
        variables: templateData.variables,
        category: templateData.category,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating SMS template:", error);
    return NextResponse.json(
      { error: "Failed to create SMS template" },
      { status: 500 }
    );
  }
} 