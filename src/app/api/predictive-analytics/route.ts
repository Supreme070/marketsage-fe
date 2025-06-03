import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  predictContactChurn,
  predictContactLTV,
  predictCampaignPerformance,
  predictContactSendTime,
  getChurnPredictions,
  getLTVPredictions,
  getCampaignPredictions,
  getContactSendTimePredictions,
  PredictionModelType
} from "@/lib/predictive-analytics";
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from "@/lib/errors";

// Schema for contact prediction requests
const contactPredictionSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  predictionType: z.enum([
    PredictionModelType.CHURN,
    PredictionModelType.LTV,
    PredictionModelType.SEND_TIME
  ]),
  timeframeMonths: z.number().optional(),
  channelType: z.string().optional()
});

// Schema for campaign prediction requests
const campaignPredictionSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  predictionType: z.enum([PredictionModelType.CAMPAIGN_PERFORMANCE])
});

// Schema for audience prediction requests
const audiencePredictionSchema = z.object({
  listId: z.string().optional(),
  segmentId: z.string().optional(),
  predictionType: z.enum([
    PredictionModelType.CHURN,
    PredictionModelType.LTV,
    PredictionModelType.SEND_TIME
  ]),
  timeframeMonths: z.number().optional(),
  channelType: z.string().optional()
});

/**
 * POST: Generate predictions
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Determine prediction type based on presence of IDs
    let result;
    
    if (body.contactId) {
      // Contact prediction
      const validation = contactPredictionSchema.safeParse(body);
      
      if (!validation.success) {
        return validationError("Invalid contact prediction request");
      }
      
      const { contactId, predictionType, timeframeMonths, channelType } = validation.data;
      
      switch (predictionType) {
        case PredictionModelType.CHURN:
          result = await predictContactChurn(contactId);
          break;
        case PredictionModelType.LTV:
          result = await predictContactLTV(contactId, timeframeMonths || 12);
          break;
        case PredictionModelType.SEND_TIME:
          result = await predictContactSendTime(contactId, channelType || 'email');
          break;
      }
      
    } else if (body.campaignId) {
      // Campaign prediction
      const validation = campaignPredictionSchema.safeParse(body);
      
      if (!validation.success) {
        return validationError("Invalid campaign prediction request");
      }
      
      const { campaignId, predictionType } = validation.data;
      
      switch (predictionType) {
        case PredictionModelType.CAMPAIGN_PERFORMANCE:
          result = await predictCampaignPerformance(campaignId);
          break;
      }
      
    } else if (body.listId || body.segmentId) {
      // Audience-level prediction
      const validation = audiencePredictionSchema.safeParse(body);
      
      if (!validation.success) {
        return validationError("Invalid audience prediction request");
      }
      
      // Not implementing batch predictions in this route
      // as they're typically handled by background jobs
      result = { 
        message: "Batch prediction submitted",
        status: "PROCESSING"
      };
      
      // In a real implementation, would queue the job:
      // await queuePredictionJob(validation.data);
    } else {
      return NextResponse.json(
        { error: "Missing required ID field (contactId, campaignId, or listId/segmentId)" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "/api/predictive-analytics/route.ts [POST]");
  }
}

/**
 * GET: Retrieve prediction results
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const predictionType = searchParams.get("predictionType");
    const contactId = searchParams.get("contactId");
    const campaignId = searchParams.get("campaignId");
    const channelType = searchParams.get("channelType") || "email";
    
    if (!predictionType) {
      return NextResponse.json(
        { error: "predictionType is required" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (predictionType) {
      case PredictionModelType.CHURN:
        if (contactId) {
          // Get churn prediction for specific contact
          const predictions = await getChurnPredictions([contactId]);
          result = predictions.length > 0 ? predictions[0] : null;
        } else {
          // Get all churn predictions
          result = await getChurnPredictions();
        }
        break;
        
      case PredictionModelType.LTV:
        if (contactId) {
          // Get LTV prediction for specific contact
          const predictions = await getLTVPredictions([contactId]);
          result = predictions.length > 0 ? predictions[0] : null;
        } else {
          // Get all LTV predictions
          result = await getLTVPredictions();
        }
        break;
        
      case PredictionModelType.CAMPAIGN_PERFORMANCE:
        if (campaignId) {
          // Get performance prediction for specific campaign
          const predictions = await getCampaignPredictions([campaignId]);
          result = predictions.length > 0 ? predictions[0] : null;
        } else {
          // Get all campaign predictions
          result = await getCampaignPredictions();
        }
        break;
        
      case PredictionModelType.SEND_TIME:
        if (contactId) {
          // Get send time predictions for specific contact
          result = await getContactSendTimePredictions(contactId, channelType);
        } else {
          // For send time, must have a contact ID
          return NextResponse.json(
            { error: "contactId is required for send time predictions" },
            { status: 400 }
          );
        }
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid prediction type" },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result || { message: "No prediction found" });
  } catch (error) {
    return handleApiError(error, "/api/predictive-analytics/route.ts [GET]");
  }
} 