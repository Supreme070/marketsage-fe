"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3Icon, 
  AlertTriangleIcon, 
  ArrowRightIcon, 
  ClockIcon, 
  UsersIcon,
  Loader2Icon
} from "lucide-react";

// Import UI components individually
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import { PageHeader } from "@/components/layout/page-header";

interface JourneyAnalyticsPageProps {
  journeyId: string;
}

// Interface for general analytics data
interface JourneyAnalytics {
  journeyId: string;
  date: string;
  totalContacts: number;
  activeContacts: number;
  completedContacts: number;
  droppedContacts: number;
  conversionRate: number;
  averageDuration: number;
  stageData: {
    [stageId: string]: {
      contacts: number;
      enteredCount: number;
      exitedCount: number;
      conversionRate: number;
      avgDuration: number;
    }
  };
}

// Interface for bottleneck data
interface Bottleneck {
  stageId: string;
  stageName: string;
  conversionRate: number;
  targetConversionRate?: number;
  averageDuration: number;
  expectedDuration?: number;
  dropOffRate: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

// Interface for flow distribution data
interface FlowDistribution {
  stageId: string;
  stageName: string;
  order: number;
  count: number;
  percentage: number;
}

// Interface for completion time distribution
interface CompletionTimeDistribution {
  timeRange: string;
  count: number;
  percentage: number;
}

export function JourneyAnalyticsPage({ journeyId }: JourneyAnalyticsPageProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Analytics data states
  const [analytics, setAnalytics] = useState<JourneyAnalytics | null>(null);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [flowDistribution, setFlowDistribution] = useState<FlowDistribution[]>([]);
  const [completionTime, setCompletionTime] = useState<CompletionTimeDistribution[]>([]);

  useEffect(() => {
    // Fetch journey details first
    fetchJourney();
  }, [journeyId]);

  useEffect(() => {
    // When active tab changes, fetch the appropriate analytics data
    if (journey) {
      switch(activeTab) {
        case "overview":
          fetchGeneralAnalytics();
          break;
        case "bottlenecks":
          fetchBottlenecks();
          break;
        case "flow":
          fetchFlowDistribution();
          break;
        case "completion":
          fetchCompletionTime();
          break;
      }
    }
  }, [activeTab, journey]);

  async function fetchJourney() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/journeys?id=${journeyId}`);
      if (!response.ok) throw new Error("Failed to fetch journey");
      
      const data = await response.json();
      setJourney(data);
      
      // After journey is fetched, get the general analytics
      await fetchGeneralAnalytics();
    } catch (error) {
      console.error("Error fetching journey:", error);
      setError("Failed to load journey details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchGeneralAnalytics() {
    try {
      const response = await fetch(
        `/api/journeys/analytics?journeyId=${journeyId}&type=general`
      );
      if (!response.ok) throw new Error("Failed to fetch journey analytics");
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Show error toast or message here
    }
  }

  async function fetchBottlenecks() {
    try {
      const response = await fetch(
        `/api/journeys/analytics?journeyId=${journeyId}&type=bottlenecks`
      );
      if (!response.ok) throw new Error("Failed to fetch bottlenecks");
      
      const data = await response.json();
      setBottlenecks(data);
    } catch (error) {
      console.error("Error fetching bottlenecks:", error);
      // Show error toast or message here
    }
  }

  async function fetchFlowDistribution() {
    try {
      const response = await fetch(
        `/api/journeys/analytics?journeyId=${journeyId}&type=flow`
      );
      if (!response.ok) throw new Error("Failed to fetch flow distribution");
      
      const data = await response.json();
      setFlowDistribution(data);
    } catch (error) {
      console.error("Error fetching flow distribution:", error);
      // Show error toast or message here
    }
  }

  async function fetchCompletionTime() {
    try {
      const response = await fetch(
        `/api/journeys/analytics?journeyId=${journeyId}&type=completion`
      );
      if (!response.ok) throw new Error("Failed to fetch completion time");
      
      const data = await response.json();
      setCompletionTime(data);
    } catch (error) {
      console.error("Error fetching completion time:", error);
      // Show error toast or message here
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Could not load journey details"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/journeys")}>
            Back to Journeys
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title={`${journey.name} - Analytics`}
        description="Analyze journey performance and identify opportunities for improvement"
        backHref={`/journeys/${journeyId}`}
      />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="flow">Contact Flow</TabsTrigger>
          <TabsTrigger value="completion">Completion Time</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalContacts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entered this journey
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(analytics.conversionRate * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.completedContacts} contacts completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeContacts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently in this journey
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageDuration} hrs
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From first to last stage
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Stage Performance */}
          {analytics && analytics.stageData && (
            <Card>
              <CardHeader>
                <CardTitle>Stage Performance</CardTitle>
                <CardDescription>
                  Track contact progress through each stage of the journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {journey.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => {
                      const stageAnalytics = analytics.stageData[stage.id] || {
                        contacts: 0,
                        enteredCount: 0,
                        exitedCount: 0,
                        conversionRate: 0,
                        avgDuration: 0
                      };
                      
                      return (
                        <div key={stage.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{stage.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {stageAnalytics.contacts} contacts • 
                                Avg {stageAnalytics.avgDuration} hrs
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {(stageAnalytics.conversionRate * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Exit rate
                              </div>
                            </div>
                          </div>
                          <Progress 
                            value={stageAnalytics.conversionRate * 100} 
                            className="h-2" 
                          />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="mt-4">
          {bottlenecks.length === 0 ? (
            <div className="flex justify-center py-12">
              {activeTab === "bottlenecks" ? (
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center">
                  <AlertTriangleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No bottlenecks detected</h3>
                  <p className="text-muted-foreground mt-2">
                    This journey seems to be performing well.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {bottlenecks.map((bottleneck) => (
                <Card key={bottleneck.stageId} className={`border-l-4 ${
                  bottleneck.impact === 'HIGH' 
                    ? 'border-l-destructive' 
                    : bottleneck.impact === 'MEDIUM' 
                      ? 'border-l-warning' 
                      : 'border-l-muted'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{bottleneck.stageName}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        bottleneck.impact === 'HIGH' 
                          ? 'bg-destructive/10 text-destructive' 
                          : bottleneck.impact === 'MEDIUM' 
                            ? 'bg-warning/10 text-warning' 
                            : 'bg-muted/10 text-muted-foreground'
                      }`}>
                        {bottleneck.impact} Impact
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Stage performance is below expected metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium">Conversion Rate</div>
                        <div className="flex items-center">
                          <span className="text-lg">{(bottleneck.conversionRate * 100).toFixed(1)}%</span>
                          {bottleneck.targetConversionRate && (
                            <span className="text-sm text-muted-foreground ml-2">
                              Target: {(bottleneck.targetConversionRate * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Average Duration</div>
                        <div className="flex items-center">
                          <span className="text-lg">{bottleneck.averageDuration} hrs</span>
                          {bottleneck.expectedDuration && (
                            <span className="text-sm text-muted-foreground ml-2">
                              Expected: {bottleneck.expectedDuration} hrs
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Drop-off Rate</div>
                        <div className="text-lg">
                          {(bottleneck.dropOffRate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium">Recommendations:</h4>
                      <ul className="space-y-1">
                        {bottleneck.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <ArrowRightIcon className="h-4 w-4 mr-2 mt-1 text-primary" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Flow Distribution Tab */}
        <TabsContent value="flow" className="mt-4">
          {flowDistribution.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contact Distribution</CardTitle>
                <CardDescription>
                  Current distribution of contacts across journey stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flowDistribution
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div key={item.stageId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{item.stageName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{item.count}</span>
                            <span className="text-muted-foreground text-sm ml-2">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Completion Time Tab */}
        <TabsContent value="completion" className="mt-4">
          {completionTime.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Journey Completion Time</CardTitle>
                <CardDescription>
                  Distribution of time taken by contacts to complete the journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completionTime.map((item) => (
                    <div key={item.timeRange} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{item.timeRange}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{item.count}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}