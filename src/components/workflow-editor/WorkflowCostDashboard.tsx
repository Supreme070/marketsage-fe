'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  Phone,
  Webhook,
  Calendar,
  Target
} from 'lucide-react';

interface CostSummary {
  totalCost: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  breakdown: {
    email: number;
    sms: number;
    whatsapp: number;
    apiCalls: number;
  };
  topExpenses: Array<{
    type: string;
    cost: number;
    percentage: number;
  }>;
}

interface CostProjection {
  projectedCost: number;
  projectionPeriod: string;
  confidence: number;
  trends: {
    increasing: boolean;
    changePercent: number;
  };
}

interface BudgetStatus {
  budgetAmount: number;
  currentSpend: number;
  currency: string;
  period: string;
  warningThreshold: number;
  criticalThreshold: number;
  utilizationPercent: number;
  remainingBudget: number;
  daysRemaining: number;
  isExceeded: boolean;
}

interface CostAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

interface WorkflowCostDashboardProps {
  workflowId: string;
}

export default function WorkflowCostDashboard({ workflowId }: WorkflowCostDashboardProps) {
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCostData();
  }, [workflowId]);

  const loadCostData = async () => {
    try {
      setLoading(true);
      
      // Load cost summary
      const summaryResponse = await fetch(`/api/workflows/${workflowId}/costs?action=summary`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setCostSummary(summaryData.data);
      }

      // Load cost projection
      const projectionResponse = await fetch(`/api/workflows/${workflowId}/costs?action=projection&period=MONTHLY`);
      if (projectionResponse.ok) {
        const projectionData = await projectionResponse.json();
        setProjection(projectionData.data);
      }

      // Load budget status
      const budgetResponse = await fetch(`/api/workflows/${workflowId}/budget`);
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        setBudgetStatus(budgetData.data);
      }

      // Load cost alerts
      const alertsResponse = await fetch(`/api/workflows/cost-alerts?workflowId=${workflowId}&resolved=false`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data);
      }

    } catch (err) {
      setError('Failed to load cost data');
      console.error('Cost dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getBudgetStatusColor = (utilizationPercent: number, isExceeded: boolean) => {
    if (isExceeded) return 'bg-red-500';
    if (utilizationPercent >= 90) return 'bg-red-400';
    if (utilizationPercent >= 75) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costSummary ? formatCurrency(costSummary.totalCost, costSummary.currency) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projection ? formatCurrency(projection.projectedCost) : '--'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {projection && (
                <>
                  <span className={`mr-1 ${projection.trends.increasing ? 'text-red-500' : 'text-green-500'}`}>
                    {projection.trends.increasing ? '↗' : '↙'} {Math.abs(projection.trends.changePercent)}%
                  </span>
                  vs last period
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetStatus ? `${budgetStatus.utilizationPercent}%` : '--'}
            </div>
            {budgetStatus && (
              <Progress 
                value={budgetStatus.utilizationPercent} 
                className="mt-2"
                indicatorClassName={getBudgetStatusColor(budgetStatus.utilizationPercent, budgetStatus.isExceeded)}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {budgetStatus ? formatCurrency(budgetStatus.remainingBudget, budgetStatus.currency) : '--'} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="flex gap-1 mt-1">
              {alerts.slice(0, 3).map(alert => (
                <Badge 
                  key={alert.id} 
                  variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="budget">Budget Management</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Costs</CardTitle>
                <Mail className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {costSummary ? formatCurrency(costSummary.breakdown.email, costSummary.currency) : '--'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SMS Costs</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {costSummary ? formatCurrency(costSummary.breakdown.sms, costSummary.currency) : '--'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WhatsApp Costs</CardTitle>
                <Phone className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {costSummary ? formatCurrency(costSummary.breakdown.whatsapp, costSummary.currency) : '--'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Costs</CardTitle>
                <Webhook className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {costSummary ? formatCurrency(costSummary.breakdown.apiCalls, costSummary.currency) : '--'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          {budgetStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Budget Status</CardTitle>
                <CardDescription>
                  {budgetStatus.period} budget: {formatCurrency(budgetStatus.budgetAmount, budgetStatus.currency)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Spend</span>
                    <span className="font-medium">{formatCurrency(budgetStatus.currentSpend, budgetStatus.currency)}</span>
                  </div>
                  <Progress 
                    value={budgetStatus.utilizationPercent} 
                    className="h-3"
                    indicatorClassName={getBudgetStatusColor(budgetStatus.utilizationPercent, budgetStatus.isExceeded)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Warning: {budgetStatus.warningThreshold}%</span>
                    <span>Critical: {budgetStatus.criticalThreshold}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {budgetStatus.isExceeded && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Budget exceeded! Current spend is {budgetStatus.utilizationPercent}% of allocated budget.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Remaining Budget</span>
                    <div className="font-medium">{formatCurrency(budgetStatus.remainingBudget, budgetStatus.currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days Remaining</span>
                    <div className="font-medium">{budgetStatus.daysRemaining} days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Budget Set</CardTitle>
                <CardDescription>Create a budget to track spending limits for this workflow.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Create Budget</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map(alert => (
                <Alert key={alert.id}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-6">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Active Alerts</h3>
                <p className="text-sm text-muted-foreground">All cost thresholds are within normal ranges.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}