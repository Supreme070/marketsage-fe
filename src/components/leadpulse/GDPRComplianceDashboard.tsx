"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Trash2,
  Settings,
  Play,
  Pause,
  Download,
  Eye,
  Calendar,
  Activity,
  Database,
  Bell,
  Lock,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface GDPRComplianceDashboardProps {
  className?: string;
}

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export function GDPRComplianceDashboard({ className }: GDPRComplianceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<'running' | 'stopped' | 'starting' | 'stopping'>('stopped');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [consentSummary, setConsentSummary] = useState<any>(null);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [newRetentionRule, setNewRetentionRule] = useState({
    name: '',
    enabled: true,
    dataType: 'visitor',
    retentionPeriod: 365,
    conditions: {},
    actions: { delete: true },
    schedule: { frequency: 'daily', time: '02:00', timezone: 'UTC' }
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/leadpulse/gdpr?action=dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleServiceToggle = async () => {
    const action = serviceStatus === 'running' ? 'stop-service' : 'start-service';
    setServiceStatus(serviceStatus === 'running' ? 'stopping' : 'starting');

    try {
      const response = await fetch(`/api/leadpulse/gdpr?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setServiceStatus(serviceStatus === 'running' ? 'stopped' : 'running');
      }
    } catch (error) {
      console.error('Error toggling service:', error);
      setServiceStatus(serviceStatus === 'running' ? 'running' : 'stopped');
    }
  };

  const handleConsentLookup = async () => {
    if (!selectedEmail) return;

    try {
      const response = await fetch(`/api/leadpulse/gdpr?action=consent-summary&email=${encodeURIComponent(selectedEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setConsentSummary(data);
      }
    } catch (error) {
      console.error('Error fetching consent summary:', error);
    }
  };

  const handleProcessRetention = async () => {
    try {
      const response = await fetch('/api/leadpulse/gdpr?action=process-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setProcessingResults(data);
      }
    } catch (error) {
      console.error('Error processing retention:', error);
    }
  };

  const handleAddRetentionRule = async () => {
    try {
      const response = await fetch('/api/leadpulse/gdpr?action=add-retention-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRetentionRule)
      });

      if (response.ok) {
        // Reset form and refresh data
        setNewRetentionRule({
          name: '',
          enabled: true,
          dataType: 'visitor',
          retentionPeriod: 365,
          conditions: {},
          actions: { delete: true },
          schedule: { frequency: 'daily', time: '02:00', timezone: 'UTC' }
        });
        // Refresh dashboard data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding retention rule:', error);
    }
  };

  const handleDataSubjectRequest = async (type: string, email: string) => {
    try {
      const response = await fetch('/api/leadpulse/gdpr?action=data-subject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email })
      });

      if (response.ok) {
        const data = await response.json();
        if (type === 'ACCESS' && data.success) {
          // Handle access request result
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gdpr-access-request-${email}-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (type === 'ERASURE' && data.success) {
          alert(`Data erasure completed for ${email}. Deleted items: ${JSON.stringify(data.deletedItems)}`);
        }
      }
    } catch (error) {
      console.error('Error handling data subject request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const alerts = dashboardData?.alerts || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const retentionStats = dashboardData?.retentionStats || {};

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GDPR Compliance Dashboard</h2>
          <p className="text-muted-foreground">Monitor data protection compliance and automate retention policies</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={serviceStatus === 'running' ? 'default' : 'secondary'}>
            {serviceStatus === 'running' ? 'Active' : 'Stopped'}
          </Badge>
          <Button
            onClick={handleServiceToggle}
            variant="outline"
            size="sm"
            disabled={serviceStatus === 'starting' || serviceStatus === 'stopping'}
          >
            {serviceStatus === 'running' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Service
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Service
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Consents</p>
                <p className="text-2xl font-bold">{summary.totalConsents || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Consents</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeConsents || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired Consents</p>
                <p className="text-2xl font-bold text-red-600">{summary.expiredConsents || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{summary.pendingRequests || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rules</p>
                <p className="text-2xl font-bold">{summary.retentionRules || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{summary.alertsCount || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">
              {alerts.length} compliance alert{alerts.length > 1 ? 's' : ''} require attention
            </div>
            <div className="mt-2 space-y-1">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="text-sm">
                  <Badge className={SEVERITY_COLORS[alert.severity]} variant="outline">
                    {alert.severity}
                  </Badge>
                  <span className="ml-2">{alert.message}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No recent activity</p>
                  ) : (
                    recentActivity.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Processing Run</span>
                    <span className="text-sm text-muted-foreground">
                      {retentionStats.lastProcessingRun ? 
                        new Date(retentionStats.lastProcessingRun).toLocaleString() : 
                        'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Rules</span>
                    <span className="text-sm">{retentionStats.activeRules || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Scheduled Tasks</span>
                    <span className="text-sm">{retentionStats.scheduledTasks || 0}</span>
                  </div>
                  <Button onClick={handleProcessRetention} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Retention Processing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent Lookup</CardTitle>
              <CardDescription>Search for consent records by email address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                />
                <Button onClick={handleConsentLookup}>
                  <Eye className="h-4 w-4 mr-2" />
                  Lookup
                </Button>
              </div>
              
              {consentSummary && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Consent Summary for {consentSummary.email}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Consents:</span> {consentSummary.totalConsents}
                    </div>
                    <div>
                      <span className="font-medium">Active Consents:</span> {consentSummary.activeConsents}
                    </div>
                    <div>
                      <span className="font-medium">Withdrawn Consents:</span> {consentSummary.withdrawnConsents}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">By Consent Type</h5>
                    <div className="space-y-2">
                      {Object.entries(consentSummary.consentsByType || {}).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{type}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-green-600">
                              {data.granted} granted
                            </Badge>
                            <Badge variant="outline" className="text-red-600">
                              {data.withdrawn} withdrawn
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Retention Rule</CardTitle>
              <CardDescription>Create automated data retention policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      value={newRetentionRule.name}
                      onChange={(e) => setNewRetentionRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Delete old visitors"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select
                      value={newRetentionRule.dataType}
                      onValueChange={(value) => setNewRetentionRule(prev => ({ ...prev, dataType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitor</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="touchpoint">Touchpoint</SelectItem>
                        <SelectItem value="form_submission">Form Submission</SelectItem>
                        <SelectItem value="consent">Consent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      value={newRetentionRule.retentionPeriod}
                      onChange={(e) => setNewRetentionRule(prev => ({ ...prev, retentionPeriod: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newRetentionRule.schedule.frequency}
                      onValueChange={(value) => setNewRetentionRule(prev => ({ 
                        ...prev, 
                        schedule: { ...prev.schedule, frequency: value } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newRetentionRule.enabled}
                      onCheckedChange={(checked) => setNewRetentionRule(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label>Enable Rule</Label>
                  </div>
                  <Button onClick={handleAddRetentionRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {processingResults && (
            <Card>
              <CardHeader>
                <CardTitle>Last Processing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{processingResults.processed}</p>
                    <p className="text-sm text-muted-foreground">Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{processingResults.deleted}</p>
                    <p className="text-sm text-muted-foreground">Deleted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{processingResults.anonymized}</p>
                    <p className="text-sm text-muted-foreground">Anonymized</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{processingResults.archived}</p>
                    <p className="text-sm text-muted-foreground">Archived</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>Handle GDPR data subject requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requestEmail">Email Address</Label>
                  <Input
                    id="requestEmail"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleDataSubjectRequest('ACCESS', selectedEmail)}
                    disabled={!selectedEmail}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Access Request
                  </Button>
                  <Button 
                    onClick={() => handleDataSubjectRequest('ERASURE', selectedEmail)}
                    disabled={!selectedEmail}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Erasure Request
                  </Button>
                  <Button 
                    onClick={() => handleDataSubjectRequest('PORTABILITY', selectedEmail)}
                    disabled={!selectedEmail}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Portability Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No compliance alerts</p>
                  </div>
                ) : (
                  alerts.map((alert: any) => (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{alert.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={SEVERITY_COLORS[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}