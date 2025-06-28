import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  viewCount: number;
  startCount: number;
  completeCount: number;
  errorCount: number;
  avgTimeSpent: number;
  dropoffRate: number;
  errorTypes: { [key: string]: number };
}

interface FormAnalytics {
  id: string;
  name: string;
  url: string;
  type: 'contact' | 'demo' | 'newsletter' | 'survey' | 'custom';
  views: number;
  starts: number;
  completions: number;
  conversionRate: number;
  abandonmentRate: number;
  avgCompletionTime: number;
  fields: FormField[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  sourceBreakdown: {
    direct: number;
    organic: number;
    social: number;
    email: number;
    paid: number;
  };
  lastUpdated: string;
}

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

// GET: Fetch form analytics data
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

    // Get form data from LeadPulse forms if they exist
    const leadPulseForms = await prisma.leadPulseForm.findMany({
      where: formId ? { id: formId } : {},
      include: {
        fields: true,
        submissions: {
          where: {
            submittedAt: { gte: cutoffTime }
          },
          include: {
            visitor: {
              select: {
                device: true,
                fingerprint: true
              }
            }
          }
        },
        analytics: {
          where: {
            date: { gte: cutoffTime }
          }
        }
      }
    });

    // Get form-related touchpoints as fallback/additional data
    const formTouchpoints = await prisma.leadPulseTouchpoint.findMany({
      where: {
        type: { in: ['FORM_VIEW', 'FORM_START', 'FORM_SUBMIT'] },
        timestamp: { gte: cutoffTime }
      },
      include: {
        visitor: {
          select: {
            device: true,
            fingerprint: true
          }
        }
      }
    });

    // Transform database data to form analytics
    const forms: FormAnalytics[] = [];

    // Process LeadPulse forms
    for (const form of leadPulseForms) {
      const formAnalytics = await processLeadPulseForm(form, formTouchpoints, cutoffTime);
      forms.push(formAnalytics);
    }

    // If no LeadPulse forms, generate analytics from touchpoints
    if (forms.length === 0) {
      const syntheticForms = await generateFormsFromTouchpoints(formTouchpoints, timeRange);
      forms.push(...syntheticForms);
    }

    return NextResponse.json({
      forms,
      metadata: {
        timeRange,
        totalForms: forms.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching form analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form analytics' },
      { status: 500 }
    );
  }
}

// Process LeadPulse form data
async function processLeadPulseForm(form: any, touchpoints: any[], cutoffTime: Date): Promise<FormAnalytics> {
  const formSubmissions = form.submissions || [];
  const formTouchpoints = touchpoints.filter(tp => 
    tp.metadata?.formId === form.id || 
    tp.url?.includes(form.publicUrl || form.id)
  );

  // Calculate basic metrics
  const views = formTouchpoints.filter(tp => tp.type === 'FORM_VIEW').length;
  const starts = formTouchpoints.filter(tp => tp.type === 'FORM_START').length;
  const completions = formSubmissions.length;

  const conversionRate = views > 0 ? (completions / views) * 100 : 0;
  const abandonmentRate = starts > 0 ? ((starts - completions) / starts) * 100 : 0;

  // Calculate average completion time
  const avgCompletionTime = formSubmissions.reduce((sum: number, sub: any) => {
    const startTime = new Date(sub.startedAt || sub.submittedAt);
    const endTime = new Date(sub.submittedAt);
    return sum + (endTime.getTime() - startTime.getTime());
  }, 0) / Math.max(formSubmissions.length, 1);

  // Device breakdown
  const deviceBreakdown = calculateDeviceBreakdown(formSubmissions);

  // Source breakdown (simulated)
  const sourceBreakdown = {
    direct: Math.floor(views * 0.4),
    organic: Math.floor(views * 0.3),
    social: Math.floor(views * 0.15),
    email: Math.floor(views * 0.1),
    paid: Math.floor(views * 0.05)
  };

  // Process form fields
  const fields: FormField[] = form.fields.map((field: any) => processFormField(field, formSubmissions));

  return {
    id: form.id,
    name: form.name,
    url: form.publicUrl || `/forms/${form.id}`,
    type: determineFormType(form.name, form.title),
    views,
    starts,
    completions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    abandonmentRate: Math.round(abandonmentRate * 100) / 100,
    avgCompletionTime: Math.round(avgCompletionTime / 1000), // Convert to seconds
    fields,
    deviceBreakdown,
    sourceBreakdown,
    lastUpdated: new Date().toISOString()
  };
}

// Process individual form field
function processFormField(field: any, submissions: any[]): FormField {
  const fieldSubmissions = submissions.filter(sub => 
    sub.data?.some((data: any) => data.fieldId === field.id)
  );

  // Calculate field metrics
  const viewCount = submissions.length; // All users who viewed the form
  const startCount = fieldSubmissions.length; // Users who interacted with this field
  const completeCount = fieldSubmissions.filter(sub => {
    const fieldData = sub.data?.find((data: any) => data.fieldId === field.id);
    return fieldData && fieldData.value && fieldData.value.trim() !== '';
  }).length;

  const dropoffRate = startCount > 0 ? ((startCount - completeCount) / startCount) * 100 : 0;

  // Simulate error data
  const errorTypes: { [key: string]: number } = {};
  if (field.type === 'email') {
    errorTypes['Invalid format'] = Math.floor(Math.random() * 5);
    errorTypes['Missing @ symbol'] = Math.floor(Math.random() * 3);
  }
  if (field.required) {
    errorTypes['Required field'] = Math.floor(Math.random() * startCount * 0.1);
  }

  return {
    id: field.id,
    name: field.name,
    type: field.type,
    label: field.label,
    required: field.required || false,
    viewCount,
    startCount,
    completeCount,
    errorCount: Object.values(errorTypes).reduce((sum, count) => sum + count, 0),
    avgTimeSpent: Math.floor(Math.random() * 30) + 10, // Simulated
    dropoffRate: Math.round(dropoffRate * 100) / 100,
    errorTypes
  };
}

// Generate synthetic forms from touchpoints if no LeadPulse forms exist
async function generateFormsFromTouchpoints(touchpoints: any[], timeRange: string): Promise<FormAnalytics[]> {
  const formUrls = [...new Set(touchpoints.map(tp => tp.url).filter(Boolean))];
  const forms: FormAnalytics[] = [];

  for (let i = 0; i < Math.min(formUrls.length, 5); i++) {
    const url = formUrls[i];
    const formTouchpoints = touchpoints.filter(tp => tp.url === url);
    
    const views = formTouchpoints.filter(tp => tp.type === 'FORM_VIEW').length;
    const starts = formTouchpoints.filter(tp => tp.type === 'FORM_START').length;
    const completions = formTouchpoints.filter(tp => tp.type === 'FORM_SUBMIT').length;

    const conversionRate = views > 0 ? (completions / views) * 100 : 0;
    const abandonmentRate = starts > 0 ? ((starts - completions) / starts) * 100 : 0;

    // Generate synthetic fields
    const fields = generateSyntheticFields(url, formTouchpoints);

    // Device breakdown
    const deviceBreakdown = calculateDeviceBreakdown(formTouchpoints);

    forms.push({
      id: `synthetic_form_${i}`,
      name: `Form ${i + 1}`,
      url,
      type: determineFormType(url, url),
      views,
      starts,
      completions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      abandonmentRate: Math.round(abandonmentRate * 100) / 100,
      avgCompletionTime: Math.floor(Math.random() * 180) + 60,
      fields,
      deviceBreakdown,
      sourceBreakdown: {
        direct: Math.floor(views * 0.4),
        organic: Math.floor(views * 0.3),
        social: Math.floor(views * 0.15),
        email: Math.floor(views * 0.1),
        paid: Math.floor(views * 0.05)
      },
      lastUpdated: new Date().toISOString()
    });
  }

  return forms;
}

// Helper functions
function calculateDeviceBreakdown(data: any[]): FormAnalytics['deviceBreakdown'] {
  const breakdown = { desktop: 0, mobile: 0, tablet: 0 };
  
  data.forEach(item => {
    const device = item.visitor?.device?.toLowerCase() || item.device?.toLowerCase() || 'desktop';
    if (device.includes('mobile')) {
      breakdown.mobile++;
    } else if (device.includes('tablet')) {
      breakdown.tablet++;
    } else {
      breakdown.desktop++;
    }
  });

  return breakdown;
}

function determineFormType(name: string, title: string): FormAnalytics['type'] {
  const combined = (name + title).toLowerCase();
  
  if (combined.includes('contact')) return 'contact';
  if (combined.includes('demo')) return 'demo';
  if (combined.includes('newsletter') || combined.includes('subscribe')) return 'newsletter';
  if (combined.includes('survey') || combined.includes('feedback')) return 'survey';
  
  return 'custom';
}

function generateSyntheticFields(url: string, touchpoints: any[]): FormField[] {
  const commonFields = [
    { name: 'name', type: 'text', label: 'Full Name', required: true },
    { name: 'email', type: 'email', label: 'Email Address', required: true },
    { name: 'phone', type: 'phone', label: 'Phone Number', required: false },
    { name: 'company', type: 'text', label: 'Company Name', required: false },
    { name: 'message', type: 'textarea', label: 'Message', required: false }
  ];

  const totalTouchpoints = touchpoints.length;
  
  return commonFields.map((field, index) => ({
    id: `field_${index}`,
    name: field.name,
    type: field.type as any,
    label: field.label,
    required: field.required,
    viewCount: totalTouchpoints,
    startCount: Math.floor(totalTouchpoints * (1 - index * 0.1)),
    completeCount: Math.floor(totalTouchpoints * (0.9 - index * 0.1)),
    errorCount: Math.floor(Math.random() * 5),
    avgTimeSpent: Math.floor(Math.random() * 30) + 10,
    dropoffRate: Math.floor(Math.random() * 20) + 5,
    errorTypes: field.type === 'email' 
      ? { 'Invalid format': 2, 'Missing @ symbol': 1 }
      : field.required 
        ? { 'Required field': 3 }
        : {}
  }));
}