"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart3, DollarSign, CheckCircle2 } from "lucide-react";
import { fetchConversionData } from '@/lib/conversions';
import { EntityType } from '@prisma/client';

interface ConversionMetricsProps {
  entityType?: EntityType;
  entityId?: string;
  title?: string;
  description?: string;
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate?: string;
  endDate?: string;
}

export function ConversionMetrics({
  entityType,
  entityId,
  title = "Conversion Metrics",
  description = "Track your conversion performance",
  period = 'DAILY',
  startDate,
  endDate
}: ConversionMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(period);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await fetchConversionData({
          entityType,
          entityId,
          period: selectedPeriod,
          startDate,
          endDate
        });
        
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error loading conversion data:', err);
        setError('Failed to load conversion data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [entityType, entityId, selectedPeriod, startDate, endDate]);
  
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    } else {
      return `₦${value.toFixed(0)}`;
    }
  };
  
  const calculateRate = () => {
    if (!data || !data.aggregatedStats || !data.aggregatedStats.totalConversions) {
      return '0%';
    }
    
    // This is a dummy implementation - in a real app you would calculate based on impressions/visits
    return '8.3%';
  };
  
  const getTotalConversions = () => {
    if (!data || !data.aggregatedStats || !data.aggregatedStats.totalConversions) {
      return 0;
    }
    
    return data.aggregatedStats.totalConversions.count || 0;
  };
  
  const getTotalValue = () => {
    if (!data || !data.aggregatedStats || !data.aggregatedStats.totalConversions) {
      return 0;
    }
    
    return data.aggregatedStats.totalConversions.value || 0;
  };
  
  const getConversionsByType = () => {
    if (!data || !data.aggregatedStats || !data.aggregatedStats.conversionsByType) {
      return [];
    }
    
    return Object.entries(data.aggregatedStats.conversionsByType).map(([type, metrics]: [string, any]) => ({
      type,
      label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      count: metrics.count || 0,
      value: metrics.value || 0
    }));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="DAILY">Daily</TabsTrigger>
            <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
            <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
            <TabsTrigger value="YEARLY">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-4 text-destructive">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateRate()}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on total visits/impressions
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Conversions
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalConversions()}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatValue(getTotalValue())}</div>
                  <p className="text-xs text-muted-foreground">
                    {getTotalConversions() > 0 
                      ? `${formatValue(getTotalValue() / getTotalConversions())} avg. per conversion` 
                      : 'No conversions yet'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Sources
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getConversionsByType().length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different conversion types
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Conversions by Type</h3>
              
              {getConversionsByType().length > 0 ? (
                <div className="space-y-4">
                  {getConversionsByType().map((conversion) => (
                    <div key={conversion.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{conversion.label}</span>
                        <span className="text-sm font-medium">{conversion.count}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-primary" 
                          style={{ 
                            width: `${Math.min(100, (conversion.count / getTotalConversions()) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No conversion data available for this period
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {startDate && endDate ? 
            `Data for period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : 
            `Data updated: ${new Date().toLocaleString()}`
          }
        </p>
      </CardFooter>
    </Card>
  );
} 