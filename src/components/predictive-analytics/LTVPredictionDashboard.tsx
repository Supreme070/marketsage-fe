"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function LTVPredictionDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lifetime Value Prediction</CardTitle>
          <CardDescription>
            Predict the future value of your contacts over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              The Lifetime Value Prediction dashboard is currently under development. 
              It will provide AI-powered predictions for the future monetary value of your contacts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 