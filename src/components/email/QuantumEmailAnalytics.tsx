"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  TrendingUp, 
  Target, 
  Globe, 
  Clock, 
  Zap, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  Eye,
  MousePointer,
  Users
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QuantumEmailAnalyticsProps {
  optimization: {
    subjectLineOptimization: {
      originalSubject: string;
      optimizedSubject: string;
      improvementScore: number;
      culturalAdaptations: string[];
      quantumAdvantage: number;
      predictedOpenRate: number;
    };
    contentOptimization: {
      originalContent: string;
      optimizedContent: string;
      improvementScore: number;
      culturalEnhancements: string[];
      quantumAdvantage: number;
      predictedClickRate: number;
    };
    timingOptimization: {
      originalSchedule?: Date;
      optimizedSchedule: Date;
      timeZoneOptimizations: Record<string, Date>;
      culturalTimingFactors: string[];
      quantumAdvantage: number;
      predictedDeliveryRate: number;
    };
    performancePrediction: {
      estimatedOpenRate: number;
      estimatedClickRate: number;
      estimatedConversionRate: number;
      estimatedUnsubscribeRate: number;
      confidenceScore: number;
      quantumAccuracy: number;
    };
    segmentationInsights: {
      recommendedSegments: Array<{
        name: string;
        criteria: Record<string, any>;
        expectedPerformance: number;
        marketRelevance: string[];
      }>;
      crossMarketOpportunities: string[];
      quantumAdvantage: number;
    };
    personalizedPersonalizationSuggestions: Array<{
      type: string;
      field: string;
      suggestions: string[];
      expectedLift: number;
      marketApplicability: string[];
    }>;
  };
  campaignId?: string;
  onApplyOptimization?: (optimizationType: string) => void;
}

export function QuantumEmailAnalytics({ 
  optimization, 
  campaignId, 
  onApplyOptimization 
}: QuantumEmailAnalyticsProps) {
  const overallQuantumAdvantage = 
    (optimization.subjectLineOptimization.quantumAdvantage +
     optimization.contentOptimization.quantumAdvantage +
     optimization.timingOptimization.quantumAdvantage) / 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">⚡ Quantum Email Optimization Analysis</h3>
          <p className="text-gray-400 mt-1">
            Advanced quantum-powered insights for email campaign optimization
          </p>
        </div>
        <Badge variant="outline" className="text-cyan-400 border-cyan-400 bg-cyan-900/30">
          <Cpu className="h-4 w-4 mr-2" />
          +{(overallQuantumAdvantage * 100).toFixed(1)}% Quantum Advantage
        </Badge>
      </div>

      {/* Performance Predictions */}
      <Card className="bg-gradient-to-r from-purple-950/50 to-blue-950/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            📊 Predicted Performance
          </CardTitle>
          <CardDescription>
            Quantum-enhanced predictions based on African market intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <Eye className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-purple-100">
                {(optimization.performancePrediction.estimatedOpenRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-purple-300">Open Rate</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">
                  +{(optimization.subjectLineOptimization.improvementScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <MousePointer className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold text-blue-100">
                {(optimization.performancePrediction.estimatedClickRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-blue-300">Click Rate</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">
                  +{(optimization.contentOptimization.improvementScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold text-green-100">
                {(optimization.performancePrediction.estimatedConversionRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-green-300">Conversion Rate</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">Optimized</span>
              </div>
            </div>

            <div className="text-center p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <Users className="h-6 w-6 mx-auto mb-2 text-orange-400" />
              <div className="text-2xl font-bold text-orange-100">
                {(optimization.performancePrediction.estimatedUnsubscribeRate * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-orange-300">Unsubscribe Rate</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowDown className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">Minimized</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-200">Confidence Score</span>
              <span className="text-sm text-cyan-400">
                {(optimization.performancePrediction.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={optimization.performancePrediction.confidenceScore * 100} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Optimization Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subject Line Optimization */}
        <Card className="border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-300">
              <Zap className="h-5 w-5" />
              📧 Subject Line
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Original:</p>
              <p className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded">
                {optimization.subjectLineOptimization.originalSubject}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-cyan-400 mb-1">Quantum Optimized:</p>
              <p className="text-sm text-cyan-200 bg-cyan-900/20 p-2 rounded border border-cyan-500/30">
                {optimization.subjectLineOptimization.optimizedSubject}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Quantum Boost</span>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                  +{(optimization.subjectLineOptimization.quantumAdvantage * 100).toFixed(1)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Predicted Open Rate</span>
                <span className="text-xs text-green-400">
                  {(optimization.subjectLineOptimization.predictedOpenRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            {optimization.subjectLineOptimization.culturalAdaptations.length > 0 && (
              <div>
                <p className="text-xs text-purple-400 mb-2">🌍 Cultural Adaptations:</p>
                <div className="space-y-1">
                  {optimization.subjectLineOptimization.culturalAdaptations.slice(0, 2).map((adaptation, index) => (
                    <Badge key={index} variant="outline" className="text-xs text-purple-300 border-purple-500/50">
                      {adaptation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {onApplyOptimization && (
              <Button 
                size="sm" 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                onClick={() => onApplyOptimization('subject')}
              >
                Apply Subject Optimization
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Content Optimization */}
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-300">
              <Target className="h-5 w-5" />
              📝 Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Content Improvements:</p>
              <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-300">Quantum Enhancement</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    +{(optimization.contentOptimization.quantumAdvantage * 100).toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Predicted Click Rate</span>
                  <span className="text-xs text-green-400">
                    {(optimization.contentOptimization.predictedClickRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {optimization.contentOptimization.culturalEnhancements.length > 0 && (
              <div>
                <p className="text-xs text-purple-400 mb-2">🌍 Cultural Enhancements:</p>
                <div className="space-y-1">
                  {optimization.contentOptimization.culturalEnhancements.slice(0, 3).map((enhancement, index) => (
                    <div key={index} className="text-xs text-purple-200 bg-purple-900/20 p-2 rounded">
                      {enhancement}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {onApplyOptimization && (
              <Button 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => onApplyOptimization('content')}
              >
                Apply Content Optimization
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Timing Optimization */}
        <Card className="border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-300">
              <Clock className="h-5 w-5" />
              ⏰ Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-orange-400 mb-2">Optimal Send Time:</p>
              <div className="bg-orange-900/20 p-3 rounded border border-orange-500/30">
                <p className="text-sm text-orange-200">
                  {optimization.timingOptimization.optimizedSchedule.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">Delivery Rate</span>
                  <span className="text-xs text-orange-400">
                    {(optimization.timingOptimization.predictedDeliveryRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {optimization.timingOptimization.culturalTimingFactors.length > 0 && (
              <div>
                <p className="text-xs text-purple-400 mb-2">🌍 Cultural Timing:</p>
                <div className="space-y-1">
                  {optimization.timingOptimization.culturalTimingFactors.slice(0, 2).map((factor, index) => (
                    <div key={index} className="text-xs text-purple-200 bg-purple-900/20 p-2 rounded">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {onApplyOptimization && (
              <Button 
                size="sm" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => onApplyOptimization('timing')}
              >
                Apply Timing Optimization
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segmentation & Personalization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Segmentation Insights */}
        <Card className="border-indigo-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-300">
              <Users className="h-5 w-5" />
              👥 Smart Segmentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimization.segmentationInsights.recommendedSegments.slice(0, 3).map((segment, index) => (
                <div key={index} className="p-3 bg-indigo-900/20 rounded border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-indigo-200">{segment.name}</span>
                    <Badge variant="outline" className="text-indigo-400 border-indigo-400">
                      {(segment.expectedPerformance * 100).toFixed(0)}% performance
                    </Badge>
                  </div>
                  <div className="text-xs text-indigo-300">
                    {segment.marketRelevance.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            
            {optimization.segmentationInsights.crossMarketOpportunities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-purple-400 mb-2">🌍 Cross-Market Opportunities:</p>
                <div className="space-y-1">
                  {optimization.segmentationInsights.crossMarketOpportunities.slice(0, 2).map((opportunity, index) => (
                    <div key={index} className="text-xs text-purple-200 bg-purple-900/20 p-2 rounded">
                      {opportunity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalization Suggestions */}
        <Card className="border-pink-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-300">
              <Globe className="h-5 w-5" />
              🎯 Personalization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimization.personalizedPersonalizationSuggestions.slice(0, 4).map((suggestion, index) => (
                <div key={index} className="p-3 bg-pink-900/20 rounded border border-pink-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-pink-200 capitalize">{suggestion.type}</span>
                    <Badge variant="outline" className="text-pink-400 border-pink-400">
                      +{(suggestion.expectedLift * 100).toFixed(0)}% lift
                    </Badge>
                  </div>
                  <p className="text-xs text-pink-300 mb-2">Field: {suggestion.field}</p>
                  <div className="text-xs text-pink-200">
                    {suggestion.suggestions.slice(0, 2).join(', ')}
                  </div>
                  <div className="text-xs text-purple-300 mt-1">
                    Markets: {suggestion.marketApplicability.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}