import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, MapPin, Clock, TrendingUp, UserCheck, Globe, Smartphone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Visitor Intelligence Hub | LeadPulse - MarketSage",
  description: "Comprehensive visitor tracking and behavioral analytics with real-time insights and GDPR-compliant data collection",
  keywords: ["visitor tracking", "behavioral analytics", "lead intelligence", "website analytics", "GDPR compliance"]
};

export default function VisitorIntelligenceHub() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Visitor Intelligence Hub</h1>
        <p className="text-muted-foreground">
          Track, analyze, and understand your website visitors with advanced behavioral analytics and real-time intelligence.
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">Currently browsing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identified Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Across 4 continents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Visitors</CardTitle>
            <Smartphone className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Primary device type</p>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Real-time Visitor Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Real-time Tracking
            </CardTitle>
            <CardDescription>
              Monitor live visitor activity and engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active sessions</span>
              <Badge variant="secondary">Live</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Recent Activity</div>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>Lagos, Nigeria - 34 active</span>
                </div>
                <div className="flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>Accra, Ghana - 12 active</span>
                </div>
                <div className="flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>Nairobi, Kenya - 8 active</span>
                </div>
              </div>
            </div>
            <Button size="sm" asChild className="w-full">
              <Link href="/leadpulse/analytics/realtime">View Live Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Lead Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Lead Management
            </CardTitle>
            <CardDescription>
              Manage identified visitors and conversion opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">1,247</div>
                <div className="text-xs text-muted-foreground">Total Leads</div>
              </div>
              <div>
                <div className="text-2xl font-bold">342</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Conversion Rate</span>
                <span className="font-medium">24.6%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Avg. Session Duration</span>
                <span className="font-medium">4m 32s</span>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/leadpulse/visitors/leads">Manage Leads</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Behavioral Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Behavioral Analytics
            </CardTitle>
            <CardDescription>
              Advanced visitor behavior analysis and segmentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Top Behaviors</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Page Scrolling</span>
                  <Badge variant="outline" className="text-xs">89%</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Form Interaction</span>
                  <Badge variant="outline" className="text-xs">67%</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Download Attempts</span>
                  <Badge variant="outline" className="text-xs">34%</Badge>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/leadpulse/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Session Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Session Intelligence
            </CardTitle>
            <CardDescription>
              Deep insights into visitor sessions and journey mapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">4m 32s</div>
                <div className="text-xs text-muted-foreground">Avg. Duration</div>
              </div>
              <div>
                <div className="text-lg font-bold">3.2</div>
                <div className="text-xs text-muted-foreground">Pages/Session</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Session Quality</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '78%'}}></div>
              </div>
              <div className="text-xs text-right">78% High Quality</div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/leadpulse/analytics/sessions">Session Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Geographic Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Geographic Intelligence
            </CardTitle>
            <CardDescription>
              Location-based visitor insights and regional analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Top Regions</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>🇳🇬 Nigeria</span>
                  <span className="font-medium">47%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>🇬🇭 Ghana</span>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>🇰🇪 Kenya</span>
                  <span className="font-medium">12%</span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/leadpulse/analytics/geographic">Geographic Map</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Device & Tech Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-indigo-600" />
              Device Intelligence
            </CardTitle>
            <CardDescription>
              Device, browser, and technology usage analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">78%</div>
                <div className="text-xs text-muted-foreground">Mobile</div>
              </div>
              <div>
                <div className="text-lg font-bold">22%</div>
                <div className="text-xs text-muted-foreground">Desktop</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Top Browsers</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Chrome Mobile</span>
                  <span>62%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Safari Mobile</span>
                  <span>16%</span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/leadpulse/analytics/devices">Device Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common visitor intelligence tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/leadpulse/visitors/export">
                <Users className="h-4 w-4 mr-2" />
                Export Visitors
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leadpulse/visitors/segments">
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Segment
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leadpulse/setup/tracking">
                <Eye className="h-4 w-4 mr-2" />
                Setup Tracking
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leadpulse/setup/privacy">
                <UserCheck className="h-4 w-4 mr-2" />
                Privacy Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}