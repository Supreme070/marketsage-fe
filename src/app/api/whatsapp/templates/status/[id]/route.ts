/**
 * WhatsApp Template Status API Endpoint
 * 
 * Gets template approval status from Meta.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappTemplateApproval } from '@/lib/whatsapp-template-approval';
import { 
  handleApiError, 
  unauthorized, 
  notFound 
} from '@/lib/errors';

// GET - Get template approval status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: templateId } = await params;

  try {
    const status = await whatsappTemplateApproval.getTemplateApprovalStatus(templateId);

    if (!status) {
      return notFound('Template not found or not submitted for approval');
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting template status:', error);
    return handleApiError(error, '/api/whatsapp/templates/status/[id]/route.ts');
  }
}