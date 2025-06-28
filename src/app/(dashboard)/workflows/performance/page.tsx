"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Settings } from "lucide-react";
import WorkflowPerformanceDashboard from "@/components/dashboard/WorkflowPerformanceDashboard";
import { toast } from "sonner";

export default function WorkflowPerformancePage() {
  const { data: session, status } = useSession();
  const [controlLoading, setControlLoading] = useState(false);

  // Check if user has admin permissions
  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const handleMonitoringControl = async (action: string, params?: any) => {
    if (!isSuperAdmin) {
      toast.error("Super admin permissions required");
      return;
    }

    setControlLoading(true);
    try {
      const response = await fetch("/api/workflows/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        throw new Error("Failed to control monitoring");
      }

      const result = await response.json();
      toast.success(result.message);
    } catch (error) {
      console.error("Monitoring control error:", error);
      toast.error("Failed to control monitoring");
    } finally {
      setControlLoading(false);
    }
  };

  const handleCacheWarm = () => {
    handleMonitoringControl("warmCache");
  };

  const handleCacheInvalidate = () => {
    handleMonitoringControl("invalidateCache", {
      patterns: ["workflow_", "user_workflows_", "analytics_"],
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Performance Monitoring</h2>
        </div>
        
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            This page requires administrator permissions. Please contact your system administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for workflow system performance
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleCacheWarm}
              disabled={controlLoading}
            >
              Warm Cache
            </Button>
            <Button
              variant="outline"
              onClick={handleCacheInvalidate}
              disabled={controlLoading}
            >
              Clear Cache
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Metrics</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="controls">System Controls</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <WorkflowPerformanceDashboard />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitoring</CardTitle>
              <CardDescription>
                Real-time system resource monitoring and health checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                System health details will be displayed here.
                This would include detailed CPU, memory, disk, and network metrics.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Workflow Performance</CardTitle>
              <CardDescription>
                Detailed performance metrics for each workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Detailed workflow performance metrics will be displayed here.
                This would include execution times, success rates, and bottleneck analysis.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Analytics</CardTitle>
              <CardDescription>
                Multi-level cache performance metrics and optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Cache performance metrics will be displayed here.
                This would include hit rates, memory usage, and cache efficiency analytics.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="controls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  System Controls
                </CardTitle>
                <CardDescription>
                  Advanced system controls for performance monitoring and cache management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Super Admin Access</AlertTitle>
                  <AlertDescription>
                    These controls can significantly impact system performance. Use with caution.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monitoring Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleMonitoringControl("start")}
                        disabled={controlLoading}
                      >
                        Start Monitoring
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleMonitoringControl("stop")}
                        disabled={controlLoading}
                      >
                        Stop Monitoring
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cache Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCacheWarm}
                        disabled={controlLoading}
                      >
                        Warm All Caches
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCacheInvalidate}
                        disabled={controlLoading}
                      >
                        Invalidate Caches
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}