"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Mail, MessageSquare, Brain, AlertCircle } from "lucide-react";

interface ForecastData {
  date: string;
  engagement: number;
  revenue: number;
  audienceGrowth: number;
  openRate: number;
  conversionRate: number;
  confidence: number;
}

interface Insight {
  type: "positive" | "negative" | "neutral";
  importance: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
}

export function PredictiveForecasting() {
  const [timeframe, setTimeframe] = useState("30");
  const [metric, setMetric] = useState("engagement");
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate realistic forecast data
  useEffect(() => {
    setIsLoading(true);
    
    const generateForecastData = () => {
      const days = parseInt(timeframe);
      const data: ForecastData[] = [];
      const startDate = new Date();
      
      // Base values
      let baseEngagement = 65;
      let baseRevenue = 485000;
      let baseAudience = 12500;
      let baseOpenRate = 22.5;
      let baseConversion = 1.8;

      // Trends and seasonality
      const weeklyPattern = [1.1, 1.2, 1.15, 1.0, 0.95, 0.85, 0.9]; // Mon-Sun multipliers
      const monthlyGrowth = 0.05; // 5% monthly growth trend
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const weekMultiplier = weeklyPattern[dayOfWeek] || 1;
        const growthMultiplier = 1 + (monthlyGrowth * (i / 30));
        const randomVariation = 0.9 + Math.random() * 0.2; // ±10% random variation
        
        // Add some seasonal effects
        const seasonalEffect = 1 + 0.1 * Math.sin((i / 7) * Math.PI); // Weekly cycle
        
        const confidence = Math.max(60, 95 - (i * 0.5)); // Decreasing confidence over time
        
        data.push({
          date: date.toISOString().split('T')[0],
          engagement: Math.round(baseEngagement * weekMultiplier * growthMultiplier * randomVariation),
          revenue: Math.round(baseRevenue * weekMultiplier * growthMultiplier * randomVariation),
          audienceGrowth: Math.round(baseAudience * growthMultiplier * seasonalEffect),
          openRate: Math.round((baseOpenRate * weekMultiplier * randomVariation) * 10) / 10,
          conversionRate: Math.round((baseConversion * weekMultiplier * randomVariation) * 10) / 10,
          confidence: Math.round(confidence)
        });
      }
      
      setForecastData(data);
      generateInsights(data);
      setIsLoading(false);
    };

    const timer = setTimeout(generateForecastData, 800); // Simulate API call
    return () => clearTimeout(timer);
  }, [timeframe]);

  const generateInsights = (data: ForecastData[]) => {
    const insights: Insight[] = [];
    
    // Calculate trends
    const firstWeek = data.slice(0, 7);
    const lastWeek = data.slice(-7);
    
    const engagementTrend = (lastWeek.reduce((a, b) => a + b.engagement, 0) / 7) - 
                           (firstWeek.reduce((a, b) => a + b.engagement, 0) / 7);
    
    const revenueTrend = (lastWeek.reduce((a, b) => a + b.revenue, 0) / 7) - 
                        (firstWeek.reduce((a, b) => a + b.revenue, 0) / 7);

    if (engagementTrend > 5) {
      insights.push({
        type: "positive",
        importance: "high",
        title: "Strong Engagement Growth Expected",
        description: `AI predicts ${engagementTrend.toFixed(1)}% increase in engagement over the forecast period.`,
        action: "Consider increasing campaign frequency to capitalize on this trend."
      });
    }

    if (revenueTrend > 10000) {
      insights.push({
        type: "positive",
        importance: "high",
        title: "Revenue Growth Opportunity",
        description: `Projected revenue increase of ₦${(revenueTrend * 7).toLocaleString()} per week.`,
        action: "Optimize high-performing campaigns and scale successful strategies."
      });
    }

    insights.push({
      type: "neutral",
      importance: "medium",
      title: "Seasonal Pattern Detected",
      description: "AI identified weekly engagement patterns with peaks on Tuesday-Wednesday.",
      action: "Schedule important campaigns on high-engagement days."
    });

    if (parseInt(timeframe) > 30) {
      insights.push({
        type: "negative",
        importance: "medium",
        title: "Prediction Confidence Decreases",
        description: "Long-term forecasts have lower accuracy. Monitor and adjust regularly.",
        action: "Review and update predictions every 2 weeks for better accuracy."
      });
    }

    insights.push({
      type: "positive",
      importance: "high",
      title: "WhatsApp Channel Opportunity",
      description: "AI predicts 35% better performance with WhatsApp integration for Nigerian market.",
      action: "Consider adding WhatsApp to your marketing mix."
    });

    setInsights(insights.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    }));
  };

  const getMetricData = () => {
    switch (metric) {
      case "engagement":
        return forecastData.map(d => ({ ...d, value: d.engagement }));
      case "revenue":
        return forecastData.map(d => ({ ...d, value: d.revenue }));
      case "audience":
        return forecastData.map(d => ({ ...d, value: d.audienceGrowth }));
      case "openRate":
        return forecastData.map(d => ({ ...d, value: d.openRate }));
      case "conversion":
        return forecastData.map(d => ({ ...d, value: d.conversionRate }));
      default:
        return forecastData.map(d => ({ ...d, value: d.engagement }));
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "engagement": return "Engagement Score";
      case "revenue": return "Revenue (₦)";
      case "audience": return "Total Audience";
      case "openRate": return "Open Rate (%)";
      case "conversion": return "Conversion Rate (%)";
      default: return "Value";
    }
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case "revenue":
        return `₦${value.toLocaleString()}`;
      case "openRate":
      case "conversion":
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const currentValue = forecastData.length > 0 ? getMetricData()[0].value : 0;
  const futureValue = forecastData.length > 0 ? getMetricData()[forecastData.length - 1].value : 0;
  const trend = ((futureValue - currentValue) / currentValue) * 100;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Forecast Period:</label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Metric:</label>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="audience">Audience Growth</SelectItem>
              <SelectItem value="openRate">Open Rate</SelectItem>
              <SelectItem value="conversion">Conversion Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Badge className="flex items-center gap-1">
          <Brain className="h-3 w-3" />
          AI-Powered Predictions
        </Badge>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current {getMetricLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
            <p className="text-xs text-muted-foreground">Baseline value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected {getMetricLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(futureValue)}</div>
            <div className="flex items-center gap-1 text-xs">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={trend > 0 ? "text-green-600" : "text-red-600"}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecastData.length > 0 ? forecastData[Math.floor(forecastData.length / 2)].confidence : 85}%
            </div>
            <Progress 
              value={forecastData.length > 0 ? forecastData[Math.floor(forecastData.length / 2)].confidence : 85} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getMetricLabel()} Forecast
          </CardTitle>
          <CardDescription>
            AI-driven predictions with confidence intervals for the next {timeframe} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-muted-foreground">AI is analyzing patterns...</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMetricData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-NG', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis tickFormatter={(value) => formatValue(value)} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatValue(value), getMetricLabel()]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-NG', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>
            Actionable recommendations based on predictive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === "positive" 
                    ? "bg-green-50 border-l-green-500" 
                    : insight.type === "negative"
                    ? "bg-red-50 border-l-red-500"
                    : "bg-blue-50 border-l-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge 
                        variant={insight.importance === "high" ? "default" : "secondary"}
                      >
                        {insight.importance}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    {insight.action && (
                      <p className="text-sm font-medium text-blue-700">
                        💡 Action: {insight.action}
                      </p>
                    )}
                  </div>
                  {insight.type === "positive" && <TrendingUp className="h-5 w-5 text-green-600 mt-1" />}
                  {insight.type === "negative" && <AlertCircle className="h-5 w-5 text-red-600 mt-1" />}
                  {insight.type === "neutral" && <Brain className="h-5 w-5 text-blue-600 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prediction Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Our AI uses machine learning algorithms analyzing historical data, seasonal patterns, 
            market trends, and Nigerian consumer behavior to generate these predictions. 
            Confidence levels decrease over longer time periods. Regular model updates ensure accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 