'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Globe, Brain, Target, Eye } from 'lucide-react';

export default function LeadPulseDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LeadPulse Analytics</h1>
        <p className="text-gray-600">Real-time visitor intelligence and behavior analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Visitors</span>
            </div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-500">Currently online</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-gray-500">Average engagement</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Conversion</span>
            </div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-gray-500">Conversion rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">AI Insights</span>
            </div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-500">New insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            LeadPulse Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>System Status</span>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Collection</span>
              <Badge variant="outline">Paused for Performance</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Real-time Updates</span>
              <Badge variant="outline">Disabled</Badge>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-yellow-800">Performance Mode Active</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Complex components have been temporarily disabled to prevent browser freezing. 
                    This is a minimal version of LeadPulse with basic functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Map</CardTitle>
            <CardDescription>Real-time visitor locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">Live Visitor Map</p>
                <p className="text-sm text-gray-500">Temporarily disabled for performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Visitor Analytics</CardTitle>
            <CardDescription>Behavior patterns and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">Analytics Dashboard</p>
                <p className="text-sm text-gray-500">Temporarily disabled for performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}