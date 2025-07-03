/**
 * Touchpoint Data Ingestion API
 * ==============================
 * 
 * API endpoints for ingesting customer touchpoint data from all channels
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  DataIngestionService,
  type EmailTouchpointData,
  type SMSTouchpointData,
  type WhatsAppTouchpointData,
  type WebsiteTouchpointData,
  type CampaignTouchpointData,
  type WorkflowTouchpointData
} from '@/lib/ingestion/data-ingestion-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Base touchpoint schema
const BaseTouchpointSchema = z.object({
  contactId: z.string(),
  organizationId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  source: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  metadata: z.record(z.any()).default({})
});

// Email touchpoint schema
const EmailTouchpointSchema = BaseTouchpointSchema.extend({
  campaignId: z.string().optional(),
  emailId: z.string(),
  action: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']),
  actionData: z.object({
    linkUrl: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceType: z.string().optional(),
    location: z.string().optional()
  }).optional()
});

// SMS touchpoint schema
const SMSTouchpointSchema = BaseTouchpointSchema.extend({
  campaignId: z.string().optional(),
  smsId: z.string(),
  action: z.enum(['sent', 'delivered', 'failed', 'replied']),
  actionData: z.object({
    message: z.string().optional(),
    deliveryStatus: z.string().optional(),
    replyContent: z.string().optional(),
    carrierInfo: z.string().optional()
  }).optional()
});

// WhatsApp touchpoint schema
const WhatsAppTouchpointSchema = BaseTouchpointSchema.extend({
  campaignId: z.string().optional(),
  messageId: z.string(),
  action: z.enum(['sent', 'delivered', 'read', 'replied', 'failed']),
  actionData: z.object({
    message: z.string().optional(),
    replyContent: z.string().optional(),
    replyType: z.enum(['text', 'media', 'location', 'contact']).optional(),
    messageType: z.enum(['text', 'template', 'media']).optional()
  }).optional()
});

// Website touchpoint schema
const WebsiteTouchpointSchema = BaseTouchpointSchema.extend({
  action: z.enum(['visit', 'page_view', 'form_submission', 'download', 'signup', 'purchase', 'cart_abandonment']),
  actionData: z.object({
    pageUrl: z.string().optional(),
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    formData: z.record(z.any()).optional(),
    productId: z.string().optional(),
    purchaseAmount: z.number().optional(),
    cartValue: z.number().optional()
  }).optional()
});

// Campaign touchpoint schema
const CampaignTouchpointSchema = BaseTouchpointSchema.extend({
  campaignId: z.string(),
  campaignType: z.enum(['email', 'sms', 'whatsapp', 'social', 'display']),
  action: z.enum(['sent', 'opened', 'clicked', 'converted', 'unsubscribed']),
  actionData: z.object({
    conversionValue: z.number().optional(),
    conversionType: z.string().optional(),
    linkUrl: z.string().optional()
  }).optional()
});

// Workflow touchpoint schema
const WorkflowTouchpointSchema = BaseTouchpointSchema.extend({
  workflowId: z.string(),
  nodeId: z.string().optional(),
  action: z.enum(['triggered', 'step_completed', 'step_failed', 'completed', 'failed']),
  actionData: z.object({
    stepType: z.string().optional(),
    stepResult: z.any().optional(),
    errorMessage: z.string().optional(),
    nextStepId: z.string().optional()
  }).optional()
});

// Batch ingestion schema
const BatchIngestionSchema = z.object({
  touchpoints: z.array(z.object({
    type: z.enum(['email', 'sms', 'whatsapp', 'website', 'campaign', 'workflow']),
    data: z.any() // Will be validated based on type
  })).max(100) // Maximum 100 touchpoints per batch
});

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
    const touchpointType = searchParams.get('type');
    const isBatch = searchParams.get('batch') === 'true';

    const body = await request.json();

    if (isBatch) {
      // Handle batch ingestion
      return await handleBatchIngestion(body, session);
    } else {
      // Handle single touchpoint ingestion
      return await handleSingleTouchpoint(touchpointType, body, session);
    }

  } catch (error) {
    logger.error('Failed to ingest touchpoint data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to ingest touchpoint data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleSingleTouchpoint(
  touchpointType: string | null, 
  body: any, 
  session: any
): Promise<NextResponse> {
  if (!touchpointType) {
    return NextResponse.json(
      { error: 'Touchpoint type is required. Use ?type=email|sms|whatsapp|website|campaign|workflow' },
      { status: 400 }
    );
  }

  let validationResult: any;
  let validatedData: any;

  // Validate based on touchpoint type
  switch (touchpointType) {
    case 'email':
      validationResult = EmailTouchpointSchema.safeParse(body);
      break;
    case 'sms':
      validationResult = SMSTouchpointSchema.safeParse(body);
      break;
    case 'whatsapp':
      validationResult = WhatsAppTouchpointSchema.safeParse(body);
      break;
    case 'website':
      validationResult = WebsiteTouchpointSchema.safeParse(body);
      break;
    case 'campaign':
      validationResult = CampaignTouchpointSchema.safeParse(body);
      break;
    case 'workflow':
      validationResult = WorkflowTouchpointSchema.safeParse(body);
      break;
    default:
      return NextResponse.json(
        { error: `Invalid touchpoint type: ${touchpointType}` },
        { status: 400 }
      );
  }

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid touchpoint data',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  validatedData = validationResult.data;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== validatedData.organizationId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  // Ingest the touchpoint data
  try {
    switch (touchpointType) {
      case 'email':
        await DataIngestionService.ingestEmailTouchpoint(validatedData as EmailTouchpointData);
        break;
      case 'sms':
        await DataIngestionService.ingestSMSTouchpoint(validatedData as SMSTouchpointData);
        break;
      case 'whatsapp':
        await DataIngestionService.ingestWhatsAppTouchpoint(validatedData as WhatsAppTouchpointData);
        break;
      case 'website':
        await DataIngestionService.ingestWebsiteTouchpoint(validatedData as WebsiteTouchpointData);
        break;
      case 'campaign':
        await DataIngestionService.ingestCampaignTouchpoint(validatedData as CampaignTouchpointData);
        break;
      case 'workflow':
        await DataIngestionService.ingestWorkflowTouchpoint(validatedData as WorkflowTouchpointData);
        break;
    }

    logger.info('Touchpoint data ingested successfully', {
      touchpointType,
      contactId: validatedData.contactId,
      organizationId: validatedData.organizationId,
      action: validatedData.action,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Touchpoint data ingested successfully',
      data: {
        touchpointType,
        contactId: validatedData.contactId,
        action: validatedData.action,
        timestamp: validatedData.timestamp.toISOString()
      }
    });

  } catch (error) {
    throw error; // Will be caught by outer try-catch
  }
}

async function handleBatchIngestion(body: any, session: any): Promise<NextResponse> {
  const validationResult = BatchIngestionSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid batch ingestion data',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { touchpoints } = validationResult.data;

  // Validate each touchpoint individually
  const validatedTouchpoints = [];
  const validationErrors = [];

  for (let i = 0; i < touchpoints.length; i++) {
    const touchpoint = touchpoints[i];
    let validationResult: any;

    try {
      switch (touchpoint.type) {
        case 'email':
          validationResult = EmailTouchpointSchema.safeParse(touchpoint.data);
          break;
        case 'sms':
          validationResult = SMSTouchpointSchema.safeParse(touchpoint.data);
          break;
        case 'whatsapp':
          validationResult = WhatsAppTouchpointSchema.safeParse(touchpoint.data);
          break;
        case 'website':
          validationResult = WebsiteTouchpointSchema.safeParse(touchpoint.data);
          break;
        case 'campaign':
          validationResult = CampaignTouchpointSchema.safeParse(touchpoint.data);
          break;
        case 'workflow':
          validationResult = WorkflowTouchpointSchema.safeParse(touchpoint.data);
          break;
        default:
          throw new Error(`Invalid touchpoint type: ${touchpoint.type}`);
      }

      if (!validationResult.success) {
        validationErrors.push({
          index: i,
          type: touchpoint.type,
          errors: validationResult.error.errors
        });
        continue;
      }

      // Check organization access
      const data = validationResult.data;
      if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== data.organizationId) {
        validationErrors.push({
          index: i,
          type: touchpoint.type,
          errors: ['Unauthorized - Access denied to organization']
        });
        continue;
      }

      validatedTouchpoints.push({
        type: touchpoint.type,
        data: validationResult.data
      });

    } catch (error) {
      validationErrors.push({
        index: i,
        type: touchpoint.type,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      });
    }
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { 
        error: 'Validation failed for some touchpoints',
        validationErrors,
        validTouchpoints: validatedTouchpoints.length,
        totalTouchpoints: touchpoints.length
      },
      { status: 400 }
    );
  }

  // Ingest all validated touchpoints
  const result = await DataIngestionService.batchIngestTouchpoints(validatedTouchpoints);

  logger.info('Batch touchpoint ingestion completed', {
    totalTouchpoints: touchpoints.length,
    successful: result.success,
    failed: result.failed,
    userId: session.user.id
  });

  return NextResponse.json({
    success: true,
    message: 'Batch touchpoint ingestion completed',
    data: {
      totalTouchpoints: touchpoints.length,
      successful: result.success,
      failed: result.failed,
      errors: result.errors,
      timestamp: new Date().toISOString()
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return ingestion API documentation/schema
    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          single: 'POST /api/ingestion/touchpoint?type={touchpointType}',
          batch: 'POST /api/ingestion/touchpoint?batch=true'
        },
        touchpointTypes: [
          'email',
          'sms', 
          'whatsapp',
          'website',
          'campaign',
          'workflow'
        ],
        schemas: {
          email: {
            required: ['contactId', 'organizationId', 'emailId', 'action', 'source', 'timestamp'],
            optional: ['campaignId', 'userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']
          },
          sms: {
            required: ['contactId', 'organizationId', 'smsId', 'action', 'source', 'timestamp'],
            optional: ['campaignId', 'userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['sent', 'delivered', 'failed', 'replied']
          },
          whatsapp: {
            required: ['contactId', 'organizationId', 'messageId', 'action', 'source', 'timestamp'],
            optional: ['campaignId', 'userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['sent', 'delivered', 'read', 'replied', 'failed']
          },
          website: {
            required: ['contactId', 'organizationId', 'action', 'source', 'timestamp'],
            optional: ['userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['visit', 'page_view', 'form_submission', 'download', 'signup', 'purchase', 'cart_abandonment']
          },
          campaign: {
            required: ['contactId', 'organizationId', 'campaignId', 'campaignType', 'action', 'source', 'timestamp'],
            optional: ['userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['sent', 'opened', 'clicked', 'converted', 'unsubscribed']
          },
          workflow: {
            required: ['contactId', 'organizationId', 'workflowId', 'action', 'source', 'timestamp'],
            optional: ['nodeId', 'userId', 'sessionId', 'actionData', 'metadata'],
            actions: ['triggered', 'step_completed', 'step_failed', 'completed', 'failed']
          }
        },
        limits: {
          batchSize: 100,
          rateLimits: 'Standard API rate limits apply'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get ingestion API info', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get API information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}