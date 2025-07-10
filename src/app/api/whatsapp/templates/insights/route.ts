/**
 * WhatsApp Template Approval Insights API Endpoint
 * 
 * Provides analytics and insights for template approval process.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappTemplateApproval } from '@/lib/whatsapp-template-approval';
import { 
  handleApiError, 
  unauthorized 
} from '@/lib/errors';

// GET - Get template approval insights
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const insights = await whatsappTemplateApproval.getApprovalInsights(session.user.id);

    // Calculate additional metrics
    const approvalRate = insights.totalTemplates > 0 ? 
      Math.round((insights.approvalStats.approved / insights.totalTemplates) * 100) : 0;

    const rejectionRate = insights.totalTemplates > 0 ?
      Math.round((insights.approvalStats.rejected / insights.totalTemplates) * 100) : 0;

    return NextResponse.json({
      success: true,
      insights: {
        ...insights,
        approvalRate,
        rejectionRate,
        pendingReview: insights.approvalStats.pending,
        recommendations: this.generateRecommendations(insights)
      }
    });

  } catch (error) {
    console.error('Error getting template insights:', error);
    return handleApiError(error, '/api/whatsapp/templates/insights/route.ts');
  }
}

function generateRecommendations(insights: any): Array<{
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const recommendations = [];

  // High rejection rate
  if (insights.totalTemplates >= 5 && insights.approvalStats.rejected / insights.totalTemplates > 0.3) {
    recommendations.push({
      type: 'quality_improvement',
      message: 'High rejection rate detected. Review Meta\'s template guidelines and common rejection reasons.',
      priority: 'high' as const
    });
  }

  // Slow approval time
  if (insights.averageApprovalTime > 72) {
    recommendations.push({
      type: 'approval_time',
      message: 'Templates are taking longer than usual to approve. Ensure compliance with Meta guidelines.',
      priority: 'medium' as const
    });
  }

  // Low quality scores
  const totalQuality = insights.qualityScoreDistribution.green + 
                      insights.qualityScoreDistribution.yellow + 
                      insights.qualityScoreDistribution.red;
  
  if (totalQuality > 0 && insights.qualityScoreDistribution.red / totalQuality > 0.2) {
    recommendations.push({
      type: 'quality_score',
      message: 'Many templates have low quality scores. Focus on user engagement and compliance.',
      priority: 'high' as const
    });
  }

  // Common rejection reasons
  if (insights.commonRejectionReasons.length > 0) {
    const topReason = insights.commonRejectionReasons[0];
    recommendations.push({
      type: 'rejection_pattern',
      message: `Most common rejection reason: "${topReason.reason}". Address this in future templates.`,
      priority: 'medium' as const
    });
  }

  // Too many draft templates
  if (insights.approvalStats.draft > 5) {
    recommendations.push({
      type: 'workflow_efficiency',
      message: 'You have many draft templates. Consider submitting them for approval or cleaning up unused drafts.',
      priority: 'low' as const
    });
  }

  return recommendations;
}