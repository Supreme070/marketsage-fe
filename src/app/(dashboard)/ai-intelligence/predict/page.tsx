"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Brain, BarChart3, Target, Zap, Calendar,
  DollarSign, Users, Mail, MessageSquare, ArrowUpRight,
  RefreshCw, Settings, Download, Filter, Activity, 
  AlertTriangle, CheckCircle, TrendingDown, Eye
} from 'lucide-react';
import { usePredictiveAnalytics } from '@/hooks/useSupremeAI';
import StaticDashboardGrid from '@/components/panels/StaticDashboardGrid';
import type { DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';
import { toast } from 'sonner';
import { 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, 
  Tooltip, Line, ReferenceLine, ResponsiveContainer, Legend 
} from 'recharts';

export default function PredictiveAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const predict = usePredictiveAnalytics("dashboard-user");

  const mockPredictions = [
    {
      metric: "Revenue",
      current: 45000,
      predicted: 52000,
      change: "+15.6%",
      confidence: 87,
      timeframe: "Next 30 days",
      color: "text-green-400"
    },
    {
      metric: "Conversion Rate",
      current: 3.2,
      predicted: 3.8,
      change: "+18.8%", 
      confidence: 84,
      timeframe: "Next 30 days",
      color: "text-blue-400"
    },
    {
      metric: "Customer Churn",
      current: 8.5,
      predicted: 6.2,
      change: "-27.1%",
      confidence: 92,
      timeframe: "Next 30 days",
      color: "text-purple-400"
    }
  ];

  // Mock forecast data with prediction bands
  const revenueForecastData = Array.from({ length: 60 }).map((_, idx) => {
    const baseValue = 45000 + idx * 120 + Math.sin(idx * 0.1) * 2000;
    const isPrediction = idx >= 30;
    
    if (!isPrediction) {
      // Historical data
      return {
        x: idx % 5 === 0 ? `Day ${idx + 1}` : '',
        actual: baseValue + (Math.random() - 0.5) * 3000,
        predicted: null,
        upperBound: null,
        lowerBound: null,
      };
    } else {
      // Prediction data with widening confidence bands
      const daysIntoPrediction = idx - 30;
      const confidenceWidening = 1 + (daysIntoPrediction * 0.1); // Confidence bands widen over time
      const upperDeviation = 3000 * confidenceWidening;
      const lowerDeviation = 2500 * confidenceWidening;
      
      return {
        x: idx % 5 === 0 ? `Day ${idx + 1}` : '',
        actual: null,
        predicted: baseValue + Math.sin(idx * 0.05) * 1000,
        upperBound: baseValue + Math.sin(idx * 0.05) * 1000 + upperDeviation,
        lowerBound: baseValue + Math.sin(idx * 0.05) * 1000 - lowerDeviation,
      };
    }
  });

  const modelAccuracyData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.floor(82 + Math.random() * 8 + Math.sin(idx * 0.2) * 3),
  }));

  const predictionConfidenceData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.floor(80 + Math.random() * 15 + Math.cos(idx * 0.15) * 5),
  }));

  // Sparklines for stat panels
  const accuracySparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(82 + idx * 0.3 + Math.random() * 3),
  }));

  const predictionSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(1200 + idx * 15 + Math.random() * 50),
  }));

  const confidenceSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.floor(85 + idx * 0.5 + Math.random() * 4),
  }));

  // Model performance comparison data
  const modelComparisonData = [
    { model: 'Random Forest', accuracy: 84, speed: 'Fast', memory: 'Low' },
    { model: 'Neural Network', accuracy: 87, speed: 'Medium', memory: 'High' },
    { model: 'XGBoost', accuracy: 89, speed: 'Fast', memory: 'Medium' },
    { model: 'Ensemble', accuracy: 92, speed: 'Medium', memory: 'Medium' },
  ];

  const factorImportanceData = [
    { factor: 'User Engagement', importance: 85 },
    { factor: 'Time of Day', importance: 72 },
    { factor: 'Campaign Type', importance: 68 },
    { factor: 'Device Type', importance: 45 },
    { factor: 'Geographic Region', importance: 38 },
    { factor: 'Weather Data', importance: 25 }
  ];

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Predictive models refreshed');
  };

  // Custom Tooltip for Forecast Chart
  const ForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      const data = payload[0].payload;
      const isHistorical = data.actual !== null;
      
      return (
        <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
          {isHistorical ? (
            <div>
              <p className="text-blue-400 font-bold text-lg">
                ${data.actual?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-400">Historical Data</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-green-400 font-bold text-lg">
                ${data.predicted?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-400">Predicted Value</p>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400">Confidence Interval:</p>
                <p className="text-xs text-green-300">
                  ${data.lowerBound?.toLocaleString() || '0'} - ${data.upperBound?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Advanced Forecast Panel with Prediction Bands
  const ForecastPanel = () => (
    <Panel 
      title="Revenue Forecast with Confidence Bands" 
      toolbar={
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
            87% Accuracy
          </Badge>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="h-96 w-full flex flex-col">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Historical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500/30"></div>
            <span>Confidence Band</span>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueForecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {/* Brighter gradients for better visibility */}
                <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.15}/>
                </linearGradient>
                {/* Glow effects */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.4} />
              
              <XAxis 
                dataKey="x" 
                stroke="#d1d5db" 
                tick={{ fill: '#d1d5db', fontSize: 11 }}
                axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                stroke="#d1d5db" 
                tick={{ fill: '#d1d5db', fontSize: 11 }}
                axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#d1d5db', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              
              <Tooltip content={<ForecastTooltip />} />
              
              {/* Confidence Band Area with better visibility */}
              <Area
                dataKey="upperBound"
                stackId="confidence"
                stroke="#10b981"
                strokeWidth={1}
                strokeOpacity={0.5}
                fill="url(#confidenceGradient)"
                connectNulls={false}
              />
              <Area
                dataKey="lowerBound"
                stackId="confidence"
                stroke="none"
                fill="#111827"
                connectNulls={false}
              />
              
              {/* Historical Data Area for better visibility */}
              <Area
                dataKey="actual"
                stroke="none"
                fill="url(#historicalGradient)"
                connectNulls={false}
              />
              
              {/* Historical Data Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#60a5fa"
                strokeWidth={3}
                dot={false}
                connectNulls={false}
                filter="url(#glow)"
              />
              
              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#34d399"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                connectNulls={false}
                filter="url(#glow)"
              />
              
              {/* Vertical line showing prediction start */}
              <ReferenceLine 
                x="Day 31" 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: "Forecast Start", position: "top", fill: "#f59e0b", fontSize: 10 }}
              />
              
              {/* Legend */}
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="line"
                wrapperStyle={{
                  paddingTop: '10px',
                }}
                formatter={(value: string) => {
                  const legendMap: { [key: string]: string } = {
                    'actual': 'Historical Data',
                    'predicted': 'Forecast',
                    'upperBound': 'Upper Confidence',
                    'lowerBound': 'Lower Confidence'
                  };
                  return <span style={{ color: '#9ca3af', fontSize: '12px' }}>{legendMap[value] || value}</span>;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );

  // Model Performance Matrix Panel
  const ModelPerformancePanel = () => (
    <Panel title="Model Performance Matrix" toolbar={
      <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
        Live Monitoring
      </Badge>
    }>
      <div className="space-y-3 flex-1">
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-400 pb-2 border-b border-gray-700/50">
          <div>Model</div>
          <div>Accuracy</div>
          <div>Speed</div>
          <div>Memory</div>
        </div>
        {modelComparisonData.map((model, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-4 gap-2 p-2 rounded border text-xs transition-colors cursor-pointer ${
              selectedModel === model.model.toLowerCase().replace(' ', '_') 
                ? 'bg-blue-500/20 border-blue-500/40' 
                : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/30'
            }`}
            onClick={() => setSelectedModel(model.model.toLowerCase().replace(' ', '_'))}
          >
            <div className="font-medium text-white flex items-center gap-1">
              {selectedModel === model.model.toLowerCase().replace(' ', '_') && (
                <CheckCircle className="h-3 w-3 text-blue-400" />
              )}
              {model.model}
            </div>
            <div className={`font-medium ${model.accuracy >= 90 ? 'text-green-400' : model.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'}`}>
              {model.accuracy}%
            </div>
            <div className={`font-medium ${model.speed === 'Fast' ? 'text-green-400' : model.speed === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
              {model.speed}
            </div>
            <div className={`font-medium ${model.memory === 'Low' ? 'text-green-400' : model.memory === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
              {model.memory}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Feature Importance Panel
  const FeatureImportancePanel = () => (
    <Panel title="Feature Importance Analysis">
      <div className="space-y-3 flex-1">
        {factorImportanceData.map((factor, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white">{factor.factor}</span>
              <span className="text-gray-400">{factor.importance}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${factor.importance}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Prediction Alerts Panel
  const PredictionAlertsPanel = () => (
    <Panel title="Prediction Alerts" toolbar={
      <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
        3 Alerts
      </Badge>
    }>
      <div className="space-y-3 flex-1">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Revenue Deviation</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Predicted revenue 12% below target for next week</p>
          <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-6">
            Investigate
          </Button>
        </div>
        
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Model Drift</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">XGBoost accuracy dropped to 84% (was 89%)</p>
          <Button size="sm" variant="outline" className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 text-xs h-6">
            Retrain
          </Button>
        </div>
        
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">High Confidence</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">92% confidence for conversion predictions</p>
          <Button size="sm" variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-xs h-6">
            Deploy
          </Button>
        </div>
      </div>
    </Panel>
  );

  // Define Grafana-style dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Metrics
    {
      id: 'model_accuracy',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Model Accuracy"
          value={`${Math.round((predict.confidence || 0.84) * 100)}%`}
          isLoading={false}
          trendValue="Ensemble Algorithm"
          trend="up"
          sparklineData={accuracySparkline}
          icon={<Brain className="h-5 w-5 text-green-400" />}
        />
      ),
    },
    {
      id: 'predictions_made',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predictions Made"
          value="1,247"
          isLoading={false}
          trendValue="+23% this month"
          trend="up"
          sparklineData={predictionSparkline}
          icon={<Target className="h-5 w-5 text-blue-400" />}
        />
      ),
    },
    {
      id: 'forecast_range',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Forecast Range"
          value="90"
          unit="days"
          isLoading={false}
          trendValue="Extended range"
          trend="stable"
          icon={<Calendar className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'confidence_score',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Avg Confidence"
          value="87%"
          isLoading={false}
          trendValue="+4% improvement"
          trend="up"
          sparklineData={confidenceSparkline}
          icon={<CheckCircle className="h-5 w-5 text-yellow-400" />}
        />
      ),
    },

    // Second Row - Advanced Forecasting
    {
      id: 'revenue_forecast',
      x: 0,
      y: 2,
      w: 8,
      h: 6,
      component: <ForecastPanel />,
    },
    {
      id: 'model_performance',
      x: 8,
      y: 2,
      w: 4,
      h: 6,
      component: <ModelPerformancePanel />,
    },

    // Third Row - Model Analytics
    {
      id: 'accuracy_trend',
      x: 0,
      y: 8,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Model Accuracy Trend"
          data={modelAccuracyData}
          yLabel="Accuracy %"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'confidence_trend',
      x: 6,
      y: 8,
      w: 6,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Prediction Confidence Trend"
          data={predictionConfidenceData}
          yLabel="Confidence %"
          stroke="#f59e0b"
          fillGradient={true}
        />
      ),
    },

    // Fourth Row - Insights and Alerts
    {
      id: 'feature_importance',
      x: 0,
      y: 12,
      w: 4,
      h: 4,
      component: <FeatureImportancePanel />,
    },
    {
      id: 'prediction_distribution',
      x: 4,
      y: 12,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Prediction Categories"
          data={[
            { name: 'Revenue', value: 35 },
            { name: 'Conversion', value: 28 },
            { name: 'Churn', value: 22 },
            { name: 'Engagement', value: 15 },
          ]}
          isLoading={false}
        />
      ),
    },
    {
      id: 'prediction_alerts',
      x: 8,
      y: 12,
      w: 4,
      h: 4,
      component: <PredictionAlertsPanel />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/20">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Predictive Analytics
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-blue-500/10 text-green-400 border-green-500/20">
                  AutoML
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Machine learning forecasts • Revenue predictions • Model monitoring</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={`h-7 px-3 text-xs ${
                  timeRange === range 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grafana-style Dashboard Grid */}
      <StaticDashboardGrid panels={dashboardPanels} />
    </div>
  );
} 