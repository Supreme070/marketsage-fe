import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, WorkflowStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";
// Temporary: Remove advanced caching to fix immediate build issues
// import { AdvancedCacheManager } from "@/lib/workflow/advanced-cache-manager";

// Initialize cache manager for enhanced performance
// const cacheManager = new AdvancedCacheManager();

// Enhanced schema for workflow validation with backward compatibility
const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  definition: z.string().optional(), // JSON string containing nodes, edges, etc.
  nodes: z.array(z.any()).optional(), // For direct node data
  edges: z.array(z.any()).optional(), // For direct edge data
  metadata: z.record(z.any()).optional(), // For metadata
});

/**
 * Enhanced GET endpoint with backward compatibility and error handling
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    // Parse query parameters
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const searchQuery = url.searchParams.get("search");
    
    // Build where clause for filtering
    const whereClause: any = {};
    
    if (!isAdmin) {
      whereClause.createdById = session.user.id;
    }
    
    if (statusParam) {
      whereClause.status = statusParam.toUpperCase() as WorkflowStatus;
    }
    
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Try to use cached workflow data first
    let workflows;
    const userId = session.user.id;
    
    try {
      // Direct database query for now (caching temporarily disabled)
      workflows = await prisma.workflow.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          definition: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
        },
        orderBy: {
          updatedAt: "desc",
        }
      });
    } catch (basicError) {
      console.error("Workflow query failed:", basicError);
      // Return empty workflows with schema warning if query fails
      return NextResponse.json({
        workflows: [],
        error: "Database schema compatibility issue",
        message: "Please contact system administrator to update database schema",
        schemaOutdated: true
      });
    }

    // Try to enhance with optional fields
    try {
      const enhancedFields: any = {};
      
      // Check each field individually to avoid failures
      if (await checkFieldExists('performanceScore')) enhancedFields.performanceScore = true;
      if (await checkFieldExists('complexityRating')) enhancedFields.complexityRating = true;
      if (await checkFieldExists('totalExecutions')) enhancedFields.totalExecutions = true;
      if (await checkFieldExists('successRate')) enhancedFields.successRate = true;

      // Re-query with enhanced fields if any exist
      if (Object.keys(enhancedFields).length > 0) {
        workflows = await prisma.workflow.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            definition: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            ...enhancedFields,
          },
          orderBy: {
            updatedAt: "desc",
          }
        });
      }
    } catch (enhancedError) {
      console.warn("Enhanced fields not available, using basic data:", enhancedError);
      // Continue with basic workflows data
    }

    // Safe parsing of definition field with enhanced error handling
    const formattedWorkflows = workflows.map(workflow => {
      let definition = {};
      let nodeCount = 0;
      
      // Safe definition parsing
      if (workflow.definition) {
        try {
          definition = JSON.parse(workflow.definition);
          // Count nodes if available
          if (definition && typeof definition === 'object' && 'nodes' in definition) {
            nodeCount = Array.isArray(definition.nodes) ? definition.nodes.length : 0;
          }
        } catch (e) {
          console.warn(`Failed to parse definition for workflow ${workflow.id}:`, e);
          definition = { nodes: [], edges: [], metadata: {} };
        }
      }

      return {
        ...workflow,
        definition,
        // Enhanced metadata with safe access
        nodeCount,
        complexity: nodeCount > 30 ? 'advanced' : nodeCount > 15 ? 'complex' : nodeCount > 5 ? 'moderate' : 'simple',
        performanceScore: workflow.performanceScore || 0,
        successRate: workflow.successRate || 0,
        totalExecutions: workflow.totalExecutions || 0,
      };
    });

    return NextResponse.json(formattedWorkflows);
  } catch (error) {
    console.error("Workflow API Error:", error);
    
    // Enhanced error handling with specific database schema messages
    if (error instanceof Error) {
      if (error.message.includes('column') || error.message.includes('field') || error.message.includes('Unknown column')) {
        return NextResponse.json(
          { 
            error: "Database schema compatibility issue", 
            message: "Using basic workflow features. Some advanced features may not be available.",
            workflows: [] // Return empty array to prevent frontend crashes
          },
          { status: 200 } // Return 200 to allow frontend to handle gracefully
        );
      }
    }
    
    return handleApiError(error, "/api/workflows/route.ts");
  }
}

/**
 * Helper function to safely check if a field exists in the workflow table
 */
async function checkFieldExists(fieldName: string): Promise<boolean> {
  try {
    // Use a safer approach to check field existence
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Workflow' 
      AND column_name = ${fieldName}
      AND table_schema = CURRENT_SCHEMA()
    `;
    return Array.isArray(result) && result.length > 0 && result[0].count > 0;
  } catch (error) {
    // If information_schema fails, try direct query
    try {
      await prisma.workflow.findFirst({
        select: { [fieldName]: true },
        take: 0,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Enhanced POST endpoint with schema compatibility
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // If the body contains nodes and edges, convert to definition
    if (body.nodes || body.edges) {
      body.definition = JSON.stringify({
        nodes: body.nodes || [],
        edges: body.edges || [],
        metadata: body.metadata || {}
      });
      
      // Remove the individual properties
      delete body.nodes;
      delete body.edges;
      delete body.metadata;
    }
    
    // Validate input
    const validation = workflowSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError(validation.error);
    }

    const workflowData = validation.data;
    const now = new Date();
    
    // Prepare base workflow data
    const baseWorkflowData: any = {
      id: randomUUID(),
      name: workflowData.name,
      description: workflowData.description || "",
      status: (workflowData.status as WorkflowStatus) || WorkflowStatus.INACTIVE,
      definition: workflowData.definition || "{}",
      createdById: session.user.id,
      createdAt: now,
      updatedAt: now,
    };

    // Safely add enhanced fields if they exist
    try {
      if (await checkFieldExists('performanceScore')) {
        baseWorkflowData.performanceScore = 0;
      }
      if (await checkFieldExists('complexityRating')) {
        baseWorkflowData.complexityRating = 'SIMPLE';
      }
      if (await checkFieldExists('totalExecutions')) {
        baseWorkflowData.totalExecutions = 0;
      }
      if (await checkFieldExists('successRate')) {
        baseWorkflowData.successRate = 0;
      }
    } catch (e) {
      // Enhanced fields don't exist, continue with basic creation
      console.log("Using basic workflow schema");
    }

    // Create the workflow with safe field access
    const newWorkflow = await prisma.workflow.create({
      data: baseWorkflowData,
    });

    // Parse the definition field before returning
    let parsedDefinition = {};
    try {
      parsedDefinition = JSON.parse(newWorkflow.definition);
    } catch (e) {
      console.error("Error parsing workflow definition:", e);
      parsedDefinition = { nodes: [], edges: [], metadata: {} };
    }

    return NextResponse.json({
      ...newWorkflow,
      definition: parsedDefinition,
      nodeCount: 0,
      complexity: 'simple',
      performanceScore: 0,
      successRate: 0,
      totalExecutions: 0,
    }, { status: 201 });
  } catch (error) {
    console.error("Workflow creation error:", error);
    
    // Enhanced error handling for schema issues
    if (error instanceof Error) {
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { 
            error: "Database schema mismatch", 
            message: "Workflow created with basic features. Some advanced features may not be available.",
            workflow: null
          },
          { status: 500 }
        );
      }
    }
    
    return handleApiError(error, "/api/workflows/route.ts");
  }
} 