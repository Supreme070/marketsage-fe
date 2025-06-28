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
 * Enhanced GET endpoint with backward compatibility
 * Handles both old JSON definition format and new normalized structure
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
    const includeNodes = url.searchParams.get("includeNodes") === "true";
    
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

    // Enhanced query with optional normalized data
    const workflows = await prisma.workflow.findMany({
      where: whereClause,
      include: includeNodes ? {
        nodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        connections: {
          where: { isActive: true },
        },
        triggers: {
          where: { isActive: true },
        },
        _count: {
          select: {
            executions: { where: { status: 'RUNNING' } },
            nodes: { where: { isActive: true } },
          },
        },
      } : {
        _count: {
          select: {
            executions: { where: { status: 'RUNNING' } },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      }
    });

    // Format workflows with backward compatibility
    const formattedWorkflows = workflows.map(workflow => {
      let definition = {};
      let nodeCount = 0;
      let activeExecutions = 0;

      // Handle backward compatibility for definition field
      if (workflow.definition) {
        try {
          definition = JSON.parse(workflow.definition);
        } catch (e) {
          console.warn(`Failed to parse definition for workflow ${workflow.id}:`, e);
          definition = { nodes: [], edges: [], metadata: {} };
        }
      }

      // If we have normalized data, use it to build definition
      if (includeNodes && 'nodes' in workflow && workflow.nodes) {
        definition = {
          nodes: workflow.nodes.map(node => ({
            id: node.id,
            type: node.type,
            data: {
              label: node.label,
              description: node.description,
              properties: node.config || {},
            },
            position: { x: node.positionX, y: node.positionY },
          })),
          edges: workflow.connections?.map(conn => ({
            id: conn.id,
            source: conn.sourceNodeId,
            target: conn.targetNodeId,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
            label: conn.label,
            data: {
              conditionType: conn.conditionType,
              conditionValue: conn.conditionValue,
            },
          })) || [],
          metadata: {
            triggers: workflow.triggers || [],
            lastModified: workflow.updatedAt,
          },
        };
        
        nodeCount = workflow.nodes.length;
        activeExecutions = workflow._count?.executions || 0;
      } else if (definition && typeof definition === 'object' && 'nodes' in definition) {
        // Use existing definition data
        nodeCount = Array.isArray(definition.nodes) ? definition.nodes.length : 0;
        activeExecutions = workflow._count?.executions || 0;
      }

      // Return enhanced workflow data
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        createdById: workflow.createdById,
        definition,
        // Enhanced metadata
        nodeCount,
        activeExecutions,
        complexity: nodeCount > 30 ? 'advanced' : nodeCount > 15 ? 'complex' : nodeCount > 5 ? 'moderate' : 'simple',
        performanceScore: workflow.performanceScore || 0,
        successRate: workflow.successRate || 0,
        totalExecutions: workflow.totalExecutions || 0,
      };
    });

    return NextResponse.json(formattedWorkflows);
  } catch (error) {
    console.error("Workflow API Error:", error);
    
    // Enhanced error handling with more specific messages
    if (error instanceof Error) {
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { 
            error: "Database schema is outdated", 
            message: "Please run database migrations or contact system administrator",
            details: error.message 
          },
          { status: 500 }
        );
      }
    }
    
    return handleApiError(error, "/api/workflows/route.ts");
  }
}

/**
 * Enhanced POST endpoint with normalized structure support
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // Validate input with enhanced schema
    const validation = workflowSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError(validation.error);
    }

    const workflowData = validation.data;
    const now = new Date();
    
    // Prepare definition data
    let definitionString = "{}";
    if (workflowData.definition) {
      definitionString = workflowData.definition;
    } else if (workflowData.nodes || workflowData.edges) {
      definitionString = JSON.stringify({
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        metadata: workflowData.metadata || {}
      });
    }

    // Create workflow with enhanced data
    const newWorkflowData: any = {
      id: randomUUID(),
      name: workflowData.name,
      description: workflowData.description || "",
      status: (workflowData.status as WorkflowStatus) || WorkflowStatus.INACTIVE,
      definition: definitionString,
      createdById: session.user.id,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional enhanced fields if they exist in schema
    try {
      // Check if enhanced fields exist by attempting a describe
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Workflow' 
        AND column_name IN ('performanceScore', 'complexityRating', 'totalExecutions')
      `;
      
      if (Array.isArray(tableInfo) && tableInfo.length > 0) {
        newWorkflowData.performanceScore = 0;
        newWorkflowData.complexityRating = 'SIMPLE';
        newWorkflowData.totalExecutions = 0;
        newWorkflowData.successRate = 0;
      }
    } catch (e) {
      // Enhanced fields don't exist, continue with basic creation
      console.log("Using basic workflow schema (enhanced fields not available)");
    }

    const newWorkflow = await prisma.workflow.create({
      data: newWorkflowData,
    });

    // Parse definition for response
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
      activeExecutions: 0,
      complexity: 'simple',
    }, { status: 201 });
  } catch (error) {
    console.error("Workflow creation error:", error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { 
            error: "Database schema mismatch", 
            message: "Some workflow features may not be available. Please check database schema.",
            details: error.message 
          },
          { status: 500 }
        );
      }
    }
    
    return handleApiError(error, "/api/workflows/route.ts");
  }
}