/**
 * LeadPulse Forms Management API
 * 
 * CRUD operations for LeadPulse forms
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
 * GET: Fetch forms for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      createdBy: session.user.id
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get forms with analytics
    const [forms, totalCount] = await Promise.all([
      withDatabaseFallback(
        () => prisma.leadPulseForm.findMany({
          where,
          include: {
            fields: {
              select: {
                id: true,
                type: true,
                name: true,
                label: true,
                isRequired: true,
                order: true
              },
              orderBy: { order: 'asc' }
            },
            analytics: {
              select: {
                date: true,
                views: true,
                submissions: true,
                conversionRate: true
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
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        [],
        { userId: session.user.id }
      ),
      withDatabaseFallback(
        () => prisma.leadPulseForm.count({ where }),
        0,
        { userId: session.user.id }
      )
    ]);

    // Calculate summary statistics for each form
    const formsWithStats = forms.map((form: any) => {
      const totalViews = form.analytics.reduce((sum: number, day: any) => sum + day.views, 0);
      const totalSubmissions = form.analytics.reduce((sum: number, day: any) => sum + day.submissions, 0);
      const avgConversionRate = form.analytics.length > 0 
        ? form.analytics.reduce((sum: number, day: any) => sum + day.conversionRate, 0) / form.analytics.length
        : 0;

      return {
        ...form,
        stats: {
          totalViews,
          totalSubmissions,
          conversionRate: Math.round(avgConversionRate * 100) / 100,
          fieldCount: form._count.fields
        }
      };
    });

    return NextResponse.json({
      forms: formsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: '/api/leadpulse/forms',
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new form
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: name and title' },
        { status: 400 }
      );
    }

    // Create form with default settings
    const form = await prisma.leadPulseForm.create({
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        status: body.status || 'DRAFT',
        layout: body.layout || 'SINGLE_COLUMN',
        theme: body.theme || {},
        settings: body.settings || {},
        submitButtonText: body.submitButtonText || 'Submit',
        successMessage: body.successMessage || 'Thank you for your submission!',
        errorMessage: body.errorMessage || 'Something went wrong. Please try again.',
        redirectUrl: body.redirectUrl,
        isTrackingEnabled: body.isTrackingEnabled ?? true,
        conversionGoal: body.conversionGoal,
        createdBy: session.user.id
      }
    });

    // Create default fields if provided
    if (body.fields && Array.isArray(body.fields)) {
      for (const [index, field] of body.fields.entries()) {
        await prisma.leadPulseFormField.create({
          data: {
            formId: form.id,
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

    logger.info('Form created', { formId: form.id, userId: session.user.id });

    // Return the created form with fields
    const createdForm = await prisma.leadPulseForm.findUnique({
      where: { id: form.id },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(createdForm, { status: 201 });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: '/api/leadpulse/forms',
      method: 'POST'
    });

    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
}