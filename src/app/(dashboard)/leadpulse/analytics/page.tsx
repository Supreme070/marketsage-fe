'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  MousePointer, 
  TrendingUp, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import TrafficConversionAnalytics from '@/components/leadpulse/TrafficConversionAnalytics';
import { FormAnalyticsDashboard } from '@/components/leadpulse/FormAnalyticsDashboard';
import HeatmapHotspots from '@/components/leadpulse/HeatmapHotspots';
import AIBehavioralScoring from '@/components/leadpulse/AIBehavioralScoring';

export default function LeadPulseAnalytics() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Deep insights into visitor behavior and conversion patterns</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">+0.8% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+23% from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">New predictions today</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Traffic Conversion
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Form Analytics
          </TabsTrigger>
          <TabsTrigger value="heatmaps" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Heatmap Analysis
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Behavioral Scoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Traffic Conversion Analytics
              </CardTitle>
              <CardDescription>
                Analyze conversion funnels and traffic source performance across your Nigerian, Kenyan, and South African markets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficConversionAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Form Performance Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into form completion rates, field-level analytics, and optimization opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Heatmap Analysis
              </CardTitle>
              <CardDescription>
                Detailed interaction tracking and click heatmaps for optimizing user experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapHotspots />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Behavioral Scoring
              </CardTitle>
              <CardDescription>
                AI-powered visitor analysis with predictive insights and behavioral patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIBehavioralScoring />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}