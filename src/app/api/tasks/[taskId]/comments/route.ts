import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

// GET /api/tasks/[taskId]/comments - Get all comments for a task
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
    
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Get comments
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
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
    });
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/tasks/[taskId]/comments - Add a comment to a task
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
    const body = commentSchema.parse(json);
    
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Create comment
    const comment = await prisma.taskComment.create({
      data: {
        content: body.content,
        taskId,
        userId: session.user.id,
      },
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
    });
    
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating task comment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
} 