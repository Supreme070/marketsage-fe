"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Save, RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

enum AttributionModel {
  FIRST_TOUCH = "FIRST_TOUCH",
  LAST_TOUCH = "LAST_TOUCH",
  LINEAR = "LINEAR",
  TIME_DECAY = "TIME_DECAY",
  POSITION_BASED = "POSITION_BASED",
  CUSTOM = "CUSTOM"
}

interface AttributionSettings {
  defaultModel: AttributionModel;
  lookbackWindow: number;
  customWeights?: {
    first: number;
    middle: number;
    last: number;
  };
}

export default function AttributionSettings() {
  const [settings, setSettings] = useState<AttributionSettings>({
    defaultModel: AttributionModel.LAST_TOUCH,
    lookbackWindow: 30,
    customWeights: {
      first: 0.4,
      middle: 0.2,
      last: 0.4
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/attribution-settings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch attribution settings");
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching attribution settings:", error);
      toast.error("Failed to load attribution settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    
    try {
      const response = await fetch("/api/attribution-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save attribution settings");
      }
      
      toast.success("Attribution settings saved successfully");
    } catch (error) {
      console.error("Error saving attribution settings:", error);
      toast.error("Failed to save attribution settings");
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = (value: string) => {
    setSettings({
      ...settings,
      defaultModel: value as AttributionModel
    });
  };

  const handleLookbackChange = (value: number[]) => {
    setSettings({
      ...settings,
      lookbackWindow: value[0]
    });
  };

  const handleCustomWeightChange = (position: 'first' | 'middle' | 'last', value: string) => {
    const numValue = Number.parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 1) {
      return;
    }
    
    setSettings({
      ...settings,
      customWeights: {
        ...(settings.customWeights || { first: 0, middle: 0, last: 0 }),
        [position]: numValue
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attribution Model Settings</CardTitle>
            <CardDescription>
              Configure how conversions are attributed to marketing touchpoints
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Default Attribution Model</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select how conversions are attributed to marketing touchpoints by default
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <RadioGroup 
                value={settings.defaultModel} 
                onValueChange={handleModelChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.FIRST_TOUCH} id="first-touch" />
                  <Label htmlFor="first-touch" className="cursor-pointer">
                    First Touch
                    <span className="text-sm text-muted-foreground block">
                      100% credit to the first interaction
                    </span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.LAST_TOUCH} id="last-touch" />
                  <Label htmlFor="last-touch" className="cursor-pointer">
                    Last Touch
                    <span className="text-sm text-muted-foreground block">
                      100% credit to the last interaction before conversion
                    </span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.LINEAR} id="linear" />
                  <Label htmlFor="linear" className="cursor-pointer">
                    Linear
                    <span className="text-sm text-muted-foreground block">
                      Equal credit across all touchpoints
                    </span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.TIME_DECAY} id="time-decay" />
                  <Label htmlFor="time-decay" className="cursor-pointer">
                    Time Decay
                    <span className="text-sm text-muted-foreground block">
                      More credit to touchpoints closer to conversion
                    </span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.POSITION_BASED} id="position-based" />
                  <Label htmlFor="position-based" className="cursor-pointer">
                    Position Based (U-Shaped)
                    <span className="text-sm text-muted-foreground block">
                      40% to first, 40% to last, 20% to middle touchpoints
                    </span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AttributionModel.CUSTOM} id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">
                    Custom Weights
                    <span className="text-sm text-muted-foreground block">
                      Define your own attribution weights
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {settings.defaultModel === AttributionModel.CUSTOM && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="text-sm font-medium mb-3">Custom Attribution Weights</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="first-weight" className="text-xs mb-1 block">
                        First Touch
                      </Label>
                      <Input 
                        id="first-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.customWeights?.first || 0}
                        onChange={(e) => handleCustomWeightChange('first', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="middle-weight" className="text-xs mb-1 block">
                        Middle Touches
                      </Label>
                      <Input 
                        id="middle-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.customWeights?.middle || 0}
                        onChange={(e) => handleCustomWeightChange('middle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last-weight" className="text-xs mb-1 block">
                        Last Touch
                      </Label>
                      <Input 
                        id="last-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.customWeights?.last || 0}
                        onChange={(e) => handleCustomWeightChange('last', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Note: Weights will be normalized to sum to 1.0 if they don't already
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="lookback-window">Attribution Lookback Window</Label>
                <span className="text-sm font-medium">{settings.lookbackWindow} days</span>
              </div>
              <Slider
                id="lookback-window"
                min={1}
                max={90}
                step={1}
                value={[settings.lookbackWindow]}
                onValueChange={handleLookbackChange}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Number of days to look back when attributing conversions to touchpoints
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 