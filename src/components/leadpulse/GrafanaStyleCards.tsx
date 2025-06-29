'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Globe, 
  Zap,
  ArrowUp,
  ArrowDown,
  Activity,
  Eye,
  MousePointer,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GrafanaStyleCardsProps {
  simulationData?: any;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

export default function GrafanaStyleCards({ 
  simulationData, 
  timeRange = '24h',
  onTimeRangeChange 
}: GrafanaStyleCardsProps) {
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('visitors');

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange]);

  // Generate mock time series data based on simulation
  const generateTimeSeriesData = (points: number = 24) => {
    const data = [];
    const baseValue = simulationData?.activeVisitors || 50;
    
    for (let i = 0; i < points; i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() - (points - i));
      
      data.push({
        time: hour.toISOString(),
        visitors: Math.floor(baseValue * (0.8 + Math.random() * 0.4)),
        conversions: Math.floor((baseValue * 0.03) * (0.5 + Math.random())),
        revenue: Math.floor((baseValue * 150) * (0.7 + Math.random() * 0.6))
      });
    }
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();
  
  // Traffic Source Distribution Data
  const trafficSources = [
    { source: 'Organic Search', percentage: 45.2, visitors: 2854, color: '#10B981' },
    { source: 'Direct', percentage: 23.8, visitors: 1502, color: '#3B82F6' },
    { source: 'Social Media', percentage: 15.6, visitors: 985, color: '#8B5CF6' },
    { source: 'Paid Ads', percentage: 10.4, visitors: 657, color: '#F59E0B' },
    { source: 'Referral', percentage: 5.0, visitors: 316, color: '#EF4444' }
  ];

  // Conversion Funnel Data
  const funnelData = [
    { stage: 'Visitors', count: 6314, percentage: 100, color: '#3B82F6' },
    { stage: 'Page Views', count: 4521, percentage: 71.6, color: '#06B6D4' },
    { stage: 'Engagements', count: 2847, percentage: 45.1, color: '#10B981' },
    { stage: 'Form Starts', count: 892, percentage: 14.1, color: '#F59E0B' },
    { stage: 'Conversions', count: 247, percentage: 3.9, color: '#8B5CF6' }
  ];

  // Geographic Performance Data
  const geoData = [
    { country: 'Nigeria', visitors: 3245, conversions: 156, rate: 4.8, color: '#10B981' },
    { country: 'Kenya', visitors: 1876, conversions: 67, rate: 3.6, color: '#3B82F6' },
    { country: 'South Africa', visitors: 1124, conversions: 43, rate: 3.8, color: '#8B5CF6' },
    { country: 'Ghana', visitors: 698, conversions: 19, rate: 2.7, color: '#F59E0B' },
    { country: 'Other', visitors: 371, conversions: 8, rate: 2.2, color: '#6B7280' }
  ];

  // Device Performance Gauge Data
  const deviceMetrics = {
    desktop: { value: 68.4, trend: 2.3, conversions: 4.2 },
    mobile: { value: 28.1, trend: -1.2, conversions: 2.8 },
    tablet: { value: 3.5, trend: 0.8, conversions: 3.1 }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Traffic Conversion Analytics</h3>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Card 1: Real-time Traffic Time Series */}
        <Card className="col-span-full lg:col-span-2 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Real-time Traffic Flow
              </CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Time Series Chart */}
              <div className="relative h-48 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-lg p-4 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line 
                      key={i} 
                      x1="40" 
                      y1={30 + (i * 30)} 
                      x2="380" 
                      y2={30 + (i * 30)} 
                      stroke="currentColor" 
                      strokeOpacity="0.1" 
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Time series line */}
                  <motion.polyline
                    points={timeSeriesData.map((point, i) => 
                      `${40 + (i * 14)},${150 - (point.visitors / Math.max(...timeSeriesData.map(d => d.visitors)) * 100)}`
                    ).join(' ')}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  
                  {/* Data points */}
                  {timeSeriesData.slice(-8).map((point, i) => (
                    <motion.circle
                      key={i}
                      cx={40 + ((timeSeriesData.length - 8 + i) * 14)}
                      cy={150 - (point.visitors / Math.max(...timeSeriesData.map(d => d.visitors)) * 100)}
                      r="3"
                      fill="rgb(59, 130, 246)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    />
                  ))}
                  
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((value, i) => (
                    <text 
                      key={i} 
                      x="35" 
                      y={155 - (value * 1.2)} 
                      textAnchor="end" 
                      className="text-xs fill-muted-foreground"
                    >
                      {Math.round(Math.max(...timeSeriesData.map(d => d.visitors)) * (value / 100))}
                    </text>
                  ))}
                </svg>
                
                {/* Real-time metrics overlay */}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
                  <div className="text-xs text-muted-foreground mb-1">Active Now</div>
                  <div className="text-lg font-bold text-blue-600">{simulationData?.activeVisitors || 47}</div>
                </div>
              </div>
              
              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{timeSeriesData[timeSeriesData.length - 1]?.visitors || 0}</div>
                  <div className="text-xs text-muted-foreground">Current Hour</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{timeSeriesData.reduce((sum, d) => sum + d.conversions, 0)}</div>
                  <div className="text-xs text-muted-foreground">Total Conversions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(timeSeriesData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(1)}k
                  </div>
                  <div className="text-xs text-muted-foreground">Revenue ({timeRange})</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Traffic Sources Pie Chart */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {trafficSources.map((source, index) => {
                    const startAngle = trafficSources.slice(0, index).reduce((sum, s) => sum + (s.percentage * 3.6), 0);
                    const endAngle = startAngle + (source.percentage * 3.6);
                    const largeArc = source.percentage > 50 ? 1 : 0;
                    
                    const x1 = 80 + 60 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 80 + 60 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 80 + 60 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const y2 = 80 + 60 * Math.sin((endAngle - 90) * Math.PI / 180);
                    
                    return (
                      <motion.path
                        key={source.source}
                        d={`M 80 80 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={source.color}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      />
                    );
                  })}
                  
                  {/* Center circle */}
                  <circle cx="80" cy="80" r="25" fill="currentColor" className="fill-background" />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">6.3k</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-2">
                {trafficSources.slice(0, 3).map((source) => (
                  <div key={source.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      ></div>
                      <span className="truncate">{source.source}</span>
                    </div>
                    <span className="font-medium">{source.percentage}%</span>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  +{trafficSources.length - 3} more sources
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Conversion Funnel */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, index) => (
                <motion.div 
                  key={stage.stage}
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{stage.stage}</span>
                    <span className="text-xs text-muted-foreground">{stage.percentage}%</span>
                  </div>
                  <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      style={{ backgroundColor: stage.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white mix-blend-difference">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Conversion Rate */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Overall Rate</span>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-bold text-green-600">3.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Geographic Performance Heatmap */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" />
              Geographic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.map((country, index) => (
                <motion.div 
                  key={country.country}
                  className="relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: country.color }}
                      ></div>
                      <span className="text-xs font-medium">{country.country}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {country.rate}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Visitors</div>
                      <div className="font-bold">{country.visitors.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversions</div>
                      <div className="font-bold text-green-600">{country.conversions}</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full" 
                      style={{ backgroundColor: country.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(country.visitors / Math.max(...geoData.map(d => d.visitors))) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Device Performance Gauges */}
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-500" />
              Device Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(deviceMetrics).map(([device, metrics], index) => (
                <motion.div 
                  key={device}
                  className="space-y-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize">{device}</span>
                    <div className="flex items-center gap-1">
                      {metrics.trend > 0 ? (
                        <ArrowUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-bold ${metrics.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metrics.trend)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Gauge */}
                  <div className="relative w-20 h-10 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 80 40">
                      {/* Background arc */}
                      <path 
                        d="M 10 35 A 30 30 0 0 1 70 35" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeOpacity="0.1" 
                        strokeWidth="4"
                      />
                      
                      {/* Progress arc */}
                      <motion.path 
                        d="M 10 35 A 30 30 0 0 1 70 35" 
                        fill="none" 
                        stroke="rgb(6, 182, 212)" 
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: metrics.value / 100 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    
                    {/* Value text */}
                    <div className="absolute inset-0 flex items-end justify-center pb-1">
                      <span className="text-xs font-bold">{metrics.value}%</span>
                    </div>
                  </div>
                  
                  {/* Conversion rate */}
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Conv. Rate</div>
                    <div className="text-xs font-bold text-purple-600">{metrics.conversions}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}