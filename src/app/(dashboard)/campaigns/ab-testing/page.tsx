"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Beaker, Mail, MessageSquare, MessageCircle, PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { ABTest, getABTests } from "@/lib/ab-testing-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CreateTestForm } from "@/components/ab-testing/CreateTestForm";
import { useRouter } from "next/navigation";

export default function ABTestingPage() {
  const [activeTab, setActiveTab] = useState("email");
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setLoading(true);
      setError(null);
      const testsData = await getABTests();
      setTests(testsData);
    } catch (err) {
      setError("Failed to load A/B tests. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const emailTests = tests.filter(test => test.entityType === "EMAIL_CAMPAIGN");
  const smsTests = tests.filter(test => test.entityType === "SMS_CAMPAIGN");
  const whatsappTests = tests.filter(test => test.entityType === "WHATSAPP_CAMPAIGN");

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

  function handleCreateTest(id: string) {
    // Reload tests after creation
    loadTests();
  }

  function renderTestCards(testsList: ABTest[]) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading tests...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (testsList.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No tests found</CardTitle>
            <CardDescription>
              Create your first A/B test to start optimizing your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="mt-2" onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testsList.map(test => (
          <Card key={test.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-1">
                <CardTitle 
                  className="text-sm font-medium hover:text-primary cursor-pointer"
                  onClick={() => router.push(`/campaigns/ab-testing/${test.id}`)}
                >
                  {test.name}
                </CardTitle>
                {getStatusBadge(test.status)}
              </div>
              <CardDescription>
                {test.description || `Testing ${test.testElements.join(", ")}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                {test.variants?.length || 0} variants • 
                {test.startedAt 
                  ? ` Started ${formatDistanceToNow(new Date(test.startedAt))} ago` 
                  : " Not started"
                }
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {test.winnerVariantId 
                    ? "Winner determined" 
                    : test.status === "RUNNING" 
                      ? "In progress" 
                      : "Not started"
                  }
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/campaigns/ab-testing/${test.id}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">
            Create and manage A/B tests for your marketing campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Test
        </Button>
      </div>

      <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Tests
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="mr-2 h-4 w-4" />
            SMS Tests
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp Tests
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="space-y-4">
          {renderTestCards(emailTests)}
        </TabsContent>
        <TabsContent value="sms" className="space-y-4">
          {renderTestCards(smsTests)}
        </TabsContent>
        <TabsContent value="whatsapp" className="space-y-4">
          {renderTestCards(whatsappTests)}
        </TabsContent>
      </Tabs>

      <CreateTestForm 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateTest}
        entityType={activeTab === "email" ? "EMAIL_CAMPAIGN" : 
                   activeTab === "sms" ? "SMS_CAMPAIGN" : 
                   "WHATSAPP_CAMPAIGN"}
      />
    </div>
  );
} 