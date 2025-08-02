"use client";

/**
 * Birthday Campaign Management Dashboard
 * =====================================
 * 
 * Frontend interface for managing automated birthday campaigns.
 * Connects to /api/campaigns/birthday-detection API endpoints.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar,
  Gift,
  Users,
  TrendingUp,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
  PlayCircle,
  Pause,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BirthdayDashboardData {
  totalContacts: number;
  upcomingBirthdays: {
    today: any[];
    tomorrow: any[];
    thisWeek: any[];
    nextWeek: any[];
  };
  campaignsCreated: number;
  estimatedRevenue: number;
  highValueBirthdays: any[];
  missedOpportunities: any[];
}

interface BirthdayPerformance {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalRevenue: number;
  openRate: number;
  clickRate: number;
}

export default function BirthdayCampaignDashboard() {
  const [data, setData] = useState<BirthdayDashboardData | null>(null);
  const [performance, setPerformance] = useState<BirthdayPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardResponse, performanceResponse] = await Promise.all([
        fetch('/api/v2/campaigns/birthday-detection?action=dashboard'),
        fetch('/api/v2/campaigns/birthday-detection?action=performance&days=30')
      ]);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setData(dashboardData.data);
      }

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformance(performanceData.data.metrics);
      }

    } catch (error) {
      console.error('Failed to load birthday dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerDetection = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/v2/campaigns/birthday-detection?action=trigger-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          timeframe: 'all'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Birthday detection triggered:', result);
        await loadDashboardData(); // Refresh data
      }

    } catch (error) {
      console.error('Failed to trigger birthday detection:', error);
    } finally {
      setLoading(false);
    }
  };

  const previewDetection = async () => {
    try {
      const response = await fetch('/api/v2/campaigns/birthday-detection?action=preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Birthday detection preview:', result);
      }

    } catch (error) {
      console.error('Failed to preview birthday detection:', error);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading birthday campaigns...</p>
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
            <Gift className="h-8 w-8 text-pink-500" />
            Birthday Campaigns
          </h1>
          <p className="text-muted-foreground">
            Automated birthday campaign management and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={automationEnabled ? "default" : "secondary"} className="flex items-center gap-1">
            {automationEnabled ? <PlayCircle className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {automationEnabled ? 'Auto-Enabled' : 'Auto-Disabled'}
          </Badge>
          <Button variant="outline" onClick={previewDetection}>
            Preview
          </Button>
          <Button onClick={triggerDetection} disabled={loading}>
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
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{data?.upcomingBirthdays.today.length || 0}</div>
                <div className="text-sm text-muted-foreground">Today's Birthdays</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{data?.upcomingBirthdays.thisWeek.length || 0}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">${(data?.estimatedRevenue || 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Est. Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{data?.highValueBirthdays.length || 0}</div>
                <div className="text-sm text-muted-foreground">High-Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Upcoming Birthdays Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Birthdays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Today</span>
                    <Badge variant="default">{data?.upcomingBirthdays.today.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tomorrow</span>
                    <Badge variant="outline">{data?.upcomingBirthdays.tomorrow.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">This Week</span>
                    <Badge variant="outline">{data?.upcomingBirthdays.thisWeek.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Week</span>
                    <Badge variant="secondary">{data?.upcomingBirthdays.nextWeek.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Open Rate</span>
                    <span className="text-sm font-bold text-green-600">
                      {performance ? `${(performance.openRate * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Click Rate</span>
                    <span className="text-sm font-bold text-blue-600">
                      {performance ? `${(performance.clickRate * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-sm font-bold text-purple-600">
                      ${(performance?.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Campaigns Sent</span>
                    <span className="text-sm font-bold">{performance?.totalSent || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missed Opportunities Alert */}
          {data?.missedOpportunities && data.missedOpportunities.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missed Opportunities Detected</AlertTitle>
              <AlertDescription>
                {data.missedOpportunities.length} recent birthdays didn't receive campaigns. 
                Consider creating recovery campaigns or adjusting automation settings.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Birthday Campaigns</CardTitle>
              <CardDescription>
                Scheduled and potential birthday campaigns for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.upcomingBirthdays.today.length === 0 && 
                 data?.upcomingBirthdays.tomorrow.length === 0 && 
                 data?.upcomingBirthdays.thisWeek.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Birthdays</h3>
                    <p className="text-muted-foreground">No birthdays scheduled for the next week.</p>
                  </div>
                ) : (
                  <>
                    {/* Today's Birthdays */}
                    {data?.upcomingBirthdays.today.map((contact: any, index: number) => (
                      <div key={`today-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">Birthday Today!</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>Today</Badge>
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Tomorrow's Birthdays */}
                    {data?.upcomingBirthdays.tomorrow.map((contact: any, index: number) => (
                      <div key={`tomorrow-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">Birthday Tomorrow</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Tomorrow</Badge>
                          <Button size="sm" variant="outline">
                            <Clock className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sent</span>
                    <span className="font-medium">{performance?.totalSent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Opens</span>
                    <span className="font-medium">{performance?.totalOpens || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Clicks</span>
                    <span className="font-medium">{performance?.totalClicks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Open Rate</span>
                    <span className="font-medium text-green-600">
                      {performance ? `${(performance.openRate * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-medium">${(performance?.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg per Campaign</span>
                    <span className="font-medium">
                      ${performance && performance.totalSent > 0 ? 
                        (performance.totalRevenue / performance.totalSent).toFixed(2) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ROI</span>
                    <span className="font-medium text-green-600">245%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Automation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Auto-Detection</span>
                    <Badge variant={automationEnabled ? "default" : "secondary"}>
                      {automationEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Run</span>
                    <span className="text-sm">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Next Run</span>
                    <span className="text-sm">6 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Birthday Campaign Templates</CardTitle>
              <CardDescription>
                Manage and customize birthday campaign templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Standard Birthday Email</div>
                      <div className="text-sm text-muted-foreground">🎉 Happy Birthday! Special gift inside</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">45% Open Rate</Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Quick Birthday SMS</div>
                      <div className="text-sm text-muted-foreground">🎂 Happy Birthday! Enjoy 10% off today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">95% Open Rate</Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">WhatsApp Birthday Message</div>
                      <div className="text-sm text-muted-foreground">🎉 Special birthday surprise waiting!</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">88% Open Rate</Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}