"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Beaker, Plus, X, Check, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailCampaignABTestProps {
  campaignId: string;
  campaignName: string;
  originalSubject: string;
}

export default function EmailCampaignABTest({
  campaignId,
  campaignName,
  originalSubject,
}: EmailCampaignABTestProps) {
  // State for the UI
  const [activeTab, setActiveTab] = useState<string>("subject");
  const [distributionPercent, setDistributionPercent] = useState<number>(50);
  const [subjectVariants, setSubjectVariants] = useState<string[]>([originalSubject, ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [resultsData, setResultsData] = useState<any>(null);

  // Fetch active tests when component loads
  const fetchActiveTests = async () => {
    try {
      const response = await fetch(`/api/v2/ab-tests?entityType=EMAIL_CAMPAIGN&entityId=${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch A/B tests');
      }
      
      const data = await response.json();
      setActiveTests(data);
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      toast.error('Failed to fetch A/B tests');
    }
  };

  // Create an A/B test
  const createABTest = async () => {
    // Validate subject variants
    const filteredVariants = subjectVariants.filter(subject => subject.trim().length > 0);
    
    if (filteredVariants.length < 2) {
      toast.error('At least two subject variants are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/v2/email/campaigns/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          testType: activeTab,
          distributionPercent: distributionPercent / 100, // Convert to decimal
          variants: filteredVariants
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create A/B test');
      }
      
      const result = await response.json();
      
      toast.success('A/B test created successfully');
      fetchActiveTests();
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast.error(error.message || 'Failed to create A/B test');
    } finally {
      setLoading(false);
    }
  };

  // View test results
  const viewTestResults = async (testId: string) => {
    try {
      const response = await fetch(`/api/v2/ab-tests?id=${testId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      
      const data = await response.json();
      setResultsData(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Failed to fetch test results');
    }
  };

  // Start a test
  const startTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/v2/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start A/B test');
      }
      
      toast.success('A/B test started successfully');
      fetchActiveTests();
    } catch (error) {
      console.error('Error starting A/B test:', error);
      toast.error(error.message || 'Failed to start A/B test');
    }
  };

  // Stop a test
  const stopTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/v2/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop A/B test');
      }
      
      toast.success('A/B test stopped successfully');
      fetchActiveTests();
    } catch (error) {
      console.error('Error stopping A/B test:', error);
      toast.error(error.message || 'Failed to stop A/B test');
    }
  };

  // Delete a test
  const deleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/v2/ab-tests/${testId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete A/B test');
      }
      
      toast.success('A/B test deleted successfully');
      fetchActiveTests();
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      toast.error(error.message || 'Failed to delete A/B test');
    }
  };

  // Add a new subject variant
  const addSubjectVariant = () => {
    setSubjectVariants([...subjectVariants, ""]);
  };

  // Remove a subject variant
  const removeSubjectVariant = (index: number) => {
    if (subjectVariants.length <= 2) {
      toast.error('At least two variants are required');
      return;
    }
    
    const newVariants = [...subjectVariants];
    newVariants.splice(index, 1);
    setSubjectVariants(newVariants);
  };

  // Update a subject variant
  const updateSubjectVariant = (index: number, value: string) => {
    const newVariants = [...subjectVariants];
    newVariants[index] = value;
    setSubjectVariants(newVariants);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">A/B Testing</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage A/B tests for this email campaign
          </p>
        </div>
        <Beaker className="h-8 w-8 text-blue-500" />
      </div>
      
      <Separator />
      
      {showResults ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Performance metrics for your A/B test
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowResults(false)}>
              Back to Tests
            </Button>
          </CardHeader>
          <CardContent>
            {resultsData && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Status</h4>
                    <p className="mt-2 text-xl font-bold">{resultsData.status}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Participants</h4>
                    <p className="mt-2 text-xl font-bold">{resultsData.totalParticipants}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <h4 className="text-sm font-medium">Confidence</h4>
                    <p className="mt-2 text-xl font-bold">
                      {resultsData.confidence ? `${Math.round(resultsData.confidence * 100)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Variant Performance</h4>
                  <div className="space-y-4">
                    {resultsData.variants.map((variant: any, index: number) => (
                      <div key={variant.variantId} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variant.name}</span>
                            {resultsData.winner === variant.variantId && (
                              <Badge className="bg-green-500">Winner</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.participants} participants
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Open Rate</span>
                            <p className="font-medium">
                              {variant.metrics.OPEN_RATE ? 
                                `${(variant.metrics.OPEN_RATE.value * 100).toFixed(1)}%` : 
                                'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Click Rate</span>
                            <p className="font-medium">
                              {variant.metrics.CLICK_RATE ? 
                                `${(variant.metrics.CLICK_RATE.value * 100).toFixed(1)}%` : 
                                'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Improvement</span>
                            <p className={`font-medium ${variant.improvement > 0 ? 'text-green-500' : variant.improvement < 0 ? 'text-red-500' : ''}`}>
                              {variant.improvement !== undefined ? 
                                `${variant.improvement > 0 ? '+' : ''}${variant.improvement.toFixed(1)}%` : 
                                'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create New A/B Test</CardTitle>
              <CardDescription>
                Test different variables to optimize campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="subject" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="subject">Subject Line</TabsTrigger>
                  <TabsTrigger value="content" disabled>Content (Coming Soon)</TabsTrigger>
                  <TabsTrigger value="send_time" disabled>Send Time (Coming Soon)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="subject" className="space-y-6 py-4">
                  <div>
                    <Label htmlFor="distribution">Test Distribution</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        id="distribution"
                        min={10}
                        max={100}
                        step={10}
                        value={[distributionPercent]}
                        onValueChange={(values) => setDistributionPercent(values[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center">{distributionPercent}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Percentage of your audience that will participate in this test
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Subject Line Variants</Label>
                    
                    {subjectVariants.map((subject, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={subject}
                          onChange={(e) => updateSubjectVariant(index, e.target.value)}
                          placeholder={`Subject line variant ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubjectVariant(index)}
                          disabled={subjectVariants.length <= 2}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={addSubjectVariant}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={createABTest} disabled={loading}>
                  {loading ? 'Creating...' : 'Create A/B Test'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active A/B Tests</CardTitle>
              <CardDescription>
                Manage and monitor your A/B tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No active A/B tests found for this campaign
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTests.map((test) => (
                    <div key={test.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{test.name}</h4>
                          <p className="text-sm text-muted-foreground">{test.description}</p>
                        </div>
                        <Badge 
                          className={
                            test.status === 'RUNNING' ? 'bg-green-500' : 
                            test.status === 'COMPLETED' ? 'bg-blue-500' : 
                            'bg-amber-500'
                          }
                        >
                          {test.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewTestResults(test.id)}
                        >
                          <BarChart2 className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        
                        {test.status === 'DRAFT' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startTest(test.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Start Test
                          </Button>
                        )}
                        
                        {test.status === 'RUNNING' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => stopTest(test.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Stop Test
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTest(test.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 