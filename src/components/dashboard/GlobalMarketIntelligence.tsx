/**
 * Global Market Intelligence Dashboard
 * ==================================
 * Comprehensive global market analysis and expansion planning tool
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  TrendingUp,
  Users,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  MapPin,
  Clock,
  Smartphone,
  Wifi,
  Building,
  Flag,
  Target,
  Zap,
  BookOpen,
  Calendar,
  Info
} from 'lucide-react';

import { 
  globalCoverage, 
  getMarketRecommendations, 
  calculateMarketEntryScore,
  getCulturalAdaptations,
  type MarketData,
  type CountryData 
} from '@/lib/geo/global-coverage';

interface GlobalMarketIntelligenceProps {
  className?: string;
}

export default function GlobalMarketIntelligence({ className }: GlobalMarketIntelligenceProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [recommendations, setRecommendations] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load market data
    const allMarkets = globalCoverage.getAllMarkets();
    setMarkets(allMarkets);
    
    // Get market recommendations
    const recs = getMarketRecommendations({
      minMarketSize: 50,
      maxCompetition: 'high',
      minDigitalAdoption: 40
    });
    setRecommendations(recs);
    
    setLoading(false);
  }, []);

  const filteredMarkets = useMemo(() => {
    if (selectedRegion === 'all') return markets;
    return markets.filter(market => 
      market.region.toLowerCase().replace(' ', '_') === selectedRegion
    );
  }, [markets, selectedRegion]);

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;
    return globalCoverage.getCountryData(selectedCountry);
  }, [selectedCountry]);

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'saturated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrencyStabilityColor = (stability: string) => {
    switch (stability) {
      case 'stable': return 'bg-green-100 text-green-800';
      case 'volatile': return 'bg-yellow-100 text-yellow-800';
      case 'hyperinflation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value * 1000000000);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 animate-pulse" />
            <span>Loading global market intelligence...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Market Intelligence
              </CardTitle>
              <CardDescription>
                Comprehensive market analysis and expansion planning for global growth
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north_america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
                  <SelectItem value="latin_america">Latin America</SelectItem>
                  <SelectItem value="middle_east">Middle East</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Markets</p>
                <p className="text-2xl font-semibold">{markets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Combined Market Size</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(markets.reduce((sum, m) => sum + m.marketOpportunity.marketSize.value, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Population</p>
                <p className="text-2xl font-semibold">
                  {(markets.reduce((sum, m) => sum + m.countries.reduce((cSum, c) => cSum + c.population, 0), 0) / 1000000000).toFixed(1)}B
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Growth Rate</p>
                <p className="text-2xl font-semibold">
                  {(markets.reduce((sum, m) => sum + m.marketOpportunity.marketSize.growth, 0) / markets.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="markets">Market Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="country">Country Deep Dive</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredMarkets.map((market) => {
              const entryScore = calculateMarketEntryScore(market.region.toLowerCase().replace(' ', '_'));
              
              return (
                <Card key={market.region}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{market.region}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Entry Score: {entryScore.toFixed(0)}
                        </Badge>
                        <Badge className={getCompetitionColor(market.marketOpportunity.competitionLevel)}>
                          {market.marketOpportunity.competitionLevel} competition
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Market Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Market Size:</span>
                        <span className="font-medium ml-2">{formatCurrency(market.marketOpportunity.marketSize.value)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Growth Rate:</span>
                        <span className="font-medium ml-2 text-green-600">+{market.marketOpportunity.marketSize.growth}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Digital Adoption:</span>
                        <span className="font-medium ml-2">{market.digitalAdoption.digitalPaymentAdoption}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Countries:</span>
                        <span className="font-medium ml-2">{market.countries.length}</span>
                      </div>
                    </div>

                    {/* Digital Adoption Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Digital Payment Adoption</span>
                        <span>{market.digitalAdoption.digitalPaymentAdoption}%</span>
                      </div>
                      <Progress value={market.digitalAdoption.digitalPaymentAdoption} className="h-2" />
                    </div>

                    {/* Key Opportunities */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Key Opportunities
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {market.marketOpportunity.keyOpportunities.slice(0, 3).map((opp, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {opp}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Countries */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Countries
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {market.countries.map((country) => (
                          <Button
                            key={country.code}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setSelectedCountry(country.code);
                              // Switch to country tab
                              const countryTab = document.querySelector('[value="country"]') as HTMLElement;
                              if (countryTab) countryTab.click();
                            }}
                          >
                            {country.code} {country.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Currency Stability */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Currency Stability:</span>
                      <Badge className={getCurrencyStabilityColor(market.economicIndicators.currencyStability)}>
                        {market.economicIndicators.currencyStability}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Market Entry Recommendations
              </CardTitle>
              <CardDescription>
                Markets ranked by entry potential and opportunity score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((market, index) => {
                  const entryScore = calculateMarketEntryScore(market.region.toLowerCase().replace(' ', '_'));
                  
                  return (
                    <div key={market.region} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{market.region}</h3>
                            <p className="text-sm text-gray-600">{market.marketOpportunity.recommendedStrategy}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">{entryScore.toFixed(0)}</div>
                          <div className="text-xs text-gray-600">Entry Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Market Size:</span>
                          <span className="font-medium ml-2">{formatCurrency(market.marketOpportunity.marketSize.value)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Competition:</span>
                          <Badge className={getCompetitionColor(market.marketOpportunity.competitionLevel)} size="sm">
                            {market.marketOpportunity.competitionLevel}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Digital Adoption:</span>
                          <span className="font-medium ml-2">{market.digitalAdoption.digitalPaymentAdoption}%</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-2">Key Opportunities:</h4>
                        <div className="flex flex-wrap gap-1">
                          {market.marketOpportunity.keyOpportunities.map((opp, oppIndex) => (
                            <Badge key={oppIndex} variant="secondary" className="text-xs">
                              {opp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {markets.flatMap(market => 
                  market.countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.code} - {country.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCountryData && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {selectedCountryData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Capital:</span>
                      <span className="font-medium ml-2">{selectedCountryData.capital}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium ml-2">{selectedCountryData.currency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Population:</span>
                      <span className="font-medium ml-2">{(selectedCountryData.population / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-gray-600">GDP per Capita:</span>
                      <span className="font-medium ml-2">${selectedCountryData.gdpPerCapita.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Business Hours
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedCountryData.businessHours.start} - {selectedCountryData.businessHours.end} 
                      ({selectedCountryData.businessHours.timezone})
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCountryData.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Digital Metrics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      Digital Adoption
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Internet Penetration</span>
                        <span>{selectedCountryData.internetPenetration}%</span>
                      </div>
                      <Progress value={selectedCountryData.internetPenetration} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Mobile Penetration</span>
                        <span>{selectedCountryData.mobilePenetration}%</span>
                      </div>
                      <Progress value={Math.min(selectedCountryData.mobilePenetration, 100)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Banking Penetration</span>
                        <span>{selectedCountryData.bankingPenetration}%</span>
                      </div>
                      <Progress value={selectedCountryData.bankingPenetration} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCountryData.paymentMethods.map((method, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{method.type}</h4>
                          <Badge variant="outline" className="text-xs">
                            {method.adoption}% adoption
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Provider: {method.provider}</div>
                          <div>Fee: {method.processingFee}%</div>
                          <div>Settlement: {method.settlementTime}</div>
                          <div>Currencies: {method.currencies.join(', ')}</div>
                        </div>
                        
                        <div className="mt-2">
                          <Progress value={method.adoption} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Adaptations */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Cultural Adaptation Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getCulturalAdaptations(selectedCountryData.code).map((adaptation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{adaptation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Global Compliance Requirements
              </CardTitle>
              <CardDescription>
                Understanding regulatory requirements across different markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {markets.map((market) => (
                  <div key={market.region} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {market.region}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-blue-600">Data Protection</h4>
                        <ul className="text-sm space-y-1">
                          {market.regulatoryEnvironment.dataProtectionLaws.map((law, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Info className="w-3 h-3 text-blue-500" />
                              {law}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600">Financial Regulations</h4>
                        <ul className="text-sm space-y-1">
                          {market.regulatoryEnvironment.financialRegulations.map((reg, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Shield className="w-3 h-3 text-green-500" />
                              {reg}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-purple-600">License Requirements</h4>
                        <ul className="text-sm space-y-1">
                          {market.regulatoryEnvironment.licenseRequirements.map((license, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-purple-500" />
                              {license}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-orange-600">Sanctions Risk</h4>
                        <div className="flex items-center gap-2">
                          {market.regulatoryEnvironment.sanctionsRisk === 'low' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {market.regulatoryEnvironment.sanctionsRisk === 'medium' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {market.regulatoryEnvironment.sanctionsRisk === 'high' && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <Badge className={
                            market.regulatoryEnvironment.sanctionsRisk === 'low' ? 'bg-green-100 text-green-800' :
                            market.regulatoryEnvironment.sanctionsRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {market.regulatoryEnvironment.sanctionsRisk} risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}