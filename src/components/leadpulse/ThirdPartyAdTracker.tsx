'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Users,
  Tag,
  Filter,
  Download
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  platform: 'Facebook' | 'Google' | 'Instagram' | 'LinkedIn' | 'Marketplace';
  impressions: number;
  clicks: number;
  spend: number; // in NGN
  conversions: number;
  revenue: number; // in NGN
}

interface PlatformData {
  platform: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roi: number;
}

export default function ThirdPartyAdTracker() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  useEffect(() => {
    setLoading(true);

    // Mock campaigns with Nigerian business context
    const mock: Campaign[] = [
      {
        id: 'gtb-jumia',
        name: 'GTB Bank – Jumia Listing',
        platform: 'Marketplace',
        impressions: 122345,
        clicks: 5423,
        spend: 850000,
        conversions: 678,
        revenue: 4275000
      },
      {
        id: 'flutterwave-fb',
        name: 'Flutterwave – Facebook Lead Ads',
        platform: 'Facebook',
        impressions: 95432,
        clicks: 6789,
        spend: 650000,
        conversions: 723,
        revenue: 5122500
      },
      {
        id: 'opay-google',
        name: 'Opay – Google Search ("Transfer Money")',
        platform: 'Google',
        impressions: 187654,
        clicks: 12345,
        spend: 1200000,
        conversions: 1432,
        revenue: 10024000
      },
      {
        id: 'interswitch-insta',
        name: 'Interswitch – Instagram Carousel',
        platform: 'Instagram',
        impressions: 70321,
        clicks: 4567,
        spend: 430000,
        conversions: 389,
        revenue: 2431250
      },
      {
        id: 'piggyvest-linkedin',
        name: 'PiggyVest – LinkedIn Sponsored Content',
        platform: 'LinkedIn',
        impressions: 48213,
        clicks: 2314,
        spend: 520000,
        conversions: 254,
        revenue: 1840500
      }
    ];

    // Aggregate by platform
    const aggregates: Record<string, Omit<PlatformData, 'platform' | 'roi'>> = {
      Facebook: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 },
      Google: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 },
      Instagram: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 },
      LinkedIn: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 },
      Marketplace: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
    };

    mock.forEach((c) => {
      const agg = aggregates[c.platform];
      agg.impressions += c.impressions;
      agg.clicks += c.clicks;
      agg.spend += c.spend;
      agg.conversions += c.conversions;
      agg.revenue += c.revenue;
    });

    const platformArr: PlatformData[] = Object.entries(aggregates).map(([platform, vals]) => ({
      platform,
      ...vals,
      roi: vals.spend === 0 ? 0 : ((vals.revenue - vals.spend) / vals.spend) * 100
    }));

    setTimeout(() => {
      setCampaigns(mock);
      setPlatformData(platformArr);
      setLoading(false);
    }, 500);
  }, []);

  const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', minimumFractionDigits: 0
  }).format(amount);

  const formatPercent = (num: number) => `${num.toFixed(1)}%`;

  const formatNumber = (num: number) => num.toLocaleString();

  // Calculate totals
  const totals = campaigns.reduce((acc, c) => {
    acc.impressions += c.impressions;
    acc.clicks += c.clicks;
    acc.spend += c.spend;
    acc.conversions += c.conversions;
    acc.revenue += c.revenue;
    return acc;
  }, { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });

  const totalCtr = totals.impressions === 0 ? 0 : (totals.clicks / totals.impressions) * 100;
  const totalRoi = totals.spend === 0 ? 0 : ((totals.revenue - totals.spend) / totals.spend) * 100;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Third-Party Ad Attribution
          </h2>
          <p className="text-sm text-muted-foreground">Cross-platform ad performance & ROI analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border">
            <Button 
              variant={selectedPlatform === 'all' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setSelectedPlatform('all')}
              className="text-xs h-7"
            >
              All
            </Button>
            <Button 
              variant={selectedPlatform === 'top' ? "default" : "ghost"} 
              size="sm"
              onClick={() => setSelectedPlatform('top')}
              className="text-xs h-7"
            >
              Top
            </Button>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-7 shadow-sm hover:shadow-md transition-all duration-200">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Ultra Compact Summary Metrics */}
      <div className="grid gap-3 grid-cols-5">
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/20 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-blue-100 dark:border-blue-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-3 w-3 text-blue-500" />
              <div className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px]">
                REACH
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
              {(totals.impressions / 1000).toFixed(0)}K
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Impressions</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/20 dark:via-gray-900 dark:to-green-950/20 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-green-100 dark:border-green-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <MousePointerClick className="h-3 w-3 text-green-500" />
              <div className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-[10px]">
                {formatPercent(totalCtr)}
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
              {(totals.clicks / 1000).toFixed(0)}K
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Clicks</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/20 dark:via-gray-900 dark:to-orange-950/20 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-orange-100 dark:border-orange-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-3 w-3 text-orange-500" />
              <div className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded text-[10px]">
                COST
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
              ₦{(totals.spend / 1000000).toFixed(1)}M
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Spend</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-gray-900 dark:to-purple-950/20 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-purple-100 dark:border-purple-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-3 w-3 text-purple-500" />
              <div className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-[10px]">
                REV
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
              ₦{(totals.revenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Revenue</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-teal-950/20 dark:via-gray-900 dark:to-teal-950/20 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-teal-100 dark:border-teal-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <Tag className="h-3 w-3 text-teal-500" />
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded text-[10px] ${
                totalRoi > 0 
                  ? 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' 
                  : 'text-red-600 bg-red-100 dark:bg-red-900/30'
              }`}>
                ROI
              </div>
            </div>
            <div className={`text-lg font-bold mb-0.5 ${
              totalRoi > 0 ? 'text-teal-600' : 'text-red-600'
            }`}>
              {formatPercent(totalRoi)}
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Return</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border h-9">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 transition-all duration-200 text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:shadow-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 transition-all duration-200 text-xs">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="attribution" className="data-[state=active]:shadow-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 transition-all duration-200 text-xs">
            Attribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3"></div>
            <div className="relative p-4">
              <div className="mb-3">
                <h3 className="text-md font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Platform Performance
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Revenue and ROI by platform</p>
              </div>
              <div className="space-y-2">
                {platformData
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((platform, index) => (
                    <div key={platform.platform} className="group relative overflow-hidden rounded-md bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.005] border border-gray-100 dark:border-gray-600">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-sm transform transition-transform duration-300 group-hover:scale-105 ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-green-400 to-blue-500' :
                            index === 2 ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                            index === 3 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                            'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`}>
                            <span className="font-bold text-white text-xs">{platform.platform[0]}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{platform.platform}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {formatNumber(platform.conversions)} conv • {formatPercent((platform.clicks / platform.impressions) * 100)} CTR
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-gray-900 dark:text-white">₦{(platform.revenue / 1000000).toFixed(1)}M</div>
                          <div className={`text-xs font-medium ${platform.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(platform.roi)} ROI
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4 mt-4">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/3 to-blue-500/3"></div>
            <div className="relative p-4">
              <div className="mb-3">
                <h3 className="text-md font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Campaign Performance
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Nigerian business campaigns</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Campaign</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Platform</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Clicks</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">CTR</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Spend</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Revenue</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => {
                      const ctr = campaign.impressions === 0 ? 0 : (campaign.clicks / campaign.impressions) * 100;
                      const roi = campaign.spend === 0 ? 0 : ((campaign.revenue - campaign.spend) / campaign.spend) * 100;
                      return (
                        <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-950/10 dark:hover:to-purple-950/10 transition-all duration-200">
                          <td className="p-2 font-medium text-gray-900 dark:text-white text-xs max-w-[200px] truncate">{campaign.name}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{campaign.platform}</Badge>
                          </td>
                          <td className="p-2 text-gray-700 dark:text-gray-300">{(campaign.clicks / 1000).toFixed(1)}K</td>
                          <td className="p-2 text-gray-700 dark:text-gray-300">{formatPercent(ctr)}</td>
                          <td className="p-2 text-gray-700 dark:text-gray-300">₦{(campaign.spend / 1000).toFixed(0)}K</td>
                          <td className="p-2 font-medium text-gray-900 dark:text-white">₦{(campaign.revenue / 1000000).toFixed(1)}M</td>
                          <td className={`p-2 font-medium ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(roi)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-4 mt-4">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 to-pink-500/3"></div>
            <div className="relative p-4">
              <div className="mb-3">
                <h3 className="text-md font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Revenue Attribution
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cross-platform impact analysis</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Revenue Distribution</h4>
                  {platformData
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((platform, index) => {
                      const percentage = (platform.revenue / totals.revenue) * 100;
                      return (
                        <div key={platform.platform} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700 dark:text-gray-300">{platform.platform}</span>
                            <span className="text-gray-900 dark:text-white">{formatPercent(percentage)}</span>
                          </div>
                          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 shadow-inner">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-1000 shadow-sm ${
                                index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                index === 3 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                'bg-gradient-to-r from-gray-500 to-gray-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Key Insights</h4>
                  <div className="space-y-2">
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-3 shadow-sm border border-blue-200 dark:border-blue-800">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                      <div className="relative">
                        <div className="font-medium text-blue-900 dark:text-blue-100 text-xs mb-1">🏆 Top ROI</div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-300">
                          Google: {formatPercent(platformData.find(p => p.platform === 'Google')?.roi || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 p-3 shadow-sm border border-green-200 dark:border-green-800">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
                      <div className="relative">
                        <div className="font-medium text-green-900 dark:text-green-100 text-xs mb-1">📈 Best CTR</div>
                        <div className="text-[10px] text-green-700 dark:text-green-300">
                          Facebook leads engagement
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 p-3 shadow-sm border border-amber-200 dark:border-amber-800">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                      <div className="relative">
                        <div className="font-medium text-amber-900 dark:text-amber-100 text-xs mb-1">💡 Optimize</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300">
                          Increase Google & FB budget
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 