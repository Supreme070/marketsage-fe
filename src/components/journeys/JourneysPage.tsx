"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, BarChart3Icon, ArrowRightIcon } from "lucide-react";

// Import UI components individually
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateJourneyModal } from "./CreateJourneyModal";

interface Journey {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  stages: {
    id: string;
    name: string;
    order: number;
    isEntryPoint?: boolean;
    isExitPoint?: boolean;
    contactCount?: number;
  }[];
}

export function JourneysPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchJourneys();
  }, [activeTab]);

  async function fetchJourneys() {
    try {
      setIsLoading(true);
      const isActive = activeTab === "active" ? true : 
                      activeTab === "inactive" ? false : undefined;
      
      const queryParams = new URLSearchParams();
      if (isActive !== undefined) {
        queryParams.append("isActive", isActive.toString());
      }
      
      const response = await fetch(`/api/journeys?${queryParams.toString()}`);
      if (!response.ok) {
        // Try to get more specific error message from response
        let errorMessage = "Failed to fetch journeys";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error JSON, just use the default message
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setJourneys(data);
    } catch (error: any) {
      console.error("Error fetching journeys:", error);
      // Here you would typically show an error toast or message to the user
      // For example: toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateJourney = async (journey: any) => {
    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(journey),
      });

      if (!response.ok) throw new Error("Failed to create journey");
      
      const newJourney = await response.json();
      setJourneys([newJourney, ...journeys]);
      setIsCreateModalOpen(false);
      
      // Navigate to the new journey
      router.push(`/journeys/${newJourney.id}`);
    } catch (error) {
      console.error("Error creating journey:", error);
      // Show error toast or message here
    }
  };

  const filteredJourneys = journeys.filter(journey => {
    if (activeTab === "active") return journey.isActive;
    if (activeTab === "inactive") return !journey.isActive;
    return true; // "all" tab
  });

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Customer Journeys"
        description="Map and optimize your customer journey across multiple touchpoints"
        actions={
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-auto"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Journey
          </Button>
        }
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Journeys</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderJourneysList(filteredJourneys, isLoading)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderJourneysList(filteredJourneys, isLoading)}
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          {renderJourneysList(filteredJourneys, isLoading)}
        </TabsContent>
      </Tabs>

      <CreateJourneyModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateJourney}
      />
    </div>
  );
}

function renderJourneysList(journeys: Journey[], isLoading: boolean) {
  if (isLoading) {
    return <div className="flex justify-center py-12">Loading journeys...</div>;
  }

  if (journeys.length === 0) {
    return (
      <EmptyState
        title="No journeys found"
        description="Create your first customer journey to start tracking and optimizing their experience."
        icon={<BarChart3Icon className="h-12 w-12" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {journeys.map((journey) => (
        <Card key={journey.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {journey.name}
              <span className={`text-xs px-2 py-1 rounded ${journey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {journey.isActive ? 'Active' : 'Inactive'}
              </span>
            </CardTitle>
            <CardDescription>
              {journey.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="text-sm mb-4">
              <strong>{journey.stages.length}</strong> stages •{" "}
              Created {new Date(journey.createdAt).toLocaleDateString()}
            </div>
            {journey.stages.length > 0 && (
              <div className="space-y-2">
                <Paragraph variant="small" className="text-muted-foreground">
                  Journey Flow:
                </Paragraph>
                <div className="flex flex-wrap items-center gap-2">
                  {journey.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, index) => (
                      <div key={stage.id} className="flex items-center">
                        <div className="rounded bg-muted px-2 py-1 text-xs">
                          {stage.name}
                          {stage.contactCount !== undefined && (
                            <span className="ml-1 text-muted-foreground">
                              ({stage.contactCount})
                            </span>
                          )}
                        </div>
                        {index < journey.stages.length - 1 && (
                          <ArrowRightIcon className="w-4 h-4 mx-1 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <a href={`/journeys/${journey.id}`}>View Journey</a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 