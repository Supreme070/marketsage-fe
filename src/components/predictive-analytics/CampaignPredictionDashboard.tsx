"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function CampaignPredictionDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Prediction</CardTitle>
          <CardDescription>
            Predict open rates, click rates, and conversion metrics for your campaigns before sending
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart2 className="h-12 w-12 text-blue-500 mb-3" />
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              The Campaign Performance Prediction dashboard is currently under development. 
              It will provide AI-powered forecasts for your marketing campaigns to help you optimize 
              before sending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 