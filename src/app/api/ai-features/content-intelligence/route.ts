import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { 
  analyzeSentiment, 
  analyzeSubjectLine, 
  scoreContent, 
  generateContentRecommendations,
  personalizeContent,
  ContentType 
} from "@/lib/content-intelligence";
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from "@/lib/errors";

// Schema for content analysis requests
const contentAnalysisSchema = z.object({
  content: z.string().min(1, "Content is required"),
  contentType: z.nativeEnum(ContentType),
  contextData: z.record(z.any()).optional()
});

// Schema for subject line analysis
const subjectLineSchema = z.object({
  subject: z.string().min(1, "Subject is required")
});

// Schema for personalization requests
const personalizationSchema = z.object({
  content: z.string().min(1, "Content is required"),
  contactId: z.string().min(1, "Contact ID is required"),
  contentType: z.nativeEnum(ContentType)
});

/**
 * POST: Analyze content sentiment
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get request path to determine which analysis to perform
    const path = request.nextUrl.pathname;
    const endpoint = path.split('/').pop();
    
    // Parse request body
    const body = await request.json();
    
    // Handle different analysis types based on endpoint
    switch (endpoint) {
      case 'sentiment': {
        const result = contentAnalysisSchema.safeParse(body);
        
        if (!result.success) {
          return validationError(result.error.format());
        }
        
        const { content, contentType } = result.data;
        const analysis = await analyzeSentiment(content, contentType);
        
        return NextResponse.json(analysis);
      }
      
      case 'subject-line': {
        const result = subjectLineSchema.safeParse(body);
        
        if (!result.success) {
          return validationError(result.error.format());
        }
        
        const { subject } = result.data;
        const analysis = await analyzeSubjectLine(subject);
        
        return NextResponse.json(analysis);
      }
      
      case 'score': {
        const result = contentAnalysisSchema.safeParse(body);
        
        if (!result.success) {
          return validationError(result.error.format());
        }
        
        const { content, contentType } = result.data;
        const score = await scoreContent(content, contentType);
        
        return NextResponse.json(score);
      }
      
      case 'recommendations': {
        const result = contentAnalysisSchema.safeParse(body);
        
        if (!result.success) {
          return validationError(result.error.format());
        }
        
        const { content, contentType } = result.data;
        const recommendations = await generateContentRecommendations(content, contentType);
        
        return NextResponse.json(recommendations);
      }
      
      case 'personalize': {
        const result = personalizationSchema.safeParse(body);
        
        if (!result.success) {
          return validationError(result.error.format());
        }
        
        const { content, contactId, contentType } = result.data;
        const personalized = await personalizeContent(content, contactId, contentType);
        
        return NextResponse.json(personalized);
      }
      
      default:
        return NextResponse.json(
          { error: "Invalid endpoint" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error, "/api/ai-features/content-intelligence/route.ts [POST]");
  }
}

/**
 * GET: Retrieve content analysis history
 * Proxies to backend /api/v2/ai/content-analysis
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const contentType = searchParams.get("contentType");
    const limit = searchParams.get("limit") || "10";

    // Build backend URL with query params
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (contentType) params.append('contentType', contentType);
    if (limit) params.append('limit', limit);

    const url = `${BACKEND_URL}/api/v2/ai/content-analysis?${params.toString()}`;

    // Call backend endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    return handleApiError(error, "/api/ai-features/content-intelligence/route.ts [GET]");
  }
} 