import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface FormInsight {
  id: string;
  formId: string;
  type: 'optimization' | 'issue' | 'success' | 'recommendation';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  impact: {
    potentialImprovement: number;
    affectedUsers: number;
  };
  fieldId?: string;
}

// GET: Fetch form insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const formId = searchParams.get('formId');

    // Calculate time cutoff
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get form analytics data to generate insights
    const forms = await prisma.leadPulseForm.findMany({
      where: formId ? { id: formId } : {},
      include: {
        submissions: {
          where: {
            submittedAt: { gte: cutoffTime }
          },
          include: {
            visitor: {
              select: {
                device: true
              }
            }
          }
        },
        fields: true
      }
    });

    // Get form touchpoints for additional analysis
    const formTouchpoints = await prisma.leadPulseTouchpoint.findMany({
      where: {
        type: { in: ['FORM_VIEW', 'FORM_START', 'FORM_SUBMIT'] },
        timestamp: { gte: cutoffTime }
      },
      include: {
        visitor: {
          select: {
            device: true
          }
        }
      }
    });

    // Generate insights based on data analysis
    const insights: FormInsight[] = [];

    // Process each form
    for (const form of forms) {
      const formInsights = await generateFormInsights(form, formTouchpoints);
      insights.push(...formInsights);
    }

    // Add general insights from touchpoint patterns
    if (forms.length === 0) {
      const generalInsights = generateGeneralInsights(formTouchpoints);
      insights.push(...generalInsights);
    }

    return NextResponse.json({
      insights,
      metadata: {
        timeRange,
        totalInsights: insights.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching form insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form insights' },
      { status: 500 }
    );
  }
}

// Generate insights for a specific form
async function generateFormInsights(form: any, touchpoints: any[]): Promise<FormInsight[]> {
  const insights: FormInsight[] = [];
  const submissions = form.submissions || [];
  
  // Calculate form metrics
  const formTouchpoints = touchpoints.filter(tp => 
    tp.metadata?.formId === form.id || 
    tp.url?.includes(form.id)
  );
  
  const views = formTouchpoints.filter(tp => tp.type === 'FORM_VIEW').length;
  const starts = formTouchpoints.filter(tp => tp.type === 'FORM_START').length;
  const completions = submissions.length;
  
  const conversionRate = views > 0 ? (completions / views) * 100 : 0;
  const abandonmentRate = starts > 0 ? ((starts - completions) / starts) * 100 : 0;

  // Insight 1: Low conversion rate
  if (conversionRate < 15 && views > 10) {
    insights.push({
      id: `insight_${form.id}_conversion`,
      formId: form.id,
      type: 'issue',
      severity: conversionRate < 5 ? 'high' : 'medium',
      title: 'Low Form Conversion Rate',
      description: `Form conversion rate is ${conversionRate.toFixed(1)}%, below industry average of 20-25%`,
      recommendation: 'Simplify form fields, add progress indicators, and improve value proposition messaging',
      impact: {
        potentialImprovement: Math.round((20 - conversionRate) * views / 100),
        affectedUsers: views
      }
    });
  }

  // Insight 2: High abandonment rate
  if (abandonmentRate > 40 && starts > 5) {
    insights.push({
      id: `insight_${form.id}_abandonment`,
      formId: form.id,
      type: 'issue',
      severity: abandonmentRate > 70 ? 'high' : 'medium',
      title: 'High Form Abandonment',
      description: `${abandonmentRate.toFixed(1)}% of users abandon the form after starting`,
      recommendation: 'Implement auto-save, reduce required fields, and add inline validation',
      impact: {
        potentialImprovement: Math.round(abandonmentRate * starts / 200), // 50% improvement
        affectedUsers: starts
      }
    });
  }

  // Insight 3: Mobile performance issues
  const mobileSubmissions = submissions.filter(sub => 
    sub.visitor?.device?.toLowerCase().includes('mobile')
  );
  const mobileViews = formTouchpoints.filter(tp => 
    tp.type === 'FORM_VIEW' && 
    tp.visitor?.device?.toLowerCase().includes('mobile')
  ).length;
  
  const mobileConversionRate = mobileViews > 0 ? (mobileSubmissions.length / mobileViews) * 100 : 0;
  
  if (mobileConversionRate < conversionRate * 0.7 && mobileViews > 5) {
    insights.push({
      id: `insight_${form.id}_mobile`,
      formId: form.id,
      type: 'optimization',
      severity: 'medium',
      title: 'Mobile Conversion Gap',
      description: `Mobile conversion rate (${mobileConversionRate.toFixed(1)}%) is significantly lower than desktop`,
      recommendation: 'Optimize form for mobile: larger buttons, simplified layout, and touch-friendly inputs',
      impact: {
        potentialImprovement: Math.round((conversionRate - mobileConversionRate) * mobileViews / 100),
        affectedUsers: mobileViews
      }
    });
  }

  // Insight 4: Field-specific issues
  for (const field of form.fields) {
    const fieldSubmissions = submissions.filter(sub => 
      sub.data?.some((data: any) => data.fieldId === field.id && data.value)
    );
    
    const fieldCompletionRate = submissions.length > 0 ? (fieldSubmissions.length / submissions.length) * 100 : 0;
    
    if (fieldCompletionRate < 60 && submissions.length > 3) {
      insights.push({
        id: `insight_${form.id}_field_${field.id}`,
        formId: form.id,
        type: 'issue',
        severity: fieldCompletionRate < 30 ? 'high' : 'medium',
        title: `Field Drop-off: ${field.label}`,
        description: `Only ${fieldCompletionRate.toFixed(1)}% of users complete the "${field.label}" field`,
        recommendation: field.required 
          ? 'Consider making this field optional or provide better guidance'
          : 'Improve field placeholder text and validation messages',
        impact: {
          potentialImprovement: Math.round((100 - fieldCompletionRate) * submissions.length / 200),
          affectedUsers: submissions.length
        },
        fieldId: field.id
      });
    }
  }

  // Insight 5: Success pattern
  if (conversionRate > 25 && views > 10) {
    insights.push({
      id: `insight_${form.id}_success`,
      formId: form.id,
      type: 'success',
      severity: 'low',
      title: 'High-Performing Form',
      description: `Excellent conversion rate of ${conversionRate.toFixed(1)}% - above industry average`,
      recommendation: 'Use this form as a template for other forms and consider A/B testing variations',
      impact: {
        potentialImprovement: 0,
        affectedUsers: views
      }
    });
  }

  return insights;
}

// Generate general insights from touchpoint patterns
function generateGeneralInsights(touchpoints: any[]): FormInsight[] {
  const insights: FormInsight[] = [];
  
  const views = touchpoints.filter(tp => tp.type === 'FORM_VIEW').length;
  const starts = touchpoints.filter(tp => tp.type === 'FORM_START').length;
  const completions = touchpoints.filter(tp => tp.type === 'FORM_SUBMIT').length;
  
  if (views === 0) return insights;
  
  const conversionRate = (completions / views) * 100;
  const startRate = (starts / views) * 100;
  
  // General conversion insight
  if (conversionRate < 15) {
    insights.push({
      id: 'insight_general_conversion',
      formId: 'general',
      type: 'recommendation',
      severity: 'medium',
      title: 'Overall Form Performance Opportunity',
      description: `Site-wide form conversion rate is ${conversionRate.toFixed(1)}%`,
      recommendation: 'Implement form optimization best practices across all forms',
      impact: {
        potentialImprovement: Math.round((20 - conversionRate) * views / 100),
        affectedUsers: views
      }
    });
  }

  // Start rate insight
  if (startRate < 30) {
    insights.push({
      id: 'insight_general_engagement',
      formId: 'general',
      type: 'optimization',
      severity: 'medium',
      title: 'Low Form Engagement',
      description: `Only ${startRate.toFixed(1)}% of visitors interact with forms`,
      recommendation: 'Improve form visibility, add compelling CTAs, and reduce initial friction',
      impact: {
        potentialImprovement: Math.round((40 - startRate) * views / 100),
        affectedUsers: views
      }
    });
  }

  // Device-specific insight
  const mobileViews = touchpoints.filter(tp => 
    tp.type === 'FORM_VIEW' && 
    tp.visitor?.device?.toLowerCase().includes('mobile')
  ).length;
  
  const mobileCompletions = touchpoints.filter(tp => 
    tp.type === 'FORM_SUBMIT' && 
    tp.visitor?.device?.toLowerCase().includes('mobile')
  ).length;
  
  const mobileConversionRate = mobileViews > 0 ? (mobileCompletions / mobileViews) * 100 : 0;
  
  if (mobileViews > views * 0.3 && mobileConversionRate < conversionRate * 0.8) {
    insights.push({
      id: 'insight_general_mobile',
      formId: 'general',
      type: 'optimization',
      severity: 'high',
      title: 'Mobile Form Optimization Needed',
      description: `Mobile form conversion (${mobileConversionRate.toFixed(1)}%) lags behind overall performance`,
      recommendation: 'Prioritize mobile form optimization across all forms',
      impact: {
        potentialImprovement: Math.round((conversionRate - mobileConversionRate) * mobileViews / 100),
        affectedUsers: mobileViews
      }
    });
  }

  return insights;
}