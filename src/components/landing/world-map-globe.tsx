"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  status: "hot" | "warm" | "cold";
  pulseDelay?: number;
}

interface WorldMapGlobeProps {
  markers: MapMarker[];
  onMarkerHover?: (markerId: string | null) => void;
  activeMarkerId?: string | null;
}

export function WorldMapGlobe({ markers, onMarkerHover, activeMarkerId }: WorldMapGlobeProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLight = theme === "light";

  // Convert lat/lng to percentage positions (0-100)
  const latLngToPercentage = (lat: number, lng: number) => {
    // Convert longitude to x percentage (-180 to 180 => 0 to 100)
    const x = ((lng + 180) / 360) * 100;
    
    // Convert latitude to y percentage (90 to -90 => 0 to 100)
    const y = ((90 - lat) / 180) * 100;
    
    return { x, y };
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* Stylized world map background */}
      <div 
        className="absolute inset-0"
        style={{
          background: isLight
            ? "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"rgba(0,0,0,0.03)\" stroke-width=\"0.5\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100\" height=\"100\" fill=\"url(%23grid)\"/%3E%3C/svg%3E'), linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f0f9ff 100%)"
            : "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"rgba(255,255,255,0.02)\" stroke-width=\"0.5\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100\" height=\"100\" fill=\"url(%23grid)\"/%3E%3C/svg%3E'), linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
        }}
      />
      
      {/* Stylized continent shapes */}
      <div className="absolute inset-0">
        {/* Africa - centered */}
        <div 
          className={`absolute w-32 h-40 ${isLight ? 'bg-gray-300/40' : 'bg-slate-700/40'} rounded-full transform rotate-12 blur-sm`}
          style={{ top: '35%', left: '48%', transform: 'translate(-50%, -50%) rotate(12deg)' }}
        />
        {/* Europe */}
        <div 
          className={`absolute w-20 h-16 ${isLight ? 'bg-gray-300/30' : 'bg-slate-700/30'} rounded-full blur-sm`}
          style={{ top: '20%', left: '48%', transform: 'translate(-50%, -50%)' }}
        />
        {/* Asia */}
        <div 
          className={`absolute w-48 h-32 ${isLight ? 'bg-gray-300/30' : 'bg-slate-700/30'} rounded-full transform rotate-6 blur-sm`}
          style={{ top: '30%', left: '70%', transform: 'translate(-50%, -50%) rotate(6deg)' }}
        />
        {/* North America */}
        <div 
          className={`absolute w-36 h-28 ${isLight ? 'bg-gray-300/30' : 'bg-slate-700/30'} rounded-full transform -rotate-12 blur-sm`}
          style={{ top: '25%', left: '20%', transform: 'translate(-50%, -50%) rotate(-12deg)' }}
        />
        {/* South America */}
        <div 
          className={`absolute w-24 h-36 ${isLight ? 'bg-gray-300/30' : 'bg-slate-700/30'} rounded-full transform rotate-6 blur-sm`}
          style={{ top: '60%', left: '28%', transform: 'translate(-50%, -50%) rotate(6deg)' }}
        />
        {/* Australia */}
        <div 
          className={`absolute w-24 h-16 ${isLight ? 'bg-gray-300/30' : 'bg-slate-700/30'} rounded-full blur-sm`}
          style={{ top: '70%', left: '80%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Connection lines between African markers */}
      <svg className="absolute inset-0 w-full h-full">
        <g className="connection-lines">
          {markers
            .filter(m => ["ng", "ke", "za", "eg", "gh"].some(prefix => m.id.startsWith(prefix)))
            .map((marker, i, arr) => {
              if (i === arr.length - 1) return null;
              const next = arr[i + 1];
              const start = latLngToPercentage(marker.lat, marker.lng);
              const end = latLngToPercentage(next.lat, next.lng);
              
              return (
                <line
                  key={`line-${marker.id}-${next.id}`}
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke={isLight ? "#3b82f6" : "#60a5fa"}
                  strokeWidth="1"
                  strokeDasharray="3,5"
                  opacity="0.3"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </line>
              );
            })}
        </g>
      </svg>

      {/* Markers */}
      <div className="absolute inset-0">
        {markers.map((marker, index) => {
          const { x, y } = latLngToPercentage(marker.lat, marker.lng);
          const isActive = activeMarkerId === marker.id;
          const colors = {
            hot: { main: "#22c55e", glow: "rgba(34, 197, 94, 0.5)" },
            warm: { main: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)" },
            cold: { main: "#9ca3af", glow: "rgba(156, 163, 175, 0.5)" }
          };
          const color = colors[marker.status];
          
          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => onMarkerHover?.(marker.id)}
              onMouseLeave={() => onMarkerHover?.(null)}
            >
              {/* Outer glow for hot leads */}
              {marker.status === "hot" && (
                <div 
                  className="absolute w-12 h-12 rounded-full -inset-6 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
                    animationDelay: `${(marker.pulseDelay || index * 0.2)}s`
                  }}
                />
              )}

              {/* Pulse rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="absolute rounded-full border-2 animate-ping"
                  style={{
                    borderColor: color.main,
                    width: marker.status === "hot" ? "32px" : "24px",
                    height: marker.status === "hot" ? "32px" : "24px",
                    animationDelay: `${(marker.pulseDelay || index * 0.2)}s`
                  }}
                />
                {marker.status === "hot" && (
                  <div 
                    className="absolute rounded-full border animate-ping"
                    style={{
                      borderColor: color.main,
                      width: "24px",
                      height: "24px",
                      animationDelay: `${(marker.pulseDelay || index * 0.2) + 0.5}s`
                    }}
                  />
                )}
              </div>

              {/* Main marker dot */}
              <div 
                className="relative cursor-pointer transition-all duration-200"
                style={{
                  width: isActive ? "16px" : marker.status === "hot" ? "12px" : "8px",
                  height: isActive ? "16px" : marker.status === "hot" ? "12px" : "8px",
                  backgroundColor: color.main,
                  borderRadius: "50%",
                  border: `2px solid ${isLight ? "white" : "#0f172a"}`,
                  boxShadow: isActive ? `0 0 16px ${color.glow}` : "0 2px 4px rgba(0,0,0,0.1)",
                  transform: isActive ? "scale(1.2)" : "scale(1)"
                }}
              >
                {/* Center glow dot for hot leads */}
                {marker.status === "hot" && (
                  <div 
                    className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full"
                    style={{ opacity: 0.8 }}
                  />
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Animated data particles */}
      <div className="absolute inset-0 pointer-events-none">
        {markers
          .filter(m => m.status === "hot")
          .slice(0, 3)
          .map((marker, i) => {
            const { x, y } = latLngToPercentage(marker.lat, marker.lng);
            return (
              <div
                key={`particle-${marker.id}`}
                className="absolute w-2 h-2 bg-green-500 rounded-full opacity-0"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animation: `particle-flow 3s ease-in-out infinite`,
                  animationDelay: `${i * 1}s`
                }}
              />
            );
          })}
      </div>

      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: isLight
            ? "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.02) 85%, rgba(0,0,0,0.04) 100%)"
            : "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.1) 85%, rgba(0,0,0,0.15) 100%)"
        }}
      />

    </div>
  );
}