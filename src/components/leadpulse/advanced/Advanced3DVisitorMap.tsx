/**
 * Advanced 3D Visitor Map Component
 * 
 * Provides 3D visualization of visitor locations with real-time tracking,
 * clustering, heatmaps, and interactive geographic analytics.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Globe, 
  MapPin, 
  Users, 
  Activity, 
  Zap,
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  Layers,
  Settings,
  Download,
  Share,
  RefreshCw,
  Maximize,
  Minimize,
  Filter,
  BarChart3,
  PieChart,
  Navigation,
  Compass,
  Map,
  Satellite,
  Mountain,
  Waves,
  Sun,
  Moon,
  Clock,
  Timer,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  RotateCcw,
  Move3D,
  Sparkles
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface Visitor3DLocation extends VisitorLocation {
  z: number; // Height/elevation for 3D
  velocity: { x: number; y: number; z: number };
  trail: Array<{ x: number; y: number; z: number; timestamp: number }>;
  clusterId?: string;
  heatmapIntensity: number;
  engagementLevel: 'low' | 'medium' | 'high';
  conversionProbability: number;
}

interface VisitorCluster {
  id: string;
  center: { x: number; y: number; z: number };
  radius: number;
  visitors: string[];
  intensity: number;
  conversionRate: number;
  averageEngagement: number;
}

interface Geographic3DInsight {
  id: string;
  type: 'hotspot' | 'coldspot' | 'movement' | 'conversion';
  location: { x: number; y: number; z: number };
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
}

interface Advanced3DVisitorMapProps {
  visitorLocations: VisitorLocation[];
  enableRealtime?: boolean;
  enable3D?: boolean;
  enableClustering?: boolean;
  enableHeatmap?: boolean;
  enableTrails?: boolean;
  onLocationClick?: (location: Visitor3DLocation) => void;
  onClusterClick?: (cluster: VisitorCluster) => void;
}

/**
 * Advanced 3D Visitor Map Component
 */
export function Advanced3DVisitorMap({
  visitorLocations,
  enableRealtime = true,
  enable3D = true,
  enableClustering = true,
  enableHeatmap = true,
  enableTrails = true,
  onLocationClick,
  onClusterClick
}: Advanced3DVisitorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('3d');
  const [viewStyle, setViewStyle] = useState<'satellite' | 'terrain' | 'street' | 'dark'>('satellite');
  const [showClusters, setShowClusters] = useState(enableClustering);
  const [showHeatmap, setShowHeatmap] = useState(enableHeatmap);
  const [showTrails, setShowTrails] = useState(enableTrails);
  const [showInsights, setShowInsights] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'converted' | 'high-engagement'>('all');

  // Transform visitor locations to 3D
  const visitor3DLocations = useMemo(() => {
    return visitorLocations.map((location, index) => ({
      ...location,
      z: Math.random() * 100 + 50, // Random elevation for 3D effect
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 0.5
      },
      trail: Array.from({ length: 5 }, (_, i) => ({
        x: location.longitude + (Math.random() - 0.5) * 0.1,
        y: location.latitude + (Math.random() - 0.5) * 0.1,
        z: Math.random() * 100 + 50,
        timestamp: Date.now() - i * 1000
      })),
      clusterId: undefined,
      heatmapIntensity: Math.random() * 100,
      engagementLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      conversionProbability: Math.random() * 100
    })) as Visitor3DLocation[];
  }, [visitorLocations]);

  // Generate visitor clusters
  const visitorClusters = useMemo(() => {
    if (!showClusters) return [];

    const clusters: VisitorCluster[] = [];
    const processed = new Set<string>();
    
    visitor3DLocations.forEach(location => {
      if (processed.has(location.id)) return;
      
      const nearbyVisitors = visitor3DLocations.filter(other => {
        const distance = Math.sqrt(
          Math.pow(location.longitude - other.longitude, 2) +
          Math.pow(location.latitude - other.latitude, 2)
        );
        return distance < 5 && !processed.has(other.id); // 5-degree radius
      });

      if (nearbyVisitors.length >= 3) {
        const cluster: VisitorCluster = {
          id: `cluster-${clusters.length}`,
          center: {
            x: nearbyVisitors.reduce((sum, v) => sum + v.longitude, 0) / nearbyVisitors.length,
            y: nearbyVisitors.reduce((sum, v) => sum + v.latitude, 0) / nearbyVisitors.length,
            z: nearbyVisitors.reduce((sum, v) => sum + v.z, 0) / nearbyVisitors.length
          },
          radius: Math.max(...nearbyVisitors.map(v => 
            Math.sqrt(Math.pow(v.longitude - location.longitude, 2) + Math.pow(v.latitude - location.latitude, 2))
          )),
          visitors: nearbyVisitors.map(v => v.id),
          intensity: nearbyVisitors.length,
          conversionRate: nearbyVisitors.filter(v => v.isActive).length / nearbyVisitors.length * 100,
          averageEngagement: nearbyVisitors.reduce((sum, v) => sum + v.heatmapIntensity, 0) / nearbyVisitors.length
        };
        
        clusters.push(cluster);
        nearbyVisitors.forEach(v => processed.add(v.id));
      }
    });
    
    return clusters;
  }, [visitor3DLocations, showClusters]);

  // Generate geographic insights
  const geographicInsights = useMemo(() => {
    const insights: Geographic3DInsight[] = [];
    
    // Hotspot detection
    visitorClusters.forEach(cluster => {
      if (cluster.intensity > 5) {
        insights.push({
          id: `hotspot-${cluster.id}`,
          type: 'hotspot',
          location: cluster.center,
          title: 'Visitor Hotspot Detected',
          description: `High concentration of ${cluster.intensity} visitors in this region`,
          confidence: 85,
          impact: 'high',
          recommendations: [
            'Consider targeted marketing campaigns for this region',
            'Analyze local market preferences',
            'Optimize content for regional audience'
          ]
        });
      }
    });

    // Conversion analysis
    const highConversionAreas = visitor3DLocations.filter(v => v.conversionProbability > 80);
    if (highConversionAreas.length > 0) {
      insights.push({
        id: 'conversion-hotspot',
        type: 'conversion',
        location: {
          x: highConversionAreas.reduce((sum, v) => sum + v.longitude, 0) / highConversionAreas.length,
          y: highConversionAreas.reduce((sum, v) => sum + v.latitude, 0) / highConversionAreas.length,
          z: highConversionAreas.reduce((sum, v) => sum + v.z, 0) / highConversionAreas.length
        },
        title: 'High Conversion Zone',
        description: `${highConversionAreas.length} visitors with high conversion probability`,
        confidence: 92,
        impact: 'high',
        recommendations: [
          'Focus marketing efforts on similar geographic areas',
          'Analyze successful conversion factors',
          'Expand presence in high-conversion regions'
        ]
      });
    }

    return insights;
  }, [visitor3DLocations, visitorClusters]);

  // Filter locations based on criteria
  const filteredLocations = useMemo(() => {
    switch (filterType) {
      case 'active':
        return visitor3DLocations.filter(v => v.isActive);
      case 'converted':
        return visitor3DLocations.filter(v => v.conversionProbability > 70);
      case 'high-engagement':
        return visitor3DLocations.filter(v => v.engagementLevel === 'high');
      default:
        return visitor3DLocations;
    }
  }, [visitor3DLocations, filterType]);

  // Animation loop for real-time updates
  useEffect(() => {
    if (!enableRealtime || !isPlaying) return;

    const interval = setInterval(() => {
      // Update visitor positions, trails, etc.
      setRotationAngle(prev => (prev + animationSpeed) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [enableRealtime, isPlaying, animationSpeed]);

  // Handle location selection
  const handleLocationClick = (location: Visitor3DLocation) => {
    setSelectedLocation(location.id);
    setSelectedCluster(null);
    onLocationClick?.(location);
  };

  // Handle cluster selection
  const handleClusterClick = (cluster: VisitorCluster) => {
    setSelectedCluster(cluster.id);
    setSelectedLocation(null);
    onClusterClick?.(cluster);
  };

  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Export map data
  const exportMapData = () => {
    const exportData = {
      locations: filteredLocations,
      clusters: visitorClusters,
      insights: geographicInsights,
      settings: {
        mapMode,
        viewStyle,
        showClusters,
        showHeatmap,
        showTrails,
        timeRange,
        filterType
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3d-visitor-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Advanced 3D Visitor Map
          </CardTitle>
          <CardDescription>
            Interactive 3D visualization of visitor locations with real-time tracking and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Primary Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mode:</span>
                <Tabs value={mapMode} onValueChange={(value) => setMapMode(value as '2d' | '3d')}>
                  <TabsList>
                    <TabsTrigger value="2d">2D</TabsTrigger>
                    <TabsTrigger value="3d">3D</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Style:</span>
                <Select value={viewStyle} onValueChange={setViewStyle}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter:</span>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visitors</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="high-engagement">High Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={showClusters} onCheckedChange={setShowClusters} />
                <span className="text-sm">Clusters</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
                <span className="text-sm">Heatmap</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showTrails} onCheckedChange={setShowTrails} />
                <span className="text-sm">Trails</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showInsights} onCheckedChange={setShowInsights} />
                <span className="text-sm">Insights</span>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm">
                  {isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Speed:</span>
                <Slider
                  value={[animationSpeed]}
                  onValueChange={([value]) => setAnimationSpeed(value)}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-24"
                />
                <span className="text-sm w-8">{animationSpeed}x</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Zoom:</span>
                <Slider
                  value={[zoomLevel]}
                  onValueChange={([value]) => setZoomLevel(value)}
                  max={3}
                  min={0.5}
                  step={0.1}
                  className="w-24"
                />
                <span className="text-sm w-8">{zoomLevel}x</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportMapData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Map Visualization */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className="relative h-96 bg-gradient-to-br from-blue-900 via-purple-900 to-black rounded-lg overflow-hidden"
            style={{
              backgroundImage: viewStyle === 'satellite' ? 'url(/api/placeholder/800/400)' : undefined,
              transform: `scale(${zoomLevel}) rotate(${rotationAngle * 0.1}deg)`,
              transformOrigin: 'center'
            }}
          >
            {/* Map Grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="border border-blue-400/20" />
                ))}
              </div>
            </div>

            {/* Visitor Locations */}
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className={`absolute cursor-pointer transition-all duration-500 ${
                  selectedLocation === location.id ? 'z-20 scale-150' : 'z-10'
                }`}
                style={{
                  left: `${((location.longitude + 180) / 360) * 100}%`,
                  top: `${((90 - location.latitude) / 180) * 100}%`,
                  transform: mapMode === '3d' ? `translateZ(${location.z}px)` : undefined
                }}
                onClick={() => handleLocationClick(location)}
              >
                {/* Visitor Marker */}
                <div className={`w-4 h-4 rounded-full border-2 ${
                  location.isActive 
                    ? 'bg-green-500 border-green-300 animate-pulse' 
                    : 'bg-blue-500 border-blue-300'
                } ${
                  location.engagementLevel === 'high' ? 'shadow-lg shadow-yellow-400' :
                  location.engagementLevel === 'medium' ? 'shadow-md shadow-blue-400' :
                  'shadow-sm shadow-gray-400'
                }`} />

                {/* Visitor Trail */}
                {showTrails && (
                  <div className="absolute inset-0">
                    {location.trail.map((point, index) => (
                      <div
                        key={index}
                        className="absolute w-2 h-2 rounded-full bg-white/20"
                        style={{
                          left: `${(point.x - location.longitude) * 100}px`,
                          top: `${(point.y - location.latitude) * 100}px`,
                          opacity: (5 - index) / 5,
                          transform: mapMode === '3d' ? `translateZ(${point.z}px)` : undefined
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Hover Info */}
                {selectedLocation === location.id && (
                  <div className="absolute top-6 left-6 bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-medium">{location.city}, {location.country}</div>
                    <div>Engagement: {location.engagementLevel}</div>
                    <div>Conversion: {location.conversionProbability.toFixed(0)}%</div>
                  </div>
                )}
              </div>
            ))}

            {/* Visitor Clusters */}
            {showClusters && visitorClusters.map((cluster) => (
              <div
                key={cluster.id}
                className={`absolute cursor-pointer transition-all duration-500 ${
                  selectedCluster === cluster.id ? 'z-20 scale-110' : 'z-5'
                }`}
                style={{
                  left: `${((cluster.center.x + 180) / 360) * 100}%`,
                  top: `${((90 - cluster.center.y) / 180) * 100}%`,
                  transform: mapMode === '3d' ? `translateZ(${cluster.center.z}px)` : undefined
                }}
                onClick={() => handleClusterClick(cluster)}
              >
                {/* Cluster Circle */}
                <div
                  className={`rounded-full border-2 border-yellow-400 bg-yellow-500/20 flex items-center justify-center text-white text-sm font-medium ${
                    cluster.intensity > 10 ? 'animate-pulse' : ''
                  }`}
                  style={{
                    width: `${Math.max(32, cluster.intensity * 4)}px`,
                    height: `${Math.max(32, cluster.intensity * 4)}px`
                  }}
                >
                  {cluster.intensity}
                </div>

                {/* Cluster Info */}
                {selectedCluster === cluster.id && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-medium">{cluster.intensity} visitors</div>
                    <div>Conversion: {cluster.conversionRate.toFixed(1)}%</div>
                    <div>Engagement: {cluster.averageEngagement.toFixed(0)}</div>
                  </div>
                )}
              </div>
            ))}

            {/* Heatmap Overlay */}
            {showHeatmap && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full bg-gradient-radial from-red-500/20 via-yellow-500/10 to-transparent opacity-50" />
              </div>
            )}

            {/* Geographic Insights */}
            {showInsights && geographicInsights.map((insight) => (
              <div
                key={insight.id}
                className="absolute z-30 cursor-pointer"
                style={{
                  left: `${((insight.location.x + 180) / 360) * 100}%`,
                  top: `${((90 - insight.location.y) / 180) * 100}%`,
                  transform: mapMode === '3d' ? `translateZ(${insight.location.z}px)` : undefined
                }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                  insight.type === 'hotspot' ? 'bg-red-500' :
                  insight.type === 'conversion' ? 'bg-green-500' :
                  insight.type === 'movement' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`}>
                  {insight.type === 'hotspot' ? <TrendingUp className="h-3 w-3" /> :
                   insight.type === 'conversion' ? <Target className="h-3 w-3" /> :
                   insight.type === 'movement' ? <Activity className="h-3 w-3" /> :
                   <Info className="h-3 w-3" />}
                </div>
              </div>
            ))}

            {/* 3D Lighting Effects */}
            {mapMode === '3d' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-blue-500/5 to-transparent" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Map Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredLocations.length}</div>
              <div className="text-sm text-muted-foreground">Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{visitorClusters.length}</div>
              <div className="text-sm text-muted-foreground">Clusters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredLocations.filter(v => v.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{geographicInsights.length}</div>
              <div className="text-sm text-muted-foreground">Insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Insights Panel */}
      {showInsights && geographicInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Geographic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {geographicInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    insight.type === 'hotspot' ? 'bg-red-100 text-red-600' :
                    insight.type === 'conversion' ? 'bg-green-100 text-green-600' :
                    insight.type === 'movement' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {insight.type === 'hotspot' ? <TrendingUp className="h-4 w-4" /> :
                     insight.type === 'conversion' ? <Target className="h-4 w-4" /> :
                     insight.type === 'movement' ? <Activity className="h-4 w-4" /> :
                     <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline">{insight.confidence}% confidence</Badge>
                      <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <div className="space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-green-700">{rec}</span>
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
}

export default Advanced3DVisitorMap;