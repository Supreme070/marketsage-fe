/**
 * Customer Segmentation API Endpoints
 * ===================================
 * 
 * API endpoints for customer segmentation operations including segmentation,
 * segment creation, management, and analytics
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getCustomerSegmentationEngine,
  segmentCustomer,
  createCustomerSegment,
  runBatchCustomerSegmentation,
  type SegmentCriteria
} from '@/lib/ml/customer-segmentation-engine';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const SegmentCustomerSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  organizationId: z.string().optional()
});

const BatchSegmentSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact ID is required').max(100, 'Maximum 100 contacts per batch'),
  organizationId: z.string().optional()
});

const SegmentRuleSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains']),
  value: z.any(),
  weight: z.number().optional()
});

const CreateSegmentSchema = z.object({
  name: z.string().min(1, 'Segment name is required').max(100, 'Segment name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  segmentType: z.enum(['value', 'behavior', 'lifecycle', 'engagement', 'risk', 'custom']),
  criteria: z.object({
    rules: z.array(SegmentRuleSchema).min(1, 'At least one rule is required'),
    logic: z.enum(['AND', 'OR']),
    minimumSize: z.number().optional(),
    maximumSize: z.number().optional()
  }),
  organizationId: z.string().optional()
});

/**
 * Handle customer segmentation operations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'segment';

    const body = await request.json();

    if (action === 'segment') {
      return await handleSingleSegmentation(body, session);
    } else if (action === 'batch') {
      return await handleBatchSegmentation(body, session);
    } else if (action === 'create') {
      return await handleCreateSegment(body, session);
    } else if (action === 'batch-all') {
      return await handleBatchAllSegmentation(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=segment, ?action=batch, ?action=create, or ?action=batch-all' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process segmentation request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process segmentation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get segmentation data and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'segments';

    if (action === 'segments') {
      return await handleGetSegments(searchParams, session);
    } else if (action === 'insights') {
      return await handleGetSegmentInsights(searchParams, session);
    } else if (action === 'customer') {
      return await handleGetCustomerSegmentation(searchParams, session);
    } else if (action === 'analytics') {
      return await handleGetSegmentAnalytics(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=segments, ?action=insights, ?action=customer, or ?action=analytics' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get segmentation data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get segmentation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update or delete segments
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and above can delete segments
    if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - ADMIN access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');

    if (!segmentId) {
      return NextResponse.json(
        { error: 'Segment ID is required' },
        { status: 400 }
      );
    }

    return await handleDeleteSegment(segmentId, session);

  } catch (error) {
    logger.error('Failed to delete segment', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to delete segment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single customer segmentation
 */
async function handleSingleSegmentation(body: any, session: any): Promise<NextResponse> {
  const validationResult = SegmentCustomerSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid segmentation request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactId, organizationId } = validationResult.data;

  // Use session organization if not provided
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const result = await segmentCustomer(contactId, orgId);

    logger.info('Customer segmentation completed via API', {
      contactId,
      organizationId: orgId,
      primarySegment: result.primarySegment,
      segmentCount: result.segments.length,
      confidence: result.confidence,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        contactId: result.contactId,
        primarySegment: result.primarySegment,
        segments: result.segments,
        confidence: result.confidence,
        reasoning: result.reasoning,
        features: {
          recency: result.features.recency,
          frequency: result.features.frequency,
          monetary: result.features.monetary,
          churnRisk: result.features.churnRisk,
          lifetimeValue: result.features.lifetimeValue,
          engagementLevel: {
            email: result.features.emailEngagement,
            sms: result.features.smsEngagement,
            website: result.features.websiteActivity
          }
        },
        segmentedAt: result.segmentedAt,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name
        }
      }
    });

  } catch (error) {
    logger.error('Single customer segmentation failed', {
      contactId,
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to segment customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch customer segmentation
 */
async function handleBatchSegmentation(body: any, session: any): Promise<NextResponse> {
  const validationResult = BatchSegmentSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid batch segmentation request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactIds, organizationId } = validationResult.data;

  // Use session organization if not provided
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const results = await Promise.allSettled(
      contactIds.map(contactId => segmentCustomer(contactId, orgId))
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        const segmentResult = result.value;
        return {
          success: true,
          contactId: segmentResult.contactId,
          primarySegment: segmentResult.primarySegment,
          segments: segmentResult.segments,
          confidence: segmentResult.confidence,
          reasoning: segmentResult.reasoning,
          segmentedAt: segmentResult.segmentedAt
        };
      } else {
        return {
          success: false,
          contactId: contactIds[index],
          error: result.reason
        };
      }
    });

    const successful = processedResults.filter(r => r.success).length;
    const failed = processedResults.length - successful;

    // Calculate segment distribution
    const segmentDistribution = processedResults
      .filter(r => r.success && 'primarySegment' in r)
      .reduce((acc: any, r: any) => {
        acc[r.primarySegment] = (acc[r.primarySegment] || 0) + 1;
        return acc;
      }, {});

    logger.info('Batch customer segmentation completed via API', {
      totalContacts: contactIds.length,
      successful,
      failed,
      segmentDistribution,
      organizationId: orgId,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        totalContacts: contactIds.length,
        successful,
        failed,
        successRate: (successful / contactIds.length * 100).toFixed(1) + '%',
        segmentDistribution,
        results: processedResults,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name,
          processedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Batch customer segmentation failed', {
      contactCount: contactIds.length,
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process batch segmentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle segment creation
 */
async function handleCreateSegment(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can create segments
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for segment creation' },
      { status: 403 }
    );
  }

  const validationResult = CreateSegmentSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid segment creation request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { name, description, segmentType, criteria, organizationId } = validationResult.data;

  // Use session organization if not provided
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const segment = await createCustomerSegment(orgId, {
      name,
      description,
      segmentType,
      criteria
    });

    logger.info('Customer segment created via API', {
      segmentId: segment.id,
      name: segment.name,
      segmentType: segment.segmentType,
      organizationId: orgId,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        segmentId: segment.id,
        name: segment.name,
        description: segment.description,
        segmentType: segment.segmentType,
        criteria: segment.criteria,
        characteristics: segment.characteristics,
        estimatedSize: segment.size,
        recommendedActions: segment.recommendedActions,
        createdAt: segment.createdAt,
        metadata: {
          createdBy: session.user.id,
          createdByName: session.user.name
        }
      }
    });

  } catch (error) {
    logger.error('Segment creation failed', {
      segmentName: name,
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to create segment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch segmentation for all customers
 */
async function handleBatchAllSegmentation(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can run full batch segmentation
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for batch segmentation' },
      { status: 403 }
    );
  }

  const organizationId = body.organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== organizationId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const result = await runBatchCustomerSegmentation(organizationId);

    logger.info('Batch segmentation for all customers completed via API', {
      organizationId,
      processed: result.processed,
      segmented: result.segmented,
      errors: result.errors,
      initiatedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        segmented: result.segmented,
        errors: result.errors,
        successRate: (result.segmented / result.processed * 100).toFixed(1) + '%',
        metadata: {
          initiatedBy: session.user.id,
          initiatedByName: session.user.name,
          completedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Batch segmentation for all customers failed', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to run batch segmentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get segments request
 */
async function handleGetSegments(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const segmentType = searchParams.get('segmentType');
  const limit = Number.parseInt(searchParams.get('limit') || '50');
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  try {
    const whereClause: any = { organizationId };
    
    if (segmentType && ['value', 'behavior', 'lifecycle', 'engagement', 'risk', 'custom'].includes(segmentType)) {
      whereClause.segmentType = segmentType;
    }

    const segments = await prisma.aI_CustomerSegment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset
    });

    const total = await prisma.aI_CustomerSegment.count({
      where: whereClause
    });

    // Calculate summary statistics
    const totalSize = segments.reduce((sum, s) => sum + s.size, 0);
    const averageClv = segments.length > 0 ? 
      segments.reduce((sum, s) => sum + s.averageClv, 0) / segments.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        segments: segments.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          segmentType: s.segmentType,
          size: s.size,
          averageClv: s.averageClv,
          churnRate: s.churnRate,
          characteristics: s.characteristics,
          recommendedActions: s.recommendedActions,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),
        summary: {
          totalSegments: total,
          totalCustomers: totalSize,
          averageClv: averageClv.toFixed(2),
          segmentTypes: segments.reduce((acc: any, s) => {
            acc[s.segmentType] = (acc[s.segmentType] || 0) + 1;
            return acc;
          }, {})
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + segments.length < total
        },
        filters: {
          organizationId,
          segmentType: segmentType || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get segments', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get segments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get segment insights
 */
async function handleGetSegmentInsights(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const segmentId = searchParams.get('segmentId');
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  if (!segmentId) {
    return NextResponse.json(
      { error: 'Segment ID is required' },
      { status: 400 }
    );
  }

  try {
    const engine = getCustomerSegmentationEngine();
    const insights = await engine.getSegmentInsights(segmentId, organizationId);

    return NextResponse.json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('Failed to get segment insights', {
      segmentId,
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get segment insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get customer segmentation
 */
async function handleGetCustomerSegmentation(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const contactId = searchParams.get('contactId');
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  if (!contactId) {
    return NextResponse.json(
      { error: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get latest segmentation result for the customer
    const segmentationResult = await prisma.aI_CustomerSegment.findFirst({
      where: {
        contactId,
        organizationId
      },
      orderBy: { segmentedAt: 'desc' }
    });

    if (!segmentationResult) {
      return NextResponse.json({
        success: false,
        error: 'No segmentation data found for customer'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        contactId: segmentationResult.contactId,
        primarySegment: segmentationResult.primarySegment,
        segments: segmentationResult.segments,
        confidence: segmentationResult.confidence,
        features: segmentationResult.features,
        reasoning: segmentationResult.reasoning,
        segmentedAt: segmentationResult.segmentedAt
      }
    });

  } catch (error) {
    logger.error('Failed to get customer segmentation', {
      contactId,
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get customer segmentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get segment analytics
 */
async function handleGetSegmentAnalytics(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  try {
    // Get segment analytics
    const segmentStats = await prisma.aI_CustomerSegment.groupBy({
      by: ['segmentType'],
      where: { organizationId },
      _count: {
        id: true
      },
      _avg: {
        size: true,
        averageClv: true,
        churnRate: true
      },
      _sum: {
        size: true
      }
    });

    const totalCustomers = segmentStats.reduce((sum, stat) => sum + (stat._sum.size || 0), 0);
    const totalSegments = segmentStats.reduce((sum, stat) => sum + stat._count.id, 0);

    const analytics = segmentStats.map(stat => ({
      segmentType: stat.segmentType,
      segmentCount: stat._count.id,
      totalCustomers: stat._sum.size || 0,
      averageSize: stat._avg.size?.toFixed(0) || '0',
      averageClv: stat._avg.averageClv?.toFixed(2) || '0.00',
      averageChurnRate: stat._avg.churnRate?.toFixed(3) || '0.000',
      customerPercentage: totalCustomers > 0 ? 
        (((stat._sum.size || 0) / totalCustomers) * 100).toFixed(1) + '%' : '0%'
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSegments,
          totalCustomers,
          averageSegmentSize: totalSegments > 0 ? Math.round(totalCustomers / totalSegments) : 0,
          organizationId
        },
        segmentTypes: analytics,
        insights: [
          `${totalSegments} active segments managing ${totalCustomers} customers`,
          `Average segment size: ${totalSegments > 0 ? Math.round(totalCustomers / totalSegments) : 0} customers`,
          'Segment distribution provides comprehensive customer coverage',
          'Regular re-segmentation recommended for optimal results'
        ],
        metadata: {
          generatedAt: new Date(),
          generatedBy: session.user.id
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get segment analytics', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get segment analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle delete segment
 */
async function handleDeleteSegment(segmentId: string, session: any): Promise<NextResponse> {
  const organizationId = session.user.organizationId;

  try {
    // Verify segment belongs to organization
    const segment = await prisma.aI_CustomerSegment.findUnique({
      where: { id: segmentId }
    });

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }

    if (session.user.role !== 'SUPER_ADMIN' && segment.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to segment' },
        { status: 403 }
      );
    }

    // Delete the segment
    await prisma.aI_CustomerSegment.delete({
      where: { id: segmentId }
    });

    logger.info('Customer segment deleted via API', {
      segmentId,
      segmentName: segment.name,
      organizationId: segment.organizationId,
      deletedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        segmentId,
        message: 'Segment deleted successfully',
        metadata: {
          deletedBy: session.user.id,
          deletedByName: session.user.name,
          deletedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to delete segment', {
      segmentId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to delete segment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}