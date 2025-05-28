import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().default("TODO"),
  priority: z.string().default("MEDIUM"),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  segmentId: z.string().optional(),
  campaignId: z.string().optional(),
  regionId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  segmentId: z.string().optional(),
  campaignId: z.string().optional(),
  regionId: z.string().optional(),
});

// Mock data for when database is not available
const MOCK_TASKS = [
  {
    id: "1",
    title: "Set up database connection",
    description: "Configure PostgreSQL for local development",
    status: "TODO",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creatorId: "mock-user",
    creator: {
      id: "mock-user",
      name: "Demo User",
      email: "demo@example.com",
      image: null,
    },
    assignee: null,
    campaign: null,
    _count: {
      comments: 0,
    },
  },
  {
    id: "2",
    title: "Review task management features",
    description: "Test the new Kanban board functionality",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creatorId: "mock-user",
    creator: {
      id: "mock-user",
      name: "Demo User",
      email: "demo@example.com",
      image: null,
    },
    assignee: null,
    campaign: null,
    _count: {
      comments: 2,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Return mock data for unauthenticated users in development
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(MOCK_TASKS);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const priority = searchParams.get("priority");

    const where: any = {};
    
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    try {
      const tasks = await prisma.task.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(tasks);
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Return mock data if database is not available in development
      if (process.env.NODE_ENV === "development") {
        console.log("Database not available, returning mock data");
        return NextResponse.json(MOCK_TASKS);
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    try {
      const task = await prisma.task.create({
        data: {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          creatorId: session.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return NextResponse.json(task, { status: 201 });
    } catch (dbError) {
      console.error("Database error:", dbError);
      if (process.env.NODE_ENV === "development") {
        // Return a mock created task in development
        const mockTask = {
          ...validatedData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          creatorId: session.user.id,
          creator: {
            id: session.user.id,
            name: session.user.name || "User",
            email: session.user.email || "user@example.com",
            image: session.user.image || null,
          },
          assignee: null,
          campaign: null,
          _count: {
            comments: 0,
          },
        };
        return NextResponse.json(mockTask, { status: 201 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
} 