'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  Filter,
  Eye,
  MousePointer,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Award,
  MapPin
} from 'lucide-react';

interface FormPerformanceMetrics {
  formId: string;
  formName: string;
  timeRange: string;
  
  // Core Metrics
  totalViews: number;
  totalStarts: number;
  totalCompletions: number;
  conversionRate: number;
  abandonment: {
    rate: number;
    points: { fieldId: string; fieldName: string; dropoffRate: number }[];
  };
  
  // Performance Metrics
  averageTime: number;
  medianTime: number;
  timeDistribution: { range: string; count: number; percentage: number }[];
  errorRate: number;
  
  // Device Performance
  devicePerformance: {
    desktop: { views: number; completions: number; conversionRate: number; avgTime: number };
    mobile: { views: number; completions: number; conversionRate: number; avgTime: number };
    tablet: { views: number; completions: number; conversionRate: number; avgTime: number };
  };
  
  // Geographic Performance (African Markets)
  geoPerformance: {
    country: string;
    views: number;
    completions: number;
    conversionRate: number;
    avgTime: number;
    topCities: { city: string; completions: number }[];
  }[];
  
  // Time-based Performance
  hourlyPerformance: { hour: number; completions: number; conversionRate: number }[];
  dailyTrends: { date: string; views: number; completions: number; conversionRate: number }[];
  
  // Field Performance
  fieldPerformance: {
    fieldId: string;
    fieldName: string;
    type: string;
    required: boolean;
    viewCount: number;
    startCount: number;
    completeCount: number;
    errorCount: number;
    avgTimeSpent: number;
    dropoffRate: number;
    errorBreakdown: { type: string; count: number }[];
  }[];
  
  // A/B Testing Results
  variants: {
    variantId: string;
    name: string;
    views: number;
    completions: number;
    conversionRate: number;
    confidenceLevel: number;
    winner: boolean;
  }[];
}

interface OptimizationInsight {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'conversion' | 'usability' | 'performance' | 'accessibility';
  title: string;
  description: string;
  recommendation: string;
  impact: {
    potential: number;
    effort: 'low' | 'medium' | 'high';
    affectedUsers: number;
  };
  field?: string;
  evidence: string[];
}

interface FormPerformanceDashboardProps {
  formId?: string;
  className?: string;
}

export default function FormPerformanceDashboard({ formId, className }: FormPerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<FormPerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [selectedForm, setSelectedForm] = useState(formId || '');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [compareMode, setCompareMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    if (selectedForm) {
      fetchPerformanceData();
    }
  }, [selectedForm, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      const [performanceRes, insightsRes] = await Promise.all([
        fetch(`/api/leadpulse/forms/${selectedForm}/performance?timeRange=${timeRange}`),
        fetch(`/api/leadpulse/forms/${selectedForm}/optimization-insights`)
      ]);

      if (performanceRes.ok && insightsRes.ok) {
        const performance = await performanceRes.json();
        const insightsData = await insightsRes.json();
        
        setPerformanceData(performance.data);
        setInsights(insightsData.insights);
      } else {
        // Use mock data for demo
        setPerformanceData(generateMockPerformanceData());
        setInsights(generateMockInsights());
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceData(generateMockPerformanceData());
      setInsights(generateMockInsights());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPerformanceData = (): FormPerformanceMetrics => {
    return {
      formId: selectedForm || 'contact_form',
      formName: 'Contact Form',
      timeRange,
      totalViews: 2450,
      totalStarts: 1680,
      totalCompletions: 892,
      conversionRate: 53.1,
      abandonment: {
        rate: 46.9,
        points: [
          { fieldId: 'email', fieldName: 'Email Address', dropoffRate: 15.2 },
          { fieldId: 'phone', fieldName: 'Phone Number', dropoffRate: 12.8 },
          { fieldId: 'company', fieldName: 'Company Name', dropoffRate: 8.5 },
          { fieldId: 'message', fieldName: 'Message', dropoffRate: 10.4 }
        ]
      },
      averageTime: 180,
      medianTime: 145,
      timeDistribution: [
        { range: '0-30s', count: 245, percentage: 14.6 },
        { range: '30s-1m', count: 420, percentage: 25.0 },
        { range: '1-2m', count: 380, percentage: 22.6 },
        { range: '2-5m', count: 485, percentage: 28.9 },
        { range: '5m+', count: 150, percentage: 8.9 }
      ],
      errorRate: 8.2,
      devicePerformance: {
        desktop: { views: 1347, completions: 623, conversionRate: 46.2, avgTime: 165 },
        mobile: { views: 858, completions: 215, conversionRate: 25.1, avgTime: 210 },
        tablet: { views: 245, completions: 54, conversionRate: 22.0, avgTime: 195 }
      },
      geoPerformance: [
        {
          country: 'Nigeria',
          views: 980,
          completions: 425,
          conversionRate: 43.4,
          avgTime: 185,
          topCities: [
            { city: 'Lagos', completions: 185 },
            { city: 'Abuja', completions: 125 },
            { city: 'Port Harcourt', completions: 65 },
            { city: 'Kano', completions: 50 }
          ]
        },
        {
          country: 'Kenya',
          views: 650,
          completions: 245,
          conversionRate: 37.7,
          avgTime: 175,
          topCities: [
            { city: 'Nairobi', completions: 145 },
            { city: 'Mombasa', completions: 65 },
            { city: 'Kisumu', completions: 35 }
          ]
        },
        {
          country: 'South Africa',
          views: 485,
          completions: 142,
          conversionRate: 29.3,
          avgTime: 170,
          topCities: [
            { city: 'Cape Town', completions: 85 },
            { city: 'Johannesburg', completions: 57 }
          ]
        },
        {
          country: 'Ghana',
          views: 335,
          completions: 80,
          conversionRate: 23.9,
          avgTime: 195,
          topCities: [
            { city: 'Accra', completions: 45 },
            { city: 'Kumasi', completions: 35 }
          ]
        }
      ],
      hourlyPerformance: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        completions: Math.floor(Math.random() * 50) + 10,
        conversionRate: Math.floor(Math.random() * 30) + 25
      })),
      dailyTrends: Array.from({ length: 30 }, (_, day) => ({
        date: new Date(Date.now() - (29 - day) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 50,
        completions: Math.floor(Math.random() * 50) + 15,
        conversionRate: Math.floor(Math.random() * 20) + 30
      })),
      fieldPerformance: [
        {
          fieldId: 'name',
          fieldName: 'Full Name',
          type: 'text',
          required: true,
          viewCount: 1680,
          startCount: 1650,
          completeCount: 1580,
          errorCount: 45,
          avgTimeSpent: 12,
          dropoffRate: 4.2,
          errorBreakdown: [
            { type: 'required', count: 20 },
            { type: 'too_short', count: 15 },
            { type: 'invalid_format', count: 10 }
          ]
        },
        {
          fieldId: 'email',
          fieldName: 'Email Address',
          type: 'email',
          required: true,
          viewCount: 1580,
          startCount: 1520,
          completeCount: 1380,
          errorCount: 85,
          avgTimeSpent: 18,
          dropoffRate: 9.2,
          errorBreakdown: [
            { type: 'invalid_email', count: 65 },
            { type: 'required', count: 12 },
            { type: 'duplicate', count: 8 }
          ]
        }
      ],
      variants: [
        {
          variantId: 'original',
          name: 'Original Form',
          views: 1225,
          completions: 446,
          conversionRate: 36.4,
          confidenceLevel: 95,
          winner: false
        },
        {
          variantId: 'variant_a',
          name: 'Simplified Form',
          views: 1225,
          completions: 446,
          conversionRate: 53.1,
          confidenceLevel: 98,
          winner: true
        }
      ]
    };
  };

  const generateMockInsights = (): OptimizationInsight[] => {
    return [
      {
        id: 'insight_1',
        type: 'critical',
        category: 'conversion',
        title: 'Mobile Conversion Crisis',
        description: 'Mobile conversion rate (25.1%) is significantly lower than desktop (46.2%). This represents a major opportunity loss.',
        recommendation: 'Implement mobile-first form design with larger touch targets, simplified layout, and reduced field count for mobile users.',
        impact: {
          potential: 28,
          effort: 'medium',
          affectedUsers: 858
        },
        evidence: [
          'Mobile users take 45s longer to complete forms',
          'Touch target size below recommended 44px',
          'High abandonment at phone number field on mobile'
        ]
      },
      {
        id: 'insight_2',
        type: 'high',
        category: 'usability',
        title: 'Email Field Validation Issues',
        description: 'Email field has highest error rate (85 errors) with 9.2% dropoff rate. Most errors are invalid format.',
        recommendation: 'Add real-time email validation with format hints and suggestions for common typos.',
        impact: {
          potential: 15,
          effort: 'low',
          affectedUsers: 140
        },
        field: 'email',
        evidence: [
          '65 invalid email format errors',
          'Average 18 seconds spent on field',
          'Common typos: @gmial.com, @yahooo.com'
        ]
      },
      {
        id: 'insight_3',
        type: 'high',
        category: 'performance',
        title: 'Regional Performance Disparity',
        description: 'Nigerian users have 43.4% conversion vs 23.9% in Ghana. Cultural/technical factors may be involved.',
        recommendation: 'Localize forms for different markets: local phone formats, payment preferences, and cultural messaging.',
        impact: {
          potential: 20,
          effort: 'high',
          affectedUsers: 670
        },
        evidence: [
          'Ghana users spend 10s longer per field',
          'Higher mobile usage in Ghana (70% vs 35%)',
          'Different business hour patterns'
        ]
      },
      {
        id: 'insight_4',
        type: 'medium',
        category: 'accessibility',
        title: 'Completion Time Optimization',
        description: 'Users taking 5+ minutes have only 12% completion rate vs 78% for under 2 minutes.',
        recommendation: 'Add progress indicators, auto-save functionality, and smart defaults to reduce completion time.',
        impact: {
          potential: 12,
          effort: 'medium',
          affectedUsers: 150
        },
        evidence: [
          'Median time 145s vs average 180s indicates outliers',
          'Long-tail users more likely to abandon',
          'Peak abandonment around 4-minute mark'
        ]
      }
    ];
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'conversion': return Target;
      case 'usability': return Users;
      case 'performance': return Zap;
      case 'accessibility': return Eye;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 animate-pulse" />
            <span>Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Select a form to view performance analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Form Performance Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-xl font-semibold text-green-600">{performanceData.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Completions</p>
                <p className="text-xl font-semibold">{performanceData.totalCompletions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Completion Time</p>
                <p className="text-xl font-semibold">{formatTime(performanceData.averageTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-xl font-semibold text-red-600">{performanceData.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area yAxisId="left" type="monotone" dataKey="completions" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#f59e0b" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData.timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Abandonment Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.abandonment.points.map((point, index) => (
                    <div key={point.fieldId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{point.fieldName}</p>
                        <p className="text-sm text-gray-600">Field #{index + 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-600">{point.dropoffRate}%</p>
                        <p className="text-xs text-gray-500">dropoff rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(performanceData.devicePerformance).map(([device, metrics]) => {
              const DeviceIcon = device === 'desktop' ? Monitor : device === 'mobile' ? Smartphone : Tablet;
              return (
                <Card key={device}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <DeviceIcon className="w-5 h-5" />
                      {device}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Views:</span>
                      <span className="font-medium">{metrics.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completions:</span>
                      <span className="font-medium">{metrics.completions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate:</span>
                      <span className={`font-medium ${
                        metrics.conversionRate > 40 ? 'text-green-600' : 
                        metrics.conversionRate > 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metrics.conversionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Time:</span>
                      <span className="font-medium">{formatTime(metrics.avgTime)}</span>
                    </div>
                    <Progress value={metrics.conversionRate} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <div className="grid gap-4">
            {performanceData.geoPerformance.map((country) => (
              <Card key={country.country}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {country.country}
                    </CardTitle>
                    <Badge variant={country.conversionRate > 35 ? 'default' : 'secondary'}>
                      {country.conversionRate}% conversion
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Views:</span>
                        <span className="font-medium">{country.views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completions:</span>
                        <span className="font-medium">{country.completions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Time:</span>
                        <span className="font-medium">{formatTime(country.avgTime)}</span>
                      </div>
                      <Progress value={country.conversionRate} className="h-2" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Top Cities</h4>
                      <div className="space-y-2">
                        {country.topCities.map((city, index) => (
                          <div key={city.city} className="flex justify-between text-sm">
                            <span>{index + 1}. {city.city}</span>
                            <span className="font-medium">{city.completions}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <div className="space-y-4">
            {performanceData.fieldPerformance.map((field, index) => (
              <Card key={field.fieldId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                        {index + 1}
                      </div>
                      {field.fieldName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={field.required ? 'default' : 'outline'}>
                        {field.required ? 'Required' : 'Optional'}
                      </Badge>
                      <Badge variant={field.dropoffRate > 10 ? 'destructive' : field.dropoffRate > 5 ? 'secondary' : 'outline'}>
                        {field.dropoffRate}% dropoff
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Views:</span>
                          <span className="font-medium">{field.viewCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Starts:</span>
                          <span className="font-medium">{field.startCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completions:</span>
                          <span className="font-medium">{field.completeCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Time:</span>
                          <span className="font-medium">{formatTime(field.avgTimeSpent)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Error Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Errors:</span>
                          <span className="font-medium text-red-600">{field.errorCount}</span>
                        </div>
                        {field.errorBreakdown.map((error) => (
                          <div key={error.type} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{error.type.replace('_', ' ')}:</span>
                            <span className="font-medium">{error.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Completion Funnel</h4>
                      <div className="space-y-2">
                        <div className="bg-gray-200 rounded-lg h-4 flex items-center">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg h-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${(field.completeCount / field.viewCount) * 100}%` }}
                          >
                            {Math.round((field.completeCount / field.viewCount) * 100)}%
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {field.completeCount} of {field.viewCount} completed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.category);
              return (
                <Card key={insight.id} className={`border-2 ${getInsightColor(insight.type)}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.type === 'critical' ? 'destructive' : insight.type === 'high' ? 'secondary' : 'outline'}>
                          {insight.type}
                        </Badge>
                        <Badge variant="outline">
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{insight.description}</p>
                    
                    <div className="bg-white/50 p-3 rounded text-sm">
                      <p className="font-medium text-xs mb-1">💡 Recommendation:</p>
                      <p>{insight.recommendation}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Potential Impact:</span>
                        <span className="font-medium ml-1 text-green-600">+{insight.impact.potential}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Implementation:</span>
                        <span className="font-medium ml-1">{insight.impact.effort} effort</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Affected Users:</span>
                        <span className="font-medium ml-1">{insight.impact.affectedUsers.toLocaleString()}</span>
                      </div>
                    </div>

                    {insight.evidence && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Supporting Evidence:</h4>
                        <ul className="text-sm space-y-1">
                          {insight.evidence.map((evidence, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}