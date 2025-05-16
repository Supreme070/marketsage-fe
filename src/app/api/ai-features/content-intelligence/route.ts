import { NextRequest, NextResponse } from "next/server";
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
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const contentType = searchParams.get("contentType");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    // Create filter
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (contentType) {
      filter.contentType = contentType;
    }
    
    // Only show the user's own analyses or all if admin
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      filter.userId = session.user.id;
    }
    
    // Get analyses from database
    const analyses = await prisma.contentAnalysis.findMany({
      where: filter,
      orderBy: {
        createdAt: "desc"
      },
      take: Math.min(limit, 100),
    });
    
    // Parse the JSON results
    const parsedAnalyses = analyses.map(analysis => ({
      ...analysis,
      result: JSON.parse(analysis.result)
    }));
    
    return NextResponse.json(parsedAnalyses);
  } catch (error) {
    return handleApiError(error, "/api/ai-features/content-intelligence/route.ts [GET]");
  }
} 