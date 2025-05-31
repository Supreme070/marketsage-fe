import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeContentLocal, generateContentLocal, clusterContacts } from "@/lib/ai/local-ai-engine";
import { logger } from "@/lib/logger";

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

        const analysis = analyzeContentLocal(content);
        
        // Log the analysis for insights
        logger.info("Local AI content analysis completed", {
          userId: session.user.id,
          contentLength: content.length,
          sentiment: analysis.sentimentLabel,
          readingGrade: analysis.readingGrade
        });

        return NextResponse.json({
          success: true,
          analysis: {
            ...analysis,
            insights: [
              `Content sentiment: ${analysis.sentimentLabel}`,
              `Reading level: Grade ${analysis.readingGrade}`,
              `Top keywords: ${analysis.keywords.slice(0, 3).join(', ')}`,
              analysis.readingEase > 70 ? "Easy to read" : 
              analysis.readingEase > 50 ? "Moderate difficulty" : "Complex content"
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

        const generated = generateContentLocal({ seedText });
        
        logger.info("Local AI content generation completed", {
          userId: session.user.id,
          seedLength: seedText.length,
          generatedLength: generated.content.length
        });

        return NextResponse.json({
          success: true,
          generated: {
            content: generated.content,
            originalSeed: seedText,
            suggestions: [
              "Try different seed text for variety",
              "Consider A/B testing this content",
              "Personalize with customer names"
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

        const clusters = await clusterContacts(customerFeatures, 3);
        
        // Interpret cluster results
        const clusterInsights = clusters.clusters.reduce((acc: any, cluster: number, index: number) => {
          if (!acc[cluster]) acc[cluster] = [];
          acc[cluster].push(index);
          return acc;
        }, {});

        logger.info("Local AI customer clustering completed", {
          userId: session.user.id,
          customersAnalyzed: customerFeatures.length,
          clustersFound: Object.keys(clusterInsights).length
        });

        return NextResponse.json({
          success: true,
          clustering: {
            clusters: clusters.clusters,
            centroids: clusters.centroids,
            insights: clusterInsights,
            recommendations: [
              "High-value cluster: Focus on premium services",
              "Medium-value cluster: Upsell opportunities",
              "Low-value cluster: Re-engagement campaigns"
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
    logger.error("Local AI API error", error);
    
    return NextResponse.json(
      { 
        error: "AI analysis failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 