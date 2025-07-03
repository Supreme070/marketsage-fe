import React, { useMemo } from 'react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';
import { motion } from 'framer-motion';
import { latLngToSvgCoords } from '@/lib/leadpulse/geoData';

interface HeatMapOverlayProps {
  visitorData: VisitorLocation[];
  showHeatMap: boolean;
  mapWidth: number;
  mapHeight: number;
}

// Define heat map point
interface HeatPoint {
  x: number;
  y: number;
  weight: number;
}

export default function HeatMapOverlay({
  visitorData,
  showHeatMap,
  mapWidth,
  mapHeight
}: HeatMapOverlayProps) {
  // Create heat map data points from visitor locations
  const heatPoints = useMemo(() => {
    if (!showHeatMap) return [];
    
    const points: HeatPoint[] = [];
    
    visitorData.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      // Convert lat/lng to SVG coordinates using proper projection
      const { x, y } = latLngToSvgCoords(location.latitude, location.longitude);
      
      // Scale the weight based on visitor count
      const weight = Math.min(1, (location.visitCount / 100) * 1.5);
      
      points.push({ x, y, weight });
    });
    
    return points;
  }, [visitorData, showHeatMap]);
  
  if (!showHeatMap || heatPoints.length === 0) {
    return null;
  }
  
  return (
    <motion.svg 
      className="absolute inset-0 pointer-events-none"
      width={mapWidth}
      height={mapHeight}
      viewBox="0 0 1000 500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        {/* Gradient for the heat spots */}
        <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: '#FF0000', stopOpacity: 0.9 }} />
          <stop offset="35%" style={{ stopColor: '#FF3300', stopOpacity: 0.7 }} />
          <stop offset="60%" style={{ stopColor: '#FF9900', stopOpacity: 0.5 }} />
          <stop offset="90%" style={{ stopColor: '#FFFF00', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#FFFF00', stopOpacity: 0 }} />
        </radialGradient>
        
        {/* Filter for blur effect */}
        <filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      
      {/* Heat map layer */}
      <g className="heat-layer" filter="url(#blurFilter)">
        {heatPoints.map((point, index) => (
          <circle
            key={`heat-${index}`}
            cx={point.x}
            cy={point.y}
            r={point.weight * 20 + 5} // Scale radius based on weight
            fill="url(#heatGradient)"
            opacity={point.weight * 0.8 + 0.2} // Scale opacity based on weight
          />
        ))}
      </g>
    </motion.svg>
  );
} 