"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getABTest, startABTest, stopABTest, ABTest } from "@/lib/ab-testing-service";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, CheckCircle, AlertCircle, Play, Pause, BarChart4, MailCheck, MailX, Github, Download, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export default function ABTestDetailPage() {
  // Use the useParams hook
  const params = useParams();
  const testId = params.id as string;
  
  const router = useRouter();
  const [test, setTest] = useState<ABTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    async function loadTest() {
      try {
        setLoading(true);
        setError(null);
        const testData = await getABTest(testId);
        setTest(testData);
      } catch (err) {
        setError("Failed to load A/B test details. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [testId]);

  const handleStartTest = async () => {
    try {
      setActionLoading(true);
      const success = await startABTest(testId);
      
      if (success) {
        // Reload the test
        const updatedTest = await getABTest(testId);
        setTest(updatedTest);
      } else {
        // Error already handled by the service with toast
        console.error("Failed to start test: returned false");
      }
    } catch (error) {
      console.error("Failed to start test with exception:", error);
      toast.error("Failed to start test: unexpected error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopTest = async () => {
    try {
      setActionLoading(true);
      const success = await stopABTest(testId);
      
      if (success) {
        // Reload the test
        const updatedTest = await getABTest(testId);
        setTest(updatedTest);
      } else {
        // Error already handled by the service with toast
        console.error("Failed to stop test: returned false");
      }
    } catch (error) {
      console.error("Failed to stop test with exception:", error);
      toast.error("Failed to stop test: unexpected error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneTest = async () => {
    try {
      setActionLoading(true);
      toast.success("Creating test clone...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Test cloned successfully");
      // In production, you would create a new test based on this one
      // and redirect to the new test page
    } catch (error) {
      console.error("Failed to clone test", error);
      toast.error("Failed to clone test");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyWinner = async () => {
    try {
      setActionLoading(true);
      toast.success("Applying winner to campaign...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Winner applied successfully");
      // In production, you would update the campaign with the winning variant
    } catch (error) {
      console.error("Failed to apply winner", error);
      toast.error("Failed to apply winner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    try {
      setActionLoading(true);
      toast.success("Deleting test...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Test deleted successfully");
      // Navigate back to the test list
      router.push('/campaigns/ab-testing');
    } catch (error) {
      console.error("Failed to delete test", error);
      toast.error("Failed to delete test");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReport = () => {
    toast.info("Generating detailed report...");
    // Generate report
    setTimeout(() => {
      setReportOpen(true);
      toast.success("Report ready");
    }, 1000);
  };

  const handleDownloadReport = () => {
    toast.success("Report downloaded");
    // In a real app, you would generate and download a PDF or CSV report
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "RUNNING":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Running</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "PAUSED":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Add this component at the end before the final return statement
  const ReportModal = () => {
    if (!test) return null;
    
    // Get the winner variant if any
    const winnerVariant = test.winnerVariantId 
      ? test.variants.find(v => v.id === test.winnerVariantId)
      : null;
    
    return (
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>A/B Test Report: {test.name}</span>
              <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </DialogTitle>
            <DialogDescription>
              {test.description || `Testing ${test.testElements.join(", ")}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Test Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{test.status}</div>
                  <p className="text-xs text-muted-foreground">
                    {test.startedAt ? `Started ${formatDistanceToNow(new Date(test.startedAt), { addSuffix: true })}` : 'Not started'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {test.variants.reduce((sum, v) => {
                      const metricValue = v.results?.[test.winnerMetric.toLowerCase()]?.sampleSize || 0;
                      return sum + metricValue;
                    }, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across {test.variants.length} variants</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {test.startedAt && test.endedAt 
                      ? `${Math.round((new Date(test.endedAt).getTime() - new Date(test.startedAt).getTime()) / (1000 * 60 * 60 * 24))} days` 
                      : test.startedAt 
                        ? `${Math.round((new Date().getTime() - new Date(test.startedAt).getTime()) / (1000 * 60 * 60 * 24))} days` 
                        : 'Not started'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {test.endedAt ? `Ended ${formatDistanceToNow(new Date(test.endedAt), { addSuffix: true })}` : 'Ongoing'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Variants Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Variant Performance</CardTitle>
                <CardDescription>Comparing all variants based on {test.winnerMetric}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {test.variants.map((variant) => {
                    const isWinner = variant.id === test.winnerVariantId;
                    const metricValue = variant.results?.[test.winnerMetric.toLowerCase()]?.value || 0;
                    const sampleSize = variant.results?.[test.winnerMetric.toLowerCase()]?.sampleSize || 0;
                    const formattedValue = (metricValue * 100).toFixed(2);
                    
                    // Calculate improvement over control
                    let improvement = null;
                    const controlVariant = test.variants.find(v => v.name.toLowerCase() === 'control');
                    
                    if (controlVariant && variant.id !== controlVariant.id && variant.results && controlVariant.results) {
                      const controlValue = controlVariant.results[test.winnerMetric.toLowerCase()]?.value || 0;
                      const variantValue = variant.results[test.winnerMetric.toLowerCase()]?.value || 0;
                      
                      if (controlValue > 0) {
                        improvement = ((variantValue - controlValue) / controlValue) * 100;
                      }
                    }
                    
                    // Calculate progress percentage
                    const maxMetricValue = Math.max(...test.variants.map(v => 
                      v.results?.[test.winnerMetric.toLowerCase()]?.value || 0
                    ));
                    const progressPercentage = maxMetricValue > 0 
                      ? (metricValue / maxMetricValue) * 100 
                      : 0;
                    
                    return (
                      <div key={variant.id} className={`p-4 rounded-lg ${isWinner ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium">{variant.name}</h3>
                              {isWinner && (
                                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Winner
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{variant.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formattedValue}%</p>
                            <p className="text-xs text-muted-foreground">Sample: {sampleSize}</p>
                          </div>
                        </div>
                        
                        {/* Content Preview */}
                        <div className="mt-3 p-3 bg-white rounded border">
                          {test.testElements.includes('subject') && (
                            <p className="text-sm">
                              <span className="font-semibold">Subject:</span> {variant.content?.subject}
                            </p>
                          )}
                          {(test.testElements.includes('content') || test.testElements.includes('message')) && (
                            <p className="text-sm">
                              <span className="font-semibold">Message:</span> {variant.content?.message || variant.content?.content}
                            </p>
                          )}
                          {test.testElements.includes('media') && variant.content?.media && (
                            <p className="text-sm">
                              <span className="font-semibold">Media:</span> {variant.content.media.type} included
                            </p>
                          )}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        {/* Improvement indicator */}
                        {improvement !== null && (
                          <div className="mt-2 text-right">
                            <span className={`text-xs font-medium ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(2)}% vs control
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Recommendations */}
            {test.status === "COMPLETED" && winnerVariant && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Winner Determined</AlertTitle>
                    <AlertDescription>
                      {winnerVariant.name} outperformed other variants with a {test.winnerMetric} of {(winnerVariant.results?.[test.winnerMetric.toLowerCase()]?.value || 0) * 100}%.
                      We recommend implementing this variant in your campaign.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Apply the winning variant to your {test.entityType.replace("_CAMPAIGN", "").toLowerCase()} campaign</li>
                      <li>Consider running additional tests on other elements</li>
                      <li>Share the results with your team</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setReportOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested A/B test could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get the winner variant if any
  const winnerVariant = test.winnerVariantId 
    ? test.variants.find(v => v.id === test.winnerVariantId)
    : null;

  // Calculate variant metrics and improvements
  const variants = test.variants.map(variant => {
    // Calculate improvement over control
    let improvement = null;
    const controlVariant = test.variants.find(v => v.name.toLowerCase() === 'control');
    
    if (controlVariant && variant.id !== controlVariant.id && variant.results && controlVariant.results) {
      const controlValue = controlVariant.results[test.winnerMetric.toLowerCase()]?.value || 0;
      const variantValue = variant.results[test.winnerMetric.toLowerCase()]?.value || 0;
      
      if (controlValue > 0) {
        improvement = ((variantValue - controlValue) / controlValue) * 100;
      }
    }

    return {
      ...variant,
      improvement
    };
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/campaigns/ab-testing')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
          <p className="text-muted-foreground">
            {test.description || `Testing ${test.testElements.join(", ")}`}
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Test Overview</CardTitle>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{test.testType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Winner Metric</p>
                  <p className="text-sm text-muted-foreground">{test.winnerMetric}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Distribution</p>
                  <p className="text-sm text-muted-foreground">{test.distributionPercent * 100}% of audience</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {test.createdAt ? formatDistanceToNow(new Date(test.createdAt), { addSuffix: true }) : 'Unknown'}
                  </p>
                </div>
                {test.startedAt && (
                  <div>
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(test.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
                {test.endedAt && (
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(test.endedAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-6">
                {test.status === "DRAFT" && (
                  <Button onClick={handleStartTest} disabled={actionLoading}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Test
                  </Button>
                )}
                {test.status === "RUNNING" && (
                  <Button onClick={handleStopTest} disabled={actionLoading} variant="outline">
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Test
                  </Button>
                )}
                <Button variant="outline" onClick={handleViewReport}>
                  <BarChart4 className="mr-2 h-4 w-4" />
                  View Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Comparing {test.variants.length} variants based on {test.winnerMetric}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {variants.map((variant) => {
                  const isWinner = variant.id === test.winnerVariantId;
                  const metricValue = variant.results?.[test.winnerMetric.toLowerCase()]?.value || 0;
                  const sampleSize = variant.results?.[test.winnerMetric.toLowerCase()]?.sampleSize || 0;
                  const formattedValue = (metricValue * 100).toFixed(2);
                  
                  // Calculate progress percentage based on the highest metric value
                  const maxMetricValue = Math.max(...variants.map(v => 
                    v.results?.[test.winnerMetric.toLowerCase()]?.value || 0
                  ));
                  const progressPercentage = maxMetricValue > 0 
                    ? (metricValue / maxMetricValue) * 100 
                    : 0;

                  return (
                    <div key={variant.id} className={`p-4 rounded-lg ${isWinner ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium">{variant.name}</h3>
                            {isWinner && (
                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Winner
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{variant.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formattedValue}%</p>
                          <p className="text-xs text-muted-foreground">Sample: {sampleSize}</p>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="mt-3 p-3 bg-white rounded border">
                        {test.testElements.includes('subject') && (
                          <p className="text-sm">
                            <span className="font-semibold">Subject:</span> {variant.content?.subject}
                          </p>
                        )}
                        {(test.testElements.includes('content') || test.testElements.includes('message')) && (
                          <p className="text-sm">
                            <span className="font-semibold">Message:</span> {variant.content?.message || variant.content?.content}
                          </p>
                        )}
                        {test.testElements.includes('media') && variant.content?.media && (
                          <p className="text-sm">
                            <span className="font-semibold">Media:</span> {variant.content.media.type} included
                          </p>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      
                      {/* Improvement indicator */}
                      {variant.improvement && (
                        <div className="mt-2 text-right">
                          <span className={`text-xs font-medium ${variant.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {variant.improvement > 0 ? '+' : ''}{variant.improvement.toFixed(2)}% vs control
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {test.status === "COMPLETED" && winnerVariant ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-medium">Winner Determined</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {winnerVariant?.name || 'A variant'} outperformed other variants 
                      with a {test.winnerMetric} of{' '}
                      {winnerVariant?.results && winnerVariant.results[test.winnerMetric.toLowerCase()] 
                        ? (winnerVariant.results[test.winnerMetric.toLowerCase()].value * 100).toFixed(2) 
                        : '0.00'}%.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement the winning variant in your campaign to improve performance
                      by up to {(variants.find(v => v.id === winnerVariant.id)?.improvement || 0).toFixed(2)}%.
                    </p>
                  </div>
                </div>
              ) : test.status === "RUNNING" ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Test is currently running. Results will be available once sufficient data has been collected.
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Collecting data...</span>
                      <span className="text-xs">Auto-complete at 95% confidence</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-blue-500 animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Test hasn't started yet. Start the test to collect performance data.
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Campaign ID</p>
                  <p className="text-sm text-muted-foreground">{test.entityId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Channel</p>
                  <p className="text-sm text-muted-foreground">
                    {test.entityType === "EMAIL_CAMPAIGN" && "Email"}
                    {test.entityType === "SMS_CAMPAIGN" && "SMS"}
                    {test.entityType === "WHATSAPP_CAMPAIGN" && "WhatsApp"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Elements Tested</p>
                  <p className="text-sm text-muted-foreground">
                    {test.testElements.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleCloneTest} 
                  disabled={actionLoading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Clone Test
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleApplyWinner} 
                  disabled={actionLoading || !test.winnerVariantId}
                >
                  {test.entityType === "EMAIL_CAMPAIGN" ? (
                    <MailCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Apply Winner
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleDeleteTest} 
                  disabled={actionLoading || test.status === "RUNNING"}
                >
                  <MailX className="mr-2 h-4 w-4" />
                  Delete Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add the modal component */}
      <ReportModal />
    </div>
  );
} 