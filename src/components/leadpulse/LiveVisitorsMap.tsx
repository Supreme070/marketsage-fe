'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Users,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Activity,
  ChevronRight,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VisitorLocation {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  visitorCount: number;
  isActive: boolean;
  lastActive: string;
}

interface VisitorSession {
  id: string;
  fingerprint: string;
  location: string;
  device: string;
  browser: string;
  engagementScore: number;
  lastActive: string;
  isActive: boolean;
  totalVisits: number;
  currentPage?: string;
  sessionDuration?: string;
  pulseData: Array<{
    timestamp: string;
    value: number;
    type: string;
    url: string;
    title: string;
  }>;
}

interface LiveVisitorsMapProps {
  className?: string;
}

export default function LiveVisitorsMap({ className }: LiveVisitorsMapProps) {
  const [locations, setLocations] = useState<VisitorLocation[]>([]);
  const [visitors, setVisitors] = useState<VisitorSession[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<VisitorLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'mobile' | 'tablet'>('all');
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');

  // Fetch data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [locationsResponse, visitorsResponse] = await Promise.all([
        fetch('/api/leadpulse/locations'),
        fetch('/api/leadpulse/visitors')
      ]);

      if (locationsResponse.ok && visitorsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const visitorsData = await visitorsResponse.json();
        
        setLocations(locationsData.locations || []);
        setVisitors(visitorsData.visitors || []);
      }
    } catch (error) {
      console.error('Error fetching visitor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter visitors based on search and device filter
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = !searchQuery || 
      visitor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.device.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDevice = deviceFilter === 'all' || 
      visitor.device.toLowerCase().includes(deviceFilter);
    
    return matchesSearch && matchesDevice;
  });

  // Get device icon
  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) return Smartphone;
    if (device.toLowerCase().includes('tablet')) return Tablet;
    return Monitor;
  };

  // Get engagement color
  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get location summary stats
  const locationStats = {
    total: locations.length,
    active: locations.filter(l => l.isActive).length,
    totalVisitors: locations.reduce((sum, l) => sum + l.visitorCount, 0),
    topCountries: locations.reduce((acc, l) => {
      acc[l.country] = (acc[l.country] || 0) + l.visitorCount;
      return acc;
    }, {} as Record<string, number>)
  };

  const topCountries = Object.entries(locationStats.topCountries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading visitor data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-xl font-semibold">{locationStats.totalVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-xl font-semibold">{visitors.filter(v => v.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Locations</p>
                <p className="text-xl font-semibold">{locationStats.active}/{locationStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-xl font-semibold">{Object.keys(locationStats.topCountries).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Visitor Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'map' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">Geographic View</TabsTrigger>
              <TabsTrigger value="list">Visitor List</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Location Map/List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Visitor Locations</h3>
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {locations.map((location) => (
                        <div
                          key={location.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedLocation?.id === location.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedLocation(location)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${location.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                              <div>
                                <p className="font-medium">{location.city}</p>
                                <p className="text-sm text-gray-600">{location.country}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{location.visitorCount}</p>
                              <p className="text-xs text-gray-500">{location.lastActive}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Top Countries */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Top Countries</h3>
                  <div className="space-y-3">
                    {topCountries.map(([country, count], index) => (
                      <div key={country} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{count}</span>
                          <span className="text-sm text-gray-500">visitors</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by location or device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={deviceFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={deviceFilter === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceFilter('desktop')}
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    variant={deviceFilter === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceFilter('mobile')}
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>

              {/* Visitor List */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredVisitors.map((visitor) => {
                    const DeviceIcon = getDeviceIcon(visitor.device);
                    return (
                      <div key={visitor.id} className="p-4 border rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${visitor.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                            <DeviceIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">{visitor.location}</p>
                              <p className="text-sm text-gray-600">{visitor.device} • {visitor.browser}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getEngagementColor(visitor.engagementScore)}`} />
                                <span className="text-sm font-medium">{visitor.engagementScore}%</span>
                              </div>
                              <p className="text-xs text-gray-500">{visitor.lastActive}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {visitor.currentPage && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-600">
                              Currently viewing: <span className="font-medium">{visitor.currentPage}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {visitors
                .filter(v => v.pulseData && v.pulseData.length > 0)
                .slice(0, 10)
                .map((visitor) => {
                  const latestActivity = visitor.pulseData[0];
                  return (
                    <div key={`${visitor.id}-${latestActivity.timestamp}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{visitor.location}</span> {latestActivity.type.toLowerCase()} 
                          <span className="text-gray-600"> on {latestActivity.title || latestActivity.url}</span>
                        </p>
                        <p className="text-xs text-gray-500">{latestActivity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}