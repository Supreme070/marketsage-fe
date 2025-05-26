"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatIfAnalysis } from "./what-if-analysis";
import { PredictiveForecasting } from "./predictive-forecasting";
import { AutomatedReports } from "./automated-reports";
import { BarChart3, TrendingUp, FileText, Brain } from "lucide-react";

export function DecisionSupportDashboard() {
  const [activeTab, setActiveTab] = useState("what-if");

  return (
    <div className="w-full space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Campaign Performance
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              vs. last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2.4M</div>
            <p className="text-xs text-muted-foreground">
              +18.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audience Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+847</div>
            <p className="text-xs text-muted-foreground">
              new contacts this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Insights
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              actionable recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="what-if" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            What-If Analysis
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictive Forecasting
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Automated Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="what-if" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>What-If Analysis</CardTitle>
              <CardDescription>
                Model different scenarios and instantly see their impact on your marketing performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatIfAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Forecasting</CardTitle>
              <CardDescription>
                AI-driven predictions for engagement, growth, and revenue over customizable timeframes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictiveForecasting />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Reports</CardTitle>
              <CardDescription>
                Comprehensive reports on performance, audience behavior, and content effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomatedReports />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 