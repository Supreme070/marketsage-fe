'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

interface FormData {
  id: string;
  name: string;
  submissions: number;
  completions: number;
  abandonment: number;
  conversionRate: number;
  lastSubmission: string;
  status: 'active' | 'inactive';
  averageTime: number;
}

interface FormTrackerProps {
  isLoading?: boolean;
}

const FormTracker = React.memo<FormTrackerProps>(({ isLoading }) => {
  // Demo form data - in real implementation, this would come from MCP
  const [forms] = useState<FormData[]>([
    {
      id: '1',
      name: 'Contact Form',
      submissions: 45,
      completions: 38,
      abandonment: 7,
      conversionRate: 84.4,
      lastSubmission: '2 hours ago',
      status: 'active',
      averageTime: 145
    },
    {
      id: '2',
      name: 'Newsletter Signup',
      submissions: 123,
      completions: 118,
      abandonment: 5,
      conversionRate: 95.9,
      lastSubmission: '15 minutes ago',
      status: 'active',
      averageTime: 32
    },
    {
      id: '3',
      name: 'Demo Request',
      submissions: 28,
      completions: 19,
      abandonment: 9,
      conversionRate: 67.9,
      lastSubmission: '1 day ago',
      status: 'active',
      averageTime: 280
    },
    {
      id: '4',
      name: 'Feedback Form',
      submissions: 12,
      completions: 8,
      abandonment: 4,
      conversionRate: 66.7,
      lastSubmission: '3 days ago',
      status: 'inactive',
      averageTime: 195
    }
  ]);

  const summary = useMemo(() => {
    const totalSubmissions = forms.reduce((sum, form) => sum + form.submissions, 0);
    const totalCompletions = forms.reduce((sum, form) => sum + form.completions, 0);
    const totalAbandonment = forms.reduce((sum, form) => sum + form.abandonment, 0);
    const averageConversionRate = forms.reduce((sum, form) => sum + form.conversionRate, 0) / forms.length;
    const activeForms = forms.filter(form => form.status === 'active').length;
    
    return {
      totalSubmissions,
      totalCompletions,
      totalAbandonment,
      averageConversionRate: Math.round(averageConversionRate * 10) / 10,
      activeForms,
      abandonmentRate: Math.round((totalAbandonment / totalSubmissions) * 100)
    };
  }, [forms]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading form data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Form Tracking
        </CardTitle>
        <div className="text-sm text-gray-600 mt-1">
          {summary.activeForms} active forms • {summary.totalSubmissions} total submissions
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <div className="text-lg font-semibold">{summary.totalCompletions}</div>
            <div className="text-xs text-gray-500">Completions</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <div className="text-lg font-semibold">{summary.totalAbandonment}</div>
            <div className="text-xs text-gray-500">Abandonments</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <div className="text-lg font-semibold">{summary.averageConversionRate}%</div>
            <div className="text-xs text-gray-500">Avg Conversion</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <TrendingDown className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <div className="text-lg font-semibold">{summary.abandonmentRate}%</div>
            <div className="text-xs text-gray-500">Abandonment Rate</div>
          </div>
        </div>

        {/* Form List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Form Performance</h4>
          <div className="space-y-2">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">{form.name}</div>
                    <div className="text-xs text-gray-500">
                      Last: {form.lastSubmission} • Avg: {Math.floor(form.averageTime / 60)}m {form.averageTime % 60}s
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{form.conversionRate}%</div>
                    <div className="text-xs text-gray-500">{form.completions}/{form.submissions}</div>
                  </div>
                  <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                    {form.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Rate Visualization */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Conversion Rates</h4>
          {forms.map((form) => (
            <div key={form.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{form.name}</span>
                <span className="font-medium">{form.conversionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    form.conversionRate >= 80 ? 'bg-green-500' :
                    form.conversionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${form.conversionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {summary.averageConversionRate > 80 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Excellent form performance overall</span>
              </div>
            )}
            {summary.abandonmentRate > 20 && (
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>High abandonment rate needs attention</span>
              </div>
            )}
            {forms.some(form => form.conversionRate < 70) && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                <span>Some forms need optimization</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FormTracker.displayName = 'FormTracker';

export { FormTracker };
export default FormTracker;