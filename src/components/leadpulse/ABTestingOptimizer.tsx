'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  Calendar,
  Zap,
  MessageSquare,
  Smartphone,
  DollarSign,
  Eye
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  type: 'website' | 'email' | 'whatsapp' | 'sms';
  status: 'running' | 'completed' | 'scheduled' | 'paused';
  startDate: string;
  endDate?: string;
  variants: {
    name: string;
    traffic: number;
    conversions: number;
    conversionRate: number;
    isControl: boolean;
    isWinner?: boolean;
  }[];
  confidence: number;
  improvementPercent: number;
  revenueImpact: number;
}

interface OptimizationTip {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  icon: React.ComponentType<any>;
}

export default function ABTestingOptimizer() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('running');
  
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [optimizationTips, setOptimizationTips] = useState<OptimizationTip[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Mock A/B test data with Nigerian business context
    const mockTests: ABTest[] = [
      {
        id: 'test_1',
        name: 'WhatsApp Integration Button Placement',
        type: 'website',
        status: 'running',
        startDate: '2024-01-15',
        variants: [
          { name: 'Control (Right Corner)', traffic: 1250, conversions: 89, conversionRate: 7.12, isControl: true },
          { name: 'Header Prominent', traffic: 1298, conversions: 127, conversionRate: 9.78, isControl: false, isWinner: true }
        ],
        confidence: 94.2,
        improvementPercent: 37.4,
        revenueImpact: 2450000
      },
      {
        id: 'test_2', 
        name: 'Mobile-First Form Design',
        type: 'website',
        status: 'running',
        startDate: '2024-01-20',
        variants: [
          { name: 'Desktop Layout', traffic: 856, conversions: 45, conversionRate: 5.26, isControl: true },
          { name: 'Mobile-Optimized', traffic: 923, conversions: 78, conversionRate: 8.45, isControl: false, isWinner: true }
        ],
        confidence: 87.1,
        improvementPercent: 60.6,
        revenueImpact: 1890000
      },
      {
        id: 'test_3',
        name: 'Naira Pricing Display Format',
        type: 'website', 
        status: 'completed',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        variants: [
          { name: '₦500,000/month', traffic: 2145, conversions: 187, conversionRate: 8.72, isControl: true },
          { name: '₦500K monthly', traffic: 2089, conversions: 234, conversionRate: 11.20, isControl: false, isWinner: true }
        ],
        confidence: 96.8,
        improvementPercent: 28.4,
        revenueImpact: 3750000
      },
      {
        id: 'test_4',
        name: 'Lagos vs Abuja Targeting',
        type: 'email',
        status: 'completed',
        startDate: '2024-01-10',
        endDate: '2024-01-17',
        variants: [
          { name: 'Generic Nigerian', traffic: 1456, conversions: 89, conversionRate: 6.11, isControl: true },
          { name: 'City-Specific Content', traffic: 1378, conversions: 124, conversionRate: 9.00, isControl: false, isWinner: true }
        ],
        confidence: 91.3,
        improvementPercent: 47.3,
        revenueImpact: 2100000
      },
      {
        id: 'test_5',
        name: 'Best Time for WhatsApp Campaigns',
        type: 'whatsapp',
        status: 'scheduled',
        startDate: '2024-02-01',
        variants: [
          { name: '9 AM WAT', traffic: 0, conversions: 0, conversionRate: 0, isControl: true },
          { name: '2 PM WAT', traffic: 0, conversions: 0, conversionRate: 0, isControl: false }
        ],
        confidence: 0,
        improvementPercent: 0,
        revenueImpact: 0
      }
    ];

    const mockOptimizationTips: OptimizationTip[] = [
      {
        category: 'WhatsApp Integration',
        title: 'Add WhatsApp Business Button',
        description: 'Nigerian users prefer WhatsApp for business communication. Adding a prominent WhatsApp button can increase conversions by 40%.',
        impact: 'high',
        effort: 'low',
        icon: MessageSquare
      },
      {
        category: 'Mobile Optimization',
        title: 'Mobile-First Form Design',
        description: '78% of Nigerian internet users are mobile-first. Optimize forms for mobile to capture more leads.',
        impact: 'high',
        effort: 'medium',
        icon: Smartphone
      },
      {
        category: 'Local Currency',
        title: 'Use Naira Shorthand Format',
        description: 'Display prices as ₦500K instead of ₦500,000 for better readability and reduced cognitive load.',
        impact: 'medium',
        effort: 'low',
        icon: DollarSign
      },
      {
        category: 'Timing',
        title: 'Peak Hours Optimization',
        description: 'Send campaigns at 2 PM WAT when Nigerian professionals are most active online.',
        impact: 'medium',
        effort: 'low',
        icon: Clock
      },
      {
        category: 'Trust Signals',
        title: 'Add Nigerian Enterprise Logos',
        description: 'Display logos of trusted Nigerian banks and enterprises to build credibility with local audiences.',
        impact: 'high',
        effort: 'medium',
        icon: Target
      }
    ];

    setAbTests(mockTests);
    setOptimizationTips(mockOptimizationTips);
    setLoading(false);
  }, []);

  const formatNaira = (amount: number) => {
    if (amount === 0) return '₦0';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'paused': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: OptimizationTip['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: OptimizationTip['effort']) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100'; 
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTests = abTests.filter(test => {
    if (selectedCategory === 'all') return true;
    return test.status === selectedCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing & Optimization</h2>
          <p className="text-muted-foreground">Test and optimize for Nigerian markets</p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Create New Test
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abTests.filter(t => t.status === 'running').length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+43.4%</div>
            <p className="text-xs text-muted-foreground">Conversion rate lift</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦10.2M</div>
            <p className="text-xs text-muted-foreground">Revenue gained</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <p className="text-xs text-muted-foreground">Avg confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Tests Management */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="running">Running Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {filteredTests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {test.type}
                    </Badge>
                    <Badge className={`${getStatusColor(test.status)} text-white`}>
                      {getStatusIcon(test.status)}
                      <span className="ml-1 capitalize">{test.status}</span>
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Started {new Date(test.startDate).toLocaleDateString()} 
                  {test.endDate && ` • Ended ${new Date(test.endDate).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Results */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {test.variants.map((variant, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${variant.isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{variant.name}</h4>
                          {variant.isControl && <Badge variant="outline">Control</Badge>}
                          {variant.isWinner && <Badge className="bg-green-500 text-white">Winner</Badge>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Traffic</div>
                            <div className="font-semibold">{variant.traffic.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Conversions</div>
                            <div className="font-semibold">{variant.conversions}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Rate</div>
                            <div className="font-semibold">{variant.conversionRate.toFixed(2)}%</div>
                          </div>
                        </div>
                        
                        {/* Visual progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${variant.isWinner ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(variant.conversionRate * 8, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Test Statistics */}
                  {test.confidence > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Confidence</div>
                          <div className="font-semibold">{test.confidence.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Improvement</div>
                          <div className="font-semibold text-green-600">+{test.improvementPercent.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue Impact</div>
                          <div className="font-semibold">{formatNaira(test.revenueImpact)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Nigerian Market Optimization Tips</CardTitle>
          <CardDescription>AI-powered recommendations for African markets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {optimizationTips.map((tip, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                    <tip.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{tip.title}</h4>
                      <Badge className={`text-xs ${getImpactColor(tip.impact)}`}>
                        {tip.impact} impact
                      </Badge>
                      <Badge className={`text-xs ${getEffortColor(tip.effort)}`}>
                        {tip.effort} effort
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{tip.description}</p>
                    <div className="text-xs text-muted-foreground">{tip.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 