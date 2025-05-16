"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface JourneyStagesEditorProps {
  journey: any;
  onUpdate: (journey: any) => void;
}

export function JourneyStagesEditor({ journey, onUpdate }: JourneyStagesEditorProps) {
  const [isAddingStage, setIsAddingStage] = useState(false);

  // This is a placeholder component - in a real implementation, this would
  // contain a rich interactive stage editor with drag & drop, etc.
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Journey Stages</h2>
        <Button 
          size="sm" 
          onClick={() => setIsAddingStage(true)}
          disabled={isAddingStage}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {journey.stages.length === 0 ? (
        <EmptyState
          title="No stages defined"
          description="Add your first stage to start building your customer journey"
          action={
            <Button 
              onClick={() => setIsAddingStage(true)}
              disabled={isAddingStage}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Stage
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {journey.stages
            .sort((a, b) => a.order - b.order)
            .map((stage) => (
              <Card key={stage.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{stage.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {stage.description || "No description provided"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {stage.isEntryPoint && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Entry Point
                      </div>
                    )}
                    {stage.isExitPoint && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Exit Point
                      </div>
                    )}
                    {stage.expectedDuration && (
                      <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Expected: {stage.expectedDuration} hrs
                      </div>
                    )}
                    {stage.conversionGoal && (
                      <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Goal: {stage.conversionGoal * 100}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* In a real implementation, this would be a modal for adding/editing stages */}
      {isAddingStage && (
        <Card className="border border-dashed">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Stage editor would be implemented here in the real application
            </p>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddingStage(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button onClick={() => setIsAddingStage(false)}>
                Add Stage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 