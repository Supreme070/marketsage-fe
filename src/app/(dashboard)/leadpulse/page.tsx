'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Activity, Users, ArrowUpRight, Clock, TrendingUp, Copy, RotateCcw, Download, Filter, Trash2, Tag } from 'lucide-react';
import VisitorPulseVisualization from '@/components/leadpulse/VisitorPulseVisualization';
import JourneyVisualization from '@/components/leadpulse/JourneyVisualization';
import VisitorInsights from '@/components/leadpulse/VisitorInsights';
import LiveVisitorMap from '@/components/leadpulse/LiveVisitorMap';

import { 
  getActiveVisitors, 
  getVisitorJourneys, 
  getVisitorInsights, 
  getVisitorSegments,
  getVisitorLocations,
  VisitorJourney,
  VisitorPath,
  InsightItem,
  VisitorSegment,
  VisitorLocation
} from '@/lib/leadpulse/dataProvider';

export default function LeadPulseDashboard() {
  const router = useRouter();
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('visitors');
  
  // Settings state
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [anonymousRetention, setAnonymousRetention] = useState('180');
  const [identifiedRetention, setIdentifiedRetention] = useState('730'); // 2 years in days
  const [autoAddList, setAutoAddList] = useState('new-leads');
  const [notificationMethod, setNotificationMethod] = useState('email-dashboard');
  
  // Advanced filtering state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [engagementFilter, setEngagementFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Bulk actions state
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Data state with proper typing
  const [visitorData, setVisitorData] = useState<VisitorJourney[]>([]);
  const [journeyData, setJourneyData] = useState<VisitorPath[]>([]);
  const [insightData, setInsightData] = useState<InsightItem[]>([]);
  const [segmentData, setSegmentData] = useState<VisitorSegment[]>([]);
  const [locationData, setLocationData] = useState<VisitorLocation[]>([]);
  
  // Fetch data on component mount and when time range changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [visitors, journeys, insights, segments, locations] = await Promise.all([
          getActiveVisitors(selectedTimeRange),
          getVisitorJourneys(selectedVisitorId),
          getVisitorInsights(),
          getVisitorSegments(),
          getVisitorLocations(selectedTimeRange)
        ]);
        
        setVisitorData(visitors);
        setJourneyData(journeys);
        setInsightData(insights);
        setSegmentData(segments);
        setLocationData(locations);
        
        // Calculate summary metrics
        setActiveVisitors(visitors.filter(v => v.lastActive.includes('min') || v.lastActive.includes('just')).length);
        setTotalVisitors(visitors.length);
        
        // Calculate conversion rate from journey data
        const convertedJourneys = journeys.filter(j => j.status === 'converted');
        const convRate = journeys.length > 0 
          ? (convertedJourneys.length / journeys.length) * 100 
          : 0;
        setConversionRate(convRate);
      } catch (error) {
        console.error('Error fetching LeadPulse data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [selectedTimeRange, selectedVisitorId]);
  
  // Handle visitor selection
  const handleSelectVisitor = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    // Automatically switch to journeys tab when a visitor is selected
    setActiveTab('journeys');
  };
  
  // Handle location selection
  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
    // In a real implementation, we would filter visitors by location
    // For now, we'll just log it
    console.log(`Selected location: ${location}`);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
  };

  // Settings handlers
  const handleTrackingToggle = () => {
    setTrackingEnabled(!trackingEnabled);
    console.log("Tracking", !trackingEnabled ? "enabled" : "disabled");
    alert(`Visitor tracking ${!trackingEnabled ? "enabled" : "disabled"} successfully!`);
  };

  const handleRetentionUpdate = (type: 'anonymous' | 'identified', days: string) => {
    if (type === 'anonymous') {
      setAnonymousRetention(days);
    } else {
      setIdentifiedRetention(days);
    }
    console.log(`${type} visitor retention updated to ${days} days`);
    alert(`${type === 'anonymous' ? 'Anonymous' : 'Identified'} visitor data retention updated to ${days} days`);
  };

  const handleIntegrationUpdate = (setting: 'list' | 'notification', value: string) => {
    if (setting === 'list') {
      setAutoAddList(value);
      console.log("Auto-add list updated to:", value);
    } else {
      setNotificationMethod(value);
      console.log("Notification method updated to:", value);
    }
    alert(`Integration setting updated successfully!`);
  };

  const handleRegeneratePixel = () => {
    console.log("Regenerating tracking pixel ID");
    alert("New tracking pixel ID generated!\n\nNew ID: lp_9x8y7z6w5v4u3t2s1\n\nPlease update your website with the new tracking code.");
  };

  // Export functionality
  const exportToCSV = (data: any[], filename: string, type: 'visitors' | 'journeys' | 'forms') => {
    let csvContent = '';
    
    if (type === 'visitors') {
      csvContent = 'Visitor ID,Location,Device,Browser,Last Active,Engagement Score,Status\n';
      data.forEach((visitor: VisitorJourney) => {
        csvContent += `${visitor.id},${visitor.location || 'Unknown'},${visitor.device || 'Unknown'},${visitor.browser || 'Unknown'},${visitor.lastActive},${visitor.engagementScore}%,Active\n`;
      });
    } else if (type === 'journeys') {
      csvContent = 'Visitor ID,Touchpoints,Probability,Predicted Value,Status\n';
      data.forEach((journey: VisitorPath) => {
        csvContent += `${journey.visitorId},${journey.touchpoints.length},${(journey.probability * 100).toFixed(1)}%,$${journey.predictedValue.toFixed(2)},${journey.status}\n`;
      });
    } else if (type === 'forms') {
      csvContent = 'Form ID,Form Name,Type,Views,Submissions,Conversion Rate\n';
      data.forEach((form: any) => {
        csvContent += `${form.id},${form.name},${form.type},${form.views},${form.submissions},${form.conversionRate}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify({
      exported_at: new Date().toISOString(),
      time_range: selectedTimeRange,
      total_records: data.length,
      data: data
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type: 'visitors' | 'journeys' | 'forms', format: 'csv' | 'json') => {
    let data, filename;
    
    switch (type) {
      case 'visitors':
        data = visitorData;
        filename = 'leadpulse_visitors';
        break;
      case 'journeys':
        data = journeyData;
        filename = 'leadpulse_journeys';
        break;
      case 'forms':
        data = [
          { id: 'form_1', name: 'Contact Us Form', type: 'Embedded', views: 532, submissions: 48, conversionRate: 9.02 },
          { id: 'form_2', name: 'Newsletter Signup', type: 'Popup', views: 1245, submissions: 187, conversionRate: 15.02 },
          { id: 'form_3', name: 'Free Trial Request', type: 'Exit Intent', views: 874, submissions: 103, conversionRate: 11.78 },
        ];
        filename = 'leadpulse_forms';
        break;
      default:
        return;
    }

    if (format === 'csv') {
      exportToCSV(data, filename, type);
    } else {
      exportToJSON(data, filename);
    }

    console.log(`Exported ${data.length} ${type} records as ${format.toUpperCase()}`);
    alert(`Successfully exported ${data.length} ${type} records as ${format.toUpperCase()}`);
  };

  // Advanced filtering
  const handleAdvancedFilter = (filterType: string, value: string) => {
    switch (filterType) {
      case 'engagement':
        setEngagementFilter(value);
        break;
      case 'device':
        setDeviceFilter(value);
        break;
      case 'location':
        setLocationFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
    }
    console.log(`Applied ${filterType} filter:`, value);
  };

  const clearAllFilters = () => {
    setEngagementFilter('all');
    setDeviceFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setShowAdvancedFilters(false);
    console.log('All filters cleared');
  };

  // Filter visitor data based on advanced filters
  const filteredVisitorData = visitorData.filter(visitor => {
    if (engagementFilter !== 'all') {
      if (engagementFilter === 'high' && visitor.engagementScore < 70) return false;
      if (engagementFilter === 'medium' && (visitor.engagementScore < 40 || visitor.engagementScore >= 70)) return false;
      if (engagementFilter === 'low' && visitor.engagementScore >= 40) return false;
    }
    
    if (deviceFilter !== 'all' && visitor.device && !visitor.device.toLowerCase().includes(deviceFilter.toLowerCase())) {
      return false;
    }
    
    if (locationFilter !== 'all' && visitor.location && !visitor.location.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    
    // Note: statusFilter would be applied if we had status data in visitor objects
    
    return true;
  });
  
  // Bulk actions
  const handleSelectVisitorBulk = (visitorId: string, checked: boolean) => {
    if (checked) {
      setSelectedVisitors([...selectedVisitors, visitorId]);
    } else {
      setSelectedVisitors(selectedVisitors.filter(id => id !== visitorId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedVisitors(filteredVisitorData.map(visitor => visitor.id));
    } else {
      setSelectedVisitors([]);
    }
  };

  const handleBulkAction = (action: 'export' | 'delete' | 'tag') => {
    if (selectedVisitors.length === 0) {
      alert('Please select visitors first');
      return;
    }

    switch (action) {
      case 'export':
        const selectedData = filteredVisitorData.filter(visitor => selectedVisitors.includes(visitor.id));
        exportToCSV(selectedData, 'selected_visitors', 'visitors');
        alert(`Exported ${selectedVisitors.length} selected visitors`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedVisitors.length} selected visitors?`)) {
          console.log('Deleting visitors:', selectedVisitors);
          alert(`${selectedVisitors.length} visitors would be deleted`);
          setSelectedVisitors([]);
          setSelectAll(false);
        }
        break;
      case 'tag':
        const tag = prompt('Enter tag for selected visitors:');
        if (tag) {
          console.log('Tagging visitors:', selectedVisitors, 'with tag:', tag);
          alert(`Tagged ${selectedVisitors.length} visitors with "${tag}"`);
        }
        break;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LeadPulse</h1>
          <p className="text-muted-foreground">
            Real-time visitor intelligence and engagement system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button 
              variant={selectedTimeRange === '1h' ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTimeRangeChange('1h')}
            >
              1h
            </Button>
            <Button 
              variant={selectedTimeRange === '24h' ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTimeRangeChange('24h')}
            >
              24h
            </Button>
            <Button 
              variant={selectedTimeRange === '7d' ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTimeRangeChange('7d')}
            >
              7d
            </Button>
            <Button 
              variant={selectedTimeRange === '30d' ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTimeRangeChange('30d')}
            >
              30d
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/leadpulse/setup')}
            >
              Install Tracking Code
            </Button>
            <Button 
              onClick={() => router.push('/leadpulse/forms/new')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Visitors
            </CardTitle>
            <CardDescription>Currently on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{activeVisitors}</div>
              <Badge variant="outline" className="ml-auto">Live</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <CardDescription>In selected time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalVisitors}</div>
              <div className="flex items-center space-x-1 ml-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedTimeRange}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <CardDescription>Visitors to leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
              <div className="flex items-center ml-auto text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm">0.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* World Map Visualization */}
      <LiveVisitorMap 
        visitorData={visitorData}
        isLoading={loading}
        onSelectLocation={handleSelectLocation}
        timeRange={selectedTimeRange}
      />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Pulse Visualization */}
        <VisitorPulseVisualization 
          data={visitorData}
          visitorId={selectedVisitorId}
          isLoading={loading}
          onSelectVisitor={handleSelectVisitor}
        />
        
        {/* AI Insights */}
        <VisitorInsights
          insights={insightData}
          segments={segmentData}
          isLoading={loading}
        />
      </div>
      
      {/* Journey Visualization */}
      <JourneyVisualization
        data={journeyData}
        selectedVisitorId={selectedVisitorId}
        isLoading={loading}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="visitors">Visitor Activity</TabsTrigger>
          <TabsTrigger value="journeys">Visitor Journeys</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Visitors</CardTitle>
                  <CardDescription>
                    Latest anonymous visitors to your website
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('visitors', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('visitors', 'json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bulk Actions */}
              {selectedVisitors.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedVisitors.length} visitor{selectedVisitors.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('export')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('tag')}
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Tag Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {(engagementFilter !== 'all' || deviceFilter !== 'all' || locationFilter !== 'all') && (
                      <Badge variant="secondary" className="ml-2">
                        {[engagementFilter, deviceFilter, locationFilter].filter(f => f !== 'all').length}
                      </Badge>
                    )}
                  </Button>
                  {(engagementFilter !== 'all' || deviceFilter !== 'all' || locationFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Engagement Level</label>
                      <Select value={engagementFilter} onValueChange={(value) => handleAdvancedFilter('engagement', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="high">High (70%+)</SelectItem>
                          <SelectItem value="medium">Medium (40-69%)</SelectItem>
                          <SelectItem value="low">Low (&lt;40%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Device Type</label>
                      <Select value={deviceFilter} onValueChange={(value) => handleAdvancedFilter('device', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Devices</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <Select value={locationFilter} onValueChange={(value) => handleAdvancedFilter('location', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                          <SelectItem value="ghana">Ghana</SelectItem>
                          <SelectItem value="kenya">Kenya</SelectItem>
                          <SelectItem value="south africa">South Africa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Time on Site</label>
                      <Select value={statusFilter} onValueChange={(value) => handleAdvancedFilter('status', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Durations</SelectItem>
                          <SelectItem value="quick">Quick Visit (&lt;30s)</SelectItem>
                          <SelectItem value="browsing">Browsing (30s-5m)</SelectItem>
                          <SelectItem value="engaged">Engaged (5m+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <RecentVisitorsTable 
                visitors={filteredVisitorData} 
                onSelectVisitor={handleSelectVisitor}
                selectedVisitors={selectedVisitors}
                selectAll={selectAll}
                onSelectVisitorBulk={handleSelectVisitorBulk}
                onSelectAll={handleSelectAll}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopPagesTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visitor Journey Visualization</CardTitle>
                  <CardDescription>
                    {selectedVisitorId 
                      ? `Journey for visitor ${selectedVisitorId.substring(0, 8)}...`
                      : "Select a visitor from the Visitor Activity tab to view their detailed journey"
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('journeys', 'csv')}
                    disabled={journeyData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('journeys', 'json')}
                    disabled={journeyData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedVisitorId ? (
                <JourneyVisualization
                  data={journeyData}
                  selectedVisitorId={selectedVisitorId}
                  isLoading={loading}
                />
              ) : (
                <div className="flex items-center justify-center p-12 border rounded-md">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Please select a visitor to see their detailed journey</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('visitors')}
                    >
                      Go to Visitor Activity
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>LeadPulse Forms</CardTitle>
                <CardDescription>
                  Smart forms for capturing visitor information
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('forms', 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => router.push('/leadpulse/forms/new')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Form
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FormsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LeadPulse Settings</CardTitle>
              <CardDescription>
                Configure your visitor tracking and integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tracking Configuration */}
                <div>
                  <h3 className="font-medium mb-4">Tracking Configuration</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Tracking Status</div>
                        <Switch
                          checked={trackingEnabled}
                          onCheckedChange={handleTrackingToggle}
                        />
                      </div>
                      <div className="flex items-center">
                        <Badge className={trackingEnabled ? "bg-green-500" : "bg-red-500"}>
                          {trackingEnabled ? "Active" : "Disabled"}
                        </Badge>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {trackingEnabled ? "Last active: 2 minutes ago" : "Tracking disabled"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Pixel ID</div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText('lp_2g3h4j2k3h4kj23h4');
                              alert('Pixel ID copied to clipboard!');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRegeneratePixel}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          lp_2g3h4j2k3h4kj23h4
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Data Retention */}
                <div>
                  <h3 className="font-medium mb-4">Data Retention</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how long to keep visitor data
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-3">Anonymous Visitors</div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={anonymousRetention}
                          onValueChange={(value) => handleRetentionUpdate('anonymous', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">Apply</Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Currently set to {anonymousRetention} days
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-3">Identified Contacts</div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={identifiedRetention}
                          onValueChange={(value) => handleRetentionUpdate('identified', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="365">1 year</SelectItem>
                            <SelectItem value="730">2 years</SelectItem>
                            <SelectItem value="1095">3 years</SelectItem>
                            <SelectItem value="1825">5 years</SelectItem>
                            <SelectItem value="-1">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">Apply</Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Currently set to {identifiedRetention === '-1' ? 'Forever' : `${Math.floor(parseInt(identifiedRetention) / 365)} year(s)`}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Integration Settings */}
                <div>
                  <h3 className="font-medium mb-4">Integration Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how LeadPulse integrates with your MarketSage account
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-3">Auto-add to List</div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={autoAddList}
                          onValueChange={(value) => handleIntegrationUpdate('list', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new-leads">New Leads (32 contacts)</SelectItem>
                            <SelectItem value="all-visitors">All Visitors (156 contacts)</SelectItem>
                            <SelectItem value="high-intent">High Intent (12 contacts)</SelectItem>
                            <SelectItem value="converted">Converted (8 contacts)</SelectItem>
                            <SelectItem value="none">Don't auto-add</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">Save</Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {autoAddList === 'none' ? 'Auto-add disabled' : `Adding to ${autoAddList.replace('-', ' ')}`}
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-3">Notifications</div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={notificationMethod}
                          onValueChange={(value) => handleIntegrationUpdate('notification', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email-dashboard">Email & Dashboard</SelectItem>
                            <SelectItem value="email-only">Email Only</SelectItem>
                            <SelectItem value="dashboard-only">Dashboard Only</SelectItem>
                            <SelectItem value="slack">Slack Integration</SelectItem>
                            <SelectItem value="none">No Notifications</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">Save</Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {notificationMethod === 'none' ? 'Notifications disabled' : notificationMethod.replace('-', ' & ')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Save All Changes */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Changes are saved automatically when you make them
                    </div>
                    <Button onClick={() => alert('All settings have been saved successfully!')}>
                      Save All Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Table components
function RecentVisitorsTable({ visitors = [], onSelectVisitor, selectedVisitors, selectAll, onSelectVisitorBulk, onSelectAll }: { visitors: VisitorJourney[], onSelectVisitor: (visitorId: string) => void, selectedVisitors: string[], selectAll: boolean, onSelectVisitorBulk: (visitorId: string, checked: boolean) => void, onSelectAll: (checked: boolean) => void }) {
  if (!visitors || visitors.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No visitor data available
      </div>
    );
  }
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3">
              <Checkbox
                checked={selectAll}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th scope="col" className="px-6 py-3">Visitor ID</th>
            <th scope="col" className="px-6 py-3">Location</th>
            <th scope="col" className="px-6 py-3">Device</th>
            <th scope="col" className="px-6 py-3">Last Active</th>
            <th scope="col" className="px-6 py-3">Engagement</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visitors.slice(0, 5).map(visitor => (
            <tr key={visitor.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-3 py-4">
                <Checkbox
                  checked={selectedVisitors.includes(visitor.id)}
                  onCheckedChange={(checked) => onSelectVisitorBulk(visitor.id, checked as boolean)}
                />
              </td>
              <td className="px-6 py-4 font-mono">{visitor.id.substring(0, 8)}...</td>
              <td className="px-6 py-4">{visitor.location || 'Unknown'}</td>
              <td className="px-6 py-4">{visitor.device || 'Unknown'}</td>
              <td className="px-6 py-4">{visitor.lastActive}</td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        visitor.engagementScore > 70 ? 'bg-green-500' : 
                        visitor.engagementScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${visitor.engagementScore}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs">{visitor.engagementScore}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onSelectVisitor(visitor.id)}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  View Journey
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPagesTable() {
  const pages = [
    { url: '/products', title: 'Products Page', visitors: 342, avgTime: '1:25', bounceRate: 32 },
    { url: '/pricing', title: 'Pricing Page', visitors: 278, avgTime: '2:41', bounceRate: 24 },
    { url: '/contact', title: 'Contact Page', visitors: 195, avgTime: '0:58', bounceRate: 41 },
    { url: '/about', title: 'About Us', visitors: 147, avgTime: '1:12', bounceRate: 35 },
    { url: '/blog', title: 'Blog Home', visitors: 126, avgTime: '2:05', bounceRate: 28 },
  ];
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Page</th>
            <th scope="col" className="px-6 py-3">Visitors</th>
            <th scope="col" className="px-6 py-3">Avg. Time</th>
            <th scope="col" className="px-6 py-3">Bounce Rate</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(page => (
            <tr key={page.url} className="bg-white border-b">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{page.title}</div>
                <div className="text-xs text-gray-500">{page.url}</div>
              </td>
              <td className="px-6 py-4">{page.visitors}</td>
              <td className="px-6 py-4">{page.avgTime}</td>
              <td className="px-6 py-4">{page.bounceRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormsList() {
  const forms = [
    { id: 'form_1', name: 'Contact Us Form', type: 'Embedded', views: 532, submissions: 48, conversionRate: 9.02 },
    { id: 'form_2', name: 'Newsletter Signup', type: 'Popup', views: 1245, submissions: 187, conversionRate: 15.02 },
    { id: 'form_3', name: 'Free Trial Request', type: 'Exit Intent', views: 874, submissions: 103, conversionRate: 11.78 },
  ];

  // Handle form actions
  const handleEditForm = (formId: string, formName: string) => {
    console.log("Editing form:", formId, formName);
    // This would typically navigate to the form editor
    alert(`Opening form editor for "${formName}"\nForm ID: ${formId}\n\nThis would redirect to /leadpulse/forms/${formId}/edit`);
  };

  const handleEmbedForm = (formId: string, formName: string) => {
    console.log("Getting embed code for form:", formId, formName);
    // This would show the embed code modal or copy to clipboard
    const embedCode = `<script src="https://leadpulse.marketsage.com/embed/${formId}.js"></script>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      alert(`Embed code for "${formName}" copied to clipboard!\n\n${embedCode}`);
    }).catch(() => {
      alert(`Embed code for "${formName}":\n\n${embedCode}\n\nPlease copy this code manually.`);
    });
  };
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Form Name</th>
            <th scope="col" className="px-6 py-3">Type</th>
            <th scope="col" className="px-6 py-3">Views</th>
            <th scope="col" className="px-6 py-3">Submissions</th>
            <th scope="col" className="px-6 py-3">Conversion Rate</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map(form => (
            <tr key={form.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{form.name}</td>
              <td className="px-6 py-4">
                <Badge variant="outline">{form.type}</Badge>
              </td>
              <td className="px-6 py-4">{form.views}</td>
              <td className="px-6 py-4">{form.submissions}</td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <span className={form.conversionRate > 10 ? 'text-green-600 font-medium' : ''}>{form.conversionRate}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditForm(form.id, form.name)}
                    className="hover:bg-blue-50 hover:border-blue-300"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmbedForm(form.id, form.name)}
                    className="hover:bg-green-50 hover:border-green-300"
                  >
                    Embed
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 