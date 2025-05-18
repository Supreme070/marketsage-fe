import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { taskUpdateSchema } from '@/lib/validations/task';
import { z } from 'zod';

// GET /api/tasks/[taskId] - Get a specific task
export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { taskId } = params;
    
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        region: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        dependsOn: {
          include: {
            parentTask: true,
          },
        },
        dependents: {
          include: {
            dependentTask: true,
          },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PATCH /api/tasks/[taskId] - Update a specific task
export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { taskId } = params;
    const json = await req.json();
    
    // Validate request body
    const body = taskUpdateSchema.parse(json);
    
    // Get the existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: true,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Check if task is being completed
    const isCompleting = body.status === 'COMPLETED' && existingTask.status !== 'COMPLETED';
    
    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assigneeId: body.assigneeId,
        contactId: body.contactId,
        segmentId: body.segmentId,
        campaignId: body.campaignId,
        regionId: body.regionId,
        // Set completedAt date if task is being marked as completed
        completedAt: isCompleting ? new Date() : existingTask.completedAt,
        // Update tags if provided
        tags: body.tags ? {
          // Delete existing tags
          deleteMany: {},
          // Create new connections
          create: body.tags.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[taskId] - Delete a specific task
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { taskId } = params;
    
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Delete task (dependencies will cascade delete due to schema setup)
    await prisma.task.delete({
      where: { id: taskId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 