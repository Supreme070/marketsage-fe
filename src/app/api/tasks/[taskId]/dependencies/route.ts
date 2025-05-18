import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const dependencySchema = z.object({
  parentTaskId: z.string().min(1),
});

// GET /api/tasks/[taskId]/dependencies - Get all dependencies for a task
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
    
    // Get task dependencies
    const dependencies = await prisma.taskDependency.findMany({
      where: { 
        OR: [
          { dependentTaskId: taskId },
          { parentTaskId: taskId }
        ]
      },
      include: {
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        },
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        }
      }
    });
    
    return NextResponse.json({ dependencies });
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 });
  }
}

// POST /api/tasks/[taskId]/dependencies - Add a dependency to a task
export async function POST(
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
    const body = dependencySchema.parse(json);
    
    // Check if tasks exist
    const dependentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    const parentTask = await prisma.task.findUnique({
      where: { id: body.parentTaskId },
    });
    
    if (!dependentTask || !parentTask) {
      return NextResponse.json({ error: 'One or both tasks do not exist' }, { status: 404 });
    }
    
    // Check if dependency already exists
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        parentTaskId: body.parentTaskId,
        dependentTaskId: taskId,
      },
    });
    
    if (existingDependency) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 });
    }
    
    // Check for circular dependencies
    const wouldCreateCircular = await checkCircularDependency(taskId, body.parentTaskId);
    if (wouldCreateCircular) {
      return NextResponse.json({ error: 'Cannot create circular dependency' }, { status: 400 });
    }
    
    // Create dependency
    const dependency = await prisma.taskDependency.create({
      data: {
        parentTaskId: body.parentTaskId,
        dependentTaskId: taskId,
      },
      include: {
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });
    
    return NextResponse.json({ dependency }, { status: 201 });
  } catch (error) {
    console.error('Error creating task dependency:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 });
  }
}

// DELETE /api/tasks/[taskId]/dependencies/[dependencyId] - Remove a dependency
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; dependencyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { taskId, dependencyId } = params;
    
    // Check if dependency exists
    const dependency = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
    });
    
    if (!dependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }
    
    // Check if dependency is related to the task
    if (dependency.dependentTaskId !== taskId && dependency.parentTaskId !== taskId) {
      return NextResponse.json({ error: 'Dependency not related to this task' }, { status: 403 });
    }
    
    // Delete dependency
    await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task dependency:', error);
    return NextResponse.json({ error: 'Failed to delete dependency' }, { status: 500 });
  }
}

// Helper function to check for circular dependencies
async function checkCircularDependency(
  dependentTaskId: string,
  parentTaskId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  // If we've already visited this task, we have a cycle
  if (visited.has(parentTaskId)) {
    return true;
  }
  
  // If parent and dependent are the same, we have a direct cycle
  if (dependentTaskId === parentTaskId) {
    return true;
  }
  
  // Add current parent to visited set
  visited.add(parentTaskId);
  
  // Find all tasks that the parent depends on
  const dependencies = await prisma.taskDependency.findMany({
    where: { dependentTaskId: parentTaskId },
    select: { parentTaskId: true }
  });
  
  // Recursively check each dependency
  for (const dep of dependencies) {
    const isCircular = await checkCircularDependency(
      dependentTaskId,
      dep.parentTaskId,
      new Set(visited)
    );
    
    if (isCircular) {
      return true;
    }
  }
  
  return false;
} 