import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSupremeAIMetrics } from '@/hooks/useSupremeAI';
import { Cpu, Clock, CheckCircle2, Database } from 'lucide-react';

export default function SupremeOverview() {
  const metrics = useSupremeAIMetrics();

  const kpis = [
    {
      label: 'Total Requests',
      value: metrics.totalRequests.toLocaleString(),
      icon: <Cpu className="h-6 w-6 text-blue-500" />
    },
    {
      label: 'Avg Response',
      value: `${Math.round(metrics.averageResponseTime)}ms`,
      icon: <Clock className="h-6 w-6 text-green-500" />
    },
    {
      label: 'Success Rate',
      value: `${Math.round(metrics.successRate * 100)}%`,
      icon: <CheckCircle2 className="h-6 w-6 text-purple-500" />
    },
    {
      label: 'Cache Hit Rate',
      value: `${Math.round(metrics.cacheHitRate * 100)}%`,
      icon: <Database className="h-6 w-6 text-orange-500" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="bg-card/50 border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
            {kpi.icon}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 