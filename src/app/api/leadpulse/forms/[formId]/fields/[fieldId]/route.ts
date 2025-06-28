/**
 * LeadPulse Individual Form Field Management API
 * 
 * CRUD operations for individual form fields
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
 * GET: Fetch a specific field
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, fieldId } = params;

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

    const field = await withDatabaseFallback(
      () => prisma.leadPulseFormField.findFirst({
        where: {
          id: fieldId,
          formId: formId
        }
      }),
      null,
      { userId: session.user.id, formId, fieldId }
    );

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json(field);

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields/${params.fieldId}`,
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch field' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a field
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, fieldId } = params;
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

    // Verify field exists
    const existingField = await prisma.leadPulseFormField.findFirst({
      where: {
        id: fieldId,
        formId: formId
      }
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Update field
    const updatedField = await prisma.leadPulseFormField.update({
      where: { id: fieldId },
      data: {
        type: body.type ?? existingField.type,
        name: body.name ?? existingField.name,
        label: body.label ?? existingField.label,
        placeholder: body.placeholder ?? existingField.placeholder,
        helpText: body.helpText ?? existingField.helpText,
        isRequired: body.isRequired ?? existingField.isRequired,
        isVisible: body.isVisible ?? existingField.isVisible,
        defaultValue: body.defaultValue ?? existingField.defaultValue,
        validation: body.validation ?? existingField.validation,
        options: body.options ?? existingField.options,
        fileTypes: body.fileTypes ?? existingField.fileTypes,
        maxFileSize: body.maxFileSize ?? existingField.maxFileSize,
        order: body.order ?? existingField.order,
        width: body.width ?? existingField.width,
        cssClasses: body.cssClasses ?? existingField.cssClasses,
        conditionalLogic: body.conditionalLogic ?? existingField.conditionalLogic
      }
    });

    logger.info('Form field updated', { 
      fieldId, 
      formId, 
      userId: session.user.id 
    });

    return NextResponse.json(updatedField);

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields/${params.fieldId}`,
      method: 'PUT'
    });

    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a field
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, fieldId } = params;

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

    // Verify field exists
    const existingField = await prisma.leadPulseFormField.findFirst({
      where: {
        id: fieldId,
        formId: formId
      }
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Delete field
    await prisma.leadPulseFormField.delete({
      where: { id: fieldId }
    });

    // Reorder remaining fields
    const remainingFields = await prisma.leadPulseFormField.findMany({
      where: { formId },
      orderBy: { order: 'asc' }
    });

    // Update order to close gaps
    await prisma.$transaction(
      remainingFields.map((field, index) =>
        prisma.leadPulseFormField.update({
          where: { id: field.id },
          data: { order: index }
        })
      )
    );

    logger.info('Form field deleted', { 
      fieldId, 
      formId, 
      userId: session.user.id 
    });

    return NextResponse.json({ message: 'Field deleted successfully' });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields/${params.fieldId}`,
      method: 'DELETE'
    });

    return NextResponse.json(
      { error: 'Failed to delete field' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Duplicate a field
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { formId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, fieldId } = params;

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

    // Find the field to duplicate
    const originalField = await prisma.leadPulseFormField.findFirst({
      where: {
        id: fieldId,
        formId: formId
      }
    });

    if (!originalField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Create duplicate field with modified name and label
    const duplicatedField = await prisma.leadPulseFormField.create({
      data: {
        formId: originalField.formId,
        type: originalField.type,
        name: `${originalField.name}_copy_${Date.now()}`,
        label: `${originalField.label} (Copy)`,
        placeholder: originalField.placeholder,
        helpText: originalField.helpText,
        isRequired: originalField.isRequired,
        isVisible: originalField.isVisible,
        defaultValue: originalField.defaultValue,
        validation: originalField.validation,
        options: originalField.options,
        fileTypes: originalField.fileTypes,
        maxFileSize: originalField.maxFileSize,
        order: originalField.order + 1,
        width: originalField.width,
        cssClasses: originalField.cssClasses,
        conditionalLogic: originalField.conditionalLogic
      }
    });

    // Reorder fields to make space for the duplicate
    await prisma.$raw`
      UPDATE "LeadPulseFormField" 
      SET "order" = "order" + 1 
      WHERE "formId" = ${formId} 
      AND "order" > ${originalField.order} 
      AND "id" != ${duplicatedField.id}
    `;

    logger.info('Form field duplicated', { 
      originalFieldId: fieldId,
      duplicatedFieldId: duplicatedField.id,
      formId, 
      userId: session.user.id 
    });

    return NextResponse.json(duplicatedField, { status: 201 });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}/fields/${params.fieldId}`,
      method: 'PATCH'
    });

    return NextResponse.json(
      { error: 'Failed to duplicate field' },
      { status: 500 }
    );
  }
}