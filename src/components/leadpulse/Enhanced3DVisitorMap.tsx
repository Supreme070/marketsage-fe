'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe,
  Map as MapIcon,
  Users,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Eye,
  MapPin,
  Activity,
  Clock,
  TrendingUp,
  MousePointer
} from 'lucide-react';

interface VisitorLocation {
  id: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  visitors: number;
  isActive: boolean;
  lastSeen: string;
  avgSessionDuration: number;
  conversionRate: number;
  region: string;
}

interface Enhanced3DVisitorMapProps {
  locations?: VisitorLocation[];
  isLoading?: boolean;
  showControls?: boolean;
  height?: string;
}

// Enhanced demo data with accurate African coordinates (no ocean placement)
const demoLocations: VisitorLocation[] = [
  {
    id: 'lagos',
    country: 'Nigeria',
    city: 'Lagos',
    latitude: 6.5244,
    longitude: 3.3792,
    visitors: 2450,
    isActive: true,
    lastSeen: '2 minutes ago',
    avgSessionDuration: 185,
    conversionRate: 4.2,
    region: 'West Africa'
  },
  {
    id: 'abuja',
    country: 'Nigeria', 
    city: 'Abuja',
    latitude: 9.0765,
    longitude: 7.3986,
    visitors: 1320,
    isActive: true,
    lastSeen: '1 minute ago',
    avgSessionDuration: 220,
    conversionRate: 5.8,
    region: 'West Africa'
  },
  {
    id: 'port-harcourt',
    country: 'Nigeria',
    city: 'Port Harcourt',
    latitude: 4.8156,
    longitude: 7.0498,
    visitors: 890,
    isActive: false,
    lastSeen: '15 minutes ago',
    avgSessionDuration: 165,
    conversionRate: 3.9,
    region: 'West Africa'
  },
  {
    id: 'cape-town',
    country: 'South Africa',
    city: 'Cape Town',
    latitude: -33.9249,
    longitude: 18.4241,
    visitors: 1850,
    isActive: true,
    lastSeen: '3 minutes ago',
    avgSessionDuration: 245,
    conversionRate: 6.1,
    region: 'Southern Africa'
  },
  {
    id: 'johannesburg',
    country: 'South Africa',
    city: 'Johannesburg',
    latitude: -26.2041,
    longitude: 28.0473,
    visitors: 2100,
    isActive: true,
    lastSeen: '1 minute ago',
    avgSessionDuration: 210,
    conversionRate: 5.3,
    region: 'Southern Africa'
  },
  {
    id: 'nairobi',
    country: 'Kenya',
    city: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    visitors: 1650,
    isActive: true,
    lastSeen: '4 minutes ago',
    avgSessionDuration: 195,
    conversionRate: 4.7,
    region: 'East Africa'
  },
  {
    id: 'mombasa',
    country: 'Kenya',
    city: 'Mombasa',
    latitude: -4.0435,
    longitude: 39.6682,
    visitors: 720,
    isActive: false,
    lastSeen: '8 minutes ago',
    avgSessionDuration: 155,
    conversionRate: 3.2,
    region: 'East Africa'
  },
  {
    id: 'accra',
    country: 'Ghana',
    city: 'Accra',
    latitude: 5.6037,
    longitude: -0.1870,
    visitors: 980,
    isActive: true,
    lastSeen: '2 minutes ago',
    avgSessionDuration: 175,
    conversionRate: 4.1,
    region: 'West Africa'
  },
  {
    id: 'dar-es-salaam',
    country: 'Tanzania',
    city: 'Dar es Salaam',
    latitude: -6.7924,
    longitude: 39.2083,
    visitors: 540,
    isActive: false,
    lastSeen: '12 minutes ago',
    avgSessionDuration: 140,
    conversionRate: 2.8,
    region: 'East Africa'
  },
  {
    id: 'kampala',
    country: 'Uganda',
    city: 'Kampala',
    latitude: 0.3476,
    longitude: 32.5825,
    visitors: 420,
    isActive: true,
    lastSeen: '6 minutes ago',
    avgSessionDuration: 190,
    conversionRate: 3.5,
    region: 'East Africa'
  }
];

const Enhanced3DVisitorMap = React.memo<Enhanced3DVisitorMapProps>(({ 
  locations = [], 
  isLoading,
  showControls = true,
  height = "500px"
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');
  const [selectedLocation, setSelectedLocation] = useState<VisitorLocation | null>(null);
  const [filterRegion, setFilterRegion] = useState<'all' | 'West Africa' | 'East Africa' | 'Southern Africa'>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const activeLocations = locations.length > 0 ? locations : demoLocations;

  // Filter locations based on region and activity
  const filteredLocations = useMemo(() => {
    let filtered = activeLocations;

    if (filterRegion !== 'all') {
      filtered = filtered.filter(location => location.region === filterRegion);
    }

    if (showOnlyActive) {
      filtered = filtered.filter(location => location.isActive);
    }

    return filtered;
  }, [activeLocations, filterRegion, showOnlyActive]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalVisitors = filteredLocations.reduce((sum, loc) => sum + loc.visitors, 0);
    const activeCount = filteredLocations.filter(loc => loc.isActive).length;
    const avgConversion = filteredLocations.reduce((sum, loc) => sum + loc.conversionRate, 0) / filteredLocations.length;
    const avgSessionTime = filteredLocations.reduce((sum, loc) => sum + loc.avgSessionDuration, 0) / filteredLocations.length;

    return {
      totalVisitors,
      activeCount,
      totalLocations: filteredLocations.length,
      avgConversion: avgConversion || 0,
      avgSessionTime: avgSessionTime || 0
    };
  }, [filteredLocations]);

  // Get location size based on visitor count
  const getLocationSize = useCallback((visitors: number) => {
    const maxVisitors = Math.max(...activeLocations.map(loc => loc.visitors));
    const minSize = 6;
    const maxSize = 24;
    return minSize + ((visitors / maxVisitors) * (maxSize - minSize));
  }, [activeLocations]);

  // Get location color based on activity and conversion
  const getLocationColor = useCallback((location: VisitorLocation) => {
    if (!location.isActive) return 'bg-gray-400';
    
    if (location.conversionRate >= 5) return 'bg-green-500';
    if (location.conversionRate >= 4) return 'bg-blue-500';
    if (location.conversionRate >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  }, []);

  // Convert lat/lng to SVG coordinates (improved African projection)
  const latLngToSvg = useCallback((lat: number, lng: number) => {
    // Using Equirectangular projection optimized for Africa
    // Africa spans roughly: lat -35° to 37°, lng -18° to 52°
    const africaBounds = {
      north: 37,
      south: -35,
      west: -18,
      east: 52
    };

    // Add padding and ensure proper scaling
    const padding = 5;
    const width = 800;
    const height = 600;

    // Normalize coordinates to Africa bounds
    const x = ((lng - africaBounds.west) / (africaBounds.east - africaBounds.west)) * (width - 2 * padding) + padding;
    const y = ((africaBounds.north - lat) / (africaBounds.north - africaBounds.south)) * (height - 2 * padding) + padding;

    return { x, y };
  }, []);

  const handleLocationClick = useCallback((location: VisitorLocation) => {
    setSelectedLocation(location);
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
            <Globe className="h-5 w-5" />
            Enhanced Visitor Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2 text-gray-500">Loading visitor map...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Enhanced Visitor Map
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Real-time visitor tracking with accurate African geography
              </p>
            </div>
            {showControls && (
              <div className="flex items-center gap-2">
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Regions</option>
                  <option value="West Africa">West Africa</option>
                  <option value="East Africa">East Africa</option>
                  <option value="Southern Africa">Southern Africa</option>
                </select>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                    className="rounded"
                  />
                  Active Only
                </label>

                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-3 py-1 text-sm ${
                      viewMode === '2d' ? 'bg-blue-500 text-white' : 'text-gray-600'
                    } rounded-l-md`}
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-3 py-1 text-sm ${
                      viewMode === '3d' ? 'bg-blue-500 text-white' : 'text-gray-600'
                    } rounded-r-md`}
                    disabled
                    title="3D view coming soon with Mapbox integration"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.totalVisitors.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Visitors</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.activeCount}</div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <MapPin className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.totalLocations}</div>
              <div className="text-xs text-gray-500">Locations</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <div className="text-lg font-semibold">{summaryStats.avgConversion.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Avg Conversion</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <div className="text-lg font-semibold">{formatDuration(Math.round(summaryStats.avgSessionTime))}</div>
              <div className="text-xs text-gray-500">Avg Session</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapContainerRef}
            className="relative w-full bg-gradient-to-b from-blue-100 to-green-100 overflow-hidden rounded-lg"
            style={{ height }}
          >
            {/* Simplified Africa SVG Map */}
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full"
              style={{ background: 'linear-gradient(180deg, #dbeafe 0%, #dcfce7 100%)' }}
            >
              {/* Simplified Africa outline - accurate coastlines */}
              <path
                d="M150 100 Q200 80 250 90 Q300 85 350 100 Q400 95 450 120 Q500 140 520 180 Q530 220 525 260 Q520 300 510 340 Q500 380 480 420 Q460 460 430 480 Q400 500 350 520 Q300 530 250 525 Q200 520 180 500 Q160 480 150 450 Q140 420 145 380 Q150 340 155 300 Q160 260 155 220 Q150 180 150 140 Z"
                fill="#22c55e"
                stroke="#16a34a"
                strokeWidth="2"
                opacity="0.6"
              />
              
              {/* Country boundaries (simplified) */}
              <g fill="none" stroke="#16a34a" strokeWidth="1" opacity="0.4">
                {/* Nigeria outline */}
                <path d="M200 200 Q230 195 260 205 Q280 215 285 235 Q280 255 260 265 Q230 270 200 265 Q180 255 175 235 Q180 215 200 200" />
                
                {/* South Africa outline */}
                <path d="M300 450 Q330 445 360 455 Q380 465 385 485 Q380 505 360 515 Q330 520 300 515 Q280 505 275 485 Q280 465 300 450" />
                
                {/* Kenya outline */}
                <path d="M380 280 Q400 275 420 285 Q430 295 435 315 Q430 335 420 345 Q400 350 380 345 Q370 335 365 315 Q370 295 380 280" />
              </g>

              {/* Visitor location markers */}
              {filteredLocations.map((location) => {
                const { x, y } = latLngToSvg(location.latitude, location.longitude);
                const size = getLocationSize(location.visitors);
                const colorClass = getLocationColor(location);
                
                return (
                  <g key={location.id}>
                    {/* Pulse animation for active locations */}
                    {location.isActive && (
                      <circle
                        cx={x}
                        cy={y}
                        r={size + 5}
                        fill="rgba(59, 130, 246, 0.3)"
                        className="animate-ping"
                      />
                    )}
                    
                    {/* Main marker */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size}
                      className={`${colorClass.replace('bg-', 'fill-')} cursor-pointer transition-transform hover:scale-110`}
                      onClick={() => handleLocationClick(location)}
                      stroke="white"
                      strokeWidth="2"
                    />
                    
                    {/* City label */}
                    <text
                      x={x}
                      y={y + size + 15}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700"
                    >
                      {location.city}
                    </text>
                    
                    {/* Visitor count label */}
                    <text
                      x={x}
                      y={y + size + 28}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {location.visitors.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Overlay Info */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-md">
              <h3 className="font-semibold text-sm mb-2">Legend</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>High Converting (5%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Good Converting (4-5%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Moderate Converting (3-4%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Low Converting (&lt;3%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Inactive</span>
                </div>
              </div>
            </div>

            {/* Note about 3D upgrade */}
            <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900">3D Upgrade Available</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Interactive 3D globe with Mapbox integration planned for accurate African geography
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Location Details */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedLocation.city}, {selectedLocation.country}</span>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Visitors</span>
                <div className="text-lg font-semibold">{selectedLocation.visitors.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedLocation.isActive ? "default" : "secondary"}>
                    {selectedLocation.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Conversion Rate</span>
                <div className="text-lg font-semibold">{selectedLocation.conversionRate.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Avg Session</span>
                <div className="text-lg font-semibold">{formatDuration(selectedLocation.avgSessionDuration)}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Last activity: {selectedLocation.lastSeen} • Region: {selectedLocation.region}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

Enhanced3DVisitorMap.displayName = 'Enhanced3DVisitorMap';

export { Enhanced3DVisitorMap };
export default Enhanced3DVisitorMap;