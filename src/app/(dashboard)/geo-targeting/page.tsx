"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import LocationSegmentation from "@/components/geo-targeting/location-segmentation";
import GeoTriggeredCampaigns from "@/components/geo-targeting/geo-triggered-campaigns";
import RegionalPerformance from "@/components/geo-targeting/regional-performance";
import LocalTimeDelivery from "@/components/geo-targeting/local-time-delivery";
import { MapPin, Send, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeoTargetingPage() {
  const [activeTab, setActiveTab] = useState("segmentation");

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Geo-Targeting</h1>
        <p className="text-muted-foreground">
          Location-based marketing tools to reach your audience at the right place and time
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Location Segments
              </CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Active location-based segments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Geo-Campaigns
              </CardTitle>
              <Send className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Location-triggered campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Region
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Lekki, Lagos</div>
              <p className="text-xs text-muted-foreground">
                Highest engagement rate: 29.2%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Time Optimization
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18%</div>
              <p className="text-xs text-muted-foreground">
                Open rate increase with local time delivery
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="segmentation">
              <MapPin className="mr-2 h-4 w-4" />
              Location Segmentation
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Send className="mr-2 h-4 w-4" />
              Geo-Campaigns
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3 className="mr-2 h-4 w-4" />
              Regional Analytics
            </TabsTrigger>
            <TabsTrigger value="timezone">
              <Clock className="mr-2 h-4 w-4" />
              Local Time Delivery
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="segmentation" className="mt-6">
            <LocationSegmentation />
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-6">
            <GeoTriggeredCampaigns />
          </TabsContent>
          
          <TabsContent value="performance" className="mt-6">
            <RegionalPerformance />
          </TabsContent>
          
          <TabsContent value="timezone" className="mt-6">
            <LocalTimeDelivery />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
} 