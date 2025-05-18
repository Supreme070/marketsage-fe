import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedTime: z.number().int().optional(),
});

// GET /api/tasks/templates - Get all task templates
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const templates = await prisma.taskTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching task templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/tasks/templates - Create a new task template
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const json = await req.json();
    
    // Validate request body
    const body = templateSchema.parse(json);
    
    // Create template
    const template = await prisma.taskTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        priority: body.priority,
        estimatedTime: body.estimatedTime,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating task template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
} 