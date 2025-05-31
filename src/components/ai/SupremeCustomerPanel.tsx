import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Activity } from 'lucide-react';
import { useCustomerIntelligence } from '@/hooks/useSupremeAI';

export default function SupremeCustomerPanel({ userId }: { userId: string }) {
  const { analyze, loading, segments, averageChurnRisk } = useCustomerIntelligence(userId);

  const handleAnalyze = async () => {
    await analyze([]); // When integrated, pass real customer data or keep empty to trigger demo inside hook
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Customer Intelligence
        </CardTitle>
        <CardDescription>AI-powered customer segmentation and churn analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? <Activity className="h-4 w-4 animate-spin mr-2" /> : null}
          Analyze Customers
        </Button>

        {segments.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{segments.length}</div>
                  <div className="text-sm text-muted-foreground">Segments</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {segments.filter((s: any) => s.segment === 'VIP Champions').length}
                  </div>
                  <div className="text-sm text-muted-foreground">VIP Champions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {segments.filter((s: any) => s.segment === 'At Risk').length}
                  </div>
                  <div className="text-sm text-muted-foreground">At Risk</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segments.map((seg: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{seg.customerId}</span>
                      <Badge>{seg.segment}</Badge>
                    </div>
                    <div className="text-right text-sm">
                      <div>Churn: {Math.round(seg.churnProbability)}%</div>
                      <div>LTV: ₦{Math.round(seg.lifetimeValue)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Churn Risk</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-orange-600">{Math.round(averageChurnRisk)}%</div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 