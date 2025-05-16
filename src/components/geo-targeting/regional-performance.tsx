"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, MapPin, ArrowUpRight, ArrowDownRight, BarChart3, Map } from "lucide-react";

// Mock performance data by region
const mockRegionalData = {
  regions: [
    { id: "1", name: "Southwest Nigeria", openRate: 28.3, clickRate: 4.2, conversionRate: 2.1, trend: "up" },
    { id: "2", name: "Southeast Nigeria", openRate: 25.7, clickRate: 3.8, conversionRate: 1.9, trend: "down" },
    { id: "3", name: "North Central Nigeria", openRate: 23.5, clickRate: 3.5, conversionRate: 1.7, trend: "down" },
    { id: "4", name: "Northwest Nigeria", openRate: 26.1, clickRate: 3.9, conversionRate: 2.0, trend: "up" },
    { id: "5", name: "Northeast Nigeria", openRate: 27.8, clickRate: 4.1, conversionRate: 2.2, trend: "up" },
    { id: "6", name: "South South Nigeria", openRate: 26.4, clickRate: 3.7, conversionRate: 1.8, trend: "up" },
    { id: "7", name: "West Africa (Ex-Nigeria)", openRate: 24.2, clickRate: 3.6, conversionRate: 1.8, trend: "stable" },
    { id: "8", name: "East Africa", openRate: 27.1, clickRate: 4.0, conversionRate: 2.0, trend: "up" },
    { id: "9", name: "Southern Africa", openRate: 28.6, clickRate: 4.3, conversionRate: 2.2, trend: "up" },
    { id: "10", name: "North Africa", openRate: 25.3, clickRate: 3.7, conversionRate: 1.9, trend: "stable" }
  ],
  cities: [
    { id: "1", name: "Lagos", openRate: 29.2, clickRate: 4.5, conversionRate: 2.3, trend: "up" },
    { id: "2", name: "Abuja", openRate: 27.9, clickRate: 4.2, conversionRate: 2.1, trend: "up" },
    { id: "3", name: "Kano", openRate: 24.6, clickRate: 3.8, conversionRate: 1.9, trend: "down" },
    { id: "4", name: "Port Harcourt", openRate: 25.3, clickRate: 3.7, conversionRate: 1.8, trend: "stable" },
    { id: "5", name: "Ibadan", openRate: 26.1, clickRate: 3.9, conversionRate: 2.0, trend: "up" },
    { id: "6", name: "Kaduna", openRate: 25.8, clickRate: 3.8, conversionRate: 1.9, trend: "down" },
    { id: "7", name: "Enugu", openRate: 24.9, clickRate: 3.6, conversionRate: 1.8, trend: "stable" },
    { id: "8", name: "Benin City", openRate: 27.3, clickRate: 4.1, conversionRate: 2.0, trend: "up" },
    { id: "9", name: "Aba", openRate: 26.2, clickRate: 3.9, conversionRate: 2.0, trend: "up" },
    { id: "10", name: "Onitsha", openRate: 28.7, clickRate: 4.4, conversionRate: 2.2, trend: "up" }
  ],
  countries: [
    { id: "1", name: "Nigeria", openRate: 26.3, clickRate: 3.9, conversionRate: 2.0, trend: "up" },
    { id: "2", name: "Ghana", openRate: 25.1, clickRate: 3.7, conversionRate: 1.9, trend: "stable" },
    { id: "3", name: "South Africa", openRate: 24.8, clickRate: 3.6, conversionRate: 1.8, trend: "down" },
    { id: "4", name: "Kenya", openRate: 25.7, clickRate: 3.8, conversionRate: 1.9, trend: "up" },
    { id: "5", name: "Egypt", openRate: 23.9, clickRate: 3.5, conversionRate: 1.7, trend: "down" }
  ]
};

// Mock campaigns for filtering
const mockCampaigns = [
  { id: "1", name: "Independence Day Campaign" },
  { id: "2", name: "Ramadan Special 2023" },
  { id: "3", name: "Product Launch: Premium Tier" },
  { id: "4", name: "Christmas Special 2023" },
  { id: "5", name: "Customer Re-engagement" }
];

export default function RegionalPerformance() {
  const [metricType, setMetricType] = useState("openRate");
  const [granularity, setGranularity] = useState("regions");
  const [campaign, setCampaign] = useState("all");
  const [timeframe, setTimeframe] = useState("last30days");
  
  // Choose which data set to display based on granularity
  const performanceData = granularity === "regions" 
    ? mockRegionalData.regions 
    : granularity === "cities" 
      ? mockRegionalData.cities 
      : mockRegionalData.countries;
  
  // Sort data by the selected metric, descending
  const sortedData = [...performanceData].sort((a, b) => {
    const bValue = b[metricType as keyof typeof b];
    const aValue = a[metricType as keyof typeof a];
    return (typeof bValue === 'number' && typeof aValue === 'number') 
      ? bValue - aValue 
      : 0;
  });
  
  // Get the top performer
  const topPerformer = sortedData[0];
  
  // Format metric label
  const getMetricLabel = (type: string) => {
    switch (type) {
      case "openRate": return "Open Rate";
      case "clickRate": return "Click Rate";
      case "conversionRate": return "Conversion Rate";
      default: return "Open Rate";
    }
  };
  
  // Format trend indicator
  const getTrendIndicator = (trend: string) => {
    switch (trend) {
      case "up": return <ArrowUpRight className="text-green-500 h-4 w-4" />;
      case "down": return <ArrowDownRight className="text-red-500 h-4 w-4" />;
      default: return <span className="text-gray-500">→</span>;
    }
  };
  
  // Get color for bar based on metric value
  const getBarColor = (value: number, metric: string) => {
    let threshold = 0;
    
    switch (metric) {
      case "openRate": threshold = 25; break;
      case "clickRate": threshold = 3.8; break;
      case "conversionRate": threshold = 2.0; break;
      default: threshold = 25;
    }
    
    return value >= threshold ? "bg-green-500" : "bg-amber-500";
  };
  
  // Calculate max value for scaling
  const maxValue = Math.max(...performanceData.map(item => item[metricType as keyof typeof item] as number));
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Regional Performance</h2>
          <p className="text-muted-foreground">
            Compare marketing performance across different geographic areas
          </p>
        </div>
        
        <Button variant="outline">
          <BarChart className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Geography Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger>
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regions">Regions/States</SelectItem>
                <SelectItem value="cities">Cities</SelectItem>
                <SelectItem value="countries">Countries</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metric</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openRate">Open Rate</SelectItem>
                <SelectItem value="clickRate">Click Rate</SelectItem>
                <SelectItem value="conversionRate">Conversion Rate</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {mockCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="yearToDate">Year to Date</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>
              {getMetricLabel(metricType)} by {granularity === "regions" ? "Region" : granularity === "cities" ? "City" : "Country"}
            </CardTitle>
            <CardDescription>
              Comparison of {getMetricLabel(metricType).toLowerCase()} across different {granularity}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedData.map((item) => {
                const value = item[metricType as keyof typeof item] as number;
                const percentage = (value / maxValue) * 100;
                
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold">
                          {value.toFixed(1)}%
                        </span>
                        <span className="ml-2">
                          {getTrendIndicator(item.trend)}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-2 ${getBarColor(value, metricType)}`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Key findings from your geographic data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Top Performing Region</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-800 mr-2">
                    Top
                  </Badge>
                  <span className="font-medium">{topPerformer.name}</span>
                </div>
                <div className="flex items-center text-green-600 font-semibold">
                  {typeof topPerformer[metricType as keyof typeof topPerformer] === 'number' 
                    ? (topPerformer[metricType as keyof typeof topPerformer] as number).toFixed(1)
                    : '0.0'}%
                  {getTrendIndicator(topPerformer.trend)}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-2">
              <h4 className="text-sm font-medium mb-2">Geographic Insights</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                  <span>
                    {granularity === "regions" ? "Lagos region" : granularity === "cities" ? "Urban centers" : "Nigeria"}
                    {" "}performs better for email campaigns
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                  <span>
                    {getMetricLabel(metricType)} improved by 3.2% in {topPerformer.name} since last month
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>
                  <span>
                    {metricType === "openRate" ? "Click rates" : "Open rates"} need improvement in Northern regions
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>
                  <span>
                    Consider local time delivery for international and diaspora customers
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="pt-2">
              <Button className="w-full">
                <Map className="mr-2 h-4 w-4" />
                View Full Geographic Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-indigo-50 border-indigo-200">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-indigo-500 mr-2" />
            <CardTitle className="text-sm font-medium text-indigo-800">Regional Analysis Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• Compare performance across regions to identify geographic strengths</li>
            <li>• Use regional insights to adjust messaging based on location preferences</li>
            <li>• Consider cultural and regional differences when creating campaigns</li>
            <li>• Target underperforming regions with location-specific re-engagement campaigns</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 