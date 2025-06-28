/**
 * LeadPulse Form Fields Management API
 * 
 * CRUD operations for form fields
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { leadPulseErrorHandler, withDatabaseFallback } from '@/lib/leadpulse/error-handler';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET: Fetch all fields for a form
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = params;

    // Verify form ownership
    const form = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        createdBy: session.user.id
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const fields = await withDatabaseFallback(
      () => prisma.leadPulseFormField.findMany({
        where: { formId },
        orderBy: { order: 'asc' }
      }),
      [],
      { userId: session.user.id, formId }
    );

    return NextResponse.json({ fields });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields`,
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = params;
    const body = await request.json();

    // Verify form ownership
    const form = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        createdBy: session.user.id
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.type || !body.name || !body.label) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, and label' },
        { status: 400 }
      );
    }

    // Get the next order value
    const lastField = await prisma.leadPulseFormField.findFirst({
      where: { formId },
      orderBy: { order: 'desc' }
    });

    const nextOrder = lastField ? lastField.order + 1 : 0;

    // Create field
    const field = await prisma.leadPulseFormField.create({
      data: {
        formId,
        type: body.type,
        name: body.name,
        label: body.label,
        placeholder: body.placeholder,
        helpText: body.helpText,
        isRequired: body.isRequired || false,
        isVisible: body.isVisible ?? true,
        defaultValue: body.defaultValue,
        validation: body.validation || {},
        options: body.options || [],
        fileTypes: body.fileTypes || [],
        maxFileSize: body.maxFileSize,
        order: body.order ?? nextOrder,
        width: body.width || 'FULL',
        cssClasses: body.cssClasses,
        conditionalLogic: body.conditionalLogic || {}
      }
    });

    logger.info('Form field created', { 
      fieldId: field.id, 
      formId, 
      userId: session.user.id 
    });

    return NextResponse.json(field, { status: 201 });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields`,
      method: 'POST'
    });

    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Bulk update field order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = params;
    const body = await request.json();

    // Verify form ownership
    const form = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        createdBy: session.user.id
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Validate request body
    if (!body.fields || !Array.isArray(body.fields)) {
      return NextResponse.json(
        { error: 'Invalid request: fields array required' },
        { status: 400 }
      );
    }

    // Update field orders
    await prisma.$transaction(
      body.fields.map((field: { id: string; order: number }) =>
        prisma.leadPulseFormField.update({
          where: { id: field.id },
          data: { order: field.order }
        })
      )
    );

    logger.info('Form field order updated', { 
      formId, 
      fieldCount: body.fields.length,
      userId: session.user.id 
    });

    // Return updated fields
    const updatedFields = await prisma.leadPulseFormField.findMany({
      where: { formId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ fields: updatedFields });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields`,
      method: 'PUT'
    });

    return NextResponse.json(
      { error: 'Failed to update field order' },
      { status: 500 }
    );
  }
}