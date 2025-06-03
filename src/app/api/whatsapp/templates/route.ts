import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, WATemplateStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
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
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

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
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Different filters based on user role
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const statusParam = url.searchParams.get("status");
      const searchQuery = url.searchParams.get("search");
      
      // Build where clause for filtering
      const whereClause: any = {};
      
      // If not admin, only show own templates
      if (!isAdmin) {
        whereClause.createdById = session.user.id;
      }
      
      // Filter by status if provided
      if (statusParam) {
        try {
          whereClause.status = statusParam.toUpperCase();
        } catch (error) {
          console.warn("Invalid status parameter:", statusParam);
          // Continue without status filter if invalid
        }
      }
      
      // Search functionality
      if (searchQuery) {
        whereClause.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { content: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      // Wrap database query in try/catch to handle specific errors
      try {
        // Get templates without any includes first
        const templates = await prisma.whatsAppTemplate.findMany({
          where: whereClause,
          orderBy: {
            updatedAt: "desc",
          },
        });

        // Get the creator information in a separate query if needed
        const creatorIds = [...new Set(templates.map(t => t.createdById))];
        const creators = await prisma.user.findMany({
          where: {
            id: {
              in: creatorIds
            }
          },
          select: {
            id: true,
            name: true,
          }
        });

        // Map creators to templates
        const formattedTemplates = templates.map(template => {
          const creator = creators.find(c => c.id === template.createdById);
          return {
            ...template,
            createdBy: creator || null,
          };
        });

        return NextResponse.json(formattedTemplates);
      } catch (dbError: any) {
        console.error("Database error fetching WhatsApp templates:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message || 'Unknown database error'}` },
          { status: 500 }
        );
      }
    } catch (parseError) {
      console.error("Error parsing request parameters:", parseError);
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/templates/route.ts");
  }
}

// POST endpoint to create a new WhatsApp template
export async function POST(request: NextRequest) {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
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
      try {
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

        // Get creator info for consistent response format
        const creator = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
          }
        });

        const formattedTemplate = {
          ...newTemplate,
          createdBy: creator
        };

        return NextResponse.json(formattedTemplate, { status: 201 });
      } catch (dbError: any) {
        console.error("Database error creating WhatsApp template:", dbError);
        return NextResponse.json(
          { error: `Failed to create template: ${dbError.message}` },
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
  } catch (error) {
    return handleApiError(error, "/api/whatsapp/templates/route.ts");
  }
} 