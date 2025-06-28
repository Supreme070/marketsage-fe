'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Route,
  ArrowRight,
  Clock,
  Eye,
  MousePointer,
  FileText,
  Target,
  TrendingUp,
  Filter,
  Search,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Users,
  Activity,
  Zap
} from 'lucide-react';

interface TouchpointEvent {
  id: string;
  type: 'PAGEVIEW' | 'CLICK' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CONVERSION';
  url: string;
  title: string;
  timestamp: string;
  duration?: number;
  value: number;
  metadata?: any;
}

interface VisitorJourney {
  visitorId: string;
  sessionId: string;
  fingerprint: string;
  location: string;
  device: string;
  browser: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  engagementScore: number;
  isActive: boolean;
  touchpoints: TouchpointEvent[];
  conversionPath?: string[];
  dropOffPoint?: string;
  returnVisitor: boolean;
}

interface JourneyPattern {
  id: string;
  name: string;
  path: string[];
  frequency: number;
  conversionRate: number;
  avgEngagement: number;
  dropOffRate: number;
  type: 'successful' | 'abandoned' | 'exploring';
}

interface VisitorJourneyFlowProps {
  className?: string;
}

export default function VisitorJourneyFlow({ className }: VisitorJourneyFlowProps) {
  const [journeys, setJourneys] = useState<VisitorJourney[]>([]);
  const [patterns, setPatterns] = useState<JourneyPattern[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<VisitorJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'converted' | 'abandoned'>('all');
  const [isRealTime, setIsRealTime] = useState(true);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

  // Fetch journey data
  useEffect(() => {
    fetchJourneyData();
    if (isRealTime) {
      const interval = setInterval(fetchJourneyData, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  const fetchJourneyData = async () => {
    try {
      const [journeysResponse, patternsResponse] = await Promise.all([
        fetch('/api/leadpulse/journeys'),
        fetch('/api/leadpulse/journey-patterns')
      ]);

      if (journeysResponse.ok) {
        const journeysData = await journeysResponse.json();
        setJourneys(journeysData.journeys || []);
      }

      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setPatterns(patternsData.patterns || []);
      }
    } catch (error) {
      console.error('Error fetching journey data:', error);
      // Use mock data for demo
      setJourneys(generateMockJourneys());
      setPatterns(generateMockPatterns());
    } finally {
      setIsLoading(false);
    }
  };

  // Filter journeys
  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch = !searchQuery || 
      journey.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.device.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'active' && journey.isActive) ||
      (filterType === 'converted' && journey.touchpoints.some(tp => tp.type === 'CONVERSION')) ||
      (filterType === 'abandoned' && journey.dropOffPoint);
    
    return matchesSearch && matchesFilter;
  });

  // Get touchpoint icon
  const getTouchpointIcon = (type: string) => {
    switch (type) {
      case 'PAGEVIEW': return Eye;
      case 'CLICK': return MousePointer;
      case 'FORM_VIEW': return FileText;
      case 'FORM_START': return FileText;
      case 'FORM_SUBMIT': return FileText;
      case 'CONVERSION': return Target;
      default: return Activity;
    }
  };

  // Get touchpoint color
  const getTouchpointColor = (type: string) => {
    switch (type) {
      case 'PAGEVIEW': return 'bg-blue-500';
      case 'CLICK': return 'bg-green-500';
      case 'FORM_VIEW': return 'bg-yellow-500';
      case 'FORM_START': return 'bg-orange-500';
      case 'FORM_SUBMIT': return 'bg-purple-500';
      case 'CONVERSION': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get engagement color
  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Mock data generators
  const generateMockJourneys = (): VisitorJourney[] => {
    const locations = ['Lagos, Nigeria', 'Abuja, Nigeria', 'Accra, Ghana', 'Nairobi, Kenya'];
    const devices = ['Desktop, Chrome', 'Mobile, Safari', 'Tablet, Chrome'];
    const pages = ['/', '/pricing', '/solutions', '/contact', '/demo', '/about'];
    
    return Array.from({ length: 15 }, (_, i) => {
      const touchpoints: TouchpointEvent[] = [];
      const numTouchpoints = Math.floor(Math.random() * 8) + 2;
      
      for (let j = 0; j < numTouchpoints; j++) {
        const types = ['PAGEVIEW', 'CLICK', 'FORM_VIEW'];
        if (j === numTouchpoints - 1 && Math.random() > 0.7) {
          types.push('CONVERSION');
        }
        
        touchpoints.push({
          id: `tp_${i}_${j}`,
          type: types[Math.floor(Math.random() * types.length)] as any,
          url: pages[Math.floor(Math.random() * pages.length)],
          title: `Page ${j + 1}`,
          timestamp: new Date(Date.now() - (numTouchpoints - j) * 120000).toISOString(),
          duration: Math.floor(Math.random() * 180000) + 30000,
          value: Math.floor(Math.random() * 5) + 1
        });
      }
      
      const hasConversion = touchpoints.some(tp => tp.type === 'CONVERSION');
      const dropOffPoint = !hasConversion && Math.random() > 0.6 ? touchpoints[touchpoints.length - 1].url : undefined;
      
      return {
        visitorId: `visitor_${i}`,
        sessionId: `session_${i}`,
        fingerprint: `fp_${i}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: 'Chrome',
        startTime: touchpoints[0]?.timestamp || new Date().toISOString(),
        endTime: touchpoints[touchpoints.length - 1]?.timestamp || new Date().toISOString(),
        totalDuration: touchpoints.reduce((sum, tp) => sum + (tp.duration || 0), 0),
        engagementScore: Math.floor(Math.random() * 60) + 40,
        isActive: Math.random() > 0.7,
        touchpoints,
        conversionPath: hasConversion ? touchpoints.slice(-3).map(tp => tp.url) : undefined,
        dropOffPoint,
        returnVisitor: Math.random() > 0.6
      };
    });
  };

  const generateMockPatterns = (): JourneyPattern[] => {
    return [
      {
        id: 'pattern_1',
        name: 'Direct to Pricing Conversion',
        path: ['/', '/pricing', '/contact', '/demo'],
        frequency: 45,
        conversionRate: 78,
        avgEngagement: 85,
        dropOffRate: 12,
        type: 'successful'
      },
      {
        id: 'pattern_2',
        name: 'Solution Explorer',
        path: ['/', '/solutions', '/about', '/contact'],
        frequency: 32,
        conversionRate: 45,
        avgEngagement: 62,
        dropOffRate: 35,
        type: 'exploring'
      },
      {
        id: 'pattern_3',
        name: 'Pricing Page Abandonment',
        path: ['/', '/pricing'],
        frequency: 28,
        conversionRate: 5,
        avgEngagement: 25,
        dropOffRate: 85,
        type: 'abandoned'
      }
    ];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 animate-pulse" />
            <span>Loading visitor journeys...</span>
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
              <Route className="w-5 h-5" />
              Visitor Journey Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isRealTime ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRealTime(!isRealTime)}
              >
                {isRealTime ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isRealTime ? 'Pause' : 'Resume'} Real-time
              </Button>
              <Button variant="outline" size="sm" onClick={fetchJourneyData}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Journey Patterns Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Common Journey Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {patterns.map((pattern) => (
              <div key={pattern.id} className={`p-4 border-2 rounded-lg ${
                pattern.type === 'successful' ? 'border-green-200 bg-green-50' :
                pattern.type === 'abandoned' ? 'border-red-200 bg-red-50' :
                'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{pattern.name}</h3>
                  <Badge variant={
                    pattern.type === 'successful' ? 'default' :
                    pattern.type === 'abandoned' ? 'destructive' : 'secondary'
                  }>
                    {pattern.frequency} visitors
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-medium">{pattern.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Engagement:</span>
                    <span className="font-medium">{pattern.avgEngagement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drop-off Rate:</span>
                    <span className="font-medium">{pattern.dropOffRate}%</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    {pattern.path.map((step, index) => (
                      <React.Fragment key={step}>
                        <span className="px-2 py-1 bg-white rounded border">{step}</span>
                        {index < pattern.path.length - 1 && <ArrowRight className="w-3 h-3" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Individual Visitor Journeys
            </CardTitle>
            <div className="text-sm text-gray-600">
              {filteredJourneys.length} journeys found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by location or device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('active')}
              >
                <Activity className="w-4 h-4 mr-1" />
                Active
              </Button>
              <Button
                variant={filterType === 'converted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('converted')}
              >
                <Target className="w-4 h-4 mr-1" />
                Converted
              </Button>
              <Button
                variant={filterType === 'abandoned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('abandoned')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Abandoned
              </Button>
            </div>
          </div>

          {/* Journey List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredJourneys.map((journey) => (
                <div key={journey.visitorId} className="border rounded-lg">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedJourney(expandedJourney === journey.visitorId ? null : journey.visitorId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${journey.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{journey.location}</span>
                            {journey.returnVisitor && (
                              <Badge variant="secondary" className="text-xs">Return</Badge>
                            )}
                            {journey.conversionPath && (
                              <Badge variant="default" className="text-xs">Converted</Badge>
                            )}
                            {journey.dropOffPoint && (
                              <Badge variant="destructive" className="text-xs">Abandoned</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{journey.device} • {journey.touchpoints.length} touchpoints</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium px-2 py-1 rounded ${getEngagementColor(journey.engagementScore)}`}>
                            {journey.engagementScore}%
                          </div>
                          <p className="text-xs text-gray-500">{formatDuration(journey.totalDuration)}</p>
                        </div>
                        {expandedJourney === journey.visitorId ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Journey Details */}
                  {expandedJourney === journey.visitorId && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="pt-4">
                        <h4 className="font-medium mb-3">Journey Timeline</h4>
                        <div className="space-y-3">
                          {journey.touchpoints.map((touchpoint, index) => {
                            const Icon = getTouchpointIcon(touchpoint.type);
                            return (
                              <div key={touchpoint.id} className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTouchpointColor(touchpoint.type)}`}>
                                    <Icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{touchpoint.title}</p>
                                    <p className="text-xs text-gray-600">{touchpoint.url}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    {new Date(touchpoint.timestamp).toLocaleTimeString()}
                                  </p>
                                  {touchpoint.duration && (
                                    <p className="text-xs text-gray-400">
                                      {formatDuration(touchpoint.duration)}
                                    </p>
                                  )}
                                </div>
                                {index < journey.touchpoints.length - 1 && (
                                  <div className="w-px h-6 bg-gray-300 ml-4" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}