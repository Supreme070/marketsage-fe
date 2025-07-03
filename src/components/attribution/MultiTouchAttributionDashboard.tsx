/**
 * Multi-Touch Attribution Dashboard
 * =================================
 * Comprehensive dashboard for analyzing customer journeys and
 * attribution across multiple marketing channels.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Download,
  Eye,
  MousePointer,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAttributionInsights } from '@/hooks/useAttribution';

interface AttributionDashboardProps {
  className?: string;
}

export default function MultiTouchAttributionDashboard({ 
  className = '' 
}: AttributionDashboardProps) {
  const [selectedModel, setSelectedModel] = useState('data_driven');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Calculate date filter
  const getDateFilter = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      attributionModel: selectedModel,
      channel: selectedChannel === 'all' ? undefined : selectedChannel
    };
  };
  
  const { 
    insights, 
    isLoading, 
    error, 
    refreshInsights,
    autoRefresh,
    setAutoRefresh
  } = useAttributionInsights(getDateFilter());
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format time duration
  const formatDuration = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };
  
  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'whatsapp': return MessageSquare;
      case 'social': return Users;
      case 'organic': return Eye;
      case 'paid': return Target;
      default: return MousePointer;
    }
  };
  
  if (error) {
    return (
      <Card className={`w-full bg-red-900/20 border-red-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load attribution data</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshInsights}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full bg-gray-900/50 border-blue-500/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">Multi-Touch Attribution</CardTitle>
              <p className="text-sm text-gray-400">Customer journey analytics & conversion attribution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_driven">Data Driven</SelectItem>
                <SelectItem value="first_touch">First Touch</SelectItem>
                <SelectItem value="last_touch">Last Touch</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="time_decay">Time Decay</SelectItem>
                <SelectItem value="position_based">Position Based</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-28 bg-gray-800/50 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshInsights}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        {insights?.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg border border-blue-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(insights.summary.totalAttributedValue)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {insights.summary.totalConversions} conversions
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-lg border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-400">Avg Order Value</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(insights.summary.averageOrderValue)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Per conversion
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-orange-600/10 to-red-600/10 rounded-lg border border-orange-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-gray-400">Attribution Model</span>
              </div>
              <div className="text-lg font-bold text-orange-400 capitalize">
                {selectedModel.replace('_', ' ')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Current model
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-gray-400">Avg Time to Convert</span>
              </div>
              <div className="text-lg font-bold text-purple-400">
                {insights.timeToConversion ? 
                  formatDuration(insights.timeToConversion.average) : 
                  'N/A'
                }
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Journey duration
              </div>
            </motion.div>
          </div>
        )}
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="channels" className="text-xs">Channels</TabsTrigger>
            <TabsTrigger value="journeys" className="text-xs">Journeys</TabsTrigger>
            <TabsTrigger value="models" className="text-xs">Models</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Performing Channels */}
              <Card className="bg-gray-800/30 border-gray-700/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Top Performing Channels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.topPerformingChannels?.slice(0, 5).map((channel, index) => {
                    const ChannelIcon = getChannelIcon(channel.channel);
                    
                    return (
                      <motion.div
                        key={channel.channel}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-600/20 rounded">
                            <ChannelIcon className="h-3 w-3 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white capitalize">
                              {channel.channel}
                            </div>
                            <div className="text-xs text-gray-400">
                              {channel.attributedConversions} conversions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">
                            {formatCurrency(channel.attributedValue)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {channel.conversionRate}% CVR
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) || (
                    <div className="text-center text-gray-500 py-4">
                      No channel data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Campaign Performance */}
              <Card className="bg-gray-800/30 border-gray-700/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Top Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.campaignPerformance?.slice(0, 5).map((campaign, index) => {
                    const ChannelIcon = getChannelIcon(campaign.channel);
                    
                    return (
                      <motion.div
                        key={`${campaign.campaign}-${campaign.channel}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-green-600/20 rounded">
                            <ChannelIcon className="h-3 w-3 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {campaign.campaign}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {campaign.channel} • {campaign.attributedConversions} conversions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">
                            {formatCurrency(campaign.attributedValue)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) || (
                    <div className="text-center text-gray-500 py-4">
                      No campaign data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Channel Effectiveness */}
              <Card className="bg-gray-800/30 border-gray-700/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Channel Effectiveness by Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.channelEffectiveness && Object.entries(insights.channelEffectiveness).map(([channel, effectiveness]) => {
                    const ChannelIcon = getChannelIcon(channel);
                    
                    return (
                      <div key={channel} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-white capitalize">{channel}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-blue-400 font-bold">
                              {(effectiveness.asInitiator * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Initiator</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold">
                              {(effectiveness.asInfluencer * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Influencer</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-400 font-bold">
                              {(effectiveness.asConverter * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Converter</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-400 font-bold">
                              {(effectiveness.asAssister * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-500">Assister</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              
              {/* Time to Conversion */}
              <Card className="bg-gray-800/30 border-gray-700/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Time to Conversion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.timeToConversion && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Average</span>
                        <span className="text-sm font-bold text-blue-400">
                          {formatDuration(insights.timeToConversion.average)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Median</span>
                        <span className="text-sm font-bold text-green-400">
                          {formatDuration(insights.timeToConversion.median)}
                        </span>
                      </div>
                      {Object.entries(insights.timeToConversion.percentiles).map(([percentile, value]) => (
                        <div key={percentile} className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">{percentile}th percentile</span>
                          <span className="text-sm text-gray-300">
                            {formatDuration(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Customer Journeys Tab */}
          <TabsContent value="journeys" className="space-y-4">
            <Card className="bg-gray-800/30 border-gray-700/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Common Customer Journey Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights?.journeyPatterns?.map((pattern, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-700/30 rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {pattern.pattern.map((channel, idx) => {
                          const ChannelIcon = getChannelIcon(channel);
                          return (
                            <React.Fragment key={idx}>
                              <div className="flex items-center gap-1">
                                <ChannelIcon className="h-3 w-3 text-blue-400" />
                                <span className="text-xs text-gray-300 capitalize">{channel}</span>
                              </div>
                              {idx < pattern.pattern.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-gray-500" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                        {pattern.frequency} journeys
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Avg Value: {formatCurrency(pattern.averageValue)}</span>
                      <span>Conversion Rate: {pattern.conversionRate.toFixed(1)}%</span>
                    </div>
                  </motion.div>
                )) || (
                  <div className="text-center text-gray-500 py-4">
                    No journey patterns available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Attribution Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Card className="bg-gray-800/30 border-gray-700/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Attribution Model Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights?.modelComparison && Object.entries(insights.modelComparison).map(([model, data]) => (
                  <motion.div
                    key={model}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded border ${
                      model === selectedModel 
                        ? 'bg-blue-600/20 border-blue-500/30' 
                        : 'bg-gray-700/30 border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-medium ${
                          model === selectedModel ? 'text-blue-400' : 'text-white'
                        } capitalize`}>
                          {model.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {data.totalConversions} conversions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          model === selectedModel ? 'text-blue-400' : 'text-green-400'
                        }`}>
                          {formatCurrency(data.totalAttributedValue)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatCurrency(data.averageOrderValue)} AOV
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}