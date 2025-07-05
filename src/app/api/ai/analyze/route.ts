import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Dynamic import to prevent circular dependencies

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, content, seedText, customerFeatures } = body;

    switch (action) {
      case 'analyze':
        if (!content) {
          return NextResponse.json(
            { error: "Content is required for analysis" },
            { status: 400 }
          );
        }

        // Dynamic import to prevent circular dependencies
        const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
        
        const analysisResult = await SupremeAIv3.process({
          type: 'content',
          userId: session.user.id,
          content: content
        });
        
        // Log the analysis for insights
        logger.info("Supreme-AI content analysis completed", {
          userId: session.user.id,
          contentLength: content.length,
          confidence: analysisResult.confidence,
          success: analysisResult.success
        });

        return NextResponse.json({
          success: analysisResult.success,
          analysis: {
            ...analysisResult.data,
            insights: analysisResult.insights || [
              "Advanced AI content analysis completed",
              "Powered by Supreme-AI intelligence engine",
              "Enhanced accuracy with OpenAI integration"
            ]
          }
        });

      case 'generate':
        if (!seedText) {
          return NextResponse.json(
            { error: "Seed text is required for generation" },
            { status: 400 }
          );
        }

        const generationResult = await SupremeAIv3.process({
          type: 'content',
          userId: session.user.id,
          content: `Generate marketing content based on: ${seedText}`
        });
        
        logger.info("Supreme-AI content generation completed", {
          userId: session.user.id,
          seedLength: seedText.length,
          confidence: generationResult.confidence,
          success: generationResult.success
        });

        return NextResponse.json({
          success: generationResult.success,
          generated: {
            content: generationResult.data.generatedContent || generationResult.data.answer,
            originalSeed: seedText,
            suggestions: generationResult.recommendations || [
              "Supreme-AI powered content generation",
              "Consider A/B testing this content",
              "Personalize with customer data"
            ]
          }
        });

      case 'cluster':
        if (!customerFeatures || !Array.isArray(customerFeatures)) {
          return NextResponse.json(
            { error: "Customer features array is required for clustering" },
            { status: 400 }
          );
        }

        const clusterResult = await SupremeAIv3.process({
          type: 'customer',
          userId: session.user.id,
          customers: customerFeatures.map((features, index) => ({
            id: index,
            features: features
          }))
        });

        logger.info("Supreme-AI customer clustering completed", {
          userId: session.user.id,
          customersAnalyzed: customerFeatures.length,
          confidence: clusterResult.confidence,
          success: clusterResult.success
        });

        return NextResponse.json({
          success: clusterResult.success,
          clustering: {
            clusters: clusterResult.data.clusters || [],
            insights: clusterResult.data.segmentation || {},
            recommendations: clusterResult.recommendations || [
              "AI-powered customer segmentation completed",
              "Supreme-AI detected behavioral patterns",
              "Enhanced targeting opportunities identified"
            ]
          }
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'analyze', 'generate', or 'cluster'" },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error("Supreme-AI API error", error);
    
    return NextResponse.json(
      { 
        error: "AI analysis failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 