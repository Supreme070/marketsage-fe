import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  campaign: z.string().optional(),
  revenue: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const task = await (prisma as any).task.findUnique({
        where: { id: params.id },
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
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      return NextResponse.json(task);
    } catch (dbError) {
      console.error("Database error:", dbError);
      if (process.env.NODE_ENV === "development") {
        // Return a mock task in development
        return NextResponse.json({
          id: params.id,
          title: "Mock Task",
          description: "This is a mock task shown when database is not available",
          status: "TODO",
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
          comments: [],
          _count: {
            comments: 0,
          },
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    try {
      // Check if task exists
      const existingTask = await (prisma as any).task.findUnique({
        where: { id: params.id },
      });

      if (!existingTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const task = await (prisma as any).task.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
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

      return NextResponse.json(task);
    } catch (dbError) {
      console.error("Database error during update:", dbError);
      if (process.env.NODE_ENV === "development") {
        // Return a mock updated task in development
        return NextResponse.json({
          id: params.id,
          ...validatedData,
          title: validatedData.title || "Updated Mock Task",
          description: validatedData.description || "Updated mock task description",
          status: validatedData.status || "TODO",
          priority: validatedData.priority || "MEDIUM",
          campaign: validatedData.campaign || null,
          revenue: validatedData.revenue || null,
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
          _count: {
            comments: 0,
          },
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Check if task exists
      const existingTask = await (prisma as any).task.findUnique({
        where: { id: params.id },
      });

      if (!existingTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      await (prisma as any).task.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ message: "Task deleted successfully" });
    } catch (dbError) {
      console.error("Database error during delete:", dbError);
      if (process.env.NODE_ENV === "development") {
        // Return success response in development (mock delete)
        return NextResponse.json({ message: "Task deleted successfully (mock)" });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
} 