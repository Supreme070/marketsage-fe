'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award,
  RefreshCw,
  UserPlus,
  Star
} from 'lucide-react';
import CustomerJourneyManager from '@/components/leadpulse/CustomerJourneyManager';
import LeadScoringDashboard from '@/components/leadpulse/LeadScoringDashboard';
import AttributionAnalysis from '@/components/leadpulse/AttributionAnalysis';

export default function LeadManagement() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Manage customer journeys, lead scoring, and attribution analysis</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Lead Management Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">+18 new today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">26% qualification rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72</div>
            <p className="text-xs text-muted-foreground">+5 points this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.8%</div>
            <p className="text-xs text-muted-foreground">+2.1% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Management Tabs */}
      <Tabs defaultValue="journeys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journeys" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Journeys
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Lead Scoring
          </TabsTrigger>
          <TabsTrigger value="attribution" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Attribution Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journeys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Journey Management
              </CardTitle>
              <CardDescription>
                Track and manage the complete customer journey from anonymous visitor to qualified lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerJourneyManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Scoring & Qualification
              </CardTitle>
              <CardDescription>
                Configure scoring criteria and automatically qualify leads based on behavioral and demographic data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadScoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Attribution Analysis
              </CardTitle>
              <CardDescription>
                Analyze marketing attribution across multiple touchpoints and channels to optimize ROI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttributionAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}