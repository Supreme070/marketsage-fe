'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Thermometer,
  MousePointer,
  Eye,
  Scroll,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Play,
  Target
} from 'lucide-react';

interface HeatmapZone {
  id: string;
  name: string;
  element: string;
  clicks: number;
  hovers: number;
  scrollReach: number;
  conversionRate: number;
  avgTimeSpent: number;
  hotness: 'hot' | 'warm' | 'cold';
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  device: 'all' | 'desktop' | 'mobile' | 'tablet';
}

interface HeatmapPage {
  id: string;
  url: string;
  title: string;
  totalViews: number;
  totalClicks: number;
  avgScrollDepth: number;
  bounceRate: number;
  conversionRate: number;
  zones: HeatmapZone[];
  lastUpdated: string;
}

interface HeatmapInsight {
  id: string;
  type: 'opportunity' | 'issue' | 'success';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  page: string;
  zone?: string;
}

interface HeatmapOverviewProps {
  className?: string;
}

export default function HeatmapOverview({ className }: HeatmapOverviewProps) {
  const [pages, setPages] = useState<HeatmapPage[]>([]);
  const [insights, setInsights] = useState<HeatmapInsight[]>([]);
  const [selectedPage, setSelectedPage] = useState<HeatmapPage | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'mobile' | 'tablet'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Fetch heatmap data
  useEffect(() => {
    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [deviceFilter]);

  const fetchHeatmapData = async () => {
    try {
      const [pagesResponse, insightsResponse] = await Promise.all([
        fetch(`/api/leadpulse/heatmaps?device=${deviceFilter}`),
        fetch('/api/leadpulse/heatmap-insights')
      ]);

      // Use mock data for demo
      setPages(generateMockPages());
      setInsights(generateMockInsights());
      
      if (pages.length > 0 && !selectedPage) {
        setSelectedPage(pages[0]);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      setPages(generateMockPages());
      setInsights(generateMockInsights());
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In real implementation, this would start/stop heatmap recording
  };

  // Get hotness color
  const getHotnessColor = (hotness: string) => {
    switch (hotness) {
      case 'hot': return 'bg-red-500 text-white';
      case 'warm': return 'bg-yellow-500 text-white';
      case 'cold': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50 text-green-800';
      case 'issue': return 'border-red-200 bg-red-50 text-red-800';
      case 'success': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Get device icon
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  // Mock data generators
  const generateMockPages = (): HeatmapPage[] => {
    const pageTemplates = [
      { url: '/', title: 'Home Page' },
      { url: '/pricing', title: 'Pricing Page' },
      { url: '/solutions', title: 'Solutions Page' },
      { url: '/contact', title: 'Contact Page' },
      { url: '/demo', title: 'Demo Page' },
      { url: '/about', title: 'About Page' }
    ];

    return pageTemplates.map((template, index) => ({
      id: `page_${index}`,
      url: template.url,
      title: template.title,
      totalViews: Math.floor(Math.random() * 1000) + 100,
      totalClicks: Math.floor(Math.random() * 500) + 50,
      avgScrollDepth: Math.floor(Math.random() * 40) + 60, // 60-100%
      bounceRate: Math.floor(Math.random() * 30) + 20, // 20-50%
      conversionRate: Math.floor(Math.random() * 10) + 2, // 2-12%
      zones: generateMockZones(),
      lastUpdated: new Date().toISOString()
    }));
  };

  const generateMockZones = (): HeatmapZone[] => {
    const elements = ['Header CTA', 'Navigation', 'Hero Section', 'Pricing Table', 'Contact Form', 'Footer Links'];
    
    return elements.map((element, index) => ({
      id: `zone_${index}`,
      name: element,
      element: element.toLowerCase().replace(/\s+/g, '-'),
      clicks: Math.floor(Math.random() * 200) + 10,
      hovers: Math.floor(Math.random() * 500) + 50,
      scrollReach: Math.floor(Math.random() * 40) + 60,
      conversionRate: Math.floor(Math.random() * 15) + 1,
      avgTimeSpent: Math.floor(Math.random() * 30) + 5,
      hotness: Math.random() > 0.6 ? 'hot' : Math.random() > 0.3 ? 'warm' : 'cold',
      coordinates: {
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 80) + 10,
        width: Math.floor(Math.random() * 20) + 10,
        height: Math.floor(Math.random() * 10) + 5
      },
      device: deviceFilter
    }));
  };

  const generateMockInsights = (): HeatmapInsight[] => {
    return [
      {
        id: 'insight_1',
        type: 'opportunity',
        title: 'High-Traffic, Low-Conversion Zone',
        description: 'The pricing table receives 78% of clicks but only 3% conversion rate.',
        recommendation: 'Optimize pricing table design and add social proof elements.',
        impact: 'high',
        page: '/pricing',
        zone: 'pricing-table'
      },
      {
        id: 'insight_2',
        type: 'issue',
        title: 'Mobile Header Navigation Issues',
        description: 'Mobile users struggle with header navigation - only 45% scroll depth.',
        recommendation: 'Implement mobile-friendly navigation menu with clear CTAs.',
        impact: 'high',
        page: '/',
        zone: 'header-nav'
      },
      {
        id: 'insight_3',
        type: 'success',
        title: 'Hero Section Performing Well',
        description: 'Hero CTA button has 89% visibility and 12% click rate.',
        recommendation: 'Replicate this design pattern across other pages.',
        impact: 'medium',
        page: '/',
        zone: 'hero-cta'
      },
      {
        id: 'insight_4',
        type: 'opportunity',
        title: 'Underutilized Contact Form',
        description: 'Contact form visible to 92% of visitors but only 4% interaction rate.',
        recommendation: 'Add progressive disclosure and reduce form fields.',
        impact: 'medium',
        page: '/contact',
        zone: 'contact-form'
      }
    ];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 animate-pulse" />
            <span>Loading heatmap data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalClicks = pages.reduce((sum, page) => sum + page.totalClicks, 0);
  const totalViews = pages.reduce((sum, page) => sum + page.totalViews, 0);
  const avgConversionRate = pages.reduce((sum, page) => sum + page.conversionRate, 0) / pages.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Heatmap & Interaction Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Recording
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchHeatmapData}>
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
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-xl font-semibold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Page Views</p>
                <p className="text-xl font-semibold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
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
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Scroll className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pages Tracked</p>
                <p className="text-xl font-semibold">{pages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Page List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pages</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={deviceFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={deviceFilter === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceFilter('desktop')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={deviceFilter === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceFilter('mobile')}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPage?.id === page.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPage(page)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{page.title}</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{page.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <span className="font-medium ml-1">{page.totalViews}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Clicks:</span>
                        <span className="font-medium ml-1">{page.totalClicks}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Scroll:</span>
                        <span className="font-medium ml-1">{page.avgScrollDepth}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Convert:</span>
                        <span className="font-medium ml-1">{page.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Page Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedPage ? (
                <>
                  <Eye className="w-5 h-5" />
                  {selectedPage.title} Heatmap
                </>
              ) : (
                'Select a page to view heatmap'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPage ? (
              <Tabs defaultValue="zones" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="zones">Hot Zones</TabsTrigger>
                  <TabsTrigger value="visualization">Visualization</TabsTrigger>
                </TabsList>

                <TabsContent value="zones" className="space-y-4">
                  <div className="space-y-3">
                    {selectedPage.zones.map((zone) => (
                      <div key={zone.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getHotnessColor(zone.hotness)}>
                              {zone.hotness}
                            </Badge>
                            <h3 className="font-medium">{zone.name}</h3>
                          </div>
                          <div className="text-sm text-gray-600">
                            {zone.clicks} clicks
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">Clicks:</span>
                            </div>
                            <p className="font-medium">{zone.clicks}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">Hovers:</span>
                            </div>
                            <p className="font-medium">{zone.hovers}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">Time:</span>
                            </div>
                            <p className="font-medium">{zone.avgTimeSpent}s</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Conversion Rate:</span>
                            <span className={`font-medium ${
                              zone.conversionRate > 8 ? 'text-green-600' :
                              zone.conversionRate > 4 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {zone.conversionRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="visualization" className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-6 min-h-96 relative">
                    <div className="text-center text-gray-600 mb-4">
                      <h3 className="font-medium">Heatmap Visualization</h3>
                      <p className="text-sm">Visual representation of {selectedPage.title}</p>
                    </div>
                    
                    {/* Simulated heatmap visualization */}
                    <div className="relative bg-white rounded border min-h-80">
                      {selectedPage.zones.map((zone) => (
                        <div
                          key={zone.id}
                          className={`absolute rounded border-2 border-dashed ${
                            zone.hotness === 'hot' ? 'bg-red-200 border-red-400' :
                            zone.hotness === 'warm' ? 'bg-yellow-200 border-yellow-400' :
                            'bg-blue-200 border-blue-400'
                          } opacity-70 flex items-center justify-center text-xs font-medium`}
                          style={{
                            left: `${zone.coordinates.x}%`,
                            top: `${zone.coordinates.y}%`,
                            width: `${zone.coordinates.width}%`,
                            height: `${zone.coordinates.height}%`
                          }}
                        >
                          {zone.name}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded" />
                        <span>Hot (High Activity)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded" />
                        <span>Warm (Medium Activity)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded" />
                        <span>Cold (Low Activity)</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a page from the left to view its heatmap analysis</p>
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
            <Zap className="w-5 h-5" />
            AI-Powered Heatmap Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <div key={insight.id} className={`p-4 border-2 rounded-lg ${getInsightColor(insight.type)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                    {insight.impact} impact
                  </Badge>
                </div>
                <p className="text-sm mb-3">{insight.description}</p>
                <div className="bg-white/50 p-3 rounded text-sm">
                  <p className="font-medium text-xs mb-1">💡 Recommendation:</p>
                  <p>{insight.recommendation}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-600">Page: {insight.page}</span>
                  {insight.zone && (
                    <span className="text-gray-600">Zone: {insight.zone}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}