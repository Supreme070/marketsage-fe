/**
 * LeadPulse Form Analytics Dashboard
 * 
 * Comprehensive analytics dashboard for form performance tracking
 */

'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Eye, 
  Users, 
  TrendingUp, 
  ArrowDown,
  ArrowUp,
  Activity,
  Target,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Clock,
  MousePointer,
  Send
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormAnalytics {
  formId: string;
  formName: string;
  status: string;
  dateRange: {
    from: string;
    to: string;
  };
  metrics: {
    totalViews: number;
    uniqueViews: number;
    submissions: number;
    conversions: number;
    conversionRate: number;
    averageTime: number;
    bounceRate: number;
    fieldInteractions: number;
  };
  trends: {
    viewsChange: number;
    submissionsChange: number;
    conversionChange: number;
  };
  dailyStats: Array<{
    date: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
  fieldAnalytics: Array<{
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    interactions: number;
    abandonment: number;
    errorRate: number;
    timeSpent: number;
  }>;
  trafficSources: Array<{
    source: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
}

interface FormAnalyticsDashboardProps {
  formId?: string;
  timeRange?: string;
}

export function FormAnalyticsDashboard({ 
  formId, 
  timeRange = '30d' 
}: FormAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedForm, setSelectedForm] = useState(formId || '');
  const [forms, setForms] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // First, fetch available forms if no specific form is selected
        if (!selectedForm) {
          const formsResponse = await fetch('/api/leadpulse/forms');
          const formsData = await formsResponse.json();
          setForms(formsData.forms || []);
          if (formsData.forms?.[0]) {
            setSelectedForm(formsData.forms[0].id);
            return; // Let the next useEffect handle the analytics fetch
          }
        }

        if (selectedForm) {
          const response = await fetch(
            `/api/leadpulse/forms/${selectedForm}/analytics?timeRange=${selectedTimeRange}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setAnalytics(data);
          } else {
            // Fallback to mock data for development
            setAnalytics(generateMockAnalytics(selectedForm));
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Use mock data as fallback
        if (selectedForm) {
          setAnalytics(generateMockAnalytics(selectedForm));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedForm, selectedTimeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">
            Select a form to view its analytics or create your first form.
          </p>
          <Button>Create Form</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Form Analytics</h2>
          <p className="text-gray-600">
            Performance insights for your forms
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Form Selector */}
          {forms.length > 0 && (
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Time Range Selector */}
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{analytics.formName}</CardTitle>
              <CardDescription>
                {analytics.dateRange.from} - {analytics.dateRange.to}
              </CardDescription>
            </div>
            <Badge variant={analytics.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {analytics.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Views"
          value={analytics.metrics.totalViews}
          change={analytics.trends.viewsChange}
          icon={<Eye className="w-4 h-4" />}
          format="number"
        />
        <MetricCard
          title="Submissions"
          value={analytics.metrics.submissions}
          change={analytics.trends.submissionsChange}
          icon={<Send className="w-4 h-4" />}
          format="number"
        />
        <MetricCard
          title="Conversion Rate"
          value={analytics.metrics.conversionRate}
          change={analytics.trends.conversionChange}
          icon={<Target className="w-4 h-4" />}
          format="percentage"
        />
        <MetricCard
          title="Avg. Time"
          value={analytics.metrics.averageTime}
          icon={<Clock className="w-4 h-4" />}
          format="duration"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fields">Field Analysis</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Views</span>
                  <span className="font-medium">{analytics.metrics.uniqueViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Field Interactions</span>
                  <span className="font-medium">{analytics.metrics.fieldInteractions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="font-medium">{analytics.metrics.bounceRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversions</span>
                  <span className="font-medium">{analytics.metrics.conversions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Daily Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization would go here</p>
                    <p className="text-xs">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Performance Analysis</CardTitle>
              <CardDescription>
                How users interact with each form field
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.fieldAnalytics.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{field.fieldLabel}</h4>
                        <p className="text-sm text-gray-600">
                          {field.fieldType} • {field.fieldName}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {field.interactions} interactions
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-red-600">
                          {field.abandonment}%
                        </p>
                        <p className="text-xs text-gray-600">Abandonment</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-orange-600">
                          {field.errorRate}%
                        </p>
                        <p className="text-xs text-gray-600">Error Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">
                          {field.timeSpent}s
                        </p>
                        <p className="text-xs text-gray-600">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>
                Where your form visitors are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{source.source}</h4>
                      <p className="text-sm text-gray-600">
                        {source.views} views • {source.submissions} submissions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {source.conversionRate}%
                      </p>
                      <p className="text-xs text-gray-600">Conversion</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Daily performance over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Trend visualization would go here</p>
                  <p className="text-xs">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  format: 'number' | 'percentage' | 'duration' | 'currency';
}

function MetricCard({ title, value, change, icon, format }: MetricCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage':
        return `${val}%`;
      case 'duration':
        return `${val}s`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value, format)}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {change > 0 ? (
              <ArrowUp className="w-3 h-3 mr-1 text-green-600" />
            ) : (
              <ArrowDown className="w-3 h-3 mr-1 text-red-600" />
            )}
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}% from last period
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data generator for development/fallback
function generateMockAnalytics(formId: string): FormAnalytics {
  return {
    formId,
    formName: 'Contact Form',
    status: 'PUBLISHED',
    dateRange: {
      from: '2024-05-01',
      to: '2024-05-31'
    },
    metrics: {
      totalViews: 2847,
      uniqueViews: 2453,
      submissions: 342,
      conversions: 287,
      conversionRate: 12.0,
      averageTime: 147,
      bounceRate: 34.2,
      fieldInteractions: 1923
    },
    trends: {
      viewsChange: 15.3,
      submissionsChange: 8.7,
      conversionChange: -2.1
    },
    dailyStats: [],
    fieldAnalytics: [
      {
        fieldName: 'email',
        fieldLabel: 'Email Address',
        fieldType: 'EMAIL',
        interactions: 298,
        abandonment: 5.2,
        errorRate: 2.1,
        timeSpent: 8.3
      },
      {
        fieldName: 'company',
        fieldLabel: 'Company Name',
        fieldType: 'TEXT',
        interactions: 276,
        abandonment: 12.8,
        errorRate: 0.8,
        timeSpent: 12.7
      },
      {
        fieldName: 'message',
        fieldLabel: 'Message',
        fieldType: 'TEXTAREA',
        interactions: 234,
        abandonment: 18.4,
        errorRate: 1.2,
        timeSpent: 45.6
      }
    ],
    trafficSources: [
      {
        source: 'organic',
        views: 1234,
        submissions: 156,
        conversionRate: 12.6
      },
      {
        source: 'direct',
        views: 876,
        submissions: 98,
        conversionRate: 11.2
      },
      {
        source: 'social',
        views: 543,
        submissions: 67,
        conversionRate: 12.3
      },
      {
        source: 'paid',
        views: 194,
        submissions: 21,
        conversionRate: 10.8
      }
    ]
  };
}