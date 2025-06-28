/**
 * LeadPulse Forms Bulk Operations API
 * 
 * Bulk operations for multiple forms
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { leadPulseErrorHandler } from '@/lib/leadpulse/error-handler';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * POST: Bulk operations on forms
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, formIds, data } = body;

    if (!operation || !formIds || !Array.isArray(formIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: operation and formIds' },
        { status: 400 }
      );
    }

    // Verify all forms belong to the user
    const forms = await prisma.leadPulseForm.findMany({
      where: {
        id: { in: formIds },
        createdBy: session.user.id
      }
    });

    if (forms.length !== formIds.length) {
      return NextResponse.json(
        { error: 'Some forms not found or unauthorized' },
        { status: 404 }
      );
    }

    let result;
    let message;

    switch (operation) {
      case 'delete':
        await prisma.leadPulseForm.deleteMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          }
        });
        result = { deletedCount: formIds.length };
        message = `${formIds.length} forms deleted successfully`;
        break;

      case 'publish':
        await prisma.leadPulseForm.updateMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          },
          data: {
            status: 'PUBLISHED',
            isPublished: true,
            publishedAt: new Date()
          }
        });
        result = { publishedCount: formIds.length };
        message = `${formIds.length} forms published successfully`;
        break;

      case 'unpublish':
        await prisma.leadPulseForm.updateMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          },
          data: {
            status: 'DRAFT',
            isPublished: false
          }
        });
        result = { unpublishedCount: formIds.length };
        message = `${formIds.length} forms unpublished successfully`;
        break;

      case 'archive':
        await prisma.leadPulseForm.updateMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          },
          data: {
            status: 'ARCHIVED',
            isPublished: false
          }
        });
        result = { archivedCount: formIds.length };
        message = `${formIds.length} forms archived successfully`;
        break;

      case 'duplicate':
        const duplicatedForms = [];
        
        for (const formId of formIds) {
          const originalForm = await prisma.leadPulseForm.findUnique({
            where: { id: formId },
            include: { fields: true }
          });

          if (originalForm) {
            // Create duplicate form
            const duplicateForm = await prisma.leadPulseForm.create({
              data: {
                name: `${originalForm.name} (Copy)`,
                title: `${originalForm.title} (Copy)`,
                description: originalForm.description,
                status: 'DRAFT',
                layout: originalForm.layout,
                theme: originalForm.theme,
                settings: originalForm.settings,
                submitButtonText: originalForm.submitButtonText,
                successMessage: originalForm.successMessage,
                errorMessage: originalForm.errorMessage,
                redirectUrl: originalForm.redirectUrl,
                isTrackingEnabled: originalForm.isTrackingEnabled,
                conversionGoal: originalForm.conversionGoal,
                isPublished: false,
                createdBy: session.user.id
              }
            });

            // Duplicate fields
            for (const field of originalForm.fields) {
              await prisma.leadPulseFormField.create({
                data: {
                  formId: duplicateForm.id,
                  type: field.type,
                  name: field.name,
                  label: field.label,
                  placeholder: field.placeholder,
                  helpText: field.helpText,
                  isRequired: field.isRequired,
                  isVisible: field.isVisible,
                  defaultValue: field.defaultValue,
                  validation: field.validation,
                  options: field.options,
                  fileTypes: field.fileTypes,
                  maxFileSize: field.maxFileSize,
                  order: field.order,
                  width: field.width,
                  cssClasses: field.cssClasses,
                  conditionalLogic: field.conditionalLogic
                }
              });
            }

            duplicatedForms.push(duplicateForm);
          }
        }
        
        result = { duplicatedForms, duplicatedCount: duplicatedForms.length };
        message = `${duplicatedForms.length} forms duplicated successfully`;
        break;

      case 'update':
        if (!data) {
          return NextResponse.json(
            { error: 'Data required for update operation' },
            { status: 400 }
          );
        }

        await prisma.leadPulseForm.updateMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          },
          data: {
            ...data,
            // Ensure these fields are not updated in bulk
            id: undefined,
            createdBy: undefined,
            createdAt: undefined
          }
        });
        result = { updatedCount: formIds.length };
        message = `${formIds.length} forms updated successfully`;
        break;

      case 'export':
        const exportData = await prisma.leadPulseForm.findMany({
          where: {
            id: { in: formIds },
            createdBy: session.user.id
          },
          include: {
            fields: {
              orderBy: { order: 'asc' }
            },
            analytics: {
              orderBy: { date: 'desc' },
              take: 30
            }
          }
        });

        result = { 
          exportData,
          exportCount: exportData.length,
          exportedAt: new Date().toISOString()
        };
        message = `${exportData.length} forms exported successfully`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    logger.info('Bulk operation completed', {
      operation,
      formCount: formIds.length,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message,
      ...result
    });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: '/api/leadpulse/forms/bulk',
      method: 'POST'
    });

    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get bulk operation status (for long-running operations)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would store operation status in Redis or database
    // For now, we'll return a simple response
    return NextResponse.json({
      operationId,
      status: 'completed',
      progress: 100,
      message: 'Operation completed successfully'
    });

  } catch (error) {
    await leadPulseErrorHandler.handleError(error, {
      endpoint: '/api/leadpulse/forms/bulk',
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to get operation status' },
      { status: 500 }
    );
  }
}