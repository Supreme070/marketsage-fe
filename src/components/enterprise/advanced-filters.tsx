"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Filter,
  Calendar as CalendarIcon,
  Search,
  X,
  Save,
  RefreshCw,
  Download,
  Settings,
  Users,
  Globe,
  TrendingUp,
  Activity,
  Building2
} from "lucide-react";
import { format } from "date-fns";

interface FilterCriteria {
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset?: string;
  };
  geography: {
    countries: string[];
    regions: string[];
    cities: string[];
  };
  demographics: {
    ageGroups: string[];
    segments: string[];
    ltv: {
      min: number;
      max: number;
    };
    churnRisk: {
      min: number;
      max: number;
    };
  };
  performance: {
    conversionRate: {
      min: number;
      max: number;
    };
    engagementScore: {
      min: number;
      max: number;
    };
    channels: string[];
  };
  compliance: {
    kycStatus: string[];
    riskLevels: string[];
    regulatoryFlags: string[];
  };
  campaigns: {
    types: string[];
    statuses: string[];
    sources: string[];
  };
  search: string;
}

interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  isShared: boolean;
  createdBy: string;
  createdAt: Date;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  initialFilters?: Partial<FilterCriteria>;
  dataType: 'customers' | 'campaigns' | 'analytics' | 'all';
}

export default function AdvancedFilters({ 
  onFiltersChange, 
  initialFilters = {},
  dataType = 'all'
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    dateRange: { from: null, to: null },
    geography: { countries: [], regions: [], cities: [] },
    demographics: { 
      ageGroups: [], 
      segments: [], 
      ltv: { min: 0, max: 500000 },
      churnRisk: { min: 0, max: 100 }
    },
    performance: {
      conversionRate: { min: 0, max: 100 },
      engagementScore: { min: 0, max: 100 },
      channels: []
    },
    compliance: {
      kycStatus: [],
      riskLevels: [],
      regulatoryFlags: []
    },
    campaigns: {
      types: [],
      statuses: [],
      sources: []
    },
    search: '',
    ...initialFilters
  });

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Filter options based on African fintech context
  const filterOptions = {
    countries: [
      'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt', 'Morocco',
      'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Senegal', 'Ivory Coast'
    ],
    regions: [
      'West Africa', 'East Africa', 'North Africa', 'Southern Africa',
      'Lagos', 'Nairobi', 'Cairo', 'Cape Town', 'Accra', 'Casablanca'
    ],
    ageGroups: [
      '18-25', '26-35', '36-45', '46-55', '56-65', '65+'
    ],
    segments: [
      'High-Value Corporate', 'SME Growth', 'Retail Premium', 'Youth Banking',
      'Diaspora Remittance', 'Islamic Banking', 'Micro-finance', 'Digital First'
    ],
    channels: [
      'Email', 'SMS', 'WhatsApp', 'Mobile App', 'Website', 'Social Media',
      'USSD', 'Agent Network', 'Bank Branch'
    ],
    kycStatus: [
      'Verified', 'Pending', 'Incomplete', 'Rejected', 'Enhanced Due Diligence'
    ],
    riskLevels: [
      'Low', 'Medium', 'High', 'Critical'
    ],
    campaignTypes: [
      'Onboarding', 'Retention', 'Cross-sell', 'Upsell', 'Win-back',
      'Product Launch', 'Seasonal', 'Compliance'
    ],
    campaignStatuses: [
      'Active', 'Paused', 'Completed', 'Draft', 'Scheduled'
    ],
    sources: [
      'Organic', 'Paid Search', 'Social Media', 'Email Marketing',
      'Referral', 'Agent Network', 'Partnership', 'Direct'
    ]
  };

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.geography.countries.length > 0) count++;
    if (filters.demographics.segments.length > 0) count++;
    if (filters.performance.channels.length > 0) count++;
    if (filters.compliance.kycStatus.length > 0) count++;
    if (filters.campaigns.types.length > 0) count++;
    
    setActiveFiltersCount(count);
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (section: keyof FilterCriteria, field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayFilter = (section: keyof FilterCriteria, field: string, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = (prev[section] as any)[field] || [];
      const newArray = checked 
        ? [...currentArray, value]
        : currentArray.filter((item: string) => item !== value);
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      geography: { countries: [], regions: [], cities: [] },
      demographics: { 
        ageGroups: [], 
        segments: [], 
        ltv: { min: 0, max: 500000 },
        churnRisk: { min: 0, max: 100 }
      },
      performance: {
        conversionRate: { min: 0, max: 100 },
        engagementScore: { min: 0, max: 100 },
        channels: []
      },
      compliance: {
        kycStatus: [],
        riskLevels: [],
        regulatoryFlags: []
      },
      campaigns: {
        types: [],
        statuses: [],
        sources: []
      },
      search: ''
    });
  };

  const saveCurrentFilter = async () => {
    const name = prompt('Enter a name for this filter:');
    if (!name) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      criteria: filters,
      isShared: false,
      createdBy: 'current-user',
      createdAt: new Date()
    };

    setSavedFilters(prev => [...prev, newFilter]);
    // In production, save to backend
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.criteria);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filter data across multiple dimensions for detailed analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={saveCurrentFilter}>
              <Save className="w-4 h-4 mr-1" />
              Save Filter
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Quick Search */}
          <div className="space-y-2">
            <Label>Quick Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers, campaigns, or any text..."
                value={filters.search}
                onChange={(e) => updateFilter('search', '', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="datetime" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="datetime">Date & Time</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="datetime" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                              {format(filters.dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(filters.dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange.from || undefined}
                        selected={{
                          from: filters.dateRange.from || undefined,
                          to: filters.dateRange.to || undefined
                        }}
                        onSelect={(range) => updateFilter('dateRange', '', range)}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Quick Presets</Label>
                  <Select onValueChange={(value) => {
                    const today = new Date();
                    let from: Date, to: Date = today;
                    
                    switch (value) {
                      case 'today':
                        from = today;
                        break;
                      case 'yesterday':
                        from = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                        to = from;
                        break;
                      case 'last7days':
                        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                      case 'last30days':
                        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                      case 'last90days':
                        from = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                      default:
                        return;
                    }
                    
                    updateFilter('dateRange', '', { from, to, preset: value });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last7days">Last 7 days</SelectItem>
                      <SelectItem value="last30days">Last 30 days</SelectItem>
                      <SelectItem value="last90days">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Countries
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filterOptions.countries.map((country) => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                          id={`country-${country}`}
                          checked={filters.geography.countries.includes(country)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('geography', 'countries', country, !!checked)
                          }
                        />
                        <Label htmlFor={`country-${country}`} className="text-sm">
                          {country}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Regions/Cities</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filterOptions.regions.map((region) => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={`region-${region}`}
                          checked={filters.geography.regions.includes(region)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('geography', 'regions', region, !!checked)
                          }
                        />
                        <Label htmlFor={`region-${region}`} className="text-sm">
                          {region}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Customer Segments
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filterOptions.segments.map((segment) => (
                        <div key={segment} className="flex items-center space-x-2">
                          <Checkbox
                            id={`segment-${segment}`}
                            checked={filters.demographics.segments.includes(segment)}
                            onCheckedChange={(checked) => 
                              updateArrayFilter('demographics', 'segments', segment, !!checked)
                            }
                          />
                          <Label htmlFor={`segment-${segment}`} className="text-sm">
                            {segment}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Age Groups</Label>
                    <div className="space-y-2">
                      {filterOptions.ageGroups.map((age) => (
                        <div key={age} className="flex items-center space-x-2">
                          <Checkbox
                            id={`age-${age}`}
                            checked={filters.demographics.ageGroups.includes(age)}
                            onCheckedChange={(checked) => 
                              updateArrayFilter('demographics', 'ageGroups', age, !!checked)
                            }
                          />
                          <Label htmlFor={`age-${age}`} className="text-sm">
                            {age}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Lifetime Value Range</Label>
                    <div className="px-3">
                      <Slider
                        value={[filters.demographics.ltv.min, filters.demographics.ltv.max]}
                        onValueChange={([min, max]) => {
                          updateFilter('demographics', 'ltv', { min, max });
                        }}
                        max={500000}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>${filters.demographics.ltv.min.toLocaleString()}</span>
                        <span>${filters.demographics.ltv.max.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Churn Risk (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[filters.demographics.churnRisk.min, filters.demographics.churnRisk.max]}
                        onValueChange={([min, max]) => {
                          updateFilter('demographics', 'churnRisk', { min, max });
                        }}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{filters.demographics.churnRisk.min}%</span>
                        <span>{filters.demographics.churnRisk.max}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Communication Channels
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filterOptions.channels.map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={filters.performance.channels.includes(channel)}
                            onCheckedChange={(checked) => 
                              updateArrayFilter('performance', 'channels', channel, !!checked)
                            }
                          />
                          <Label htmlFor={`channel-${channel}`} className="text-sm">
                            {channel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Conversion Rate (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[filters.performance.conversionRate.min, filters.performance.conversionRate.max]}
                        onValueChange={([min, max]) => {
                          updateFilter('performance', 'conversionRate', { min, max });
                        }}
                        max={100}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{filters.performance.conversionRate.min}%</span>
                        <span>{filters.performance.conversionRate.max}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Engagement Score</Label>
                    <div className="px-3">
                      <Slider
                        value={[filters.performance.engagementScore.min, filters.performance.engagementScore.max]}
                        onValueChange={([min, max]) => {
                          updateFilter('performance', 'engagementScore', { min, max });
                        }}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{filters.performance.engagementScore.min}</span>
                        <span>{filters.performance.engagementScore.max}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>KYC Status</Label>
                  <div className="space-y-2">
                    {filterOptions.kycStatus.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`kyc-${status}`}
                          checked={filters.compliance.kycStatus.includes(status)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('compliance', 'kycStatus', status, !!checked)
                          }
                        />
                        <Label htmlFor={`kyc-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Risk Levels</Label>
                  <div className="space-y-2">
                    {filterOptions.riskLevels.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`risk-${level}`}
                          checked={filters.compliance.riskLevels.includes(level)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('compliance', 'riskLevels', level, !!checked)
                          }
                        />
                        <Label htmlFor={`risk-${level}`} className="text-sm">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Regulatory Status</Label>
                  <div className="space-y-2">
                    {['Compliant', 'Under Review', 'Non-Compliant', 'Exempt'].map((flag) => (
                      <div key={flag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`regulatory-${flag}`}
                          checked={filters.compliance.regulatoryFlags.includes(flag)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('compliance', 'regulatoryFlags', flag, !!checked)
                          }
                        />
                        <Label htmlFor={`regulatory-${flag}`} className="text-sm">
                          {flag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>Campaign Types</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filterOptions.campaignTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`campaign-type-${type}`}
                          checked={filters.campaigns.types.includes(type)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('campaigns', 'types', type, !!checked)
                          }
                        />
                        <Label htmlFor={`campaign-type-${type}`} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Campaign Status</Label>
                  <div className="space-y-2">
                    {filterOptions.campaignStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`campaign-status-${status}`}
                          checked={filters.campaigns.statuses.includes(status)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('campaigns', 'statuses', status, !!checked)
                          }
                        />
                        <Label htmlFor={`campaign-status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Traffic Sources</Label>
                  <div className="space-y-2">
                    {filterOptions.sources.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source}`}
                          checked={filters.campaigns.sources.includes(source)}
                          onCheckedChange={(checked) => 
                            updateArrayFilter('campaigns', 'sources', source, !!checked)
                          }
                        />
                        <Label htmlFor={`source-${source}`} className="text-sm">
                          {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="border-t pt-4">
              <Label className="mb-3 block">Saved Filters</Label>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((savedFilter) => (
                  <Button
                    key={savedFilter.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedFilter(savedFilter)}
                    className="text-xs"
                  >
                    {savedFilter.name}
                    {savedFilter.isShared && <Badge variant="secondary" className="ml-1 text-xs">Shared</Badge>}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 