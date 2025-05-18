'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, MapPin } from 'lucide-react';
import { getVisitorLocations, VisitorLocation } from '@/lib/leadpulse/dataProvider';

// World map data (simplified coordinates for SVG path)
const WORLD_MAP_PATH = "M3.5,49.8l1.8-0.7l1.8-0.7h2.3l0.8,2.2l2.7,0.9l1.3,0.1l2.5-1l4.8,0.8l1,1.3l-0.9,1.2l-0.3,2.7v2.6l-2.2-1.1l-1.7-2 l-2.7-0.7h-3.4l-3,0.9l-1.4,1.2L3.5,55l-1-1.1L3,51.1L3.5,49.8z M57.1,27.4l-2,0.6l-0.9,1.6l3.5,2.5l2.5,4.9l3,5l-1.6,0.7 l1.4,1.8v3.2l-1.1,2.9l-2.8,1.1l-4.2,2.7l-3.8,3.3l-2.7-0.9l2.7-3.6l3.3-1.6l-0.3-1.9l-3.7,2.1l-2,3.1l-2.1,3.6l-2.6,0.2l-2,2.9 l-2.9,0.8l-1.2,1.8l-0.6,2.4l0.9,2.2l1.3-0.6l1.7,1.3l2,3.7l-1.2,1.4l-3.5-1.7l-1.4-2.6h-4.8l-5,0.6l2.3-2.4l0.3-3.3l-0.9-2 l-2,1l-3.7-4.8L24,54.8l-0.4-3.5L21,46.6l-1.9-1.1l-7.1-0.2l-3.1-2.2l1.6-1.5l-1-4.2l2.2-2.5l2.9-0.7l-0.3-2l2.1-3.1l2-2.8 l2.8-0.4l4.8,0.2l-1.6-3.4l0.4-1.8l2-0.7L29,19l2.6-0.1l0.9-1.5l2.2-1.3l4.8-0.2l4.3,0.6l1.8,1l0.8-0.8l2.9,1.2l0.8,0.7 l-1.6,1.4v1.8l3.7,0.3l2.4,0.9l3-1.6l2.1,0.6l0.3,2.2l-2.1,1.1l-0.2,1.3L57.1,27.4z M89.3,13.7l0.2,2.4l-2.2,2.9l-2.1,1.4 l-3.9-0.1l-4.2,3l-4.1-0.1l-3,1.2l-1.8,2.3l-3.7,0.7l-2-1.7l-2.9-1.3l-0.1-1.9l1.5-1.1l2.6-0.2l3.4-2.6l4.6-2l2.1-1.9l2.4-1.2 l3.7-0.8l2.3,0.9l5.1-0.7L89.3,13.7z";

// Simplified map marker coordinates (latitude and longitude to SVG x,y)
const CITY_COORDINATES: {[key: string]: {lat: number, lng: number, x: number, y: number}} = {
  'New York': { lat: 40.7128, lng: -74.0060, x: 35, y: 26 },
  'London': { lat: 51.5074, lng: -0.1278, x: 45, y: 23 },
  'Lagos': { lat: 6.5244, lng: 3.3792, x: 45, y: 41 },
  'Tokyo': { lat: 35.6762, lng: 139.6503, x: 83, y: 28 },
  'Sydney': { lat: -33.8688, lng: 151.2093, x: 85, y: 52 },
  'Cairo': { lat: 30.0444, lng: 31.2357, x: 53, y: 32 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, x: 32, y: 47 },
  'Delhi': { lat: 28.7041, lng: 77.1025, x: 68, y: 32 },
  'Abuja': { lat: 9.0765, lng: 7.3986, x: 47, y: 40 },
  'Accra': { lat: 5.6037, lng: -0.1870, x: 44, y: 41 },
};

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
  // State for active locations and activity pulses
  const [activeLocations, setActiveLocations] = useState<VisitorLocation[]>([]);
  const [activityPulses, setActivityPulses] = useState<{id: string, x: number, y: number, timestamp: number}[]>([]);
  const [mapMode, setMapMode] = useState<'all' | 'active'>('all');
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  
  // Fetch visitor locations
  useEffect(() => {
    async function fetchLocations() {
      setLoading(true);
      try {
        const locations = await getVisitorLocations(selectedTimeRange);
        setActiveLocations(locations);
      } catch (error) {
        console.error('Error fetching visitor locations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLocations();
  }, [selectedTimeRange]);
  
  // Simulate activity pulses every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeLocations.length > 0) {
        const activeLocationKeys = activeLocations
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
  }, [activeLocations]);
  
  // Get city coordinates
  const getCityCoordinates = (city: string) => {
    return CITY_COORDINATES[city] || null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Live Visitor Map</CardTitle>
            <CardDescription>
              Geographic visualization of visitor activity
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={mapMode === 'all' ? "default" : "outline"} 
              size="sm"
              onClick={() => setMapMode('all')}
            >
              All Visitors
            </Button>
            <Button 
              variant={mapMode === 'active' ? "default" : "outline"} 
              size="sm"
              onClick={() => setMapMode('active')}
            >
              Active Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse">Loading visitor data...</div>
          </div>
        ) : (
          <>
            {/* World Map with visitors */}
            <div className="relative h-[300px] w-full">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 100 60" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* World map background */}
                <motion.path
                  d={WORLD_MAP_PATH}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  fill="#e2e8f0"
                  stroke="#94a3b8"
                  strokeWidth="0.2"
                />
                
                {/* Location markers */}
                {activeLocations
                  .filter(loc => mapMode === 'all' || loc.isActive)
                  .map((location) => {
                    const cityCoord = getCityCoordinates(location.city);
                    if (!cityCoord) return null;
                    
                    return (
                      <g 
                        key={location.id}
                        onMouseEnter={() => setHoveredLocation(location.id)}
                        onMouseLeave={() => setHoveredLocation(null)}
                        onClick={() => onSelectLocation && onSelectLocation(location.city)}
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
                        {location.isActive && (
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
                            x={cityCoord.x - 10}
                            y={cityCoord.y - 35}
                            width="80"
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
                
                {/* Activity pulses */}
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
              </svg>
            </div>
            
            {/* Visitor location stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {activeLocations
                .filter(loc => mapMode === 'all' || loc.isActive)
                .slice(0, 5)
                .map(location => (
                  <motion.div
                    key={location.id}
                    className="bg-muted rounded-lg p-2 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
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