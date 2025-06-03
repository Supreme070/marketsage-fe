'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, MapPin, Activity, Thermometer, Layers, Box, Map } from 'lucide-react';
import { type VisitorLocation, getVisitorLocations } from '@/lib/leadpulse/dataProvider';
import TimelineSlider from './TimelineSlider';
import HeatMapOverlay from './HeatMapOverlay';
import GeoFilterBreadcrumb from './GeoFilterBreadcrumb';
import GlobeVisualization from './GlobeVisualization';
import { 
  CONTINENT_PATHS, 
  WORLD_MAP_PATH, 
  CITY_COORDINATES, 
  CITY_MAPPINGS, 
  getGeoHierarchy 
} from '@/lib/leadpulse/geoData';

interface LiveVisitorMapProps {
  visitorData?: any[];
  isLoading?: boolean;
  onSelectLocation?: (location: string) => void;
  timeRange?: string;
}

export default function LiveVisitorMap({
  visitorData = [],
  isLoading: initialLoading = false,
  onSelectLocation,
  timeRange = '24h'
}: LiveVisitorMapProps) {
  // Refs for dimensions
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // State for active locations and activity pulses
  const [activeLocations, setActiveLocations] = useState<VisitorLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<VisitorLocation[]>([]);
  const [activityPulses, setActivityPulses] = useState<{id: string, x: number, y: number, timestamp: number}[]>([]);
  const [mapMode, setMapMode] = useState<'all' | 'active' | 'heat'>('all');
  const [mapView, setMapView] = useState<'2d' | '3d'>('2d');
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  
  // State for geographical filtering
  const [geoPath, setGeoPath] = useState<string[]>(['africa']); // Start focused on Africa
  
  // State for timeline playback
  const [isTimelineActive, setIsTimelineActive] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const startTimeRef = useRef<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  
  // Update map dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        setMapDimensions({
          width: mapContainerRef.current.offsetWidth,
          height: mapContainerRef.current.offsetHeight
        });
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Fetch visitor locations
  useEffect(() => {
    async function fetchLocations() {
      setLoading(true);
      try {
        const locations = await getVisitorLocations(selectedTimeRange);
        setActiveLocations(locations);
        filterLocationsByGeoPath(locations, geoPath);
      } catch (error) {
        console.error('Error fetching visitor locations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLocations();
  }, [selectedTimeRange, geoPath]);
  
  // Filter locations based on geo path
  const filterLocationsByGeoPath = (locations: VisitorLocation[], path: string[]) => {
    if (!path.length) {
      setFilteredLocations(locations);
      return;
    }
    
    const filtered = locations.filter(location => {
      const hierarchy = getGeoHierarchy(location.city);
      
      // Check if the hierarchy matches the path at each level
      for (let i = 0; i < path.length; i++) {
        if (hierarchy[i] !== path[i]) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredLocations(filtered);
  };
  
  // Apply geo filtering when path changes
  useEffect(() => {
    filterLocationsByGeoPath(activeLocations, geoPath);
  }, [geoPath, activeLocations]);
  
  // Simulate activity pulses every few seconds
  useEffect(() => {
    if (mapView === '3d') return; // Don't need pulses in 3D mode as it has its own animations
    
    const interval = setInterval(() => {
      if (filteredLocations.length > 0) {
        const activeLocationKeys = filteredLocations
          .filter(loc => loc.isActive)
          .map(loc => loc.city);
          
        if (activeLocationKeys.length === 0) return;
        
        const randomCity = activeLocationKeys[Math.floor(Math.random() * activeLocationKeys.length)];
        const cityCoord = CITY_COORDINATES[randomCity];
        
        if (cityCoord) {
          const newPulse = {
            id: `pulse_${Date.now()}`,
            x: cityCoord.x,
            y: cityCoord.y,
            timestamp: Date.now()
          };
          
          setActivityPulses(prev => [...prev, newPulse]);
          
          // Remove old pulses after animation completes
          setTimeout(() => {
            setActivityPulses(prev => prev.filter(p => p.id !== newPulse.id));
          }, 2000);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [filteredLocations, mapView]);
  
  // Handle time change from timeline
  const handleTimeChange = (time: Date) => {
    setCurrentTime(time);
    
    // In a real implementation, we would fetch data for this specific time
    // For now, let's just simulate by showing fewer active locations
    const timeAgoMs = Date.now() - time.getTime();
    const daysDiff = timeAgoMs / (1000 * 60 * 60 * 24);
    
    // Simulate fewer active locations as we go back in time
    const simulatedActive = activeLocations.map(loc => ({
      ...loc,
      isActive: daysDiff < 1 ? loc.isActive : Math.random() > daysDiff / 10
    }));
    
    setActiveLocations(simulatedActive);
    filterLocationsByGeoPath(simulatedActive, geoPath);
  };
  
  // Handle location click for drilling down
  const handleLocationClick = (city: string) => {
    // Get the hierarchy for this city
    const hierarchy = getGeoHierarchy(city);
    
    // Set the path to include everything up to this city
    setGeoPath(hierarchy);
    
    // Call the original handler if provided
    if (onSelectLocation) {
      onSelectLocation(city);
    }
  };
  
  // Handle click on continent
  const handleContinentClick = (continentId: string) => {
    setGeoPath([continentId]);
  };
  
  // Handle geo navigation path updates
  const handleGeoPathUpdate = (newPath: string[]) => {
    setGeoPath(newPath);
  };
  
  // Get appropriate map path based on current geo path
  const getMapPath = () => {
    if (geoPath.length === 0) {
      return WORLD_MAP_PATH; // World map
    }
    
    const continentId = geoPath[0];
    return CONTINENT_PATHS[continentId] || WORLD_MAP_PATH;
  };
  
  // Get active continent
  const getActiveContinent = () => {
    if (!geoPath.length) return null;
    return geoPath[0];
  };

  return (
    <Card className="w-full h-full bg-gray-900/50 border-blue-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/20">
                <Globe className="h-4 w-4 text-blue-400" />
              </div>
              Live Visitor Map
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time geographic visualization
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <div className="mr-2 flex items-center bg-gray-800/50 p-1 rounded-md border border-gray-700/50">
              <Button 
                variant={mapView === '2d' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setMapView('2d')}
                className="h-7 text-xs bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30"
              >
                <Map className="h-3 w-3 mr-1" />
                2D
              </Button>
              <Button 
                variant={mapView === '3d' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setMapView('3d')}
                className="h-7 text-xs bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30"
              >
                <Box className="h-3 w-3 mr-1" />
                3D
              </Button>
            </div>
            
            {mapView === '2d' && (
              <>
                <Button 
                  variant={mapMode === 'all' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('all')}
                  className="h-7 text-xs border-gray-600/50 bg-gray-800/30 hover:bg-gray-700/50"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button 
                  variant={mapMode === 'active' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('active')}
                  className="h-7 text-xs border-green-600/50 bg-green-800/30 hover:bg-green-700/50"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Active
                </Button>
                <Button 
                  variant={mapMode === 'heat' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('heat')}
                  className="h-7 text-xs border-orange-600/50 bg-orange-800/30 hover:bg-orange-700/50"
                >
                  <Thermometer className="h-3 w-3 mr-1" />
                  Heat
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Geographic filter breadcrumb - only show in 2D mode */}
        {mapView === '2d' && (
          <AnimatePresence>
            {geoPath.length > 0 && (
              <GeoFilterBreadcrumb 
                path={geoPath} 
                onNavigate={handleGeoPathUpdate} 
              />
            )}
          </AnimatePresence>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-gray-400 text-sm">Loading visitor data...</div>
          </div>
        ) : (
          <>
            {/* 3D Globe Visualization */}
            {mapView === '3d' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-[300px] flex justify-center"
              >
                <GlobeVisualization 
                  visitorData={filteredLocations}
                  onSelectLocation={handleLocationClick}
                  width={mapDimensions.width || 800}
                  height={300}
                />
              </motion.div>
            ) : (
              <>
                {/* 2D SVG Map Visualization */}
                <div 
                  ref={mapContainerRef}
                  className="relative w-full h-[300px] bg-gray-800/30 rounded-lg border border-gray-700/30 overflow-hidden"
                >
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 1000 500" 
                    className="absolute inset-0"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                  >
                    {/* World map background */}
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.2"/>
                      </pattern>
                      <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.2" />
                    
                    {/* Render world map path */}
                    <path
                      d={WORLD_MAP_PATH}
                      fill="#374151"
                      stroke="#4b5563"
                      strokeWidth="0.5"
                      opacity="0.8"
                    />
                    
                    {/* Render filtered locations */}
                    {filteredLocations
                      .filter(loc => mapMode === 'heat' || mapMode === 'all' || (mapMode === 'active' && loc.isActive))
                      .map((location) => {
                        // Convert lat/lng to SVG coordinates
                        const x = ((location.longitude + 180) * (1000 / 360));
                        const y = ((90 - location.latitude) * (500 / 180));
                        
                        return (
                          <g 
                            key={location.id}
                            onMouseEnter={() => setHoveredLocation(location.id)}
                            onMouseLeave={() => setHoveredLocation(null)}
                            onClick={() => handleLocationClick(location.city)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Base marker */}
                            <motion.circle
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              cx={x}
                              cy={y}
                              r={location.isActive ? 4 : 3}
                              fill={location.isActive ? "#3b82f6" : "#6366f1"}
                              stroke="white"
                              strokeWidth="1"
                              filter="drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))"
                            />
                            
                            {/* Active pulse for active visitors */}
                            {location.isActive && (
                              <motion.circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1"
                                initial={{ r: 4, opacity: 0.8 }}
                                animate={{ 
                                  r: 12,
                                  opacity: 0
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeOut"
                                }}
                              />
                            )}
                            
                            {/* Hover tooltip */}
                            {hoveredLocation === location.id && (
                              <foreignObject 
                                x={x - 80} 
                                y={y - 80} 
                                width="160" 
                                height="60"
                              >
                                <div 
                                  className="bg-gray-900/95 text-white p-3 rounded-md shadow-lg text-sm border border-gray-600/50 backdrop-blur-sm"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  <div className="font-semibold text-blue-300">{location.city}</div>
                                  <div className="text-gray-300">{location.country}</div>
                                  <div className="text-green-400 text-xs mt-1">
                                    {location.visitCount} visits • {location.isActive ? 'Active now' : location.lastActive}
                                  </div>
                                </div>
                              </foreignObject>
                            )}
                          </g>
                        );
                      })}
                    
                    {/* Activity pulses */}
                    {mapMode !== 'heat' && (
                      <AnimatePresence>
                        {activityPulses.map(pulse => (
                          <motion.circle
                            key={pulse.id}
                            cx={pulse.x}
                            cy={pulse.y}
                            r={3}
                            fill="#3b82f6"
                            initial={{ opacity: 0.8, scale: 1 }}
                            animate={{ 
                              opacity: 0,
                              scale: 4,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 1.5,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </svg>
                  
                  {/* Heat map overlay */}
                  <HeatMapOverlay 
                    visitorData={filteredLocations}
                    showHeatMap={mapMode === 'heat'}
                    mapWidth={mapDimensions.width}
                    mapHeight={300}
                  />
                </div>
              </>
            )}
            
            {/* Timeline slider - compact version */}
            <div className="mt-4">
              <TimelineSlider
                startTime={startTimeRef.current}
                endTime={new Date()}
                onTimeChange={handleTimeChange}
                isPlaying={isTimelineActive}
                onPlayToggle={() => setIsTimelineActive(!isTimelineActive)}
              />
            </div>
            
            {/* Visitor location stats - compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Total Locations</div>
                <div className="text-xl font-bold text-white">{filteredLocations.length}</div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Active Now</div>
                <div className="text-xl font-bold text-green-400">{filteredLocations.filter(l => l.isActive).length}</div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Top Location</div>
                <div className="text-sm font-semibold text-blue-300 truncate">
                  {filteredLocations.sort((a, b) => b.visitCount - a.visitCount)[0]?.city || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Coverage</div>
                <div className="text-xl font-bold text-purple-400">{filteredLocations.length > 0 ? '12' : '0'} Countries</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 