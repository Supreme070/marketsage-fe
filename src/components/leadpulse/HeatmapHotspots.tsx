'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MousePointer, 
  Eye, 
  Clock, 
  TrendingUp,
  Activity,
  Target,
  Users,
  ChevronDown,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface HotspotData {
  id: string;
  element: string;
  page: string;
  hovers: number;
  clicks: number;
  avgTime: number; // seconds
  conversionInfluence: number; // percentage
  heatIntensity: number; // 0-100
  position: {
    x: number;
    y: number;
  };
}

interface ScrollData {
  depth: number; // percentage
  visitors: number;
  dropOffRate: number;
}

interface HeatmapZone {
  name: string;
  intensity: number;
  clicks: number;
  area: 'header' | 'hero' | 'features' | 'pricing' | 'testimonials' | 'footer';
}

export default function HeatmapHotspots() {
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('heatmap');
  const [selectedPage, setSelectedPage] = useState('homepage');
  const [livePulses, setLivePulses] = useState<Array<{id: string, x: number, y: number, timestamp: number, intensity: number}>>([]);
  
  const [hotspotData, setHotspotData] = useState<HotspotData[]>([]);
  const [scrollData, setScrollData] = useState<ScrollData[]>([]);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Mock heatmap data with Nigerian business context
    const mockHotspots: HotspotData[] = [
      {
        id: 'whatsapp-button',
        element: 'WhatsApp Contact Button',
        page: 'Homepage',
        hovers: 2456,
        clicks: 1834,
        avgTime: 3.2,
        conversionInfluence: 34.5,
        heatIntensity: 95,
        position: { x: 85, y: 25 }
      },
      {
        id: 'pricing-naira',
        element: 'Naira Pricing Section',
        page: 'Pricing',
        hovers: 1987,
        clicks: 1245,
        avgTime: 8.7,
        conversionInfluence: 28.3,
        heatIntensity: 87,
        position: { x: 50, y: 45 }
      },
      {
        id: 'demo-video',
        element: 'Product Demo Video',
        page: 'Homepage',
        hovers: 1654,
        clicks: 987,
        avgTime: 45.3,
        conversionInfluence: 42.1,
        heatIntensity: 78,
        position: { x: 50, y: 60 }
      },
      {
        id: 'mobile-form',
        element: 'Mobile Signup Form',
        page: 'Contact',
        hovers: 1432,
        clicks: 1089,
        avgTime: 12.4,
        conversionInfluence: 31.7,
        heatIntensity: 82,
        position: { x: 50, y: 35 }
      },
      {
        id: 'testimonials',
        element: 'Nigerian Enterprise Logos',
        page: 'Homepage',
        hovers: 1298,
        clicks: 456,
        avgTime: 5.8,
        conversionInfluence: 18.9,
        heatIntensity: 65,
        position: { x: 50, y: 75 }
      },
      {
        id: 'features-grid',
        element: 'AI Features Grid',
        page: 'Features',
        hovers: 1156,
        clicks: 734,
        avgTime: 15.2,
        conversionInfluence: 25.4,
        heatIntensity: 71,
        position: { x: 50, y: 50 }
      }
    ];

    const mockScrollData: ScrollData[] = [
      { depth: 10, visitors: 2456, dropOffRate: 5.2 },
      { depth: 25, visitors: 2298, dropOffRate: 12.8 },
      { depth: 50, visitors: 2087, dropOffRate: 18.4 },
      { depth: 75, visitors: 1756, dropOffRate: 31.2 },
      { depth: 90, visitors: 1234, dropOffRate: 45.6 },
      { depth: 100, visitors: 987, dropOffRate: 52.1 }
    ];

    const mockHeatmapZones: HeatmapZone[] = [
      { name: 'Header Navigation', intensity: 75, clicks: 1834, area: 'header' },
      { name: 'Hero CTA Button', intensity: 95, clicks: 2456, area: 'hero' },
      { name: 'WhatsApp Integration', intensity: 89, clicks: 2134, area: 'hero' },
      { name: 'Feature Showcase', intensity: 68, clicks: 1456, area: 'features' },
      { name: 'Pricing Cards', intensity: 82, clicks: 1987, area: 'pricing' },
      { name: 'Enterprise Logos', intensity: 45, clicks: 876, area: 'testimonials' },
      { name: 'Footer Links', intensity: 32, clicks: 456, area: 'footer' }
    ];

    setHotspotData(mockHotspots);
    setScrollData(mockScrollData);
    setHeatmapZones(mockHeatmapZones);
    setLoading(false);
  }, [selectedPage]);

  // Live pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newPulse = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 90 + 5, // 5% to 95%
        y: Math.random() * 80 + 10, // 10% to 90%
        timestamp: Date.now(),
        intensity: Math.random() * 100 + 20 // 20-120 for varying sizes
      };
      
      setLivePulses(prev => [...prev, newPulse]);
      
      // Remove pulses after 3 seconds
      setTimeout(() => {
        setLivePulses(prev => prev.filter(pulse => pulse.id !== newPulse.id));
      }, 3000);
    }, 800); // New pulse every 800ms

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getEngagementTrend = (influence: number) => {
    if (influence >= 30) return { icon: ArrowUp, color: 'text-green-600', label: 'High Impact' };
    if (influence >= 15) return { icon: Minus, color: 'text-yellow-600', label: 'Medium Impact' };
    return { icon: ArrowDown, color: 'text-red-600', label: 'Low Impact' };
  };

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
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/3 to-orange-500/3"></div>
      <div className="relative space-y-6 p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Heatmap & Hotspot Analysis
            </h3>
            <p className="text-xs text-muted-foreground">User engagement patterns and interactions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border">
              <Button 
                variant={selectedPage === 'homepage' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('homepage')}
                className="text-xs h-7"
              >
                Homepage
              </Button>
              <Button 
                variant={selectedPage === 'pricing' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('pricing')}
                className="text-xs h-7"
              >
                Pricing
              </Button>
              <Button 
                variant={selectedPage === 'features' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('features')}
                className="text-xs h-7"
              >
                Features
              </Button>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,456</div>
              <p className="text-xs text-muted-foreground">Clicks & hovers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m 34s</div>
              <p className="text-xs text-muted-foreground">Time on hotspots</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Influence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28.7%</div>
              <p className="text-xs text-muted-foreground">Avg influence rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Zones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">High-engagement areas</p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Analysis Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList>
            <TabsTrigger value="heatmap">Visual Heatmap</TabsTrigger>
            <TabsTrigger value="scroll">Scroll Analysis</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Page Heatmap</CardTitle>
                <CardDescription>Real-time user interactions on SwiftPay fintech landing page</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Live Heatmap with SwiftPay iframe */}
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg h-96 overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {/* SwiftPay Landing Page Iframe */}
                  <iframe
                    src="/mock/fintech-landing.html"
                    className="absolute inset-0 w-full h-full border-0"
                    style={{
                      pointerEvents: 'none',
                      transform: 'scale(0.8)',
                      transformOrigin: 'top left',
                      width: '125%',
                      height: '125%'
                    }}
                    title="SwiftPay Landing Page"
                  />
                  
                  {/* Live Pulse Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {livePulses.map((pulse) => (
                      <div
                        key={pulse.id}
                        className="absolute animate-ping"
                        style={{
                          left: `${pulse.x}%`,
                          top: `${pulse.y}%`,
                          width: `${Math.max(8, pulse.intensity / 8)}px`,
                          height: `${Math.max(8, pulse.intensity / 8)}px`,
                        }}
                      >
                        <div 
                          className={`w-full h-full rounded-full opacity-75 ${
                            pulse.intensity > 80 ? 'bg-red-500' :
                            pulse.intensity > 60 ? 'bg-orange-500' :
                            pulse.intensity > 40 ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                    
                    {/* Static Heat zones overlay for reference */}
                    {heatmapZones.map((zone, index) => (
                      <div
                        key={index}
                        className={`absolute rounded-full opacity-40 ${getIntensityColor(zone.intensity)}`}
                        style={{
                          left: `${15 + (index * 12)}%`,
                          top: `${20 + (index % 3) * 20}%`,
                          width: `${Math.max(12, zone.intensity / 3)}px`,
                          height: `${Math.max(12, zone.intensity / 3)}px`,
                        }}
                        title={`${zone.name}: ${zone.clicks} clicks`}
                      />
                    ))}
                  </div>
                  
                  {/* Live Stats Overlay */}
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live • {livePulses.length} active users</span>
                    </div>
                  </div>
                  
                  {/* Interaction Legend */}
                  <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-gray-900/95 text-xs px-3 py-2 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High engagement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Medium engagement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Low engagement</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Heat zones metrics */}
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {heatmapZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getIntensityColor(zone.intensity)}`}></div>
                        <div>
                          <span className="font-medium text-sm">{zone.name}</span>
                          <div className="text-xs text-muted-foreground">{zone.area}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{zone.clicks.toLocaleString()}</div>
                        <div className="text-muted-foreground text-xs">{zone.intensity}% intensity</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Real-time Insights */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Live Insights</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="text-blue-700 dark:text-blue-300">• "Create free account" CTA getting highest clicks</div>
                      <div className="text-blue-700 dark:text-blue-300">• Pricing section has 23% higher engagement</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-blue-700 dark:text-blue-300">• Mobile users scrolling 31% deeper</div>
                      <div className="text-blue-700 dark:text-blue-300">• Testimonials driving 12% conversion lift</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Depth Analysis</CardTitle>
                <CardDescription>How far users scroll down your pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scrollData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium w-16">{data.depth}%</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${100 - data.dropOffRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.visitors.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{data.dropOffRate.toFixed(1)}% drop-off</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Scroll Insights</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 52.1% of users scroll to the bottom of the page</li>
                    <li>• Highest drop-off occurs at 75% scroll depth</li>
                    <li>• Mobile users scroll 23% deeper than desktop users</li>
                    <li>• WhatsApp button placement shows optimal engagement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Hotspot Metrics</CardTitle>
                <CardDescription>Comprehensive interaction data for each element</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Element</th>
                        <th className="text-left p-2">Page</th>
                        <th className="text-left p-2">Hovers</th>
                        <th className="text-left p-2">Clicks</th>
                        <th className="text-left p-2">Avg Time</th>
                        <th className="text-left p-2">Conversion Impact</th>
                        <th className="text-left p-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotspotData.map((hotspot) => {
                        const trend = getEngagementTrend(hotspot.conversionInfluence);
                        return (
                          <tr key={hotspot.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{hotspot.element}</td>
                            <td className="p-2">{hotspot.page}</td>
                            <td className="p-2">{hotspot.hovers.toLocaleString()}</td>
                            <td className="p-2">{hotspot.clicks.toLocaleString()}</td>
                            <td className="p-2">{formatTime(hotspot.avgTime)}</td>
                            <td className="p-2">
                              <div className="font-semibold">{hotspot.conversionInfluence.toFixed(1)}%</div>
                            </td>
                            <td className="p-2">
                              <div className={`flex items-center gap-1 ${trend.color}`}>
                                <trend.icon className="h-4 w-4" />
                                <span className="text-xs">{trend.label}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Top Performing Elements</h4>
                    <div className="space-y-2">
                      {hotspotData
                        .sort((a, b) => b.conversionInfluence - a.conversionInfluence)
                        .slice(0, 3)
                        .map((hotspot, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{hotspot.element}</span>
                            <Badge variant="outline">{hotspot.conversionInfluence.toFixed(1)}%</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Optimization Opportunities</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>• Move WhatsApp button to hero section for better visibility</div>
                      <div>• Optimize mobile form fields for better engagement</div>
                      <div>• Consider repositioning enterprise logos higher on page</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 