'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Thermometer,
  MousePointer,
  Eye,
  Scroll,
  Clock,
  Target,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Filter,
  Search,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Settings,
  Download,
  Share2,
  Maximize2,
  Grid3x3,
  Layers,
  Palette,
  Camera,
  RotateCcw
} from 'lucide-react';

interface HeatmapDataPoint {
  x: number;
  y: number;
  intensity: number;
  clickCount: number;
  hoverTime: number;
  scrollDepth: number;
  timestamp: string;
  visitorId: string;
  sessionId: string;
  device: 'desktop' | 'mobile' | 'tablet';
  elementSelector: string;
  elementType: 'button' | 'link' | 'form' | 'image' | 'text' | 'video';
}

interface HeatmapElement {
  id: string;
  selector: string;
  tagName: string;
  className: string;
  text: string;
  type: 'button' | 'link' | 'form' | 'image' | 'text' | 'video' | 'navigation';
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metrics: {
    totalClicks: number;
    uniqueClicks: number;
    totalHovers: number;
    avgHoverTime: number;
    clickThroughRate: number;
    conversionRate: number;
    bounceRate: number;
    attentionTime: number;
  };
  heatIntensity: 'cold' | 'cool' | 'warm' | 'hot' | 'burning';
  performance: {
    vs_average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    score: number;
  };
}

interface HeatmapPage {
  id: string;
  url: string;
  title: string;
  type: 'landing' | 'product' | 'pricing' | 'contact' | 'blog' | 'other';
  viewport: {
    width: number;
    height: number;
  };
  scrollHeight: number;
  totalVisitors: number;
  totalInteractions: number;
  avgScrollDepth: number;
  bounceRate: number;
  conversionRate: number;
  elements: HeatmapElement[];
  heatmapData: HeatmapDataPoint[];
  lastUpdated: string;
}

interface HeatmapFilter {
  device: 'all' | 'desktop' | 'mobile' | 'tablet';
  timeRange: '1h' | '24h' | '7d' | '30d';
  elementType: 'all' | 'button' | 'link' | 'form' | 'image' | 'navigation';
  minClicks: number;
  visitorSegment: 'all' | 'new' | 'returning' | 'converting';
}

interface HeatmapSettings {
  opacity: number;
  intensity: number;
  radius: number;
  colorScheme: 'classic' | 'modern' | 'grayscale' | 'viridis';
  showGrid: boolean;
  showElements: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

interface HeatmapAnalysisDetailedProps {
  className?: string;
}

export default function HeatmapAnalysisDetailed({ className }: HeatmapAnalysisDetailedProps) {
  const [pages, setPages] = useState<HeatmapPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<HeatmapPage | null>(null);
  const [selectedElement, setSelectedElement] = useState<HeatmapElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<HeatmapFilter>({
    device: 'all',
    timeRange: '24h',
    elementType: 'all',
    minClicks: 1,
    visitorSegment: 'all'
  });

  const [settings, setSettings] = useState<HeatmapSettings>({
    opacity: 70,
    intensity: 80,
    radius: 25,
    colorScheme: 'classic',
    showGrid: false,
    showElements: true,
    animationSpeed: 'normal'
  });

  // Fetch heatmap data
  useEffect(() => {
    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leadpulse/heatmap-analysis?${new URLSearchParams({
        device: filters.device,
        timeRange: filters.timeRange,
        elementType: filters.elementType,
        minClicks: filters.minClicks.toString(),
        segment: filters.visitorSegment
      })}`);

      // Use mock data for demo
      const mockPages = generateMockPages();
      setPages(mockPages);
      
      if (mockPages.length > 0 && !selectedPage) {
        setSelectedPage(mockPages[0]);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      const mockPages = generateMockPages();
      setPages(mockPages);
      if (mockPages.length > 0) {
        setSelectedPage(mockPages[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter pages based on search
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'burning': return 'bg-red-600 text-white';
      case 'hot': return 'bg-red-500 text-white';
      case 'warm': return 'bg-yellow-500 text-white';
      case 'cool': return 'bg-blue-500 text-white';
      case 'cold': return 'bg-blue-300 text-gray-800';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Get element type icon
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'button': return Target;
      case 'link': return MousePointer;
      case 'form': return Users;
      case 'image': return Camera;
      case 'navigation': return Grid3x3;
      case 'video': return Play;
      default: return Activity;
    }
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Mock data generators
  const generateMockPages = (): HeatmapPage[] => {
    const pageTemplates = [
      { url: '/', title: 'Homepage', type: 'landing' as const },
      { url: '/pricing', title: 'Pricing Page', type: 'pricing' as const },
      { url: '/contact', title: 'Contact Us', type: 'contact' as const },
      { url: '/solutions', title: 'Solutions', type: 'product' as const },
      { url: '/demo', title: 'Demo Request', type: 'contact' as const },
      { url: '/blog/fintech-trends', title: 'Fintech Trends Blog', type: 'blog' as const }
    ];

    return pageTemplates.map((template, index) => ({
      id: `page_${index}`,
      url: template.url,
      title: template.title,
      type: template.type,
      viewport: { width: 1920, height: 1080 },
      scrollHeight: Math.floor(Math.random() * 3000) + 1500,
      totalVisitors: Math.floor(Math.random() * 1000) + 200,
      totalInteractions: Math.floor(Math.random() * 2000) + 500,
      avgScrollDepth: Math.floor(Math.random() * 40) + 60,
      bounceRate: Math.floor(Math.random() * 30) + 20,
      conversionRate: Math.floor(Math.random() * 8) + 2,
      elements: generateMockElements(),
      heatmapData: generateMockHeatmapData(),
      lastUpdated: new Date().toISOString()
    }));
  };

  const generateMockElements = (): HeatmapElement[] => {
    const elementTypes = ['button', 'link', 'form', 'image', 'navigation'] as const;
    const intensities = ['cold', 'cool', 'warm', 'hot', 'burning'] as const;
    const trends = ['increasing', 'decreasing', 'stable'] as const;

    return Array.from({ length: 12 }, (_, i) => {
      const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];
      const trend = trends[Math.floor(Math.random() * trends.length)];
      
      return {
        id: `element_${i}`,
        selector: `#element-${i}`,
        tagName: type === 'button' ? 'button' : type === 'link' ? 'a' : 'div',
        className: `${type}-element`,
        text: `${type.charAt(0).toUpperCase() + type.slice(1)} Element ${i + 1}`,
        type,
        coordinates: {
          x: Math.floor(Math.random() * 80) + 10,
          y: Math.floor(Math.random() * 80) + 10,
          width: Math.floor(Math.random() * 15) + 10,
          height: Math.floor(Math.random() * 8) + 5
        },
        metrics: {
          totalClicks: Math.floor(Math.random() * 500) + 10,
          uniqueClicks: Math.floor(Math.random() * 300) + 5,
          totalHovers: Math.floor(Math.random() * 1000) + 50,
          avgHoverTime: Math.floor(Math.random() * 5000) + 500,
          clickThroughRate: Math.random() * 15 + 2,
          conversionRate: Math.random() * 12 + 1,
          bounceRate: Math.random() * 40 + 10,
          attentionTime: Math.floor(Math.random() * 10000) + 1000
        },
        heatIntensity: intensity,
        performance: {
          vs_average: (Math.random() - 0.5) * 50,
          trend,
          score: Math.floor(Math.random() * 40) + 60
        }
      };
    });
  };

  const generateMockHeatmapData = (): HeatmapDataPoint[] => {
    return Array.from({ length: 150 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random(),
      clickCount: Math.floor(Math.random() * 10) + 1,
      hoverTime: Math.floor(Math.random() * 5000) + 100,
      scrollDepth: Math.random() * 100,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      visitorId: `visitor_${Math.floor(Math.random() * 1000)}`,
      sessionId: `session_${Math.floor(Math.random() * 500)}`,
      device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as 'desktop' | 'mobile' | 'tablet',
      elementSelector: `#element-${Math.floor(Math.random() * 12)}`,
      elementType: ['button', 'link', 'form', 'image', 'text', 'video'][Math.floor(Math.random() * 6)] as any
    }));
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 animate-pulse" />
            <span>Loading detailed heatmap analysis...</span>
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
              <Thermometer className="w-5 h-5" />
              Detailed Heatmap Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Recording
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Analysis Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Device</label>
              <Select value={filters.device} onValueChange={(value: any) => setFilters(prev => ({ ...prev, device: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={filters.timeRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, timeRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Element Type</label>
              <Select value={filters.elementType} onValueChange={(value: any) => setFilters(prev => ({ ...prev, elementType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Elements</SelectItem>
                  <SelectItem value="button">Buttons</SelectItem>
                  <SelectItem value="link">Links</SelectItem>
                  <SelectItem value="form">Forms</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Visitor Segment</label>
              <Select value={filters.visitorSegment} onValueChange={(value: any) => setFilters(prev => ({ ...prev, visitorSegment: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visitors</SelectItem>
                  <SelectItem value="new">New Visitors</SelectItem>
                  <SelectItem value="returning">Returning</SelectItem>
                  <SelectItem value="converting">Converting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Min Clicks</label>
              <div className="px-3 py-2 border rounded">
                <Slider
                  value={[filters.minClicks]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, minClicks: value }))}
                  max={50}
                  min={1}
                  step={1}
                />
                <div className="text-xs text-center mt-1">{filters.minClicks} clicks</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Pages</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Page List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredPages.map((page) => (
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
                      <Badge variant="outline" className="text-xs">
                        {page.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{page.url}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Visitors:</span>
                        <span className="font-medium ml-1">{page.totalVisitors}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Interactions:</span>
                        <span className="font-medium ml-1">{page.totalInteractions}</span>
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

        {/* Heatmap Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedPage ? (
                  <>
                    <Thermometer className="w-5 h-5" />
                    {selectedPage.title} Heatmap
                  </>
                ) : (
                  'Select a page to view heatmap'
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={isPlaying ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedPage ? (
              <div className="space-y-4">
                {/* Heatmap Settings */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <Select value={settings.colorScheme} onValueChange={(value: any) => setSettings(prev => ({ ...prev, colorScheme: value }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="grayscale">Grayscale</SelectItem>
                        <SelectItem value="viridis">Viridis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Opacity:</span>
                    <div className="w-20">
                      <Slider
                        value={[settings.opacity]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, opacity: value }))}
                        max={100}
                        min={10}
                        step={10}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{settings.opacity}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">Intensity:</span>
                    <div className="w-20">
                      <Slider
                        value={[settings.intensity]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, intensity: value }))}
                        max={100}
                        min={20}
                        step={10}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{settings.intensity}%</span>
                  </div>
                </div>

                {/* Heatmap Canvas */}
                <div className="relative bg-white border rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                  {/* Page mockup background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white">
                    {/* Header mockup */}
                    <div className="h-16 bg-blue-600 relative">
                      <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="w-24 h-8 bg-white/20 rounded" />
                        <div className="flex gap-4">
                          <div className="w-16 h-6 bg-white/20 rounded" />
                          <div className="w-16 h-6 bg-white/20 rounded" />
                          <div className="w-16 h-6 bg-white/20 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Content mockup */}
                    <div className="p-6 space-y-6">
                      <div className="h-12 bg-gray-200 rounded" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-100 rounded" />
                        <div className="h-24 bg-gray-100 rounded" />
                        <div className="h-24 bg-gray-100 rounded" />
                      </div>
                      <div className="h-8 bg-gray-150 rounded" />
                      <div className="h-32 bg-gray-100 rounded" />
                    </div>
                  </div>

                  {/* Heatmap overlay */}
                  {settings.showElements && selectedPage.elements
                    .filter(el => filters.elementType === 'all' || el.type === filters.elementType)
                    .map((element) => (
                    <div
                      key={element.id}
                      className={`absolute border-2 border-dashed cursor-pointer transition-all ${
                        selectedElement?.id === element.id ? 'border-blue-500 bg-blue-100/30' : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{
                        left: `${element.coordinates.x}%`,
                        top: `${element.coordinates.y}%`,
                        width: `${element.coordinates.width}%`,
                        height: `${element.coordinates.height}%`,
                        opacity: settings.opacity / 100
                      }}
                      onClick={() => setSelectedElement(selectedElement?.id === element.id ? null : element)}
                    >
                      {/* Heat intensity indicator */}
                      <div className={`absolute -top-2 -left-2 w-4 h-4 rounded-full ${getIntensityColor(element.heatIntensity)} flex items-center justify-center text-xs font-bold`}>
                        {element.metrics.totalClicks > 100 ? '🔥' : element.metrics.totalClicks > 50 ? '🌡️' : '❄️'}
                      </div>
                      
                      {/* Element info on hover */}
                      <div className="absolute inset-0 bg-black/10 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-xs font-medium text-white bg-black/70 px-2 py-1 rounded">
                          {element.metrics.totalClicks} clicks
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Heatmap data points */}
                  {selectedPage.heatmapData
                    .filter(point => filters.device === 'all' || point.device === filters.device)
                    .map((point, index) => (
                    <div
                      key={index}
                      className="absolute rounded-full animate-pulse"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        width: `${settings.radius}px`,
                        height: `${settings.radius}px`,
                        backgroundColor: `rgba(255, ${255 - point.intensity * 255}, ${255 - point.intensity * 255}, ${point.intensity * settings.intensity / 100})`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}

                  {/* Grid overlay */}
                  {settings.showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full grid grid-cols-12 grid-rows-12 opacity-20">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div key={i} className="border border-gray-400" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Stats */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-lg text-blue-600">{selectedPage.totalVisitors.toLocaleString()}</div>
                    <div className="text-gray-600">Visitors</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-lg text-green-600">{selectedPage.totalInteractions.toLocaleString()}</div>
                    <div className="text-gray-600">Interactions</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-lg text-yellow-600">{selectedPage.avgScrollDepth}%</div>
                    <div className="text-gray-600">Avg Scroll</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-bold text-lg text-purple-600">{selectedPage.conversionRate}%</div>
                    <div className="text-gray-600">Conversion</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a page from the left to view its detailed heatmap analysis</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Element Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Element Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedElement ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  {React.createElement(getElementIcon(selectedElement.type), { className: "w-4 h-4" })}
                  <span className="font-medium">{selectedElement.text}</span>
                  <Badge className={getIntensityColor(selectedElement.heatIntensity) + ' text-xs'}>
                    {selectedElement.heatIntensity}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Clicks</span>
                      <span className="font-medium">{selectedElement.metrics.totalClicks.toLocaleString()}</span>
                    </div>
                    <Progress value={(selectedElement.metrics.totalClicks / 500) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Unique Clicks</span>
                      <span className="font-medium">{selectedElement.metrics.uniqueClicks.toLocaleString()}</span>
                    </div>
                    <Progress value={(selectedElement.metrics.uniqueClicks / 300) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Click-Through Rate</span>
                      <span className="font-medium">{selectedElement.metrics.clickThroughRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedElement.metrics.clickThroughRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conversion Rate</span>
                      <span className="font-medium">{selectedElement.metrics.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedElement.metrics.conversionRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Avg Hover Time</span>
                      <span className="font-medium">{(selectedElement.metrics.avgHoverTime / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Performance vs Average</h4>
                  <div className="flex items-center gap-2">
                    {selectedElement.performance.vs_average > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`font-medium ${selectedElement.performance.vs_average > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(selectedElement.performance.vs_average)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {selectedElement.performance.trend}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">Performance Score</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedElement.performance.score}/100</div>
                  </div>
                </div>

                <div className="pt-3 border-t text-xs text-gray-600">
                  <div>Selector: <code className="bg-gray-100 px-1 rounded">{selectedElement.selector}</code></div>
                  <div className="mt-1">Element: <code className="bg-gray-100 px-1 rounded">{selectedElement.tagName}</code></div>
                </div>
              </div>
            ) : selectedPage ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">Click on elements in the heatmap to view detailed analytics</p>
                
                <h4 className="font-medium">Top Performing Elements</h4>
                <div className="space-y-2">
                  {selectedPage.elements
                    .sort((a, b) => b.metrics.totalClicks - a.metrics.totalClicks)
                    .slice(0, 5)
                    .map((element) => {
                      const Icon = getElementIcon(element.type);
                      return (
                        <div
                          key={element.id}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedElement(element)}
                        >
                          <Icon className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{element.text}</div>
                            <div className="text-xs text-gray-600">{element.metrics.totalClicks} clicks</div>
                          </div>
                          <Badge className={getIntensityColor(element.heatIntensity) + ' text-xs'}>
                            {element.heatIntensity}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a page to view element details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}