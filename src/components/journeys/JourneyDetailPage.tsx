"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3Icon, PlusIcon, ArrowRightIcon, Settings2Icon, Loader2Icon } from "lucide-react";

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

import { PageHeader } from "@/components/layout/page-header";
import { JourneyStagesEditor } from "./JourneyStagesEditor";
import { JourneySettings } from "./JourneySettings";

interface JourneyProps {
  journeyId: string;
}

interface Journey {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  stages: {
    id: string;
    name: string;
    description?: string;
    order: number;
    expectedDuration?: number;
    conversionGoal?: number;
    isEntryPoint?: boolean;
    isExitPoint?: boolean;
    transitions?: {
      id: string;
      fromStageId: string;
      toStageId: string;
      triggerType: string;
      name?: string;
      conditions?: any;
    }[];
  }[];
}

export function JourneyDetailPage({ journeyId }: JourneyProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("stages");

  useEffect(() => {
    fetchJourney();
  }, [journeyId]);

  async function fetchJourney() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/journeys?id=${journeyId}`);
      if (!response.ok) throw new Error("Failed to fetch journey");
      
      const data = await response.json();
      setJourney(data);
    } catch (error) {
      console.error("Error fetching journey:", error);
      setError("Failed to load journey details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleJourneyUpdate = async (updatedData: Partial<Journey>) => {
    try {
      const response = await fetch(`/api/journeys?id=${journeyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Failed to update journey");
      
      const updatedJourney = await response.json();
      setJourney(updatedJourney);
    } catch (error) {
      console.error("Error updating journey:", error);
      // Show error toast or message here
    }
  };

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
        title={journey.name}
        description={journey.description || "No description provided"}
        backHref="/journeys"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/journeys/${journeyId}/analytics`)}
            >
              <BarChart3Icon className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant={journey.isActive ? "default" : "secondary"}
              onClick={() => handleJourneyUpdate({ isActive: !journey.isActive })}
            >
              {journey.isActive ? "Active" : "Inactive"}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="stages" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="stages">Journey Stages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stages" className="mt-4">
          <JourneyStagesEditor 
            journey={journey} 
            onUpdate={(updatedJourney) => setJourney(updatedJourney)} 
          />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <JourneySettings 
            journey={journey} 
            onUpdate={handleJourneyUpdate} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 