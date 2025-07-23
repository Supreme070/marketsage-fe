import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowTemplateMarketplace } from '@/lib/workflow/template-marketplace';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for template installation
const installTemplateSchema = z.object({
  workflowName: z.string().optional(),
  customizations: z.object({
    variables: z.record(z.any()).optional(),
    nodes: z.record(z.any()).optional()
  }).optional(),
  installationType: z.enum(['clone', 'reference', 'custom']).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const body = await request.json();
    const validatedData = installTemplateSchema.parse(body);

    // Install template
    const result = await workflowTemplateMarketplace.installTemplate({
      templateId,
      userId: session.user.id,
      workflowName: validatedData.workflowName,
      customizations: validatedData.customizations,
      installationType: validatedData.installationType || 'clone'
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Template installed successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error installing workflow template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(
      { 
        error: 'Failed to install workflow template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}