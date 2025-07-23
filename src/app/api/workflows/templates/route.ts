import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowTemplateMarketplace } from '@/lib/workflow/template-marketplace';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for template creation
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
  complexity: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  definition: z.object({}).passthrough(),
  tags: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  useCase: z.string().min(1, 'Use case is required'),
  features: z.array(z.string()).optional(),
  requirements: z.object({}).passthrough().optional(),
  variables: z.object({}).passthrough().optional(),
  triggerTypes: z.array(z.string()).optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().url().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().min(0).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters = {
      category: searchParams.get('category') || undefined,
      complexity: searchParams.get('complexity') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      industry: searchParams.get('industry')?.split(',') || undefined,
      search: searchParams.get('search') || undefined,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      isPremium: searchParams.get('premium') === 'true' ? true : undefined,
      minRating: searchParams.get('minRating') ? Number.parseFloat(searchParams.get('minRating')!) : undefined,
      limit: Number.parseInt(searchParams.get('limit') || '20'),
      offset: Number.parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'popular'
    };

    // Get templates
    const templates = await workflowTemplateMarketplace.getTemplates(filters);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: templates.length
      }
    });

  } catch (error) {
    logger.error('Error getting workflow templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only ADMIN or OWNER can create templates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create template
    const template = await workflowTemplateMarketplace.createTemplate({
      ...validatedData,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Workflow template created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating workflow template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create workflow template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}