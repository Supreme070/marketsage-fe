"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function SendTimePredictionDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimal Send Time Prediction</CardTitle>
          <CardDescription>
            Predict the best days and times to send messages to maximize engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-purple-500 mb-3" />
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              The Optimal Send Time Prediction dashboard is currently under development. 
              It will analyze your contacts' historical engagement patterns to predict
              the best times to send messages for maximum engagement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 