import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Brain, 
  Sparkles, 
  BarChart3, 
  Zap, 
  Users, 
  MessageSquare,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campaign Intelligence Hub | AI Intelligence - MarketSage",
  description: "AI-powered campaign optimization, performance prediction, and intelligent automation for multi-channel marketing",
  keywords: ["campaign intelligence", "AI optimization", "predictive analytics", "multi-channel marketing", "campaign automation"]
};

export default function CampaignIntelligenceHub() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Campaign Intelligence Hub</h1>
        <p className="text-muted-foreground">
          Leverage AI to optimize campaigns, predict performance, and automate intelligent marketing decisions across all channels.
        </p>
      </div>

      {/* AI Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Optimization Score</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Campaign intelligence active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+34%</div>
            <p className="text-xs text-muted-foreground">Above baseline performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AI Campaigns</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Currently optimizing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$47.2K</div>
            <p className="text-xs text-muted-foreground">AI-driven revenue this month</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Intelligence Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Predictive Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Predictive Analytics
            </CardTitle>
            <CardDescription>
              AI-powered campaign performance forecasting and optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Email Open Rate Prediction</span>
                <Badge variant="outline">94% Accuracy</Badge>
              </div>
              <Progress value={78} className="h-2" />
              <div className="text-xs text-muted-foreground">Predicted: 23.4% (+2.1%)</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>SMS Conversion Forecast</span>
                <Badge variant="outline">91% Accuracy</Badge>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-xs text-muted-foreground">Predicted: 8.2% (+1.3%)</div>
            </div>
            <Button size="sm" asChild className="w-full">
              <Link href="/ai-intelligence/customers/predictive">View Predictions</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Content Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Content Intelligence
            </CardTitle>
            <CardDescription>
              AI-generated content optimization and A/B test suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Email Subject Lines</span>
                <Badge variant="secondary" className="ml-auto">12 Generated</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">SMS Copy Variants</span>
                <Badge variant="secondary" className="ml-auto">8 Generated</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">WhatsApp Templates</span>
                <Badge variant="secondary" className="ml-auto">5 Generated</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/content/generator">Generate Content</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Send Time Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Send Time Intelligence
            </CardTitle>
            <CardDescription>
              AI-optimized timing for maximum engagement rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Optimal Send Times</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>📧 Email</span>
                  <span className="font-medium">Tue 2:30 PM</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>📱 SMS</span>
                  <span className="font-medium">Wed 6:45 PM</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>💬 WhatsApp</span>
                  <span className="font-medium">Thu 11:15 AM</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-800 dark:text-green-400">
                +32% Engagement Boost
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                Using AI-optimized send times
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/campaigns/timing">Timing Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Audience Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Audience Intelligence
            </CardTitle>
            <CardDescription>
              AI-powered audience segmentation and targeting optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">47</div>
                <div className="text-xs text-muted-foreground">AI Segments</div>
              </div>
              <div>
                <div className="text-lg font-bold">89%</div>
                <div className="text-xs text-muted-foreground">Targeting Accuracy</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Top Performing Segments</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>High-Value Mobile Users</span>
                  <Badge variant="outline">+45% CTR</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Engaged Africa Segment</span>
                  <Badge variant="outline">+31% Conv</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Re-engagement Cohort</span>
                  <Badge variant="outline">+28% Open</Badge>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/customers/segments">View Segments</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Campaign Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Smart Automation
            </CardTitle>
            <CardDescription>
              AI-driven campaign triggers and optimization workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">12</div>
                <div className="text-xs text-muted-foreground">Active Automations</div>
              </div>
              <div>
                <div className="text-lg font-bold">94%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Recent AI Decisions</div>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="text-green-600">✓</span> Optimized send time for "Welcome Series"
                </div>
                <div className="text-xs">
                  <span className="text-blue-600">↗</span> Increased SMS frequency for high-value segment  
                </div>
                <div className="text-xs">
                  <span className="text-purple-600">🎯</span> Applied dynamic content to email campaign
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/operations/automation">Automation Hub</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Performance Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Performance Intelligence
            </CardTitle>
            <CardDescription>
              Real-time campaign monitoring and optimization alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Campaign Health Scores</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Black Friday Email Campaign</span>
                  <div className="flex items-center gap-1">
                    <Progress value={92} className="w-12 h-2" />
                    <span className="text-green-600 font-medium">92%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>SMS Flash Sale Series</span>
                  <div className="flex items-center gap-1">
                    <Progress value={76} className="w-12 h-2" />
                    <span className="text-blue-600 font-medium">76%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>WhatsApp Product Launch</span>
                  <div className="flex items-center gap-1">
                    <Progress value={84} className="w-12 h-2" />
                    <span className="text-green-600 font-medium">84%</span>
                  </div>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/campaigns/performance">Performance Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Latest AI-generated insights and optimization recommendations for your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Optimal Frequency Detected</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI recommends reducing email frequency by 15% for the "Engaged Users" segment to prevent fatigue and improve engagement rates.
                    </div>
                    <Button size="xs" variant="outline" className="mt-2">Apply Recommendation</Button>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Content Optimization Opportunity</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI suggests testing personalized WhatsApp message templates based on customer journey stage. Potential +18% conversion lift.
                    </div>
                    <Button size="xs" variant="outline" className="mt-2">View Templates</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/campaigns/insights">
                  <Brain className="h-4 w-4 mr-2" />
                  All Insights
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/campaigns/ab-tests">
                  <Target className="h-4 w-4 mr-2" />
                  A/B Tests
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/campaigns/optimization">
                  <Zap className="h-4 w-4 mr-2" />
                  Optimization
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/campaigns/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  AI Reports
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}