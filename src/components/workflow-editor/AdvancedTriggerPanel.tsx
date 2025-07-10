"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  Zap,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Clock,
  Calendar,
  Globe,
  CreditCard,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { type AdvancedTriggerCondition, type AdvancedTriggerType } from "@/lib/workflow/advanced-trigger-engine";

interface AdvancedTriggerPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  workflowId?: string;
  contactId?: string;
}

// Trigger type configurations
const TRIGGER_TYPES = {
  behavioral_score_threshold: {
    icon: Brain,
    name: "Behavioral Score Threshold",
    description: "Trigger when customer behavioral score exceeds threshold",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    defaultParams: { score_threshold: 0.7, time_window_days: 7 }
  },
  engagement_drop_detection: {
    icon: TrendingDown,
    name: "Engagement Drop Detection", 
    description: "Trigger when engagement drops significantly",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    defaultParams: { drop_percentage: 0.3, compare_window_days: 14 }
  },
  churn_risk_alert: {
    icon: AlertTriangle,
    name: "Churn Risk Alert",
    description: "Trigger when churn risk exceeds threshold", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    defaultParams: { risk_threshold: 0.6 }
  },
  purchase_intent_spike: {
    icon: ShoppingCart,
    name: "Purchase Intent Spike",
    description: "Trigger when purchase intent signals increase",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", 
    defaultParams: { intent_threshold: 0.7 }
  },
  optimal_engagement_window: {
    icon: Clock,
    name: "Optimal Engagement Window",
    description: "Trigger during optimal engagement time",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    defaultParams: {}
  },
  seasonal_behavior_pattern: {
    icon: Calendar,
    name: "Seasonal Behavior Pattern", 
    description: "Trigger based on seasonal patterns",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    defaultParams: { seasonal_threshold: 0.6 }
  },
  cultural_event_timing: {
    icon: Globe,
    name: "Cultural Event Timing",
    description: "Trigger around cultural events in African markets",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    defaultParams: { min_importance: 0.7 }
  },
  payment_behavior_change: {
    icon: CreditCard,
    name: "Payment Behavior Change",
    description: "Trigger when payment patterns change",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    defaultParams: {}
  }
};

const AFRICAN_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'EG', name: 'Egypt' }
];

export default function AdvancedTriggerPanel({
  isOpen = false,
  onOpenChange,
  workflowId,
  contactId
}: AdvancedTriggerPanelProps) {
  const [conditions, setConditions] = useState<AdvancedTriggerCondition[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<any>(null);

  // Add a new trigger condition
  const addCondition = (type: AdvancedTriggerType) => {
    const config = TRIGGER_TYPES[type];
    const newCondition: AdvancedTriggerCondition = {
      id: `condition-${Date.now()}`,
      type,
      enabled: true,
      confidence_threshold: 0.7,
      parameters: { ...config.defaultParams },
      african_market_context: {
        countries: ['NG'],
        cultural_factors: ['business_hours', 'seasonal_patterns'],
        local_timing_preferences: true
      }
    };

    setConditions([...conditions, newCondition]);
  };

  // Update a condition
  const updateCondition = (id: string, updates: Partial<AdvancedTriggerCondition>) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  // Remove a condition
  const removeCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id));
  };

  // Evaluate triggers
  const evaluateTriggers = async () => {
    if (!workflowId || !contactId) {
      toast.error("Missing workflow ID or contact ID");
      return;
    }

    if (conditions.length === 0) {
      toast.error("Add at least one trigger condition");
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/workflows/advanced-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          workflowId,
          contactId,
          triggerConditions: conditions.filter(c => c.enabled)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate triggers');
      }

      const data = await response.json();
      setLastEvaluation(data.evaluation);
      
      toast.success(`Evaluation complete: ${data.evaluation.shouldTrigger ? 'Conditions met!' : 'Conditions not met'}`, {
        description: `Confidence: ${(data.evaluation.confidence * 100).toFixed(1)}%`
      });

    } catch (error) {
      console.error('Trigger evaluation failed:', error);
      toast.error('Failed to evaluate triggers');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Trigger workflow if conditions are met
  const triggerWorkflow = async () => {
    if (!workflowId || !contactId) {
      toast.error("Missing workflow ID or contact ID");
      return;
    }

    if (conditions.length === 0) {
      toast.error("Add at least one trigger condition");
      return;
    }

    setIsTriggering(true);
    try {
      const response = await fetch('/api/workflows/advanced-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_if_conditions_met',
          workflowId,
          contactId,
          triggerConditions: conditions.filter(c => c.enabled)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger workflow');
      }

      const data = await response.json();
      setLastEvaluation(data.evaluation);

      if (data.triggered) {
        toast.success('Workflow triggered successfully!', {
          description: `Execution ID: ${data.executionId}`
        });
      } else {
        toast.info('Conditions not met, workflow not triggered', {
          description: `Confidence: ${(data.evaluation.confidence * 100).toFixed(1)}%`
        });
      }

    } catch (error) {
      console.error('Workflow trigger failed:', error);
      toast.error('Failed to trigger workflow');
    } finally {
      setIsTriggering(false);
    }
  };

  // Render parameter controls for a condition
  const renderParameterControls = (condition: AdvancedTriggerCondition) => {
    const config = TRIGGER_TYPES[condition.type];
    const params = condition.parameters;

    return (
      <div className="space-y-4">
        {/* Score/threshold parameters */}
        {params.hasOwnProperty('score_threshold') && (
          <div className="space-y-2">
            <Label>Score Threshold: {params.score_threshold}</Label>
            <Slider
              value={[params.score_threshold]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, score_threshold: value }
                })
              }
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {params.hasOwnProperty('drop_percentage') && (
          <div className="space-y-2">
            <Label>Drop Threshold: {(params.drop_percentage * 100).toFixed(0)}%</Label>
            <Slider
              value={[params.drop_percentage]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, drop_percentage: value }
                })
              }
              min={0.1}
              max={0.8}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {params.hasOwnProperty('risk_threshold') && (
          <div className="space-y-2">
            <Label>Risk Threshold: {(params.risk_threshold * 100).toFixed(0)}%</Label>
            <Slider
              value={[params.risk_threshold]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, risk_threshold: value }
                })
              }
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {params.hasOwnProperty('intent_threshold') && (
          <div className="space-y-2">
            <Label>Intent Threshold: {(params.intent_threshold * 100).toFixed(0)}%</Label>
            <Slider
              value={[params.intent_threshold]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, intent_threshold: value }
                })
              }
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Time window parameters */}
        {params.hasOwnProperty('time_window_days') && (
          <div className="space-y-2">
            <Label>Time Window (days)</Label>
            <Input
              type="number"
              value={params.time_window_days}
              onChange={(e) => 
                updateCondition(condition.id, {
                  parameters: { ...params, time_window_days: parseInt(e.target.value) || 7 }
                })
              }
              min={1}
              max={30}
            />
          </div>
        )}

        {params.hasOwnProperty('compare_window_days') && (
          <div className="space-y-2">
            <Label>Compare Window (days)</Label>
            <Input
              type="number"
              value={params.compare_window_days}
              onChange={(e) => 
                updateCondition(condition.id, {
                  parameters: { ...params, compare_window_days: parseInt(e.target.value) || 14 }
                })
              }
              min={1}
              max={60}
            />
          </div>
        )}

        {params.hasOwnProperty('min_importance') && (
          <div className="space-y-2">
            <Label>Minimum Event Importance: {(params.min_importance * 100).toFixed(0)}%</Label>
            <Slider
              value={[params.min_importance]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, min_importance: value }
                })
              }
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {params.hasOwnProperty('seasonal_threshold') && (
          <div className="space-y-2">
            <Label>Seasonal Threshold: {(params.seasonal_threshold * 100).toFixed(0)}%</Label>
            <Slider
              value={[params.seasonal_threshold]}
              onValueChange={([value]) => 
                updateCondition(condition.id, {
                  parameters: { ...params, seasonal_threshold: value }
                })
              }
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Advanced ML Triggers
          </SheetTitle>
          <SheetDescription>
            Configure intelligent, AI-powered workflow triggers with African market context
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Add New Trigger */}
          <div className="px-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Trigger Condition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TRIGGER_TYPES).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => addCondition(type as AdvancedTriggerType)}
                        className="justify-start gap-2 h-auto p-3"
                      >
                        <Icon className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium text-xs">{config.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {config.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configured Conditions */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Configured Conditions ({conditions.length})
              </h3>
              {conditions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={evaluateTriggers}
                    disabled={isEvaluating || conditions.filter(c => c.enabled).length === 0}
                  >
                    {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                    Evaluate
                  </Button>
                  <Button
                    size="sm"
                    onClick={triggerWorkflow}
                    disabled={isTriggering || conditions.filter(c => c.enabled).length === 0}
                  >
                    {isTriggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Trigger
                  </Button>
                </div>
              )}
            </div>

            {conditions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No conditions configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add trigger conditions above to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {conditions.map((condition) => {
                  const config = TRIGGER_TYPES[condition.type];
                  const Icon = config.icon;
                  
                  return (
                    <AccordionItem 
                      key={condition.id} 
                      value={condition.id}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <div className={`p-2 rounded-full ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Confidence: {(condition.confidence_threshold * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={condition.enabled}
                              onCheckedChange={(enabled) => 
                                updateCondition(condition.id, { enabled })
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCondition(condition.id);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {/* Description */}
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>

                          {/* General Settings */}
                          <div className="space-y-2">
                            <Label>Confidence Threshold: {(condition.confidence_threshold * 100).toFixed(0)}%</Label>
                            <Slider
                              value={[condition.confidence_threshold]}
                              onValueChange={([value]) => 
                                updateCondition(condition.id, { confidence_threshold: value })
                              }
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              className="w-full"
                            />
                          </div>

                          {/* Type-specific Parameters */}
                          {renderParameterControls(condition)}

                          {/* African Market Context */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">African Market Context</Label>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Target Countries</Label>
                              <div className="flex flex-wrap gap-2">
                                {AFRICAN_COUNTRIES.map((country) => (
                                  <Badge
                                    key={country.code}
                                    variant={
                                      condition.african_market_context?.countries?.includes(country.code)
                                        ? "default"
                                        : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const currentCountries = condition.african_market_context?.countries || [];
                                      const newCountries = currentCountries.includes(country.code)
                                        ? currentCountries.filter(c => c !== country.code)
                                        : [...currentCountries, country.code];
                                      
                                      updateCondition(condition.id, {
                                        african_market_context: {
                                          ...condition.african_market_context,
                                          countries: newCountries
                                        }
                                      });
                                    }}
                                  >
                                    {country.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`local-timing-${condition.id}`}
                                checked={condition.african_market_context?.local_timing_preferences || false}
                                onCheckedChange={(checked) =>
                                  updateCondition(condition.id, {
                                    african_market_context: {
                                      ...condition.african_market_context,
                                      local_timing_preferences: checked
                                    }
                                  })
                                }
                              />
                              <Label htmlFor={`local-timing-${condition.id}`} className="text-xs">
                                Use local timing preferences
                              </Label>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {/* Last Evaluation Results */}
          {lastEvaluation && (
            <div className="px-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {lastEvaluation.shouldTrigger ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Last Evaluation Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Should Trigger:</span>
                    <Badge variant={lastEvaluation.shouldTrigger ? "default" : "secondary"}>
                      {lastEvaluation.shouldTrigger ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence:</span>
                    <Badge variant="outline">
                      {(lastEvaluation.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Reasoning:</span>
                    <p className="text-xs text-muted-foreground">
                      {lastEvaluation.reasoning}
                    </p>
                  </div>

                  {lastEvaluation.african_context && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">African Market Context:</span>
                      <div className="text-xs space-y-1">
                        <div>Optimal Timing: {new Date(lastEvaluation.african_context.optimal_timing).toLocaleString()}</div>
                        <div>Cultural Relevance: {(lastEvaluation.african_context.cultural_relevance * 100).toFixed(0)}%</div>
                        {lastEvaluation.african_context.local_market_factors?.length > 0 && (
                          <div>Market Factors: {lastEvaluation.african_context.local_market_factors.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}