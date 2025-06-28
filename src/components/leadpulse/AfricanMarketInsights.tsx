'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Smartphone, 
  CreditCard,
  Clock,
  MapPin,
  Zap,
  Brain,
  Target,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  AFRICAN_MARKETS, 
  getAllMarkets, 
  getMarketsBySize, 
  analyzeMarketOpportunity,
  formatCurrencyForMarket,
  type AfricanMarket 
} from '@/lib/geo/african-markets';

interface Props {
  selectedMarkets?: string[];
  updateInterval?: number;
}

export default function AfricanMarketInsights({ 
  selectedMarkets = [],
  updateInterval = 30000 
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMarket, setSelectedMarket] = useState<string>('nigeria');
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time market data simulation
  useEffect(() => {
    const updateMarketData = () => {
      const markets = getAllMarkets();
      const updatedData: Record<string, any> = {};

      markets.forEach(market => {
        const baseData = analyzeMarketOpportunity(market);
        const currentHour = new Date().getHours();
        const isBusinessHours = currentHour >= market.businessHours.start && 
                               currentHour <= market.businessHours.end;
        
        // Simulate real-time metrics
        updatedData[market.countryCode.toLowerCase()] = {
          ...baseData,
          currentActivity: {
            activeVisitors: Math.floor(Math.random() * 100) + (isBusinessHours ? 50 : 10),
            conversionRate: (Math.random() * 5 + 2).toFixed(1),
            avgSessionDuration: `${Math.floor(Math.random() * 5 + 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            peakTraffic: isBusinessHours,
            recentConversions: Math.floor(Math.random() * 10),
            trendsDirection: Math.random() > 0.5 ? 'up' : 'down',
            weeklyGrowth: (Math.random() * 20 - 10).toFixed(1) // -10% to +10%
          },
          aiPredictions: {
            nextHourConversions: Math.floor(Math.random() * 15 + 5),
            weeklyForecast: (Math.random() * 30 + 70).toFixed(1), // 70-100% confidence
            optimalContactTime: market.aiInsights.peakHours[Math.floor(Math.random() * market.aiInsights.peakHours.length)],
            recommendedActions: generateMarketRecommendations(market, isBusinessHours)
          }
        };
      });

      setMarketData(updatedData);
      setLastUpdate(new Date());
    };

    updateMarketData();
    const interval = setInterval(updateMarketData, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const generateMarketRecommendations = (market: AfricanMarket, isBusinessHours: boolean) => {
    const recommendations = [];
    
    if (isBusinessHours) {
      recommendations.push(`Peak hours in ${market.country} - increase ad spend`);
      recommendations.push('Enable real-time chat support');
    } else {
      recommendations.push('Schedule content for next business day');
      recommendations.push('Focus on other active markets');
    }

    if (market.preferredPaymentMethods.includes('Mobile Money')) {
      recommendations.push('Highlight mobile payment options');
    }

    if (market.techAdoption === 'high') {
      recommendations.push('Showcase advanced features');
    } else {
      recommendations.push('Emphasize ease of use');
    }

    return recommendations.slice(0, 3);
  };

  const getMarketStatusColor = (market: AfricanMarket) => {
    const currentHour = new Date().getHours();
    const marketHour = (currentHour + getTimezoneOffset(market.timezone)) % 24;
    const isBusinessHours = marketHour >= market.businessHours.start && 
                           marketHour <= market.businessHours.end;
    
    return isBusinessHours ? 'bg-green-500' : 'bg-gray-400';
  };

  const getTimezoneOffset = (timezone: string): number => {
    // Simplified timezone offset calculation
    const offsets: Record<string, number> = {
      'Africa/Lagos': 1,      // WAT (UTC+1)
      'Africa/Nairobi': 3,    // EAT (UTC+3)
      'Africa/Accra': 0,      // GMT (UTC+0)
      'Africa/Johannesburg': 2, // SAST (UTC+2)
      'Africa/Cairo': 2,      // EET (UTC+2)
      'Africa/Dar_es_Salaam': 3, // EAT (UTC+3)
      'Africa/Kampala': 3,    // EAT (UTC+3)
      'Africa/Casablanca': 1, // CET (UTC+1)
      'Africa/Addis_Ababa': 3, // EAT (UTC+3)
      'Africa/Kigali': 2      // CAT (UTC+2)
    };
    return offsets[timezone] || 0;
  };

  const getTopMarkets = () => {
    return getAllMarkets()
      .map(market => ({
        ...market,
        opportunity: analyzeMarketOpportunity(market),
        currentData: marketData[market.countryCode.toLowerCase()]
      }))
      .sort((a, b) => b.opportunity.score - a.opportunity.score)
      .slice(0, 5);
  };

  const selectedMarketData = AFRICAN_MARKETS[selectedMarket];
  const selectedMarketMetrics = marketData[selectedMarket];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            African Market Intelligence
            <Badge variant="outline" className="ml-auto">
              {getAllMarkets().length} Markets
            </Badge>
          </CardTitle>
          <CardDescription>
            AI-powered insights across 10 African markets with real-time analytics and predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getAllMarkets().reduce((sum, market) => 
                  sum + (marketData[market.countryCode.toLowerCase()]?.currentActivity?.activeVisitors || 0), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getMarketsBySize('large').length + getMarketsBySize('medium').length}
              </div>
              <div className="text-sm text-muted-foreground">High-Opportunity Markets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getAllMarkets().filter(market => {
                  const currentHour = new Date().getHours();
                  const marketHour = (currentHour + getTimezoneOffset(market.timezone)) % 24;
                  return marketHour >= market.businessHours.start && marketHour <= market.businessHours.end;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Markets in Business Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(getAllMarkets().reduce((sum, market) => sum + market.internetPenetration, 0) / getAllMarkets().length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Internet Penetration</div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {lastUpdate.toLocaleTimeString()} • Real-time market analysis
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="opportunities">AI Opportunities</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Market Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAllMarkets().map((market) => {
              const opportunity = analyzeMarketOpportunity(market);
              const currentData = marketData[market.countryCode.toLowerCase()];
              
              return (
                <Card 
                  key={market.countryCode} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMarket === market.countryCode.toLowerCase() ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedMarket(market.countryCode.toLowerCase())}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getMarketStatusColor(market)} animate-pulse`} />
                        <CardTitle className="text-lg">{market.country}</CardTitle>
                      </div>
                      <Badge variant={market.marketSize === 'large' ? 'default' : 'secondary'}>
                        {market.marketSize}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {market.majorCities[0]} • {market.currencySymbol}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="font-semibold text-blue-600">{market.internetPenetration}%</div>
                          <div className="text-xs text-muted-foreground">Internet</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{market.mobileUsage}%</div>
                          <div className="text-xs text-muted-foreground">Mobile</div>
                        </div>
                        <div>
                          <div className="font-semibold text-purple-600">{opportunity.score}</div>
                          <div className="text-xs text-muted-foreground">AI Score</div>
                        </div>
                        <div>
                          <div className="font-semibold text-orange-600">
                            {currentData?.currentActivity?.activeVisitors || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Live Visitors</div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <div className="text-xs font-medium mb-1">Payment Methods:</div>
                        <div className="flex flex-wrap gap-1">
                          {market.preferredPaymentMethods.slice(0, 2).map((method) => (
                            <Badge key={method} variant="outline" className="text-xs">
                              {method}
                            </Badge>
                          ))}
                          {market.preferredPaymentMethods.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{market.preferredPaymentMethods.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Current Status */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Current Status:</span>
                          <span className={currentData?.currentActivity?.peakTraffic ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {currentData?.currentActivity?.peakTraffic ? 'Peak Hours' : 'Off Hours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Top Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Top Market Opportunities
                <Badge variant="outline" className="ml-auto">AI Ranked</Badge>
              </CardTitle>
              <CardDescription>
                Markets ranked by AI opportunity score based on economic factors, tech adoption, and growth potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopMarkets().map((market, index) => (
                  <div key={market.countryCode} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{market.country}</div>
                        <div className="text-sm text-muted-foreground">
                          {market.marketSize} market • {market.techAdoption} tech adoption
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{market.opportunity.score}</div>
                      <div className="text-xs text-muted-foreground">Opportunity Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis Detail */}
          {selectedMarketData && selectedMarketMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Analysis: {selectedMarketData.country}
                </CardTitle>
                <CardDescription>
                  Detailed opportunity analysis and AI-powered recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Opportunity Factors */}
                  <div>
                    <h4 className="font-medium mb-3">Opportunity Factors</h4>
                    <div className="space-y-2">
                      {analyzeMarketOpportunity(selectedMarketData).reasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3">AI Recommendations</h4>
                    <div className="space-y-2">
                      {analyzeMarketOpportunity(selectedMarketData).recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-blue-500" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Predictions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    AI Predictions
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {selectedMarketMetrics.aiPredictions?.nextHourConversions || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Next Hour Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">
                        {selectedMarketMetrics.aiPredictions?.weeklyForecast || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Weekly Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">
                        {selectedMarketMetrics.aiPredictions?.optimalContactTime || 9}:00
                      </div>
                      <div className="text-xs text-muted-foreground">Optimal Contact Time</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">
                        {selectedMarketMetrics.currentActivity?.conversionRate || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Current Conv. Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Real-time Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getAllMarkets().slice(0, 4).map((market) => {
              const currentData = marketData[market.countryCode.toLowerCase()];
              const isActive = currentData?.currentActivity?.peakTraffic;
              
              return (
                <Card key={market.countryCode} className={isActive ? 'border-green-200 bg-green-50/50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{market.country}</CardTitle>
                      <div className={`w-2 h-2 rounded-full ${getMarketStatusColor(market)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {currentData?.currentActivity?.activeVisitors || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Visitors</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Conversion Rate:</span>
                          <span className="font-medium">{currentData?.currentActivity?.conversionRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Session:</span>
                          <span className="font-medium">{currentData?.currentActivity?.avgSessionDuration || '0:00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent Conversions:</span>
                          <span className="font-medium">{currentData?.currentActivity?.recentConversions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weekly Growth:</span>
                          <span className={`font-medium ${
                            Number.parseFloat(currentData?.currentActivity?.weeklyGrowth || '0') > 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {currentData?.currentActivity?.weeklyGrowth || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Market Insights */}
          {selectedMarketData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Market Insights: {selectedMarketData.country}
                </CardTitle>
                <CardDescription>
                  AI-generated insights and behavioral patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* AI Insights */}
                  <div>
                    <h4 className="font-medium mb-3">AI Behavioral Insights</h4>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm">{selectedMarketData.aiInsights.conversionTrends}</p>
                    </div>
                  </div>

                  {/* Best Channels */}
                  <div>
                    <h4 className="font-medium mb-3">Best Channels</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMarketData.aiInsights.bestChannels.map((channel, index) => (
                        <Badge key={index} variant="outline" className="justify-center">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Cultural Notes */}
                  <div>
                    <h4 className="font-medium mb-3">Cultural Considerations</h4>
                    <div className="space-y-2">
                      {selectedMarketData.culturalNotes.map((note, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Market Characteristics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="font-bold text-blue-600">{selectedMarketData.economicGrowth}%</div>
                      <div className="text-sm text-muted-foreground">Economic Growth</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="font-bold text-green-600">{selectedMarketData.internetPenetration}%</div>
                      <div className="text-sm text-muted-foreground">Internet Penetration</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="font-bold text-purple-600">{selectedMarketData.mobileUsage}%</div>
                      <div className="text-sm text-muted-foreground">Mobile Usage</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Market Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Select Market for Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getAllMarkets().map((market) => (
              <Button
                key={market.countryCode}
                variant={selectedMarket === market.countryCode.toLowerCase() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMarket(market.countryCode.toLowerCase())}
                className="text-xs"
              >
                {market.country}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}