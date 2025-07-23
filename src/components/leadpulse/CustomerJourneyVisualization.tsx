'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import '../../styles/journey-animations.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  Clock, 
  MapPin, 
  Mouse, 
  Eye, 
  Heart, 
  Star, 
  CheckCircle, 
  Circle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Download,
  Maximize2,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';

interface JourneyStep {
  id: string;
  timestamp: string;
  action: string;
  page: string;
  duration: number;
  type: 'page_view' | 'interaction' | 'conversion' | 'exit';
  metadata: {
    device: 'mobile' | 'desktop' | 'tablet';
    location: string;
    referrer?: string;
    engagement: number;
  };
}

interface CustomerJourney {
  visitorId: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  steps: JourneyStep[];
  outcome: 'converted' | 'abandoned' | 'ongoing';
  value: number;
  engagementScore: number;
}

interface CustomerJourneyVisualizationProps {
  journeys?: CustomerJourney[];
  isLoading?: boolean;
}

const CustomerJourneyVisualization = React.memo<CustomerJourneyVisualizationProps>(({ 
  journeys = [], 
  isLoading 
}) => {
  const [selectedJourney, setSelectedJourney] = useState<CustomerJourney | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'timeline'>('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'converted' | 'abandoned'>('all');
  const [animateStats, setAnimateStats] = useState(false);

  // Auto-play journey animation
  useEffect(() => {
    if (isPlaying && selectedJourney && currentStep < selectedJourney.steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (isPlaying && selectedJourney && currentStep >= selectedJourney.steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, selectedJourney]);

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Demo data for visualization
  const demoJourneys: CustomerJourney[] = useMemo(() => [
    {
      visitorId: 'visitor_001',
      sessionId: 'session_abc123',
      startTime: '2024-07-18T10:15:00Z',
      endTime: '2024-07-18T10:42:15Z',
      totalDuration: 1635,
      outcome: 'converted',
      value: 299,
      engagementScore: 92,
      steps: [
        {
          id: 'step_1',
          timestamp: '2024-07-18T10:15:00Z',
          action: 'Landing Page Visit',
          page: '/',
          duration: 45,
          type: 'page_view',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            referrer: 'google.com',
            engagement: 85
          }
        },
        {
          id: 'step_2',
          timestamp: '2024-07-18T10:15:45Z',
          action: 'Features Page',
          page: '/features',
          duration: 180,
          type: 'page_view',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            engagement: 90
          }
        },
        {
          id: 'step_3',
          timestamp: '2024-07-18T10:18:45Z',
          action: 'Demo Video Play',
          page: '/features',
          duration: 120,
          type: 'interaction',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            engagement: 95
          }
        },
        {
          id: 'step_4',
          timestamp: '2024-07-18T10:20:45Z',
          action: 'Pricing Page',
          page: '/pricing',
          duration: 240,
          type: 'page_view',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            engagement: 88
          }
        },
        {
          id: 'step_5',
          timestamp: '2024-07-18T10:24:45Z',
          action: 'Sign Up Form',
          page: '/signup',
          duration: 300,
          type: 'interaction',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            engagement: 92
          }
        },
        {
          id: 'step_6',
          timestamp: '2024-07-18T10:29:45Z',
          action: 'Account Created',
          page: '/welcome',
          duration: 60,
          type: 'conversion',
          metadata: {
            device: 'desktop',
            location: 'Lagos, Nigeria',
            engagement: 100
          }
        }
      ]
    },
    {
      visitorId: 'visitor_002',
      sessionId: 'session_def456',
      startTime: '2024-07-18T14:22:00Z',
      endTime: '2024-07-18T14:28:30Z',
      totalDuration: 390,
      outcome: 'abandoned',
      value: 0,
      engagementScore: 45,
      steps: [
        {
          id: 'step_1',
          timestamp: '2024-07-18T14:22:00Z',
          action: 'Landing Page Visit',
          page: '/',
          duration: 120,
          type: 'page_view',
          metadata: {
            device: 'mobile',
            location: 'Abuja, Nigeria',
            referrer: 'facebook.com',
            engagement: 60
          }
        },
        {
          id: 'step_2',
          timestamp: '2024-07-18T14:24:00Z',
          action: 'Pricing Page',
          page: '/pricing',
          duration: 90,
          type: 'page_view',
          metadata: {
            device: 'mobile',
            location: 'Abuja, Nigeria',
            engagement: 40
          }
        },
        {
          id: 'step_3',
          timestamp: '2024-07-18T14:25:30Z',
          action: 'Exit Intent',
          page: '/pricing',
          duration: 180,
          type: 'exit',
          metadata: {
            device: 'mobile',
            location: 'Abuja, Nigeria',
            engagement: 30
          }
        }
      ]
    }
  ], []);

  const activeJourneys = journeys.length > 0 ? journeys : demoJourneys;

  const filteredJourneys = useMemo(() => {
    if (filterType === 'all') return activeJourneys;
    return activeJourneys.filter(journey => journey.outcome === filterType);
  }, [activeJourneys, filterType]);

  const journeyStats = useMemo(() => {
    const total = activeJourneys.length;
    const converted = activeJourneys.filter(j => j.outcome === 'converted').length;
    const abandoned = activeJourneys.filter(j => j.outcome === 'abandoned').length;
    const avgDuration = activeJourneys.reduce((sum, j) => sum + j.totalDuration, 0) / total;
    const avgEngagement = activeJourneys.reduce((sum, j) => sum + j.engagementScore, 0) / total;
    
    return {
      total,
      converted,
      abandoned,
      conversionRate: (converted / total) * 100,
      avgDuration: Math.round(avgDuration),
      avgEngagement: Math.round(avgEngagement)
    };
  }, [activeJourneys]);

  const getStepIcon = useCallback((type: string) => {
    switch (type) {
      case 'page_view': return <Eye className="h-4 w-4" />;
      case 'interaction': return <Mouse className="h-4 w-4" />;
      case 'conversion': return <CheckCircle className="h-4 w-4" />;
      case 'exit': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  }, []);

  const getStepColor = useCallback((type: string) => {
    switch (type) {
      case 'page_view': return 'bg-blue-500';
      case 'interaction': return 'bg-purple-500';
      case 'conversion': return 'bg-green-500';
      case 'exit': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getEngagementColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Customer Journey Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2 text-gray-500">Loading journey data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Customer Journey Visualization
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Interactive journey mapping and analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Journeys</option>
                <option value="converted">Converted</option>
                <option value="abandoned">Abandoned</option>
              </select>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Journey Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className={`text-center p-3 bg-blue-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`}>
              <Users className="h-6 w-6 mx-auto text-blue-500 mb-2 engagement-pulse" />
              <div className="text-lg font-semibold">{journeyStats.total}</div>
              <div className="text-xs text-gray-500">Total Journeys</div>
            </div>
            
            <div className={`text-center p-3 bg-green-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <div className="text-lg font-semibold">{journeyStats.converted}</div>
              <div className="text-xs text-gray-500">Converted</div>
            </div>
            
            <div className={`text-center p-3 bg-red-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <Circle className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <div className="text-lg font-semibold">{journeyStats.abandoned}</div>
              <div className="text-xs text-gray-500">Abandoned</div>
            </div>
            
            <div className={`text-center p-3 bg-purple-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
              <Target className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <div className="text-lg font-semibold">{journeyStats.conversionRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Conversion</div>
            </div>
            
            <div className={`text-center p-3 bg-orange-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
              <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <div className="text-lg font-semibold">{formatDuration(journeyStats.avgDuration)}</div>
              <div className="text-xs text-gray-500">Avg Duration</div>
            </div>
            
            <div className={`text-center p-3 bg-indigo-50 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 ${animateStats ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
              <Zap className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
              <div className="text-lg font-semibold">{journeyStats.avgEngagement}%</div>
              <div className="text-xs text-gray-500">Engagement</div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {['overview', 'detailed', 'timeline'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey List Overview */}
      {viewMode === 'overview' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredJourneys.map((journey) => (
                <div
                  key={journey.sessionId}
                  onClick={() => setSelectedJourney(journey)}
                  className="p-4 border rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer group journey-card hover:border-blue-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        journey.outcome === 'converted' ? 'bg-green-500' :
                        journey.outcome === 'abandoned' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">Session {journey.sessionId.slice(-6)}</span>
                      <Badge variant="outline" className="text-xs">
                        {journey.steps.length} steps
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getEngagementColor(journey.engagementScore)}>
                        {journey.engagementScore}% engagement
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDuration(journey.totalDuration)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Journey Steps Preview */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {journey.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full ${getStepColor(step.type)} flex items-center justify-center text-white journey-step transition-transform duration-200 hover:scale-110`}>
                          {getStepIcon(step.type)}
                        </div>
                        {index < journey.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-gray-400 transition-colors group-hover:text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    Started: {new Date(journey.startTime).toLocaleTimeString()} • 
                    Device: {journey.steps[0]?.metadata.device} • 
                    Location: {journey.steps[0]?.metadata.location}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Journey View */}
      {viewMode === 'detailed' && selectedJourney && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Journey Details - Session {selectedJourney.sessionId.slice(-6)}</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Journey Timeline */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
                {selectedJourney.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`relative flex items-start gap-4 pb-8 transition-all duration-500 ${
                      currentStep >= index ? 'opacity-100 journey-step-reveal' : 'opacity-40'
                    }`}
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className={`relative z-10 w-12 h-12 rounded-full ${getStepColor(step.type)} flex items-center justify-center text-white shadow-lg ${
                      currentStep === index && isPlaying ? 'step-highlight' : ''
                    } hover:scale-110 transition-transform duration-200`}>
                      {getStepIcon(step.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{step.action}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Page:</span>
                            <div className="font-medium">{step.page}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <div className="font-medium">{formatDuration(step.duration)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Device:</span>
                            <div className="font-medium capitalize">{step.metadata.device}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Engagement:</span>
                            <div className={`font-medium ${
                              step.metadata.engagement >= 80 ? 'text-green-600' :
                              step.metadata.engagement >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {step.metadata.engagement}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{step.metadata.location}</span>
                          </div>
                          {step.metadata.referrer && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-gray-400" />
                              <span>from {step.metadata.referrer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Journey Timeline Comparison</h3>
              
              {filteredJourneys.slice(0, 3).map((journey, journeyIndex) => (
                <div key={journey.sessionId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        journey.outcome === 'converted' ? 'bg-green-500' :
                        journey.outcome === 'abandoned' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">Session {journey.sessionId.slice(-6)}</span>
                      <Badge variant="outline">{journey.outcome}</Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDuration(journey.totalDuration)}
                    </span>
                  </div>
                  
                  {/* Horizontal Timeline */}
                  <div className="relative">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {journey.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                          <div className="group relative">
                            <div className={`w-10 h-10 rounded-full ${getStepColor(step.type)} flex items-center justify-center text-white`}>
                              {getStepIcon(step.type)}
                            </div>
                            {/* Hover Tooltip */}
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {step.action}
                              <br />
                              {formatDuration(step.duration)}
                            </div>
                          </div>
                          {index < journey.steps.length - 1 && (
                            <div className="w-8 h-0.5 bg-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

CustomerJourneyVisualization.displayName = 'CustomerJourneyVisualization';

export { CustomerJourneyVisualization };
export default CustomerJourneyVisualization;