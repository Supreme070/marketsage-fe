import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  SupremeAI, 
  analyzeContentWithSupremeAI,
  predictRevenueWithSupremeAI,
  analyzeCustomersWithSupremeAI,
  analyzeMarketWithSupremeAI,
  adaptiveAnalysisWithSupremeAI
} from "@/lib/ai/supreme-ai-engine";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Supreme-AI access requires authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data, context } = body;

    // Log Supreme-AI request
    logger.info("Supreme-AI request received", {
      userId: session.user.id,
      action,
      context,
      timestamp: new Date().toISOString()
    });

    let result;

    switch (action) {
      case 'analyzeContent':
        if (!data.content) {
          return NextResponse.json(
            { error: "Content is required for Supreme-AI analysis" },
            { status: 400 }
          );
        }
        result = await analyzeContentWithSupremeAI(data.content);
        break;

      case 'predictRevenue':
        if (!data.historical || !data.market) {
          return NextResponse.json(
            { error: "Historical data and market factors required for revenue prediction" },
            { status: 400 }
          );
        }
        result = await predictRevenueWithSupremeAI(data.historical, data.market);
        break;

      case 'analyzeCustomers':
        if (!data.customers || !Array.isArray(data.customers)) {
          return NextResponse.json(
            { error: "Customer data array required for Supreme-AI customer analysis" },
            { status: 400 }
          );
        }
        result = await analyzeCustomersWithSupremeAI(data.customers);
        break;

      case 'analyzeMarket':
        if (!data.marketData) {
          return NextResponse.json(
            { error: "Market data required for Supreme-AI market analysis" },
            { status: 400 }
          );
        }
        result = await analyzeMarketWithSupremeAI(data.marketData);
        break;

      case 'adaptiveAnalysis':
        if (!data.inputData || !context) {
          return NextResponse.json(
            { error: "Input data and context required for adaptive analysis" },
            { status: 400 }
          );
        }
        result = await adaptiveAnalysisWithSupremeAI(data.inputData, context);
        break;

      case 'comprehensiveAnalysis':
        // Supreme-AI comprehensive analysis - combines multiple models
        const comprehensiveResult = {
          content: data.content ? await analyzeContentWithSupremeAI(data.content) : null,
          revenue: (data.historical && data.market) ? await predictRevenueWithSupremeAI(data.historical, data.market) : null,
          customers: data.customers ? await analyzeCustomersWithSupremeAI(data.customers) : null,
          market: data.marketData ? await analyzeMarketWithSupremeAI(data.marketData) : null
        };

        // Calculate overall Supreme-AI score
        const analyses = Object.values(comprehensiveResult).filter(Boolean);
        const avgSupremeScore = analyses.reduce((sum, analysis) => sum + (analysis?.supremeScore || 0), 0) / Math.max(analyses.length, 1);
        const overallConfidence = analyses.reduce((sum, analysis) => sum + (analysis?.confidence || 0), 0) / Math.max(analyses.length, 1);

        result = {
          success: true,
          confidence: overallConfidence,
          timestamp: new Date(),
          model: 'Supreme-AI Comprehensive Analysis v2.0',
          data: comprehensiveResult,
          insights: [
            `Supreme-AI processed ${analyses.length} analysis modules`,
            `Overall Supreme-AI confidence: ${overallConfidence.toFixed(1)}%`,
            `Comprehensive intelligence score: ${avgSupremeScore.toFixed(0)}/100`,
            'Multi-model ensemble analysis complete'
          ],
          recommendations: [
            avgSupremeScore > 80 ? 'Excellent data quality - all systems optimized' : 'Consider data quality improvements',
            overallConfidence > 75 ? 'High confidence analysis - proceed with recommendations' : 'Monitor results and refine inputs',
            'Supreme-AI suggests regular comprehensive analysis for optimal performance',
            'Adaptive learning enabled - system will improve with usage'
          ],
          supremeScore: Math.round(avgSupremeScore)
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Supreme-AI supports: analyzeContent, predictRevenue, analyzeCustomers, analyzeMarket, adaptiveAnalysis, comprehensiveAnalysis" },
          { status: 400 }
        );
    }

    // Log successful Supreme-AI response
    logger.info("Supreme-AI analysis completed", {
      userId: session.user.id,
      action,
      success: result.success,
      confidence: result.confidence,
      supremeScore: result.supremeScore,
      model: result.model
    });

    // Add Supreme-AI branding to response
    return NextResponse.json({
      ...result,
      supremeAI: {
        version: "2.0",
        powered: "Supreme-AI Intelligence Engine",
        capabilities: [
          "Advanced ML Models",
          "Predictive Analytics", 
          "Customer Intelligence",
          "Content Intelligence",
          "Market Intelligence",
          "Real-time Learning"
        ]
      }
    });

  } catch (error) {
    logger.error("Supreme-AI analysis failed", error);
    
    return NextResponse.json(
      { 
        error: "Supreme-AI analysis failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        supremeAI: {
          status: "error",
          message: "Supreme-AI engine encountered an error"
        }
      },
      { status: 500 }
    );
  }
} 