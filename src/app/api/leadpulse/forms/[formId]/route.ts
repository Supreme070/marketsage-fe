/**
 * LeadPulse Individual Form Management API
 * 
 * CRUD operations for individual forms
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
 * GET: Fetch a specific form with its fields
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

    const form = await withDatabaseFallback(
      () => prisma.leadPulseForm.findFirst({
        where: {
          id: formId,
          createdBy: session.user.id
        },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          analytics: {
            select: {
              date: true,
              views: true,
              submissions: true,
              conversionRate: true,
              averageTime: true,
              abandonmentRate: true
            },
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          },
          _count: {
            select: {
              submissions: true,
              fields: true
            }
          }
        }
      }),
      null,
      { userId: session.user.id, formId }
    );

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Calculate summary stats
    const totalViews = form.analytics.reduce((sum, day) => sum + day.views, 0);
    const totalSubmissions = form.analytics.reduce((sum, day) => sum + day.submissions, 0);
    const avgConversionRate = form.analytics.length > 0 
      ? form.analytics.reduce((sum, day) => sum + day.conversionRate, 0) / form.analytics.length
      : 0;

    const formWithStats = {
      ...form,
      stats: {
        totalViews,
        totalSubmissions,
        conversionRate: Math.round(avgConversionRate * 100) / 100,
        fieldCount: form._count.fields,
        submissionCount: form._count.submissions
      }
    };

    return NextResponse.json(formWithStats);

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}`,
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a form
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
    const existingForm = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        createdBy: session.user.id
      }
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Update form
    const updatedForm = await prisma.leadPulseForm.update({
      where: { id: formId },
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        status: body.status,
        layout: body.layout,
        theme: body.theme,
        settings: body.settings,
        submitButtonText: body.submitButtonText,
        successMessage: body.successMessage,
        errorMessage: body.errorMessage,
        redirectUrl: body.redirectUrl,
        isTrackingEnabled: body.isTrackingEnabled,
        conversionGoal: body.conversionGoal,
        isPublished: body.status === 'PUBLISHED',
        publishedAt: body.status === 'PUBLISHED' && !existingForm.publishedAt ? new Date() : existingForm.publishedAt
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Update fields if provided
    if (body.fields && Array.isArray(body.fields)) {
      // Delete existing fields that are not in the new list
      const newFieldIds = body.fields.filter((f: any) => f.id).map((f: any) => f.id);
      await prisma.leadPulseFormField.deleteMany({
        where: {
          formId: formId,
          id: { notIn: newFieldIds }
        }
      });

      // Update or create fields
      for (const [index, field] of body.fields.entries()) {
        if (field.id) {
          // Update existing field
          await prisma.leadPulseFormField.update({
            where: { id: field.id },
            data: {
              type: field.type,
              name: field.name,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              isRequired: field.isRequired || false,
              isVisible: field.isVisible ?? true,
              defaultValue: field.defaultValue,
              validation: field.validation,
              options: field.options,
              fileTypes: field.fileTypes,
              maxFileSize: field.maxFileSize,
              order: field.order ?? index,
              width: field.width || 'FULL',
              cssClasses: field.cssClasses,
              conditionalLogic: field.conditionalLogic
            }
          });
        } else {
          // Create new field
          await prisma.leadPulseFormField.create({
            data: {
              formId: formId,
              type: field.type,
              name: field.name,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              isRequired: field.isRequired || false,
              isVisible: field.isVisible ?? true,
              defaultValue: field.defaultValue,
              validation: field.validation,
              options: field.options,
              fileTypes: field.fileTypes,
              maxFileSize: field.maxFileSize,
              order: field.order ?? index,
              width: field.width || 'FULL',
              cssClasses: field.cssClasses,
              conditionalLogic: field.conditionalLogic
            }
          });
        }
      }
    }

    logger.info('Form updated', { formId, userId: session.user.id });

    // Return updated form with fields
    const finalForm = await prisma.leadPulseForm.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(finalForm);

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}`,
      method: 'PUT'
    });

    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a form
 */
export async function DELETE(
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
    const existingForm = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        createdBy: session.user.id
      }
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Delete form (cascade will handle fields and submissions)
    await prisma.leadPulseForm.delete({
      where: { id: formId }
    });

    logger.info('Form deleted', { formId, userId: session.user.id });

    return NextResponse.json({ message: 'Form deleted successfully' });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: `/api/leadpulse/forms/${params.formId}`,
      method: 'DELETE'
    });

    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}