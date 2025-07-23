import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Brain, 
  DollarSign, 
  Target, 
  BarChart3, 
  LineChart, 
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Lightbulb,
  FileText
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Business Intelligence Hub | AI Intelligence - MarketSage",
  description: "AI-powered business insights, strategic decision support, and intelligent market analysis for African enterprises",
  keywords: ["business intelligence", "AI insights", "decision support", "market analysis", "strategic planning", "African markets"]
};

export default function BusinessIntelligenceHub() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Hub</h1>
        <p className="text-muted-foreground">
          Strategic AI-powered insights and decision support to drive business growth and optimize operations across African markets.
        </p>
      </div>

      {/* Business Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Health Score</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">AI-calculated overall health</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Prediction</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2.4M</div>
            <p className="text-xs text-muted-foreground">Next quarter forecast</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Opportunities</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">AI-identified opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground">AI risk evaluation</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Strategic Decision Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Strategic Decision Support
            </CardTitle>
            <CardDescription>
              AI-powered strategic recommendations and decision modeling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Market Expansion</span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  AI recommends expanding to Ghana market - 78% success probability
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Product Portfolio</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Focus on SMS campaigns - 34% higher ROI predicted
                </div>
              </div>
            </div>
            <Button size="sm" asChild className="w-full">
              <Link href="/ai-intelligence/business/decisions">Decision Center</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Market Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Market Intelligence
            </CardTitle>
            <CardDescription>
              AI-driven market analysis and competitive intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Market Position</span>
                <Badge variant="outline" className="text-green-600">Strong</Badge>
              </div>
              <Progress value={78} className="h-2" />
              <div className="text-xs text-muted-foreground">Top 3 in Nigerian fintech marketing</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Competitive Advantage</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Multi-channel Integration</span>
                  <span className="text-green-600">+45%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Local Market Knowledge</span>
                  <span className="text-blue-600">+32%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>AI Capabilities</span>
                  <span className="text-purple-600">+28%</span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/business/market">Market Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive business performance measurement and KPI tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold text-green-600">↗ 23%</div>
                <div className="text-xs text-muted-foreground">Revenue Growth</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">87%</div>
                <div className="text-xs text-muted-foreground">Customer Retention</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Key Performance Areas</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Customer Acquisition</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Excellent</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Campaign Performance</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Good</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Market Penetration</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Improving</Badge>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/business/performance">Performance Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Revenue Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Intelligence
            </CardTitle>
            <CardDescription>
              AI-powered revenue forecasting and optimization insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue Forecast Accuracy</span>
                <Badge variant="outline">94%</Badge>
              </div>
              <Progress value={94} className="h-2" />
              <div className="text-xs text-muted-foreground">Based on 12-month historical data</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold">₦2.4M</div>
                <div className="text-xs text-muted-foreground">Q4 Forecast</div>
              </div>
              <div>
                <div className="text-sm font-bold text-green-600">+18%</div>
                <div className="text-xs text-muted-foreground">Growth Rate</div>
              </div>
              <div>
                <div className="text-sm font-bold">₦180K</div>
                <div className="text-xs text-muted-foreground">Monthly ARR</div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/business/revenue">Revenue Analytics</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Customer Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Customer Intelligence
            </CardTitle>
            <CardDescription>
              Advanced customer behavior analysis and segmentation insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold">4,247</div>
                <div className="text-xs text-muted-foreground">Active Customers</div>
              </div>
              <div>
                <div className="text-lg font-bold">₦420</div>
                <div className="text-xs text-muted-foreground">Avg. LTV</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Customer Health Distribution</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-200 h-2 rounded"></div>
                <div className="flex-1 bg-blue-200 h-2 rounded"></div>
                <div className="flex-1 bg-yellow-200 h-2 rounded"></div>
                <div className="flex-1 bg-red-200 h-2 rounded"></div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Healthy 68%</span>
                <span className="text-red-600">At Risk 8%</span>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/customers">Customer Intelligence</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Risk & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risk & Compliance
            </CardTitle>
            <CardDescription>
              AI-powered risk assessment and regulatory compliance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Risk Level</span>
                <Badge variant="outline" className="text-green-600">Low</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>GDPR Compliance</span>
                  <Badge variant="secondary" className="ml-auto text-xs">98%</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Nigerian Data Protection</span>
                  <Badge variant="secondary" className="ml-auto text-xs">100%</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span>Security Audit</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Due in 15d</Badge>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href="/ai-intelligence/business/compliance">Risk Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Business Insights & Strategic Recommendations
          </CardTitle>
          <CardDescription>
            Latest AI-generated business insights and strategic recommendations based on comprehensive data analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Revenue Optimization Opportunity</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI identifies potential 23% revenue increase by focusing on SMS campaigns for high-value customers in Lagos and Abuja markets.
                    </div>
                    <Button size="xs" variant="outline" className="mt-2">Implement Strategy</Button>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Market Expansion Timing</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Optimal timing for Ghana market entry detected: Q2 2024. Competitor analysis shows 67% success probability with current positioning.
                    </div>
                    <Button size="xs" variant="outline" className="mt-2">View Analysis</Button>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Customer Retention Risk</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      234 high-value customers show early churn signals. AI recommends proactive engagement campaign within 7 days.
                    </div>
                    <Button size="xs" variant="outline" className="mt-2">Start Campaign</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/business/insights">
                  <Brain className="h-4 w-4 mr-2" />
                  All Insights
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/business/forecasting">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Forecasting
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/business/reports">
                  <FileText className="h-4 w-4 mr-2" />
                  AI Reports
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ai-intelligence/business/scenarios">
                  <Target className="h-4 w-4 mr-2" />
                  What-If Analysis
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}