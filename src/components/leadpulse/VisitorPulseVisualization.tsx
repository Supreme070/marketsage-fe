'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PulseDataPoint {
  timestamp: string;
  value: number;
  type: 'pageview' | 'click' | 'form_interaction' | 'conversion';
  url?: string;
  title?: string;
}

interface VisitorJourney {
  id: string;
  visitorId: string;
  fingerprint: string;
  location?: string;
  device?: string;
  browser?: string;
  engagementScore: number;
  lastActive: string;
  pulseData: PulseDataPoint[];
}

interface Props {
  visitorId?: string;
  data?: VisitorJourney[];
  isLoading?: boolean;
  onSelectVisitor?: (visitorId: string) => void;
}

export default function VisitorPulseVisualization({ 
  visitorId, 
  data = [], 
  isLoading = false,
  onSelectVisitor
}: Props) {
  const [selectedVisitor, setSelectedVisitor] = useState<string | undefined>(visitorId);
  const [timeWindow, setTimeWindow] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Select first visitor if none selected and data is available
  useEffect(() => {
    if (!selectedVisitor && data.length > 0) {
      setSelectedVisitor(data[0].id);
      if (onSelectVisitor) onSelectVisitor(data[0].id);
    }
  }, [data, selectedVisitor, onSelectVisitor]);

  // Get the selected visitor data
  const visitorData = data.find(v => v.id === selectedVisitor);
  
  // Function to render the pulse visualization
  const renderPulseGraph = (pulseData: PulseDataPoint[]) => {
    if (!pulseData || pulseData.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          No activity data available
        </div>
      );
    }

    // Sort data by timestamp
    const sortedData = [...pulseData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Normalize values between 0 and 100 for visualization
    const maxValue = Math.max(...sortedData.map(p => p.value));
    const normalizedData = sortedData.map((point, i) => ({
      ...point,
      id: `point-${i}`,
      normalizedValue: maxValue > 0 ? (point.value / maxValue) * 100 : 0
    }));

    return (
      <div className="relative h-40 w-full mt-4">
        {/* Background grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 gap-1 opacity-10">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="border-t border-l border-gray-300"></div>
          ))}
        </div>
        
        {/* X-axis (time) */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between text-xs text-muted-foreground">
          {timeWindow === '1h' && (
            <>
              <span>Now</span>
              <span>15m ago</span>
              <span>30m ago</span>
              <span>45m ago</span>
              <span>1h ago</span>
            </>
          )}
          {timeWindow === '24h' && (
            <>
              <span>Now</span>
              <span>6h ago</span>
              <span>12h ago</span>
              <span>18h ago</span>
              <span>24h ago</span>
            </>
          )}
          {timeWindow === '7d' && (
            <>
              <span>Today</span>
              <span>2d ago</span>
              <span>4d ago</span>
              <span>6d ago</span>
              <span>7d ago</span>
            </>
          )}
          {timeWindow === '30d' && (
            <>
              <span>Today</span>
              <span>1w ago</span>
              <span>2w ago</span>
              <span>3w ago</span>
              <span>1m ago</span>
            </>
          )}
        </div>
        
        {/* Pulse line with animation */}
        <svg className="absolute inset-0 h-32" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Background area with animation */}
          <motion.path
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.3, pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            d={`M0,100 ${normalizedData.map((point, i) => {
              const x = (i / (normalizedData.length - 1)) * 100;
              const y = 100 - point.normalizedValue;
              return `L${x},${y}`;
            }).join(' ')} L100,100 Z`}
            fill="url(#pulseGradient)"
          />
          
          {/* Pulse line with animation */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={`M0,${100 - (normalizedData[0]?.normalizedValue || 0)} ${normalizedData.map((point, i) => {
              const x = (i / (normalizedData.length - 1)) * 100;
              const y = 100 - point.normalizedValue;
              return `L${x},${y}`;
            }).join(' ')}`}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Activity points with staggered animation */}
          {normalizedData.map((point, i) => {
            const x = (i / (normalizedData.length - 1)) * 100;
            const y = 100 - point.normalizedValue;
            
            // Color based on activity type
            const colors: Record<string, string> = {
              pageview: '#4f46e5', // Blue
              click: '#22c55e',    // Green
              form_interaction: '#eab308', // Yellow
              conversion: '#ef4444' // Red
            };
            
            return (
              <g key={i}>
                <motion.circle
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 3, opacity: 1 }}
                  transition={{ 
                    delay: 0.8 + (i * 0.1), 
                    duration: 0.3,
                    type: "spring"
                  }}
                  cx={x}
                  cy={y}
                  fill={colors[point.type] || '#4f46e5'}
                  stroke="white"
                  strokeWidth="1"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveTooltip(point.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
                
                {activeTooltip === point.id && (
                  <foreignObject x={x - 50} y={y - 70} width="100" height="60">
                    <div 
                      className="bg-white p-2 rounded-md shadow-md text-xs border w-full"
                      style={{ pointerEvents: 'none' }}
                    >
                      <div className="font-semibold capitalize">{point.type.replace('_', ' ')}</div>
                      {point.title && <div className="truncate">{point.title}</div>}
                      <div className="text-muted-foreground mt-1">
                        {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-0 right-0 flex items-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#4f46e5] rounded-full mr-1"></div>
            <span>Page View</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#22c55e] rounded-full mr-1"></div>
            <span>Click</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#eab308] rounded-full mr-1"></div>
            <span>Form</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#ef4444] rounded-full mr-1"></div>
            <span>Conversion</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Visitor Pulse</CardTitle>
            <CardDescription>
              Real-time visualization of visitor engagement
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={timeWindow === '1h' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeWindow('1h')}
            >
              1h
            </Button>
            <Button 
              variant={timeWindow === '24h' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeWindow('24h')}
            >
              24h
            </Button>
            <Button 
              variant={timeWindow === '7d' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeWindow('7d')}
            >
              7d
            </Button>
            <Button 
              variant={timeWindow === '30d' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeWindow('30d')}
            >
              30d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse">Loading visitor data...</div>
          </div>
        ) : (
          <>
            {/* Visitor selector */}
            {data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
                {data.slice(0, 4).map((visitor, index) => (
                  <motion.div
                    key={visitor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedVisitor === visitor.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    onClick={() => {
                      setSelectedVisitor(visitor.id);
                      if (onSelectVisitor) onSelectVisitor(visitor.id);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div className="text-sm font-medium truncate">
                        {visitor.fingerprint.substring(0, 8)}...
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {visitor.engagementScore}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{visitor.lastActive}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Main stats */}
            {visitorData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <motion.div 
                    className="bg-muted rounded-lg p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                      <Activity className="mr-2 h-4 w-4" />
                      Engagement Score
                    </div>
                    <div className="text-2xl font-bold">
                      {visitorData.engagementScore.toFixed(1)}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-muted rounded-lg p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Activity Count
                    </div>
                    <div className="text-2xl font-bold">
                      {visitorData.pulseData.length}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-muted rounded-lg p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                      <Clock className="mr-2 h-4 w-4" />
                      Last Active
                    </div>
                    <motion.div 
                      className="text-2xl font-bold"
                      animate={visitorData.lastActive.includes('mins') || visitorData.lastActive.includes('just') ? {
                        scale: [1, 1.02, 1],
                        color: ['#000', '#4f46e5', '#000']
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      {visitorData.lastActive}
                    </motion.div>
                  </motion.div>
                </div>

                {/* Pulse visualization */}
                {renderPulseGraph(visitorData.pulseData)}
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {data.length === 0 
                  ? "No visitor data available" 
                  : "Select a visitor to view their activity pulse"}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 