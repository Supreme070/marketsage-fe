'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, MapPin, Activity, Thermometer, Layers, Box, Map } from 'lucide-react';
import { VisitorLocation, getVisitorLocations } from '@/lib/leadpulse/dataProvider';
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl font-bold">Live Visitor Map</CardTitle>
            <CardDescription>
              Geographic visualization of visitor activity
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <div className="mr-2 flex items-center bg-muted p-1 rounded-md">
              <Button 
                variant={mapView === '2d' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setMapView('2d')}
                className="h-8"
              >
                <Map className="h-4 w-4 mr-1" />
                2D
              </Button>
              <Button 
                variant={mapView === '3d' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setMapView('3d')}
                className="h-8"
              >
                <Box className="h-4 w-4 mr-1" />
                3D
              </Button>
            </div>
            
            {mapView === '2d' && (
              <>
                <Button 
                  variant={mapMode === 'all' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('all')}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  All Visitors
                </Button>
                <Button 
                  variant={mapMode === 'active' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('active')}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Active Now
                </Button>
                <Button 
                  variant={mapMode === 'heat' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setMapMode('heat')}
                >
                  <Thermometer className="h-4 w-4 mr-1" />
                  Heat Map
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
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse">Loading visitor data...</div>
          </div>
        ) : (
          <>
            {/* 3D Globe Visualization */}
            {mapView === '3d' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-[400px] flex justify-center"
              >
                <GlobeVisualization 
                  visitorData={filteredLocations}
                  onSelectLocation={handleLocationClick}
                  width={mapDimensions.width || 800}
                  height={400}
                />
              </motion.div>
            ) : (
              <>
                {/* 2D World Map with visitors */}
                <div className="relative h-[300px] w-full" ref={mapContainerRef}>
                  <svg 
                    className="w-full h-full" 
                    viewBox="0 0 100 60" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* World map background */}
                    <motion.path
                      d={getMapPath()}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.8 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      fill="#e2e8f0"
                      stroke="#94a3b8"
                      strokeWidth="0.2"
                    />
                    
                    {/* Continent clickable areas (only shown on world map) */}
                    {geoPath.length === 0 && Object.entries(CONTINENT_PATHS).map(([id, path]) => (
                      <motion.path
                        key={id}
                        d={path}
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth="0"
                        className="cursor-pointer hover:fill-primary/10"
                        onClick={() => handleContinentClick(id)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                    ))}
                    
                    {/* Location markers */}
                    {filteredLocations
                      .filter(loc => mapMode === 'heat' || mapMode === 'all' || (mapMode === 'active' && loc.isActive))
                      .map((location) => {
                        const cityCoord = CITY_COORDINATES[location.city];
                        if (!cityCoord) return null;
                        
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
                              cx={cityCoord.x}
                              cy={cityCoord.y}
                              r={location.isActive ? 0.8 : 0.6}
                              fill={location.isActive ? "#ef4444" : "#6366f1"}
                            />
                            
                            {/* Active pulse for active visitors */}
                            {location.isActive && mapMode !== 'heat' && (
                              <motion.circle
                                cx={cityCoord.x}
                                cy={cityCoord.y}
                                r={0.8}
                                fill="#ef4444"
                                initial={{ opacity: 0.7, scale: 1 }}
                                animate={{ 
                                  opacity: 0,
                                  scale: 3,
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2,
                                  ease: "easeOut"
                                }}
                              />
                            )}
                            
                            {/* Tooltip */}
                            {hoveredLocation === location.id && (
                              <foreignObject
                                x={cityCoord.x - 15}
                                y={cityCoord.y - 35}
                                width="100"
                                height="30"
                              >
                                <div className="bg-white text-xs p-1 rounded shadow border text-center">
                                  <div className="font-medium">{location.city}</div>
                                  <div className="text-[10px] text-muted-foreground">{location.country}</div>
                                </div>
                              </foreignObject>
                            )}
                          </g>
                        );
                      })}
                    
                    {/* Activity pulses (only in non-heat map mode) */}
                    {mapMode !== 'heat' && (
                      <AnimatePresence>
                        {activityPulses.map(pulse => (
                          <motion.circle
                            key={pulse.id}
                            cx={pulse.x}
                            cy={pulse.y}
                            r={0.8}
                            fill="#ef4444"
                            initial={{ opacity: 0.7, scale: 1 }}
                            animate={{ 
                              opacity: 0,
                              scale: 4,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 2,
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
                    mapHeight={mapDimensions.height}
                  />
                </div>
              </>
            )}
            
            {/* Timeline slider */}
            <div className="mt-4">
              <TimelineSlider
                startTime={startTimeRef.current}
                endTime={new Date()}
                onTimeChange={handleTimeChange}
                isPlaying={isTimelineActive}
                onPlayToggle={() => setIsTimelineActive(!isTimelineActive)}
              />
            </div>
            
            {/* Visitor location stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredLocations
                .filter(loc => mapMode === 'heat' || mapMode === 'all' || (mapMode === 'active' && loc.isActive))
                .slice(0, 5)
                .map(location => (
                  <motion.div
                    key={location.id}
                    className="bg-muted rounded-lg p-2 text-sm cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleLocationClick(location.city)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate">{location.city}</div>
                      {location.isActive && (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.8, 1] 
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-red-500"
                        />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{location.visitCount}</span>
                      <Badge 
                        variant="outline" 
                        className="ml-auto text-[10px] py-0 h-4"
                      >
                        {location.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 