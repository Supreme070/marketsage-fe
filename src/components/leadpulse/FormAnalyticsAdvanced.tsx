'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  Edit3,
  Send,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Filter,
  Download,
  Share2,
  Zap,
  Brain,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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

interface FormAnalyticsAdvancedProps {
  className?: string;
}

export default function FormAnalyticsAdvanced({ className }: FormAnalyticsAdvancedProps) {
  const [forms, setForms] = useState<FormAnalytics[]>([]);
  const [insights, setInsights] = useState<FormInsight[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormAnalytics | null>(null);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch form analytics data
  useEffect(() => {
    fetchFormData();
    const interval = setInterval(fetchFormData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchFormData = async () => {
    try {
      const [formsResponse, insightsResponse] = await Promise.all([
        fetch(`/api/leadpulse/form-analytics?timeRange=${timeRange}`),
        fetch('/api/leadpulse/form-insights')
      ]);

      // Use mock data for demo
      const mockForms = generateMockForms();
      setForms(mockForms);
      setInsights(generateMockInsights());
      
      if (mockForms.length > 0 && !selectedForm) {
        setSelectedForm(mockForms[0]);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      const mockForms = generateMockForms();
      setForms(mockForms);
      setInsights(generateMockInsights());
      
      if (mockForms.length > 0) {
        setSelectedForm(mockForms[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get form type color
  const getFormTypeColor = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'demo': return 'bg-green-100 text-green-800';
      case 'newsletter': return 'bg-purple-100 text-purple-800';
      case 'survey': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'issue': return 'border-red-200 bg-red-50 text-red-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'recommendation': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return Zap;
      case 'issue': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'recommendation': return Brain;
      default: return Activity;
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Mock data generators
  const generateMockForms = (): FormAnalytics[] => {
    return [
      {
        id: 'contact_form',
        name: 'Contact Form',
        url: '/contact',
        type: 'contact',
        views: 2450,
        starts: 1680,
        completions: 892,
        conversionRate: 53.1,
        abandonmentRate: 46.9,
        avgCompletionTime: 180,
        deviceBreakdown: { desktop: 55, mobile: 35, tablet: 10 },
        sourceBreakdown: { direct: 30, organic: 40, social: 15, email: 10, paid: 5 },
        fields: [
          {
            id: 'name',
            name: 'full_name',
            type: 'text',
            label: 'Full Name',
            required: true,
            viewCount: 1680,
            startCount: 1650,
            completeCount: 1580,
            errorCount: 45,
            avgTimeSpent: 12,
            dropoffRate: 4.2,
            errorTypes: { 'invalid_format': 25, 'too_short': 15, 'required': 5 }
          },
          {
            id: 'email',
            name: 'email_address',
            type: 'email',
            label: 'Email Address',
            required: true,
            viewCount: 1580,
            startCount: 1520,
            completeCount: 1380,
            errorCount: 85,
            avgTimeSpent: 18,
            dropoffRate: 9.2,
            errorTypes: { 'invalid_email': 65, 'required': 12, 'duplicate': 8 }
          },
          {
            id: 'company',
            name: 'company_name',
            type: 'text',
            label: 'Company Name',
            required: false,
            viewCount: 1380,
            startCount: 1200,
            completeCount: 1150,
            errorCount: 12,
            avgTimeSpent: 15,
            dropoffRate: 4.2,
            errorTypes: { 'too_long': 8, 'invalid_chars': 4 }
          },
          {
            id: 'phone',
            name: 'phone_number',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            viewCount: 1150,
            startCount: 980,
            completeCount: 892,
            errorCount: 68,
            avgTimeSpent: 25,
            dropoffRate: 9.0,
            errorTypes: { 'invalid_format': 45, 'too_short': 15, 'required': 8 }
          },
          {
            id: 'message',
            name: 'message',
            type: 'textarea',
            label: 'Message',
            required: true,
            viewCount: 892,
            startCount: 820,
            completeCount: 892,
            errorCount: 15,
            avgTimeSpent: 120,
            dropoffRate: 0,
            errorTypes: { 'too_short': 10, 'required': 5 }
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'demo_form',
        name: 'Demo Request Form',
        url: '/demo',
        type: 'demo',
        views: 1850,
        starts: 1420,
        completions: 567,
        conversionRate: 39.9,
        abandonmentRate: 60.1,
        avgCompletionTime: 240,
        deviceBreakdown: { desktop: 70, mobile: 25, tablet: 5 },
        sourceBreakdown: { direct: 25, organic: 35, social: 10, email: 20, paid: 10 },
        fields: [
          {
            id: 'business_name',
            name: 'business_name',
            type: 'text',
            label: 'Business Name',
            required: true,
            viewCount: 1420,
            startCount: 1380,
            completeCount: 1250,
            errorCount: 35,
            avgTimeSpent: 20,
            dropoffRate: 9.4,
            errorTypes: { 'required': 20, 'too_short': 10, 'invalid_chars': 5 }
          },
          {
            id: 'business_email',
            name: 'business_email',
            type: 'email',
            label: 'Business Email',
            required: true,
            viewCount: 1250,
            startCount: 1200,
            completeCount: 1050,
            errorCount: 95,
            avgTimeSpent: 22,
            dropoffRate: 12.5,
            errorTypes: { 'invalid_email': 70, 'personal_email': 15, 'required': 10 }
          },
          {
            id: 'company_size',
            name: 'company_size',
            type: 'select',
            label: 'Company Size',
            required: true,
            viewCount: 1050,
            startCount: 920,
            completeCount: 820,
            errorCount: 25,
            avgTimeSpent: 15,
            dropoffRate: 10.9,
            errorTypes: { 'required': 25 }
          },
          {
            id: 'demo_requirements',
            name: 'demo_requirements',
            type: 'textarea',
            label: 'Demo Requirements',
            required: false,
            viewCount: 820,
            startCount: 650,
            completeCount: 567,
            errorCount: 8,
            avgTimeSpent: 180,
            dropoffRate: 12.8,
            errorTypes: { 'too_long': 5, 'inappropriate': 3 }
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'newsletter_form',
        name: 'Newsletter Signup',
        url: '/newsletter',
        type: 'newsletter',
        views: 3200,
        starts: 2890,
        completions: 2456,
        conversionRate: 85.0,
        abandonmentRate: 15.0,
        avgCompletionTime: 45,
        deviceBreakdown: { desktop: 40, mobile: 50, tablet: 10 },
        sourceBreakdown: { direct: 20, organic: 30, social: 35, email: 10, paid: 5 },
        fields: [
          {
            id: 'newsletter_email',
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            viewCount: 2890,
            startCount: 2850,
            completeCount: 2456,
            errorCount: 125,
            avgTimeSpent: 15,
            dropoffRate: 13.8,
            errorTypes: { 'invalid_email': 85, 'already_subscribed': 25, 'required': 15 }
          },
          {
            id: 'interests',
            name: 'interests',
            type: 'checkbox',
            label: 'Interests',
            required: false,
            viewCount: 2456,
            startCount: 1850,
            completeCount: 2456,
            errorCount: 0,
            avgTimeSpent: 30,
            dropoffRate: 0,
            errorTypes: {}
          }
        ],
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const generateMockInsights = (): FormInsight[] => {
    return [
      {
        id: 'insight_1',
        formId: 'contact_form',
        type: 'issue',
        severity: 'high',
        title: 'High Email Field Error Rate',
        description: 'Email field has 85 errors (9.2% drop-off rate) with most errors being invalid email format.',
        recommendation: 'Add real-time email validation and format hints to reduce input errors.',
        impact: {
          potentialImprovement: 15,
          affectedUsers: 140
        },
        fieldId: 'email'
      },
      {
        id: 'insight_2',
        formId: 'demo_form',
        type: 'optimization',
        severity: 'high',
        title: 'Business Email Validation Issue',
        description: 'Demo form rejects personal emails but validation message is unclear, causing 15 errors.',
        recommendation: 'Clarify business email requirement and provide example formats.',
        impact: {
          potentialImprovement: 8,
          affectedUsers: 95
        },
        fieldId: 'business_email'
      },
      {
        id: 'insight_3',
        formId: 'newsletter_form',
        type: 'success',
        severity: 'low',
        title: 'Excellent Newsletter Conversion',
        description: 'Newsletter form achieves 85% conversion rate with minimal friction.',
        recommendation: 'Apply similar simplicity principles to other forms.',
        impact: {
          potentialImprovement: 5,
          affectedUsers: 400
        }
      },
      {
        id: 'insight_4',
        formId: 'contact_form',
        type: 'recommendation',
        severity: 'medium',
        title: 'Phone Number Field Optimization',
        description: 'Phone field has 25-second average completion time with format errors.',
        recommendation: 'Add auto-formatting and country code selection to improve UX.',
        impact: {
          potentialImprovement: 12,
          affectedUsers: 88
        },
        fieldId: 'phone'
      }
    ];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 animate-pulse" />
            <span>Loading form analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalViews = forms.reduce((sum, form) => sum + form.views, 0);
  const totalCompletions = forms.reduce((sum, form) => sum + form.completions, 0);
  const avgConversionRate = forms.reduce((sum, form) => sum + form.conversionRate, 0) / forms.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Advanced Form Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={timeRange === '24h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                >
                  30d
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={fetchFormData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-xl font-semibold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completions</p>
                <p className="text-xl font-semibold">{totalCompletions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Conversion</p>
                <p className="text-xl font-semibold">{avgConversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Forms Tracked</p>
                <p className="text-xl font-semibold">{forms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Forms List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedForm?.id === form.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedForm(form)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{form.name}</h3>
                      <Badge className={getFormTypeColor(form.type)}>
                        {form.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{form.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <span className="font-medium ml-1">{form.views}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completions:</span>
                        <span className="font-medium ml-1">{form.completions}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Rate:</span>
                        <span className="font-medium ml-1 text-green-600">{form.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Form Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedForm ? (
                <>
                  <FileText className="w-5 h-5" />
                  {selectedForm.name} Analytics
                </>
              ) : (
                'Select a form to view analytics'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedForm ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="fields">Field Analysis</TabsTrigger>
                  <TabsTrigger value="funnel">Form Funnel</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Form Performance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Views</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedForm.views.toLocaleString()}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Completions</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedForm.completions.toLocaleString()}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">Conversion Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{selectedForm.conversionRate}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Avg Time</span>
                      </div>
                      <p className="text-2xl font-bold">{formatTime(selectedForm.avgCompletionTime)}</p>
                    </div>
                  </div>

                  {/* Device & Source Breakdown */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">Device Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Desktop</span>
                          <span className="font-medium">{selectedForm.deviceBreakdown.desktop}%</span>
                        </div>
                        <Progress value={selectedForm.deviceBreakdown.desktop} className="h-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mobile</span>
                          <span className="font-medium">{selectedForm.deviceBreakdown.mobile}%</span>
                        </div>
                        <Progress value={selectedForm.deviceBreakdown.mobile} className="h-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tablet</span>
                          <span className="font-medium">{selectedForm.deviceBreakdown.tablet}%</span>
                        </div>
                        <Progress value={selectedForm.deviceBreakdown.tablet} className="h-2" />
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">Traffic Sources</h3>
                      <div className="space-y-2">
                        {Object.entries(selectedForm.sourceBreakdown).map(([source, percentage]) => (
                          <div key={source}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm capitalize">{source}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fields" className="space-y-4">
                  <div className="space-y-3">
                    {selectedForm.fields.map((field) => (
                      <div key={field.id} className="border rounded-lg">
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                field.dropoffRate > 10 ? 'bg-red-500' : 
                                field.dropoffRate > 5 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div>
                                <h3 className="font-medium">{field.label}</h3>
                                <p className="text-sm text-gray-600">{field.type} • {field.required ? 'Required' : 'Optional'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium">{field.completeCount} completions</div>
                                <div className="text-xs text-gray-500">{field.dropoffRate}% drop-off</div>
                              </div>
                              {expandedField === field.id ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedField === field.id && (
                          <div className="px-4 pb-4 border-t bg-gray-50">
                            <div className="pt-4 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Views:</span>
                                <span className="font-medium ml-1">{field.viewCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Starts:</span>
                                <span className="font-medium ml-1">{field.startCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Errors:</span>
                                <span className="font-medium ml-1 text-red-600">{field.errorCount}</span>
                              </div>
                            </div>
                            
                            {Object.keys(field.errorTypes).length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <h4 className="font-medium text-sm mb-2">Error Breakdown:</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(field.errorTypes).map(([error, count]) => (
                                    <div key={error} className="flex justify-between">
                                      <span className="text-gray-600 capitalize">{error.replace('_', ' ')}:</span>
                                      <span className="font-medium">{count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="funnel" className="space-y-4">
                  <div className="space-y-4">
                    {selectedForm.fields.map((field, index) => {
                      const isLast = index === selectedForm.fields.length - 1;
                      const widthPercentage = (field.completeCount / selectedForm.views) * 100;
                      
                      return (
                        <div key={field.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-medium">{field.label}</h3>
                                <p className="text-sm text-gray-600">{field.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{field.completeCount.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">completions</div>
                            </div>
                          </div>
                          
                          {/* Funnel Bar */}
                          <div className="relative">
                            <div className="bg-gray-200 rounded-lg h-6 flex items-center">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg h-full flex items-center justify-between px-3 text-white text-sm font-medium"
                                style={{ width: `${widthPercentage}%` }}
                              >
                                <span>{field.completeCount.toLocaleString()}</span>
                                {field.errorCount > 0 && (
                                  <span className="text-red-200">{field.errorCount} errors</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow between steps */}
                          {!isLast && (
                            <div className="flex justify-center">
                              <ArrowDown className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a form from the left to view detailed analytics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Form Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div key={insight.id} className={`p-4 border-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge variant={insight.severity === 'high' ? 'destructive' : insight.severity === 'medium' ? 'secondary' : 'outline'}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{insight.description}</p>
                  <div className="bg-white/50 p-3 rounded text-sm mb-3">
                    <p className="font-medium text-xs mb-1">💡 Recommendation:</p>
                    <p>{insight.recommendation}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Potential Improvement:</span>
                      <span className="font-medium ml-1 text-green-600">+{insight.impact.potentialImprovement}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Affected Users:</span>
                      <span className="font-medium ml-1">{insight.impact.affectedUsers}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}