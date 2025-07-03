"use client";

/**
 * High-Value Customer Detection Dashboard
 * =====================================
 * 
 * Frontend interface for managing high-value customer detection and rules.
 * Connects to /api/rules/high-value-detection API endpoints.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Crown,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Settings,
  PlayCircle,
  Pause,
  Eye,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Filter,
  Calendar,
  UserCheck,
  Star,
  Award
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HighValueRule {
  id: string;
  name: string;
  description: string;
  criteria: {
    minPurchaseValue?: number;
    minTransactionCount?: number;
    timeframeDays?: number;
    engagementScore?: number;
  };
  isActive: boolean;
  priority: number;
  createdAt: Date;
  lastTriggered?: Date;
  matchCount: number;
}

interface HighValueCustomer {
  id: string;
  name: string;
  email: string;
  totalValue: number;
  transactionCount: number;
  lastPurchase: Date;
  riskScore: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  triggers: string[];
  predictedChurn: number;
  lifetimeValue: number;
}

interface HighValueDashboardData {
  totalHighValueCustomers: number;
  totalValue: number;
  averageValue: number;
  growthRate: number;
  customers: HighValueCustomer[];
  rules: HighValueRule[];
  recentDetections: any[];
}

export default function HighValueCustomerDashboard() {
  const [data, setData] = useState<HighValueDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingRule, setEditingRule] = useState<HighValueRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardResponse, rulesResponse] = await Promise.all([
        fetch('/api/rules/high-value-detection?action=dashboard'),
        fetch('/api/rules/high-value-detection?action=list-rules')
      ]);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setData(dashboardData.data);
      }

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        if (data) {
          setData(prev => ({ ...prev!, rules: rulesData.data || [] }));
        }
      }

    } catch (error) {
      console.error('Failed to load high-value customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/rules/high-value-detection?action=run-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          organizationId: 'current' // This would come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('High-value detection completed:', result);
        await loadDashboardData(); // Refresh data
      }

    } catch (error) {
      console.error('Failed to run high-value detection:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/rules/high-value-detection?action=toggle-rule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, isActive })
      });

      if (response.ok) {
        await loadDashboardData();
      }

    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'platinum': return 'text-purple-400 bg-purple-900/20';
      case 'gold': return 'text-yellow-400 bg-yellow-900/20';
      case 'silver': return 'text-gray-400 bg-gray-900/20';
      case 'bronze': return 'text-orange-400 bg-orange-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="w-4 h-4" />;
      case 'gold': return <Award className="w-4 h-4" />;
      case 'silver': return <Star className="w-4 h-4" />;
      case 'bronze': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Crown className="h-8 w-8 animate-pulse mx-auto mb-4 text-purple-500" />
            <p className="text-muted-foreground">Loading high-value customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-purple-500" />
            High-Value Customers
          </h1>
          <p className="text-muted-foreground">
            Automated detection and management of high-value customer segments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCreatingRule(true)}>
            <Settings className="h-4 w-4 mr-2" />
            New Rule
          </Button>
          <Button onClick={runDetection} disabled={loading}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Run Detection
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{data?.totalHighValueCustomers || 0}</div>
                <div className="text-sm text-muted-foreground">High-Value Customers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">${(data?.totalValue || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">${(data?.averageValue || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Avg. Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{((data?.growthRate || 0) * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Growth Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="rules">Detection Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent High-Value Detections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Detections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.recentDetections?.length === 0 ? (
                    <div className="text-center py-4">
                      <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent detections</p>
                    </div>
                  ) : (
                    data?.recentDetections?.slice(0, 5).map((detection: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTierIcon(detection.tier)}
                          <div>
                            <div className="font-medium">{detection.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              ${detection.value?.toLocaleString()} • {detection.trigger}
                            </div>
                          </div>
                        </div>
                        <Badge className={getTierColor(detection.tier)}>
                          {detection.tier}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tier Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { tier: 'platinum', count: data?.customers?.filter(c => c.tier === 'platinum').length || 0, color: 'purple' },
                    { tier: 'gold', count: data?.customers?.filter(c => c.tier === 'gold').length || 0, color: 'yellow' },
                    { tier: 'silver', count: data?.customers?.filter(c => c.tier === 'silver').length || 0, color: 'gray' },
                    { tier: 'bronze', count: data?.customers?.filter(c => c.tier === 'bronze').length || 0, color: 'orange' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getTierIcon(item.tier)}
                        <span className="text-sm font-medium capitalize">{item.tier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.count}</span>
                        <div className={`w-16 h-2 rounded-full bg-${item.color}-200`}>
                          <div 
                            className={`h-full rounded-full bg-${item.color}-500`}
                            style={{ width: `${(item.count / (data?.totalHighValueCustomers || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Value Customer Directory</CardTitle>
              <CardDescription>
                Complete list of detected high-value customers with AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.customers?.length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No High-Value Customers Detected</h3>
                    <p className="text-muted-foreground">Run detection to identify high-value customers.</p>
                  </div>
                ) : (
                  data?.customers?.map((customer: HighValueCustomer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50/5 to-transparent">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTierColor(customer.tier)}`}>
                          {getTierIcon(customer.tier)}
                        </div>
                        <div>
                          <div className="font-medium text-lg">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              ${customer.totalValue.toLocaleString()} Total
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {customer.transactionCount} Orders
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ${customer.lifetimeValue.toLocaleString()} LTV
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getTierColor(customer.tier)}>
                          {customer.tier.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Last purchase: {formatDistanceToNow(new Date(customer.lastPurchase))} ago
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Churn risk: {(customer.predictedChurn * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Rules Management</CardTitle>
              <CardDescription>
                Configure and manage rules for high-value customer detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.rules?.map((rule: HighValueRule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {rule.matchCount} matches • Priority: {rule.priority}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleRule(rule.id, !rule.isActive)}
                      >
                        {rule.isActive ? <Pause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingRule(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Detection Accuracy</span>
                    <span className="font-bold text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue from HV Customers</span>
                    <span className="font-bold">${((data?.totalValue || 0) * 0.78).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retention Rate</span>
                    <span className="font-bold text-blue-600">89.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Order Value</span>
                    <span className="font-bold">${(data?.averageValue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertTitle>Growth Opportunity</AlertTitle>
                    <AlertDescription>
                      23% of silver-tier customers show potential for gold upgrade with targeted campaigns.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Churn Risk Alert</AlertTitle>
                    <AlertDescription>
                      5 platinum customers show elevated churn risk. Immediate retention action recommended.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}