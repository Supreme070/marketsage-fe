const fs = require('fs');
const path = require('path');

// Paths
const dashboardPath = 'src/app/dashboard/predictive-analytics';
const routeGroupPath = 'src/app/(dashboard)/dashboard/predictive-analytics';
const pageFileName = 'page.tsx';

// The content we want to keep
const pageContent = `"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import ChurnPredictionDashboard from "@/components/predictive-analytics/ChurnPredictionDashboard";
import LTVPredictionDashboard from "@/components/predictive-analytics/LTVPredictionDashboard";
import CampaignPredictionDashboard from "@/components/predictive-analytics/CampaignPredictionDashboard";
import SendTimePredictionDashboard from "@/components/predictive-analytics/SendTimePredictionDashboard";
import { BarChart2, DollarSign, Clock, Users } from "lucide-react";

export default function PredictiveAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("churn");

  return (
    <DashboardShell className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics</h1>
        <p className="text-muted-foreground">
          Leverage AI to predict customer behavior and optimize campaigns
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Churn Risk
              </CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.4%</div>
              <p className="text-xs text-muted-foreground">
                Average churn risk across all contacts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Predicted LTV
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$254.82</div>
              <p className="text-xs text-muted-foreground">
                Average customer lifetime value (12 months)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Campaign Performance
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">21.6%</div>
              <p className="text-xs text-muted-foreground">
                Average predicted open rate for campaigns
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Optimal Send Times
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+32%</div>
              <p className="text-xs text-muted-foreground">
                Engagement increase with optimized timing
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
            <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
            <TabsTrigger value="campaign">Campaign Performance</TabsTrigger>
            <TabsTrigger value="sendtime">Optimal Send Times</TabsTrigger>
          </TabsList>
          <TabsContent value="churn" className="mt-6">
            <ChurnPredictionDashboard />
          </TabsContent>
          <TabsContent value="ltv" className="mt-6">
            <LTVPredictionDashboard />
          </TabsContent>
          <TabsContent value="campaign" className="mt-6">
            <CampaignPredictionDashboard />
          </TabsContent>
          <TabsContent value="sendtime" className="mt-6">
            <SendTimePredictionDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}`;

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to remove a directory
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing directory: ${dirPath}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Step 1: Remove both directories to ensure clean slate
console.log('Step 1: Removing existing directories...');
removeDirectory(dashboardPath);
removeDirectory(routeGroupPath);

// Step 2: Create the route group directory and save the file there
console.log('Step 2: Creating route group directory and saving file...');
ensureDirectoryExists(routeGroupPath);
fs.writeFileSync(path.join(routeGroupPath, pageFileName), pageContent);

// Verify
console.log('\nVerification:');
console.log(`Route group file exists: ${fs.existsSync(path.join(routeGroupPath, pageFileName))}`);
console.log(`Dashboard path exists: ${fs.existsSync(dashboardPath)}`);

console.log('\nDone! The routing conflict should be resolved.'); 