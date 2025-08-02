'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Play,
  Pause,
  Square,
  Award,
  AlertTriangle,
  CheckCircle,
  Copy,
  Settings,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Crown,
  Zap,
  Brain,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  type: 'original' | 'variant';
  formConfig: {
    title?: string;
    description?: string;
    fields: any[];
    styling?: {
      theme: string;
      buttonColor: string;
      backgroundColor: string;
    };
    layout?: {
      columns: number;
      spacing: string;
      alignment: string;
    };
  };
  traffic: number; // Percentage of traffic allocated
  status: 'draft' | 'running' | 'paused' | 'completed' | 'winner';
  
  // Performance Metrics
  views: number;
  starts: number;
  completions: number;
  conversionRate: number;
  avgCompletionTime: number;
  bounceRate: number;
  
  // Statistical Significance
  confidenceLevel: number;
  pValue: number;
  improvement: number; // % improvement over control
  sampleSize: number;
  requiredSampleSize: number;
  
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  formId: string;
  formName: string;
  hypothesis: string;
  successMetric: 'conversion_rate' | 'completion_time' | 'error_rate' | 'engagement';
  
  // Test Configuration
  trafficAllocation: number; // Percentage of total traffic
  duration: number; // Days
  minimumSampleSize: number;
  confidenceLevel: number;
  
  // Test Status
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  variants: ABTestVariant[];
  winner?: string;
  
  // Results
  totalViews: number;
  totalConversions: number;
  overallConversionRate: number;
  significance: 'not_significant' | 'approaching' | 'significant' | 'highly_significant';
  
  // Timing
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  estimatedCompletionAt?: string;
  
  // Insights
  insights: {
    type: 'performance' | 'statistical' | 'recommendation';
    title: string;
    description: string;
    actionable: boolean;
  }[];
}

interface ABTestingProps {
  formId?: string;
  className?: string;
}

export default function FormABTesting({ formId, className }: ABTestingProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states for creating tests
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    hypothesis: '',
    successMetric: 'conversion_rate' as const,
    duration: 14,
    trafficAllocation: 50,
    confidenceLevel: 95
  });

  const [newVariant, setNewVariant] = useState({
    name: '',
    description: '',
    changes: [] as { type: string; field: string; value: string }[]
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchABTests();
  }, [formId]);

  const fetchABTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v2/leadpulse/ab-tests${formId ? `?formId=${formId}` : ''}`);
      
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests);
        if (data.tests.length > 0 && !selectedTest) {
          setSelectedTest(data.tests[0]);
        }
      } else {
        // Use mock data for demo
        const mockTests = generateMockTests();
        setTests(mockTests);
        if (mockTests.length > 0) {
          setSelectedTest(mockTests[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      const mockTests = generateMockTests();
      setTests(mockTests);
      if (mockTests.length > 0) {
        setSelectedTest(mockTests[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTests = (): ABTest[] => {
    return [
      {
        id: 'test_1',
        name: 'Contact Form Optimization',
        description: 'Testing simplified form layout vs original design',
        formId: 'contact_form',
        formName: 'Contact Form',
        hypothesis: 'Reducing form fields from 5 to 3 will improve conversion rate by at least 15%',
        successMetric: 'conversion_rate',
        trafficAllocation: 80,
        duration: 14,
        minimumSampleSize: 1000,
        confidenceLevel: 95,
        status: 'running',
        totalViews: 2450,
        totalConversions: 892,
        overallConversionRate: 36.4,
        significance: 'significant',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-16T09:00:00Z',
        estimatedCompletionAt: '2024-01-30T09:00:00Z',
        variants: [
          {
            id: 'original',
            name: 'Original Form',
            description: 'Current 5-field contact form',
            type: 'original',
            formConfig: {
              title: 'Get in Touch',
              fields: [
                { type: 'text', label: 'Full Name', required: true },
                { type: 'email', label: 'Email Address', required: true },
                { type: 'text', label: 'Company Name', required: false },
                { type: 'phone', label: 'Phone Number', required: true },
                { type: 'textarea', label: 'Message', required: true }
              ]
            },
            traffic: 50,
            status: 'running',
            views: 1225,
            starts: 980,
            completions: 446,
            conversionRate: 36.4,
            avgCompletionTime: 180,
            bounceRate: 45.2,
            confidenceLevel: 95,
            pValue: 0.02,
            improvement: 0,
            sampleSize: 1225,
            requiredSampleSize: 500,
            createdAt: '2024-01-15T10:00:00Z',
            startedAt: '2024-01-16T09:00:00Z'
          },
          {
            id: 'variant_a',
            name: 'Simplified Form',
            description: 'Reduced to 3 essential fields',
            type: 'variant',
            formConfig: {
              title: 'Quick Contact',
              fields: [
                { type: 'text', label: 'Full Name', required: true },
                { type: 'email', label: 'Email Address', required: true },
                { type: 'textarea', label: 'How can we help?', required: true }
              ]
            },
            traffic: 50,
            status: 'running',
            views: 1225,
            starts: 1050,
            completions: 446,
            conversionRate: 42.5,
            avgCompletionTime: 120,
            bounceRate: 38.8,
            confidenceLevel: 95,
            pValue: 0.02,
            improvement: 16.8,
            sampleSize: 1225,
            requiredSampleSize: 500,
            createdAt: '2024-01-15T10:00:00Z',
            startedAt: '2024-01-16T09:00:00Z'
          }
        ],
        winner: 'variant_a',
        insights: [
          {
            type: 'performance',
            title: 'Variant A Shows Strong Performance',
            description: 'Simplified form achieved 16.8% improvement in conversion rate with 95% confidence.',
            actionable: true
          },
          {
            type: 'statistical',
            title: 'Statistical Significance Achieved',
            description: 'Test reached statistical significance (p-value: 0.02) after 1,225 views per variant.',
            actionable: false
          },
          {
            type: 'recommendation',
            title: 'Ready to Implement Winner',
            description: 'Consider implementing Variant A as the new default form design.',
            actionable: true
          }
        ]
      },
      {
        id: 'test_2',
        name: 'Demo Request CTA Testing',
        description: 'Testing different call-to-action button styles and copy',
        formId: 'demo_form',
        formName: 'Demo Request Form',
        hypothesis: 'More prominent CTA button with action-oriented copy will increase form starts by 20%',
        successMetric: 'conversion_rate',
        trafficAllocation: 60,
        duration: 21,
        minimumSampleSize: 800,
        confidenceLevel: 95,
        status: 'running',
        totalViews: 1200,
        totalConversions: 234,
        overallConversionRate: 19.5,
        significance: 'approaching',
        createdAt: '2024-01-20T14:00:00Z',
        startedAt: '2024-01-22T09:00:00Z',
        estimatedCompletionAt: '2024-02-12T09:00:00Z',
        variants: [
          {
            id: 'original_b',
            name: 'Original CTA',
            description: 'Standard "Submit" button',
            type: 'original',
            formConfig: {
              title: 'Request Demo',
              fields: []
            },
            traffic: 33,
            status: 'running',
            views: 400,
            starts: 320,
            completions: 72,
            conversionRate: 18.0,
            avgCompletionTime: 240,
            bounceRate: 52.5,
            confidenceLevel: 85,
            pValue: 0.15,
            improvement: 0,
            sampleSize: 400,
            requiredSampleSize: 800,
            createdAt: '2024-01-20T14:00:00Z',
            startedAt: '2024-01-22T09:00:00Z'
          },
          {
            id: 'variant_b1',
            name: 'Action-Oriented CTA',
            description: '"Get My Free Demo" button',
            type: 'variant',
            formConfig: {
              title: 'Request Demo',
              fields: []
            },
            traffic: 33,
            status: 'running',
            views: 400,
            starts: 348,
            completions: 85,
            conversionRate: 21.3,
            avgCompletionTime: 220,
            bounceRate: 48.2,
            confidenceLevel: 85,
            pValue: 0.15,
            improvement: 18.3,
            sampleSize: 400,
            requiredSampleSize: 800,
            createdAt: '2024-01-20T14:00:00Z',
            startedAt: '2024-01-22T09:00:00Z'
          },
          {
            id: 'variant_b2',
            name: 'Urgent CTA',
            description: '"Start My Demo Now" with urgency',
            type: 'variant',
            formConfig: {
              title: 'Request Demo',
              fields: []
            },
            traffic: 34,
            status: 'running',
            views: 400,
            starts: 332,
            completions: 77,
            conversionRate: 19.3,
            avgCompletionTime: 235,
            bounceRate: 50.8,
            confidenceLevel: 75,
            pValue: 0.25,
            improvement: 7.2,
            sampleSize: 400,
            requiredSampleSize: 800,
            createdAt: '2024-01-20T14:00:00Z',
            startedAt: '2024-01-22T09:00:00Z'
          }
        ],
        insights: [
          {
            type: 'performance',
            title: 'Action-Oriented CTA Leading',
            description: 'Variant B1 shows 18.3% improvement but needs more data for significance.',
            actionable: false
          },
          {
            type: 'statistical',
            title: 'Approaching Statistical Significance',
            description: 'Test is 75% complete. Estimated 5 more days to reach statistical significance.',
            actionable: false
          }
        ]
      }
    ];
  };

  const createTest = async () => {
    try {
      const response = await fetch('/api/v2/leadpulse/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTest,
          formId: formId || 'default'
        })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchABTests();
        setShowCreateDialog(false);
        setNewTest({
          name: '',
          description: '',
          hypothesis: '',
          successMetric: 'conversion_rate',
          duration: 14,
          trafficAllocation: 50,
          confidenceLevel: 95
        });
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const startTest = async (testId: string) => {
    try {
      await fetch(`/api/v2/leadpulse/ab-tests/${testId}/start`, {
        method: 'POST'
      });
      await fetchABTests();
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const pauseTest = async (testId: string) => {
    try {
      await fetch(`/api/v2/leadpulse/ab-tests/${testId}/pause`, {
        method: 'POST'
      });
      await fetchABTests();
    } catch (error) {
      console.error('Error pausing test:', error);
    }
  };

  const endTest = async (testId: string, winnerId?: string) => {
    try {
      await fetch(`/api/v2/leadpulse/ab-tests/${testId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: winnerId })
      });
      await fetchABTests();
    } catch (error) {
      console.error('Error ending test:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'highly_significant': return 'text-green-600';
      case 'significant': return 'text-green-500';
      case 'approaching': return 'text-yellow-600';
      case 'not_significant': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 animate-pulse" />
            <span>Loading A/B tests...</span>
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
              <FlaskConical className="w-5 h-5" />
              A/B Testing Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New A/B Test</DialogTitle>
                    <DialogDescription>
                      Set up a new A/B test to optimize your form performance
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-name">Test Name</Label>
                      <Input
                        id="test-name"
                        value={newTest.name}
                        onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                        placeholder="e.g., Contact Form Optimization"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-description">Description</Label>
                      <Textarea
                        id="test-description"
                        value={newTest.description}
                        onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                        placeholder="Brief description of what you're testing"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-hypothesis">Hypothesis</Label>
                      <Textarea
                        id="test-hypothesis"
                        value={newTest.hypothesis}
                        onChange={(e) => setNewTest({ ...newTest, hypothesis: e.target.value })}
                        placeholder="e.g., Reducing form fields will improve conversion by 15%"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="success-metric">Success Metric</Label>
                        <Select
                          value={newTest.successMetric}
                          onValueChange={(value: any) => setNewTest({ ...newTest, successMetric: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                            <SelectItem value="completion_time">Completion Time</SelectItem>
                            <SelectItem value="error_rate">Error Rate</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="90"
                          value={newTest.duration}
                          onChange={(e) => setNewTest({ ...newTest, duration: Number.parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="traffic">Traffic Allocation (%)</Label>
                        <Input
                          id="traffic"
                          type="number"
                          min="1"
                          max="100"
                          value={newTest.trafficAllocation}
                          onChange={(e) => setNewTest({ ...newTest, trafficAllocation: Number.parseInt(e.target.value) })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confidence">Confidence Level (%)</Label>
                        <Select
                          value={newTest.confidenceLevel.toString()}
                          onValueChange={(value) => setNewTest({ ...newTest, confidenceLevel: Number.parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="95">95%</SelectItem>
                            <SelectItem value="99">99%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTest} disabled={!newTest.name || !newTest.hypothesis}>
                      Create Test
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={fetchABTests}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tests Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Tests</p>
                <p className="text-xl font-semibold">{tests.filter(t => t.status === 'running').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Tests</p>
                <p className="text-xl font-semibold">{tests.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Improvement</p>
                <p className="text-xl font-semibold text-green-600">
                  +{tests.filter(t => t.winner).reduce((sum, t) => {
                    const winner = t.variants.find(v => v.id === t.winner);
                    return sum + (winner?.improvement || 0);
                  }, 0) / Math.max(tests.filter(t => t.winner).length, 1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-xl font-semibold">{tests.reduce((sum, t) => sum + t.totalViews, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">A/B Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTest?.id === test.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{test.name}</h3>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{test.formName}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Conversion:</span>
                        <span className="font-medium ml-1">{test.overallConversionRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Participants:</span>
                        <span className="font-medium ml-1">{test.totalViews}</span>
                      </div>
                    </div>
                    {test.significance && (
                      <div className="mt-2">
                        <Badge variant="outline" className={`text-xs ${getSignificanceColor(test.significance)}`}>
                          {test.significance.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedTest ? (
                  <>
                    <FlaskConical className="w-5 h-5" />
                    {selectedTest.name}
                  </>
                ) : (
                  'Select a test to view details'
                )}
              </CardTitle>
              {selectedTest && (
                <div className="flex items-center gap-2">
                  {selectedTest.status === 'draft' && (
                    <Button size="sm" onClick={() => startTest(selectedTest.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {selectedTest.status === 'running' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => pauseTest(selectedTest.id)}>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Square className="w-4 h-4 mr-1" />
                            End Test
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End A/B Test</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to end this test? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => endTest(selectedTest.id, selectedTest.winner)}>
                              End Test
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTest ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Test Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={getStatusColor(selectedTest.status)}>
                            {selectedTest.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{selectedTest.duration} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Traffic:</span>
                          <span className="font-medium">{selectedTest.trafficAllocation}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{selectedTest.confidenceLevel}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Current Performance</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Views:</span>
                          <span className="font-medium">{selectedTest.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversions:</span>
                          <span className="font-medium">{selectedTest.totalConversions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Overall Rate:</span>
                          <span className="font-medium text-green-600">{selectedTest.overallConversionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Significance:</span>
                          <span className={`font-medium ${getSignificanceColor(selectedTest.significance)}`}>
                            {selectedTest.significance.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Hypothesis</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedTest.hypothesis}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Success Metric</h3>
                    <Badge variant="outline">
                      {selectedTest.successMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  <div className="space-y-4">
                    {selectedTest.variants.map((variant, index) => (
                      <Card key={variant.id} className={variant.id === selectedTest.winner ? 'border-green-500 bg-green-50' : ''}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {variant.id === selectedTest.winner && <Crown className="w-4 h-4 text-green-600" />}
                              {variant.name}
                              {variant.type === 'original' && <Badge variant="outline">Control</Badge>}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{variant.traffic}% traffic</Badge>
                              <Badge className={getStatusColor(variant.status)}>
                                {variant.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Performance</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Views:</span>
                                  <span className="font-medium">{variant.views.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Conversions:</span>
                                  <span className="font-medium">{variant.completions.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Rate:</span>
                                  <span className="font-medium">{variant.conversionRate}%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Statistics</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Confidence:</span>
                                  <span className="font-medium">{variant.confidenceLevel}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">P-value:</span>
                                  <span className="font-medium">{variant.pValue}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Improvement:</span>
                                  <span className={`font-medium ${getImprovementColor(variant.improvement)}`}>
                                    {variant.improvement > 0 ? '+' : ''}{variant.improvement}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Sample Size</h4>
                              <div className="space-y-2">
                                <Progress 
                                  value={(variant.sampleSize / variant.requiredSampleSize) * 100} 
                                  className="h-2" 
                                />
                                <p className="text-xs text-gray-600">
                                  {variant.sampleSize} / {variant.requiredSampleSize} required
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-sm text-gray-700">{variant.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Conversion Rates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={selectedTest.variants}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="conversionRate" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Traffic Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={selectedTest.variants}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="traffic"
                            >
                              {selectedTest.variants.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Variant</th>
                              <th className="text-right p-2">Views</th>
                              <th className="text-right p-2">Conversions</th>
                              <th className="text-right p-2">Rate</th>
                              <th className="text-right p-2">Improvement</th>
                              <th className="text-right p-2">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTest.variants.map((variant) => (
                              <tr key={variant.id} className="border-b">
                                <td className="p-2 font-medium">
                                  {variant.name}
                                  {variant.id === selectedTest.winner && <Crown className="w-3 h-3 inline ml-1 text-green-600" />}
                                </td>
                                <td className="text-right p-2">{variant.views.toLocaleString()}</td>
                                <td className="text-right p-2">{variant.completions.toLocaleString()}</td>
                                <td className="text-right p-2">{variant.conversionRate}%</td>
                                <td className={`text-right p-2 ${getImprovementColor(variant.improvement)}`}>
                                  {variant.improvement > 0 ? '+' : ''}{variant.improvement}%
                                </td>
                                <td className="text-right p-2">{variant.confidenceLevel}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-4">
                    {selectedTest.insights.map((insight, index) => (
                      <Card key={index} className={
                        insight.type === 'performance' ? 'border-blue-200 bg-blue-50' :
                        insight.type === 'statistical' ? 'border-green-200 bg-green-50' :
                        'border-yellow-200 bg-yellow-50'
                      }>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {insight.type === 'performance' && <BarChart3 className="w-4 h-4 text-blue-600" />}
                              {insight.type === 'statistical' && <Activity className="w-4 h-4 text-green-600" />}
                              {insight.type === 'recommendation' && <Brain className="w-4 h-4 text-yellow-600" />}
                              {insight.title}
                            </CardTitle>
                            {insight.actionable && (
                              <Badge variant="outline" className="bg-white">
                                Actionable
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{insight.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an A/B test from the left to view details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}