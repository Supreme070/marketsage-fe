"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ChevronRight,
  BarChart3,
  Activity
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ConversionMetrics {
  conversionRate: number;
  totalConversions: number;
  revenue: number;
  costPerConversion: number;
  topChannels: Array<{
    name: string;
    conversions: number;
    rate: number;
    trend: 'up' | 'down';
  }>;
  recentConversions: Array<{
    id: string;
    type: string;
    value: number;
    channel: string;
    timestamp: string;
  }>;
}


interface ConversionSubSidebarProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function ConversionSubSidebar({ 
  isExpanded = false, 
  onToggle,
  className = ""
}: ConversionSubSidebarProps) {
  // Demo conversion metrics with realistic data
  const metrics = {
    conversionRate: 3.2,
    totalConversions: 45,
    revenue: 2350000,
    costPerConversion: 52000,
    topChannels: [
      { name: 'Email', conversions: 18, rate: 4.1, trend: 'up' as const },
      { name: 'WhatsApp', conversions: 12, rate: 3.8, trend: 'up' as const },
      { name: 'SMS', conversions: 8, rate: 2.9, trend: 'down' as const },
      { name: 'Workflows', conversions: 7, rate: 2.1, trend: 'up' as const }
    ],
    recentConversions: []
  };

  const [liveConversions, setLiveConversions] = useState<Array<{
    id: string;
    type: string;
    value: number;
    channel: string;
    timestamp: string;
  }>>([]);

  // Generate live conversions for demo
  useEffect(() => {
    const generateLiveConversion = () => {
      const channels = ['Email', 'WhatsApp', 'SMS', 'Workflows'];
      const types = ['Lead', 'Purchase', 'Sign-up', 'Trial'];
      
      const newConversion = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: types[Math.floor(Math.random() * types.length)],
        value: Math.floor(Math.random() * 50000) + 10000,
        channel: channels[Math.floor(Math.random() * channels.length)],
        timestamp: new Date().toISOString()
      };

      setLiveConversions(prev => [newConversion, ...prev.slice(0, 4)]);
    };

    const interval = setInterval(generateLiveConversion, 45000); // Every 45 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isExpanded ? 320 : 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-background border-l border-border z-40 ${className}`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            {isExpanded ? (
              <>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-sm">Conversions</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggle}
                className="h-8 w-8 p-0 mx-auto"
              >
                <Target className="h-4 w-4 text-green-400" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-3 space-y-4"
            >
              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 rounded-lg border border-green-500/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{metrics.conversionRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Conversion Rate</div>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">Live tracking</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <div className="text-lg font-bold">{metrics.totalConversions}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <div className="text-lg font-bold">{formatCurrency(metrics.revenue)}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </div>

              {/* Top Channels */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Top Channels
                </h4>
                
                <div className="space-y-2">
                  {metrics.topChannels.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">{channel.conversions} conversions</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{channel.rate}%</Badge>
                        {channel.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3 text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Conversions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Live Activity
                  {liveConversions.length > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </h4>
                
                {liveConversions.length > 0 ? (
                  <div className="space-y-2">
                    {liveConversions.map((conversion, index) => (
                      <motion.div
                        key={conversion.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-2 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded border border-green-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-green-400">{conversion.type}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {formatCurrency(conversion.value)} via {conversion.channel}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(conversion.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded border text-center">
                    <div className="text-sm text-muted-foreground">
                      Waiting for conversion activity...
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Actions</h4>
                
                <div className="space-y-2">
                  <Link href="/leadpulse/forms/conversions" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Button>
                  </Link>
                  
                  <Link href="/leadpulse/forms/conversions/goals" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Manage Goals
                    </Button>
                  </Link>
                  
                  <Link href="/leadpulse/forms/conversions/optimize" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Cost Efficiency */}
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{formatCurrency(metrics.costPerConversion)}</div>
                  <div className="text-xs text-muted-foreground">Cost per Conversion</div>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs">
                    <TrendingDown className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Optimizing cost</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed indicator */}
        {!isExpanded && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{metrics.conversionRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground transform -rotate-90 whitespace-nowrap">Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold">{metrics.totalConversions}</div>
              <div className="text-xs text-muted-foreground transform -rotate-90 whitespace-nowrap">Total</div>
            </div>

            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}