"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JourneyBuilder } from "./journey-builder";
import { JourneyAnalytics } from "./journey-analytics";
import { JourneyTemplates } from "./journey-templates";
import { ContactJourneyTracking } from "./contact-journey-tracking";
import { 
  Route, 
  BarChart3, 
  Users, 
  Zap, 
  Plus,
  TrendingUp,
  Clock,
  Target
} from "lucide-react";

export function JourneyManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for overview stats
  const stats = {
    activeJourneys: 12,
    totalContacts: 8547,
    completionRate: 68.5,
    avgEngagement: 74.2
  };

  // Handle new journey creation
  const handleNewJourney = () => {
    console.log("Creating new journey...");
    // Switch to builder tab and initialize new journey
    setActiveTab("builder");
  };

  // Handle AI recommendation action
  const handleRecommendationAction = (recommendation: any) => {
    console.log("Acting on recommendation:", recommendation.title);
    
    switch (recommendation.type) {
      case "optimization":
        setActiveTab("builder");
        break;
      case "automation":
        setActiveTab("analytics");
        break;
      case "timing":
        setActiveTab("analytics");
        break;
      case "content":
        setActiveTab("builder");
        break;
      default:
        console.log("Unknown recommendation type");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Journeys</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJourneys}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts in Journeys</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              +8.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button size="sm" className="flex items-center gap-2" onClick={handleNewJourney}>
              <Plus className="h-4 w-4" />
              New Journey
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Journey Activity</CardTitle>
                <CardDescription>Latest updates from your customer journeys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      journey: "Welcome Onboarding",
                      action: "234 contacts entered",
                      time: "2 hours ago",
                      status: "active"
                    },
                    {
                      journey: "Product Discovery",
                      action: "89 contacts completed",
                      time: "4 hours ago", 
                      status: "completed"
                    },
                    {
                      journey: "Re-engagement Campaign",
                      action: "156 contacts progressed",
                      time: "6 hours ago",
                      status: "active"
                    },
                    {
                      journey: "Seasonal Promotion",
                      action: "67 contacts converted",
                      time: "8 hours ago",
                      status: "converting"
                    }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{activity.journey}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            activity.status === "active" ? "default" :
                            activity.status === "completed" ? "secondary" :
                            activity.status === "converting" ? "destructive" : "outline"
                          }
                        >
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Recommendations</CardTitle>
                <CardDescription>Intelligent suggestions to optimize your journeys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: "optimization",
                      title: "Optimize Welcome Journey",
                      description: "Add WhatsApp touchpoint after email step 2 to increase engagement by 23%",
                      priority: "high"
                    },
                    {
                      type: "automation",
                      title: "Automate Segmentation",
                      description: "Create dynamic segments based on engagement patterns for better targeting",
                      priority: "medium"
                    },
                    {
                      type: "timing",
                      title: "Adjust Send Times",
                      description: "Nigerian users show 35% higher engagement between 6-8 PM",
                      priority: "medium"
                    },
                    {
                      type: "content",
                      title: "Localize Content",
                      description: "Add Pidgin English variants for Lagos-based contacts",
                      priority: "low"
                    }
                  ].map((rec, index) => (
                    <div 
                      key={index} 
                      className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleRecommendationAction(rec)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{rec.title}</span>
                        </div>
                        <Badge 
                          variant={
                            rec.priority === "high" ? "destructive" :
                            rec.priority === "medium" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecommendationAction(rec);
                          }}
                        >
                          Apply
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Dismissing recommendation:", rec.title);
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="builder">
          <JourneyBuilder />
        </TabsContent>

        <TabsContent value="analytics">
          <JourneyAnalytics />
        </TabsContent>

        <TabsContent value="tracking">
          <ContactJourneyTracking />
        </TabsContent>

        <TabsContent value="templates">
          <JourneyTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
} 