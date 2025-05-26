"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Mail, MessageSquare } from "lucide-react";

interface ScenarioData {
  emailFrequency: number;
  audienceSize: number;
  personalization: boolean;
  sendTime: string;
  segmentation: boolean;
  abTesting: boolean;
  channel: string;
}

interface Metrics {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  roi: number;
  unsubscribeRate: number;
}

export function WhatIfAnalysis() {
  const [scenario, setScenario] = useState<ScenarioData>({
    emailFrequency: 2,
    audienceSize: 75,
    personalization: true,
    sendTime: "10am",
    segmentation: true,
    abTesting: false,
    channel: "email"
  });

  const [baselineMetrics] = useState<Metrics>({
    openRate: 22.5,
    clickRate: 3.2,
    conversionRate: 1.8,
    revenue: 485000,
    roi: 4.2,
    unsubscribeRate: 0.8
  });

  const [projectedMetrics, setProjectedMetrics] = useState<Metrics>(baselineMetrics);

  // Calculate impact based on scenario changes
  useEffect(() => {
    const calculateImpact = () => {
      let openRateMultiplier = 1;
      let clickRateMultiplier = 1;
      let conversionMultiplier = 1;
      let unsubscribeMultiplier = 1;

      // Email frequency impact
      if (scenario.emailFrequency > 3) {
        openRateMultiplier *= 0.85; // Fatigue effect
        unsubscribeMultiplier *= 1.4;
      } else if (scenario.emailFrequency < 2) {
        openRateMultiplier *= 0.95; // Lower engagement
      }

      // Personalization impact
      if (scenario.personalization) {
        openRateMultiplier *= 1.25;
        clickRateMultiplier *= 1.35;
        conversionMultiplier *= 1.15;
      }

      // Segmentation impact
      if (scenario.segmentation) {
        openRateMultiplier *= 1.18;
        clickRateMultiplier *= 1.22;
        conversionMultiplier *= 1.28;
      }

      // A/B Testing impact
      if (scenario.abTesting) {
        openRateMultiplier *= 1.12;
        clickRateMultiplier *= 1.15;
        conversionMultiplier *= 1.08;
      }

      // Send time impact
      const timeMultipliers: Record<string, number> = {
        "8am": 1.05,
        "10am": 1.15,
        "2pm": 1.08,
        "6pm": 1.12,
        "8pm": 0.92
      };
      openRateMultiplier *= timeMultipliers[scenario.sendTime] || 1;

      // Channel impact
      const channelMultipliers: Record<string, { open: number; click: number; conv: number }> = {
        email: { open: 1, click: 1, conv: 1 },
        sms: { open: 1.45, click: 0.85, conv: 1.12 },
        whatsapp: { open: 1.65, click: 1.25, conv: 1.35 }
      };
      const channelData = channelMultipliers[scenario.channel];
      openRateMultiplier *= channelData.open;
      clickRateMultiplier *= channelData.click;
      conversionMultiplier *= channelData.conv;

      // Audience size impact (smaller audiences = better targeting)
      const audienceSizeMultiplier = scenario.audienceSize > 80 ? 0.95 : scenario.audienceSize < 50 ? 1.15 : 1.05;
      conversionMultiplier *= audienceSizeMultiplier;

      const newMetrics: Metrics = {
        openRate: Math.min(baselineMetrics.openRate * openRateMultiplier, 65),
        clickRate: Math.min(baselineMetrics.clickRate * clickRateMultiplier, 15),
        conversionRate: Math.min(baselineMetrics.conversionRate * conversionMultiplier, 8),
        revenue: baselineMetrics.revenue * conversionMultiplier * (scenario.audienceSize / 75),
        roi: baselineMetrics.roi * conversionMultiplier * openRateMultiplier * 0.8,
        unsubscribeRate: Math.max(baselineMetrics.unsubscribeRate * unsubscribeMultiplier, 0.1)
      };

      setProjectedMetrics(newMetrics);
    };

    calculateImpact();
  }, [scenario, baselineMetrics]);

  const getImpact = (baseline: number, projected: number) => {
    const change = ((projected - baseline) / baseline) * 100;
    return {
      value: change,
      isPositive: change > 0,
      color: change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
    };
  };

  const chartData = [
    { metric: "Open Rate", baseline: baselineMetrics.openRate, projected: projectedMetrics.openRate },
    { metric: "Click Rate", baseline: baselineMetrics.clickRate, projected: projectedMetrics.clickRate },
    { metric: "Conversion Rate", baseline: baselineMetrics.conversionRate, projected: projectedMetrics.conversionRate },
    { metric: "ROI", baseline: baselineMetrics.roi, projected: projectedMetrics.roi }
  ];

  return (
    <div className="space-y-6">
      {/* Scenario Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scenario Parameters</CardTitle>
            <CardDescription>Adjust these settings to model different marketing scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Marketing Channel</Label>
              <Select value={scenario.channel} onValueChange={(value) => setScenario({...scenario, channel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Marketing
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Marketing
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp Marketing
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Campaign Frequency (per week): {scenario.emailFrequency}</Label>
              <Slider
                value={[scenario.emailFrequency]}
                onValueChange={(value) => setScenario({...scenario, emailFrequency: value[0]})}
                max={7}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Target Audience Size: {scenario.audienceSize}%</Label>
              <Slider
                value={[scenario.audienceSize]}
                onValueChange={(value) => setScenario({...scenario, audienceSize: value[0]})}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Optimal Send Time</Label>
              <Select value={scenario.sendTime} onValueChange={(value) => setScenario({...scenario, sendTime: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8am">8:00 AM</SelectItem>
                  <SelectItem value="10am">10:00 AM (Recommended)</SelectItem>
                  <SelectItem value="2pm">2:00 PM</SelectItem>
                  <SelectItem value="6pm">6:00 PM</SelectItem>
                  <SelectItem value="8pm">8:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="personalization">AI Personalization</Label>
                <Switch
                  id="personalization"
                  checked={scenario.personalization}
                  onCheckedChange={(checked) => setScenario({...scenario, personalization: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="segmentation">Smart Segmentation</Label>
                <Switch
                  id="segmentation"
                  checked={scenario.segmentation}
                  onCheckedChange={(checked) => setScenario({...scenario, segmentation: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="abtesting">A/B Testing</Label>
                <Switch
                  id="abtesting"
                  checked={scenario.abTesting}
                  onCheckedChange={(checked) => setScenario({...scenario, abTesting: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Impact Analysis</CardTitle>
            <CardDescription>Projected vs. current performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Open Rate", baseline: baselineMetrics.openRate, projected: projectedMetrics.openRate, suffix: "%" },
              { label: "Click Rate", baseline: baselineMetrics.clickRate, projected: projectedMetrics.clickRate, suffix: "%" },
              { label: "Conversion Rate", baseline: baselineMetrics.conversionRate, projected: projectedMetrics.conversionRate, suffix: "%" },
              { label: "Revenue", baseline: baselineMetrics.revenue, projected: projectedMetrics.revenue, prefix: "₦", suffix: "" },
              { label: "ROI", baseline: baselineMetrics.roi, projected: projectedMetrics.roi, suffix: "x" },
              { label: "Unsubscribe Rate", baseline: baselineMetrics.unsubscribeRate, projected: projectedMetrics.unsubscribeRate, suffix: "%" }
            ].map((metric) => {
              const impact = getImpact(metric.baseline, metric.projected);
              return (
                <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{metric.label}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Current: {metric.prefix}{metric.baseline.toLocaleString()}{metric.suffix}</span>
                      <span>→</span>
                      <span>Projected: {metric.prefix}{metric.projected.toLocaleString()}{metric.suffix}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {impact.isPositive ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    <Badge variant={impact.isPositive ? "default" : "destructive"} className={impact.color}>
                      {impact.value > 0 ? "+" : ""}{impact.value.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Comparison</CardTitle>
          <CardDescription>Visual comparison of baseline vs. projected metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}${name === "ROI" ? "x" : "%"}`,
                    name === "baseline" ? "Current" : "Projected"
                  ]}
                />
                <Bar dataKey="baseline" fill="#94a3b8" name="baseline" />
                <Bar dataKey="projected" fill="#3b82f6" name="projected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Optimizations to maximize your campaign performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scenario.personalization && scenario.segmentation ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Excellent! Using both personalization and segmentation can increase conversion rates by up to 40%.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Consider enabling both personalization and segmentation for optimal results.
                </p>
              </div>
            )}
            
            {scenario.emailFrequency > 4 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ High frequency may lead to subscriber fatigue. Consider reducing to 2-3 campaigns per week.
                </p>
              </div>
            )}

            {scenario.channel === "whatsapp" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 WhatsApp shows highest engagement rates for Nigerian audiences. Great choice!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 