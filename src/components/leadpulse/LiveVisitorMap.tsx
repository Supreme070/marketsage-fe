'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, MapPin, Activity, Thermometer, Layers, Box, Map, ZoomIn, ZoomOut } from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';
import { getVisitorLocations } from '@/lib/leadpulse/unifiedDataProvider';
import { useLeadPulseLocationSync } from '@/hooks/useLeadPulseSync';
import { raceConditionDetector } from '@/lib/leadpulse/race-condition-detector';
import TimelineSlider from './TimelineSlider';
import HeatMapOverlay from './HeatMapOverlay';
import GeoFilterBreadcrumb from './GeoFilterBreadcrumb';
import GlobeVisualization from './GlobeVisualization';
import DemoModeToggle from './DemoModeToggle';
import { 
  CONTINENT_PATHS, 
  WORLD_MAP_PATH, 
  CITY_COORDINATES, 
  CITY_MAPPINGS, 
  getGeoHierarchy,
  ALL_REGIONS,
  latLngToSvgCoords,
  getRegionById,
  getRegionChildren,
  getViewBoxForPath,
  isRegionClickable,
  CONTINENTS,
  COUNTRIES,
  loadGeoData,
  getContinent,
  getCountry,
  getCountriesInContinent
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

  // Use synchronized data to prevent race conditions
  const { 
    locations: hookLocations, 
    isLoading: syncLoading, 
    error: syncError,
    isStale,
    lastUpdated 
  } = useLeadPulseLocationSync({
    timeRange,
    refreshInterval: 15000, // 15 seconds
    fallbackToDemo: true,
    enableRealtime: true,
    syncStrategy: 'priority_based'
  });

  // Local state for active locations that can be modified
  const [activeLocations, setActiveLocations] = useState<VisitorLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<VisitorLocation[]>([]);
  const [activityPulses, setActivityPulses] = useState<{id: string, x: number, y: number, timestamp: number}[]>([]);
  const [mapMode, setMapMode] = useState<'all' | 'active' | 'heat'>('all');
  const [mapView, setMapView] = useState<'2d' | '3d'>('2d');
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialLoading || syncLoading);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const operationIdRef = useRef<string | null>(null);

  // Sync hook locations with local state
  useEffect(() => {
    if (hookLocations && hookLocations.length > 0) {
      setActiveLocations(hookLocations);
    }
  }, [hookLocations]);
  
  // Enhanced state for geographical filtering and zoom
  const [geoPath, setGeoPath] = useState<string[]>([]); // Start at world view
  const [currentViewBox, setCurrentViewBox] = useState<string>("0 0 1000 500");
  const [geoDataLoaded, setGeoDataLoaded] = useState(false);

  // Preload geographic data
  useEffect(() => {
    const preloadGeoData = async () => {
      try {
        await loadGeoData();
        setGeoDataLoaded(true);
      } catch (error) {
        console.error('Failed to preload geographic data:', error);
        setGeoDataLoaded(true); // Still proceed with fallback data
      }
    };
    
    preloadGeoData();
  }, []);
  
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
  
  // Update viewBox when geoPath changes with smooth transition
  useEffect(() => {
    const updateViewBox = async () => {
      // Use our enhanced function that loads processed data
      const newViewBox = await getViewBoxForRegion(geoPath);
      setCurrentViewBox(newViewBox);
    };
    updateViewBox();
  }, [geoPath]);
  
  // Fetch visitor locations with real-time updates
  useEffect(() => {
    let isActive = true;
    let refreshInterval: NodeJS.Timeout | null = null;

    async function fetchLocations() {
      if (!isActive) return;
      
      try {
        // Fetch both locations and enhanced overview for consistency
        const [locations, overview] = await Promise.all([
          getVisitorLocations(selectedTimeRange),
          fetch(`/api/leadpulse?timeRange=${selectedTimeRange}`).then(res => res.json())
        ]);
        
        if (!isActive) return; // Component unmounted
        
        // Ensure active location count matches enhanced overview
        // Don't override the isActive property from the API - it's already correctly set
        const enhancedLocations = locations.map((loc: any) => ({
          ...loc,
          // Preserve the original isActive value from the API
          isActive: loc.isActive
        }));
        
        setActiveLocations(enhancedLocations);
        filterLocationsByGeoPath(enhancedLocations, geoPath);
      } catch (error) {
        console.error('Error fetching visitor locations:', error);
        if (!isActive) return;
        
        // Fallback to original logic
        try {
          const locations = await getVisitorLocations(selectedTimeRange);
          if (isActive) {
            setActiveLocations(locations);
            filterLocationsByGeoPath(locations, geoPath);
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    
    // Initial fetch
    setLoading(true);
    fetchLocations();
    
    // Set up real-time polling every 30 seconds for live data updates
    refreshInterval = setInterval(() => {
      if (isActive) {
        fetchLocations();
      }
    }, 30000); // Optimized: 30 seconds instead of 3 seconds
    
    return () => {
      isActive = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
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
  
  // Generate activity pulses that match actual visitor count
  useEffect(() => {
    if (mapView === '3d') return; // Don't need pulses in 3D mode as it has its own animations
    
    const activeVisitorLocations = filteredLocations.filter(loc => loc.isActive);
    const activeCount = activeVisitorLocations.length;
    
    if (activeCount === 0) {
      setActivityPulses([]);
      return;
    }
    
    // Create pulses for each active visitor location
    const interval = setInterval(() => {
      // Generate pulses proportional to visitor count (1 pulse per 2-3 active visitors)
      const pulsesToGenerate = Math.max(1, Math.ceil(activeCount / 2.5));
      
      for (let i = 0; i < pulsesToGenerate; i++) {
        // Select random active location
        const randomLocation = activeVisitorLocations[Math.floor(Math.random() * activeVisitorLocations.length)];
        const { x, y } = convertToSVGCoordinates(randomLocation.latitude, randomLocation.longitude);
        
        // Add slight randomness to avoid overlapping pulses
        const offsetX = x + (Math.random() - 0.5) * 10;
        const offsetY = y + (Math.random() - 0.5) * 10;
        
        const newPulse = {
          id: `pulse_${Date.now()}_${i}`,
          x: offsetX,
          y: offsetY,
          timestamp: Date.now()
        };
        
        setActivityPulses(prev => [...prev, newPulse]);
        
        // Remove old pulses after animation completes
        setTimeout(() => {
          setActivityPulses(prev => prev.filter(p => p.id !== newPulse.id));
        }, 2000);
      }
    }, 1500); // Faster pulse generation for more activity
    
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

  // Helper function to get viewBox for a geographic path using processed data
  const getViewBoxForRegion = async (path: string[]): Promise<string> => {
    try {
      if (path.length === 0) {
        return "0 0 1000 500"; // World view
      }
      
      const regionId = path[path.length - 1];
      
      // For Africa continent or African countries, use processed data
      if (regionId === 'africa' || ['GHA', 'KEN', 'NGA', 'ZAF', 'gha', 'ken', 'nga', 'zaf'].includes(regionId.toUpperCase())) {
        try {
          const response = await fetch('/geo-data/processed-africa.json');
          const data = await response.json();
          
          if (regionId === 'africa') {
            return data.africa.viewBox || "0 0 1000 500";
          } else {
            const countryData = data.countries[regionId.toUpperCase()];
            return countryData?.viewBox || "0 0 1000 500";
          }
        } catch (error) {
          console.error('Failed to load processed Africa data:', error);
        }
      }
      
      // Fall back to the original function for other regions
      return await getViewBoxForPath(path);
    } catch (error) {
      console.error('Error getting viewBox for region:', error);
      return "0 0 1000 500";
    }
  };
  
  // Enhanced handler for region clicks (continents, countries, states)
  const handleRegionClick = async (regionId: string) => {
    try {
      console.log('Region clicked:', regionId);
      
      const clickable = await isRegionClickable(regionId);
      if (!clickable) {
        console.log('Region not clickable:', regionId);
        return;
      }
      
      // Build the path to this region
      const newPath = [...geoPath];
      
      // If clicking on a region that's already in the path, zoom to that level
      const existingIndex = newPath.indexOf(regionId);
      if (existingIndex !== -1) {
        const trimmedPath = newPath.slice(0, existingIndex + 1);
        setGeoPath(trimmedPath);
        
        // Update viewBox for this zoom level
        const newViewBox = await getViewBoxForRegion(trimmedPath);
        setCurrentViewBox(newViewBox);
        return;
      }
      
      // Otherwise, add this region to the path
      newPath.push(regionId);
      setGeoPath(newPath);
      
      // Update viewBox for the new zoom level
      const newViewBox = await getViewBoxForRegion(newPath);
      setCurrentViewBox(newViewBox);
      
      console.log('Updated path:', newPath);
      console.log('New viewBox:', newViewBox);
      
      // Notify parent component
      if (onSelectLocation) {
        const region = await getRegionById(regionId);
        onSelectLocation(region?.name || regionId);
      }
    } catch (error) {
      console.error('Error handling region click:', error);
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (geoPath.length > 0) {
      setGeoPath(geoPath.slice(0, -1));
    }
  };
  
  // Handle reset to world view
  const handleResetView = () => {
    setGeoPath([]);
  };
  
  // Handle geo navigation path updates
  const handleGeoPathUpdate = (newPath: string[]) => {
    setGeoPath(newPath);
  };
  
  // Get current zoom level info
  const [zoomInfo, setZoomInfo] = useState<{
    level: string;
    name?: string;
    canZoomOut: boolean;
    children?: any[];
  }>({ level: 'world', canZoomOut: false });

  useEffect(() => {
    const updateZoomInfo = async () => {
      if (geoPath.length === 0) {
        setZoomInfo({ level: 'world', canZoomOut: false });
        return;
      }
      
      const currentRegion = await getRegionById(geoPath[geoPath.length - 1]);
      const children = await getRegionChildren(geoPath[geoPath.length - 1]);
      
      setZoomInfo({
        level: currentRegion?.type || 'unknown',
        name: currentRegion?.name || 'Unknown',
        canZoomOut: geoPath.length > 0,
        children
      });
    };
    
    updateZoomInfo();
  }, [geoPath]);
  
  // Function to convert lat/lng to SVG coordinates with zoom support
  const convertToSVGCoordinates = (latitude: number, longitude: number) => {
    // Use the proper coordinate conversion function that uses Web Mercator projection
    return latLngToSvgCoords(latitude, longitude, geoPath.length > 0 ? currentViewBox : undefined);
  };

  // Get regions to display based on current zoom level
  const [displayRegions, setDisplayRegions] = useState<any[]>([]);

  useEffect(() => {
    const updateDisplayRegions = async () => {
      if (geoPath.length === 0) {
        // World view - show clickable regions as hotspots (not full continents)
        // Only show interactive hotspots, let the background image handle the geography
        setDisplayRegions([
          {
            id: 'africa',
            name: 'Africa',
            code: 'AF',
            type: 'continent',
            coordinates: { lat: 0, lng: 20, x: 500, y: 300 },
            svgPath: "M 495 110 L 505 115 L 515 120 L 525 130 L 535 140 L 545 155 L 555 170 L 565 185 L 575 200 L 580 215 L 585 230 L 590 245 L 595 260 L 600 275 L 605 290 L 608 305 L 610 320 L 612 335 L 610 350 L 605 365 L 600 380 L 595 395 L 590 410 L 585 425 L 580 440 L 575 455 L 570 470 L 565 485 L 560 500 L 555 515 L 545 525 L 530 530 L 515 532 L 500 530 L 485 525 L 470 518 L 455 510 L 440 500 L 430 488 L 422 475 L 415 460 L 410 445 L 405 430 L 400 415 L 395 400 L 390 385 L 388 370 L 385 355 L 383 340 L 382 325 L 381 310 L 380 295 L 379 280 L 378 265 L 377 250 L 378 235 L 380 220 L 383 205 L 387 190 L 392 175 L 398 160 L 405 145 L 413 130 L 422 118 L 432 108 L 443 100 L 455 95 L 468 93 L 481 95 L 495 110 Z",
            viewBox: "305.55555555555554 126.66666666666669 255.55555555555554 340",
            clickable: true,
            children: ['GHA', 'KEN', 'NGA', 'ZAF']
          }
        ]);
        return;
      }
      
      const currentRegionId = geoPath[geoPath.length - 1];
      
      // If we're in Africa, show the real countries from processed data
      if (currentRegionId === 'africa') {
        try {
          const response = await fetch('/geo-data/processed-africa.json');
          const data = await response.json();
          
          if (data.countries) {
            const africanCountries = Object.values(data.countries);
            setDisplayRegions(africanCountries);
            console.log('Loaded African countries:', africanCountries);
            return;
          } else {
            throw new Error('No countries data in processed file');
          }
        } catch (error) {
          console.error('Failed to load African countries from processed data:', error);
          // Fallback to static countries
          const staticCountries = Object.values(COUNTRIES).filter(c => c.parent === 'africa');
          setDisplayRegions(staticCountries);
        }
        return;
      }
      
      // Default behavior for other regions
      const currentRegion = await getRegionById(currentRegionId);
      
      if (currentRegion?.children) {
        const children = await getRegionChildren(currentRegionId);
        const clickableChildren = children.filter((region: any) => region.clickable);
        setDisplayRegions(clickableChildren);
      } else {
        setDisplayRegions([]);
      }
    };
    
    updateDisplayRegions();
  }, [geoPath, geoDataLoaded]);

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
              {zoomInfo.level !== 'world' && (
                <Badge variant="secondary" className="ml-2 bg-blue-600/20 text-blue-300">
                  {zoomInfo.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time geographic visualization with drill-down navigation
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Demo Mode Toggle */}
            <DemoModeToggle className="mr-2" showLabel={false} variant="ghost" />
            
            {/* Zoom controls */}
            {mapView === '2d' && (
              <div className="mr-2 flex items-center bg-gray-800/50 p-1 rounded-md border border-gray-700/50">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={!zoomInfo.canZoomOut}
                  className="h-7 text-xs text-gray-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleResetView}
                  disabled={geoPath.length === 0}
                  className="h-7 text-xs text-gray-300 hover:text-white"
                  title="Reset to World View"
                >
                  <Globe className="h-3 w-3" />
                </Button>
              </div>
            )}
            
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
                  selectedPath={geoPath}
                  onRegionClick={handleRegionClick}
                  displayRegions={displayRegions}
                  width={mapDimensions.width || 800}
                  height={300}
                />
              </motion.div>
            ) : (
              <>
                {/* Enhanced 2D SVG Map Visualization with Drill-down */}
                <div 
                  ref={mapContainerRef}
                  className="relative w-full h-[300px] bg-gray-800/30 rounded-lg border border-gray-700/30 overflow-hidden"
                >
                  {/* World Map Background */}
                  <div 
                    className="absolute inset-0 bg-center bg-cover opacity-80"
                    style={{
                      backgroundImage: 'url(/textures/world_map_2d.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  
                  {/* Dark overlay for better contrast */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 to-blue-900/20" />
                  
                  <motion.svg 
                    width="100%" 
                    height="100%" 
                    viewBox={currentViewBox}
                    className="absolute inset-0 z-10"
                    preserveAspectRatio="xMidYMid meet"
                    animate={{ viewBox: currentViewBox }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    {/* Clickable geographic regions */}
                    {displayRegions.map((region) => (
                      <g key={region.id}>
                        <motion.path
                          d={region.svgPath}
                          fill={hoveredRegion === region.id ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.15)"}
                          stroke={hoveredRegion === region.id ? "#3b82f6" : "#1e40af"}
                          strokeWidth={hoveredRegion === region.id ? "2" : "1"}
                          className="cursor-pointer transition-all duration-300"
                          onMouseEnter={() => setHoveredRegion(region.id)}
                          onMouseLeave={() => setHoveredRegion(null)}
                          onClick={() => handleRegionClick(region.id)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        {/* Region label */}
                        {hoveredRegion === region.id && (
                          <motion.text
                            x={region.coordinates.x}
                            y={region.coordinates.y}
                            textAnchor="middle"
                            className="fill-white text-xs font-medium pointer-events-none"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            {region.name}
                          </motion.text>
                        )}
                      </g>
                    ))}
                    
                    {/* Visitor location markers */}
                    {filteredLocations
                      .filter(loc => mapMode === 'heat' || mapMode === 'all' || (mapMode === 'active' && loc.isActive))
                      .map((location) => {
                        // Convert lat/lng to SVG coordinates using enhanced conversion
                        const { x, y } = convertToSVGCoordinates(location.latitude, location.longitude);
                        
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
                              r={location.isActive ? 5 : 4}
                              fill={location.isActive ? "#ff4444" : "#4488ff"}
                              stroke="white"
                              strokeWidth="2"
                              filter="drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))"
                            />
                            
                            {/* Active pulse for active visitors */}
                            {location.isActive && (
                              <motion.circle
                                cx={x}
                                cy={y}
                                r={5}
                                fill="none"
                                stroke="#ff4444"
                                strokeWidth="2"
                                initial={{ r: 5, opacity: 0.8 }}
                                animate={{ 
                                  r: 15,
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
                    
                    {/* Enhanced Activity pulses */}
                    {mapMode !== 'heat' && (
                      <AnimatePresence>
                        {activityPulses.map(pulse => (
                          <g key={pulse.id}>
                            {/* Main pulse circle */}
                            <motion.circle
                              cx={pulse.x}
                              cy={pulse.y}
                              r={3}
                              fill="#00ff88"
                              initial={{ opacity: 1, scale: 1 }}
                              animate={{ 
                                opacity: 0,
                                scale: 6,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 2,
                                ease: "easeOut"
                              }}
                            />
                            {/* Secondary pulse ring */}
                            <motion.circle
                              cx={pulse.x}
                              cy={pulse.y}
                              r={2}
                              fill="none"
                              stroke="#00ff88"
                              strokeWidth="2"
                              initial={{ opacity: 0.8, scale: 1 }}
                              animate={{ 
                                opacity: 0,
                                scale: 8,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 2.5,
                                ease: "easeOut",
                                delay: 0.2
                              }}
                            />
                            {/* Center dot */}
                            <motion.circle
                              cx={pulse.x}
                              cy={pulse.y}
                              r={1.5}
                              fill="#ffffff"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 1,
                                ease: "easeOut"
                              }}
                            />
                          </g>
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.svg>
                  
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
            
            {/* Enhanced visitor location stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Zoom Level</div>
                <div className="text-lg font-bold text-blue-400 capitalize">{zoomInfo.level}</div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Visitors Shown</div>
                <div className="text-xl font-bold text-green-400">{filteredLocations.length}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  ({filteredLocations.filter(l => l.isActive).length} active)
                  {filteredLocations.filter(l => l.isActive).length > 0 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Current View</div>
                <div className="text-sm font-semibold text-blue-300 truncate">
                  {geoPath.length === 0 ? 'World' : zoomInfo.name || 'Unknown'}
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-3 border border-gray-700/30">
                <div className="text-xs text-gray-400">Clickable Regions</div>
                <div className="text-xl font-bold text-purple-400">{displayRegions.length}</div>
              </div>
            </div>
            
            {/* Debug info for filtering */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-gray-800/20 rounded text-xs text-gray-400">
                <strong>Debug:</strong> Path: {geoPath.join(' → ') || 'World'} | 
                Total visitors: {activeLocations.length} | 
                Filtered: {filteredLocations.length} | 
                Regions: {displayRegions.map(r => r.name).join(', ') || 'None'}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}