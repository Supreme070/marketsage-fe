import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { taskSchema } from '@/lib/validations/task';
import { z } from 'zod';

// GET /api/tasks - Get all tasks with filtering options
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    
    // Parse filters from query params
    const assigneeId = searchParams.get('assigneeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const contactId = searchParams.get('contactId');
    const segmentId = searchParams.get('segmentId');
    const campaignId = searchParams.get('campaignId');
    const regionId = searchParams.get('regionId');
    
    // Build filter object
    const where: any = {};
    
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (contactId) where.contactId = contactId;
    if (segmentId) where.segmentId = segmentId;
    if (campaignId) where.campaignId = campaignId;
    if (regionId) where.regionId = regionId;
    
    // Get tasks with filters
    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        contact: true,
        segment: true,
        campaign: true,
        dependencies: true,
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const json = await req.json();
    const body = taskSchema.parse(json);
    
    // Create task
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate,
        assigneeId: body.assigneeId,
        creatorId: session.user.id,
        contactId: body.contactId,
        segmentId: body.segmentId,
        campaignId: body.campaignId,
        regionId: body.regionId,
      },
    });
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Bulk update tasks (Used for Kanban board)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const json = await req.json();
    
    // Validate request body has the required format
    if (!json.tasks || !Array.isArray(json.tasks)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    try {
      // Process each task update
      const updates = json.tasks.map((task: any) => 
        prisma.task.update({
          where: { id: task.id },
          data: {
            status: task.status,
            // Can add other bulk-updatable fields here
          }
        })
      );
      
      await prisma.$transaction(updates);
      
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Prisma update error:', err);
      return NextResponse.json({ error: 'Database update failed', details: err }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating tasks:', error);
    return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
  }
} 