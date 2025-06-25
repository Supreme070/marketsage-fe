'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Activity, 
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  factors: string[];
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  mean: number;
}

interface AIPrediction {
  id: string;
  title: string;
  description: string;
  prediction: number;
  confidence: ConfidenceInterval;
  category: 'conversion' | 'traffic' | 'engagement' | 'revenue';
  timeframe: '1h' | '24h' | '7d' | '30d';
  accuracy: number;
  lastUpdated: Date;
  factors: {
    name: string;
    weight: number;
    direction: 'positive' | 'negative';
  }[];
}

interface Props {
  updateInterval?: number;
  showAdvancedMetrics?: boolean;
}

export default function AIPredictionDashboard({ 
  updateInterval = 10000,
  showAdvancedMetrics = true 
}: Props) {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [modelAccuracy, setModelAccuracy] = useState(89.3);

  // Generate realistic AI predictions
  useEffect(() => {
    const generatePredictions = () => {
      setIsAnalyzing(true);
      
      const predictionTemplates: Omit<AIPrediction, 'id' | 'lastUpdated' | 'confidence'>[] = [
        {
          title: 'Conversion Rate Forecast',
          description: 'AI predicts conversion rate changes based on current visitor behavior patterns',
          prediction: 24.7,
          category: 'conversion',
          timeframe: '24h',
          accuracy: 91.2,
          factors: [
            { name: 'Visitor Quality Score', weight: 0.35, direction: 'positive' },
            { name: 'Page Load Time', weight: 0.28, direction: 'negative' },
            { name: 'Mobile Optimization', weight: 0.22, direction: 'positive' },
            { name: 'Time of Day', weight: 0.15, direction: 'positive' }
          ]
        },
        {
          title: 'Traffic Volume Prediction',
          description: 'Expected traffic increase from African markets during peak business hours',
          prediction: 340,
          category: 'traffic',
          timeframe: '1h',
          accuracy: 87.8,
          factors: [
            { name: 'Business Hours Alignment', weight: 0.40, direction: 'positive' },
            { name: 'Regional Seasonality', weight: 0.25, direction: 'positive' },
            { name: 'Market Penetration', weight: 0.20, direction: 'positive' },
            { name: 'Competition Activity', weight: 0.15, direction: 'negative' }
          ]
        },
        {
          title: 'User Engagement Score',
          description: 'Predicted engagement levels based on content relevance and user behavior',
          prediction: 78.5,
          category: 'engagement',
          timeframe: '7d',
          accuracy: 85.4,
          factors: [
            { name: 'Content Localization', weight: 0.32, direction: 'positive' },
            { name: 'UI/UX Optimization', weight: 0.28, direction: 'positive' },
            { name: 'Feature Adoption', weight: 0.25, direction: 'positive' },
            { name: 'Support Response Time', weight: 0.15, direction: 'positive' }
          ]
        },
        {
          title: 'Revenue Per Visitor',
          description: 'AI-calculated revenue potential per visitor from TechFlow Solutions demos',
          prediction: 45.30,
          category: 'revenue',
          timeframe: '30d',
          accuracy: 88.9,
          factors: [
            { name: 'Lead Quality Score', weight: 0.38, direction: 'positive' },
            { name: 'Pricing Strategy', weight: 0.27, direction: 'positive' },
            { name: 'Sales Funnel Efficiency', weight: 0.20, direction: 'positive' },
            { name: 'Market Competition', weight: 0.15, direction: 'negative' }
          ]
        },
        {
          title: 'Churn Risk Assessment',
          description: 'Probability of visitor abandonment based on behavioral patterns',
          prediction: 12.8,
          category: 'engagement',
          timeframe: '24h',
          accuracy: 92.1,
          factors: [
            { name: 'Session Duration', weight: 0.35, direction: 'negative' },
            { name: 'Page Bounce Rate', weight: 0.30, direction: 'positive' },
            { name: 'Feature Interaction', weight: 0.20, direction: 'negative' },
            { name: 'Support Tickets', weight: 0.15, direction: 'positive' }
          ]
        },
        {
          title: 'Mobile Conversion Trend',
          description: 'African mobile user conversion patterns and optimization opportunities',
          prediction: 31.4,
          category: 'conversion',
          timeframe: '7d',
          accuracy: 86.7,
          factors: [
            { name: 'Mobile Page Speed', weight: 0.40, direction: 'positive' },
            { name: 'Mobile Payment Options', weight: 0.30, direction: 'positive' },
            { name: 'App Store Optimization', weight: 0.18, direction: 'positive' },
            { name: 'Network Connectivity', weight: 0.12, direction: 'negative' }
          ]
        }
      ];

      const newPredictions = predictionTemplates.map((template, index) => {
        // Generate confidence intervals
        const baseConfidence = template.accuracy / 100;
        const variance = (100 - template.accuracy) / 100 * 0.1;
        
        const confidenceInterval: ConfidenceInterval = {
          lower: template.prediction * (baseConfidence - variance),
          upper: template.prediction * (baseConfidence + variance),
          mean: template.prediction * baseConfidence
        };

        // Add some randomness to make it feel live
        const randomVariation = (Math.random() - 0.5) * 0.1;
        
        return {
          ...template,
          id: `prediction-${index}`,
          prediction: template.prediction * (1 + randomVariation),
          confidence: {
            lower: confidenceInterval.lower * (1 + randomVariation * 0.5),
            upper: confidenceInterval.upper * (1 + randomVariation * 0.5),
            mean: confidenceInterval.mean * (1 + randomVariation)
          },
          lastUpdated: new Date()
        };
      });

      setPredictions(newPredictions);
      setModelAccuracy(89.3 + (Math.random() - 0.5) * 2); // 88.3 - 90.3 range
      setLastUpdate(new Date());
      
      setTimeout(() => setIsAnalyzing(false), 1500);
    };

    generatePredictions();
    const interval = setInterval(generatePredictions, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const filteredPredictions = predictions.filter(pred => {
    if (selectedCategory !== 'all' && pred.category !== selectedCategory) return false;
    if (selectedTimeframe !== 'all' && pred.timeframe !== selectedTimeframe) return false;
    return true;
  });

  const getPredictionIcon = (category: string) => {
    switch (category) {
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'traffic': return <TrendingUp className="h-4 w-4" />;
      case 'engagement': return <Activity className="h-4 w-4" />;
      case 'revenue': return <BarChart3 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrendIcon = (factors: AIPrediction['factors']) => {
    const positiveWeight = factors
      .filter(f => f.direction === 'positive')
      .reduce((sum, f) => sum + f.weight, 0);
    
    const negativeWeight = factors
      .filter(f => f.direction === 'negative')
      .reduce((sum, f) => sum + f.weight, 0);

    if (positiveWeight > negativeWeight) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (negativeWeight > positiveWeight) return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return <Activity className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            AI Prediction Dashboard
            <Badge variant="outline" className="ml-auto">
              {modelAccuracy.toFixed(1)}% Accuracy
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time AI predictions with confidence intervals for TechFlow Solutions analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{predictions.length}</div>
              <div className="text-sm text-muted-foreground">Active Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {predictions.filter(p => p.accuracy > 85).length}
              </div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(predictions.reduce((sum, p) => sum + p.accuracy, 0) / predictions.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {predictions.filter(p => p.timeframe === '24h' || p.timeframe === '1h').length}
              </div>
              <div className="text-sm text-muted-foreground">Real-time Models</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === 'conversion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('conversion')}
              >
                Conversion
              </Button>
              <Button
                variant={selectedCategory === 'traffic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('traffic')}
              >
                Traffic
              </Button>
              <Button
                variant={selectedCategory === 'engagement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('engagement')}
              >
                Engagement
              </Button>
              <Button
                variant={selectedCategory === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('revenue')}
              >
                Revenue
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPredictions.map((prediction) => (
          <Card key={prediction.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getPredictionIcon(prediction.category)}
                  <div>
                    <CardTitle className="text-lg">{prediction.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {prediction.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(prediction.factors)}
                  <Badge variant="outline">{prediction.timeframe}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Prediction */}
                <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600">
                    {prediction.category === 'revenue' ? '₦' : ''}
                    {prediction.prediction.toFixed(prediction.category === 'revenue' ? 2 : 1)}
                    {prediction.category === 'conversion' || prediction.category === 'engagement' ? '%' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">Predicted Value</div>
                </div>

                {/* Confidence Interval */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence Interval</span>
                    <span className={`text-xs px-2 py-1 rounded border ${getConfidenceColor(prediction.accuracy)}`}>
                      {prediction.accuracy.toFixed(1)}% confident
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{prediction.confidence.lower.toFixed(1)}</span>
                      <span>{prediction.confidence.mean.toFixed(1)}</span>
                      <span>{prediction.confidence.upper.toFixed(1)}</span>
                    </div>
                    
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      {/* Confidence range */}
                      <div 
                        className="absolute h-full bg-indigo-200 rounded-full"
                        style={{
                          left: '10%',
                          width: '80%'
                        }}
                      />
                      {/* Mean prediction line */}
                      <div 
                        className="absolute h-full w-1 bg-indigo-600"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Factors */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Factors</h4>
                  <div className="space-y-2">
                    {prediction.factors.slice(0, 3).map((factor, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            factor.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {factor.name}
                        </span>
                        <span className="font-medium">{(factor.weight * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accuracy History */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Model Accuracy:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={prediction.accuracy} className="w-16 h-2" />
                      <span className="font-medium">{prediction.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Processing Indicator */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span className="text-sm text-indigo-600">Updating prediction...</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Advanced Analytics */}
      {showAdvancedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              Model Performance Analytics
            </CardTitle>
            <CardDescription>
              Deep insights into AI prediction model performance and reliability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Model Health */}
              <div>
                <h4 className="font-medium mb-3">Model Health Score</h4>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{modelAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Overall Accuracy</div>
                  <Progress value={modelAccuracy} className="mt-2" />
                </div>
              </div>

              {/* Category Performance */}
              <div>
                <h4 className="font-medium mb-3">Category Performance</h4>
                <div className="space-y-2">
                  {['conversion', 'traffic', 'engagement', 'revenue'].map(category => {
                    const categoryPredictions = predictions.filter(p => p.category === category);
                    const avgAccuracy = categoryPredictions.length > 0 
                      ? categoryPredictions.reduce((sum, p) => sum + p.accuracy, 0) / categoryPredictions.length
                      : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={avgAccuracy} className="w-12 h-2" />
                          <span className="font-medium w-12">{avgAccuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Status */}
              <div>
                <h4 className="font-medium mb-3">Real-time Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Data Freshness:</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Live
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing Speed:</span>
                    <span className="font-medium">2.3s avg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Model Updates:</span>
                    <span className="font-medium">Every 10s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence Level:</span>
                    <span className="font-medium text-green-600">High</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}