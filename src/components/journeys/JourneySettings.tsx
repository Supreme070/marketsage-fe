"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

interface JourneySettingsProps {
  journey: any;
  onUpdate: (data: any) => void;
}

export function JourneySettings({ journey, onUpdate }: JourneySettingsProps) {
  const [name, setName] = useState(journey.name);
  const [description, setDescription] = useState(journey.description || "");
  const [isActive, setIsActive] = useState(journey.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        name,
        description: description || undefined,
        isActive
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    // In a real implementation, this would show a confirmation dialog
    alert("Delete functionality would be implemented in the real application");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Journey Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Journey Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter journey name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this journey"
              rows={4}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Active Journey</Label>
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive border-dashed">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this journey will permanently remove it and all associated data.
            This action cannot be undone.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            Delete Journey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 