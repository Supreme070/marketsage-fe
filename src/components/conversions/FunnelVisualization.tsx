"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BarChart3, ArrowDown, DollarSign, Users, Percent } from "lucide-react";

interface FunnelStage {
  eventId: string;
  name: string;
  count: number;
  dropOffRate?: number;
  conversionRate?: number;
  totalValue?: number;
}

interface FunnelData {
  name: string;
  totalEntries: number;
  totalConversions: number;
  conversionRate: number;
  totalValue: number;
  stages: FunnelStage[];
  startDate: Date;
  endDate: Date;
}

interface FunnelVisualizationProps {
  funnelId: string;
  startDate: Date;
  endDate: Date;
  initialData?: FunnelData;
}

export default function FunnelVisualization({
  funnelId,
  startDate,
  endDate,
  initialData
}: FunnelVisualizationProps) {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialData) {
      fetchFunnelData();
    }
  }, [funnelId, startDate, endDate, initialData]);

  const fetchFunnelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Either get the existing report or generate a new one
      const response = await fetch(`/api/conversion-funnels/reports?funnelId=${funnelId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch funnel reports");
      }
      
      const reports = await response.json();
      
      if (reports.length > 0) {
        // Use the most recent report
        const reportId = reports[0].id;
        const reportResponse = await fetch(`/api/conversion-funnels/reports?id=${reportId}`);
        
        if (!reportResponse.ok) {
          throw new Error("Failed to fetch report details");
        }
        
        const data = await reportResponse.json();
        setFunnelData(data);
      } else {
        // Generate a new report
        const generateResponse = await fetch("/api/conversion-funnels/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funnelId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        });
        
        if (!generateResponse.ok) {
          throw new Error("Failed to generate funnel report");
        }
        
        const data = await generateResponse.json();
        setFunnelData(data);
      }
    } catch (error) {
      console.error("Error fetching funnel data:", error);
      setError("Failed to load funnel data");
      toast.error("Failed to load funnel data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate the widths for the funnel visualization
  const calculateWidth = (stage: FunnelStage, index: number) => {
    if (!funnelData) return "100%";
    
    const firstStage = funnelData.stages[0];
    const firstCount = firstStage.count;
    
    if (firstCount === 0) return "0%";
    
    // Calculate percentage of the initial count
    const percentage = (stage.count / firstCount) * 100;
    
    // Minimum width of 10% to ensure visibility
    return `${Math.max(percentage, 10)}%`;
  };

  // Format a number as a percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format a number as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Visualization</CardTitle>
          <CardDescription>Loading funnel data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-pulse h-[300px] w-full bg-gray-200 rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Visualization</CardTitle>
          <CardDescription>Error loading funnel data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchFunnelData}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!funnelData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Visualization</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-gray-500">No funnel data is available for the selected time period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{funnelData.name} Funnel</CardTitle>
            <CardDescription>
              {new Date(funnelData.startDate).toLocaleDateString()} - {new Date(funnelData.endDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchFunnelData}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Funnel summary metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Users size={14} />
              <span>Total Entries</span>
            </div>
            <div className="text-2xl font-bold">{funnelData.totalEntries.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Users size={14} />
              <span>Conversions</span>
            </div>
            <div className="text-2xl font-bold">{funnelData.totalConversions.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Percent size={14} />
              <span>Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold">{formatPercent(funnelData.conversionRate)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign size={14} />
              <span>Total Value</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(funnelData.totalValue)}</div>
          </div>
        </div>

        {/* Funnel visualization */}
        <div className="mb-8" ref={chartRef}>
          {funnelData.stages.map((stage, index) => (
            <div key={stage.eventId} className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-medium">{stage.name}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{stage.count.toLocaleString()} users</span>
                  {stage.totalValue !== undefined && stage.totalValue > 0 && (
                    <span className="text-sm text-green-600">{formatCurrency(stage.totalValue)}</span>
                  )}
                  {index > 0 && stage.dropOffRate !== undefined && (
                    <span className="text-sm text-red-500">-{formatPercent(stage.dropOffRate)}</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-md h-16 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-md"
                  style={{ width: calculateWidth(stage, index) }}
                >
                  <div className="h-full w-full flex items-center justify-center text-white">
                    {stage.conversionRate !== undefined && formatPercent(stage.conversionRate)}
                  </div>
                </div>
              </div>
              
              {/* Arrow to next stage */}
              {index < funnelData.stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stage details table */}
        <Separator className="my-6" />
        <h3 className="font-medium mb-4">Stage Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Stage</th>
                <th className="text-right py-2 font-medium">Users</th>
                <th className="text-right py-2 font-medium">Drop-off</th>
                <th className="text-right py-2 font-medium">Conversion</th>
                <th className="text-right py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {funnelData.stages.map((stage, index) => (
                <tr key={stage.eventId} className="border-b">
                  <td className="py-2">{stage.name}</td>
                  <td className="text-right py-2">{stage.count.toLocaleString()}</td>
                  <td className="text-right py-2 text-red-500">
                    {index > 0 && stage.dropOffRate !== undefined
                      ? formatPercent(stage.dropOffRate)
                      : "—"}
                  </td>
                  <td className="text-right py-2">
                    {stage.conversionRate !== undefined ? formatPercent(stage.conversionRate) : "—"}
                  </td>
                  <td className="text-right py-2">
                    {stage.totalValue !== undefined ? formatCurrency(stage.totalValue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 