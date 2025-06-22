'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SimpleGeoMapProps {
  onRegionClick?: (regionId: string) => void;
}

export default function SimpleGeoMap({ onRegionClick }: SimpleGeoMapProps) {
  const [currentView, setCurrentView] = useState<'world' | 'africa' | 'nigeria'>('world');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Define viewBoxes for each zoom level
  const viewBoxes = {
    world: "0 0 1000 500",
    africa: "305 126 255 340", 
    nigeria: "355 203 126 132"
  };

  // Define regions for each view
  const regions = {
    world: [
      {
        id: 'africa',
        name: 'Africa',
        // Simple Africa hotspot positioned on background map
        svgPath: "M 380 250 L 420 240 L 460 260 L 480 300 L 470 350 L 440 380 L 400 390 L 360 370 L 340 340 L 350 300 L 370 270 L 380 250 Z"
      }
    ],
    africa: [
      {
        id: 'nigeria',
        name: 'Nigeria',
        // Real Nigeria shape from processed data
        svgPath: "M 418.88952888888895 284.09339 L 416.58246222222226 285.29297333333335 L 415.73910222222224 285.1177033333334 L 414.88460444444445 285.86468666666667 L 413.1070511111111 285.79182333333335 L 411.9173444444445 283.70676333333336 L 411.18572 281.29399333333333 L 409.61246 279.09783 L 407.94262222222227 279.139 L 405.98156 279.1372766666667 L 406.10902888888893 273.76422 L 406.05287333333337 271.64385000000004 L 406.47179555555556 269.5413066666667 L 407.15633777777776 268.51949 L 408.23430666666667 266.4559666666667 L 408.0001555555555 265.55938 L 408.4380266666667 264.21751333333333 L 407.9382577777778 262.24020333333334 L 408.02484444444445 261.1327766666667 L 408.1791866666667 258.15699 L 408.8161844444445 256.81297 L 409.1287688888889 254.89594666666667 L 409.70743111111113 254.17506 L 412.0956844444445 253.78025333333332 L 414.3231688888889 255.02410666666668 L 415.1565377777778 256.28303 L 416.2905488888889 256.33987333333334 L 417.34371333333337 255.5215766666667 L 420.03318444444443 257.24447 L 421.16650666666663 257.16299333333336 L 422.47736444444445 255.74249333333333 L 423.7800711111111 255.8436066666667 L 424.4213177777778 255.37559000000002 L 425.61734 255.57006666666666 L 427.3379355555556 256.54270333333335 L 429.0755266666667 254.67951 L 429.5971155555556 254.8121466666667 L 431.10078444444446 258.46145 L 431.51408 258.38781000000006 L 432.3937288888889 259.71546333333333 L 432.1515377777778 260.31749333333335 L 432.0341755555556 261.4254366666667 L 430.16211111111113 264.00478000000004 L 429.5748355555556 266.1321266666667 L 429.2613333333333 267.86458000000005 L 428.7899288888889 268.6074266666667 L 428.34149333333335 270.94079 L 427.1530488888889 272.31392 L 426.8087688888889 274.00064000000003 L 426.3095755555556 275.3431933333334 L 426.10172000000006 276.7287233333334 L 424.5750844444444 277.85191 L 423.32750000000004 276.48214 L 422.48506000000003 276.53743333333335 L 421.1615688888889 278.48839333333336 L 420.51814 278.51836333333335 L 419.4611844444444 281.7344466666667 L 418.88952888888895 284.09339 Z"
      }
    ],
    nigeria: []
  };

  const handleRegionClick = (regionId: string) => {
    console.log('Clicked region:', regionId, 'Current view:', currentView);
    
    if (currentView === 'world' && regionId === 'africa') {
      setCurrentView('africa');
    } else if (currentView === 'africa' && regionId === 'nigeria') {
      setCurrentView('nigeria');
    }
    
    if (onRegionClick) {
      onRegionClick(regionId);
    }
  };

  const handleReset = () => {
    setCurrentView('world');
  };

  const currentRegions = regions[currentView];
  const currentViewBox = viewBoxes[currentView];

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
      {/* Background Map */}
      <div 
        className="absolute inset-0 bg-center bg-cover opacity-80"
        style={{
          backgroundImage: 'url(/textures/world_map_2d.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gray-900/40" />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 text-white text-sm">
        <div>Current View: <span className="font-bold">{currentView}</span></div>
        <div>ViewBox: {currentViewBox}</div>
        <button 
          onClick={handleReset}
          className="mt-2 px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
        >
          Reset to World
        </button>
      </div>
      
      {/* SVG Overlay */}
      <motion.svg 
        width="100%" 
        height="100%" 
        viewBox={currentViewBox}
        className="absolute inset-0 z-10"
        preserveAspectRatio="xMidYMid meet"
        animate={{ viewBox: currentViewBox }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {currentRegions.map((region) => (
          <g key={region.id}>
            <motion.path
              d={region.svgPath}
              fill={hoveredRegion === region.id ? "rgba(59, 130, 246, 0.5)" : "rgba(59, 130, 246, 0.2)"}
              stroke={hoveredRegion === region.id ? "#3b82f6" : "#1e40af"}
              strokeWidth={hoveredRegion === region.id ? "3" : "2"}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick(region.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Region label on hover */}
            {hoveredRegion === region.id && (
              <motion.text
                x="50%"
                y="50%"
                textAnchor="middle"
                className="fill-white text-lg font-bold pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {region.name}
              </motion.text>
            )}
          </g>
        ))}
      </motion.svg>
    </div>
  );
} 