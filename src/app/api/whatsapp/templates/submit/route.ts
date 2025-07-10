/**
 * WhatsApp Template Submission API Endpoint
 * 
 * Handles template submission to Meta for approval.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappTemplateApproval } from '@/lib/whatsapp-template-approval';
import { 
  handleApiError, 
  unauthorized, 
  notFound,
  validationError 
} from '@/lib/errors';

// POST - Submit template for Meta approval
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return validationError('templateId is required');
    }

    const result = await whatsappTemplateApproval.submitTemplateForApproval(
      templateId, 
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template submitted for approval successfully',
      metaTemplateId: result.metaTemplateId,
      status: 'PENDING'
    });

  } catch (error) {
    console.error('Error submitting template for approval:', error);
    return handleApiError(error, '/api/whatsapp/templates/submit/route.ts');
  }
}