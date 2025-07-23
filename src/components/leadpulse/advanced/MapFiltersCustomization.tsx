/**
 * Map Filters and Customization Component
 * 
 * Advanced filtering and customization options for the 3D visitor map
 * with real-time filter application and custom visualization settings.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  Settings, 
  Palette, 
  Eye, 
  EyeOff,
  Target,
  Users,
  Activity,
  MapPin,
  Clock,
  Globe,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Save,
  Upload,
  Download,
  Share,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  Search,
  Calendar,
  Star,
  Heart,
  Bookmark,
  Flag,
  AlertCircle,
  Info,
  HelpCircle
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface FilterCriteria {
  timeRange: string;
  deviceTypes: string[];
  countries: string[];
  cities: string[];
  engagementLevel: string[];
  conversionStatus: string[];
  minimumVisitCount: number;
  maximumVisitCount: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  customFilters: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface CustomizationSettings {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red';
  markerSize: number;
  clusterSize: number;
  animationSpeed: number;
  opacity: number;
  showLabels: boolean;
  showMetrics: boolean;
  showGrid: boolean;
  showCompass: boolean;
  autoRotate: boolean;
  particleEffects: boolean;
  heatmapIntensity: number;
  trailLength: number;
  customStyles: {
    backgroundColor: string;
    gridColor: string;
    markerColor: string;
    clusterColor: string;
    heatmapColors: string[];
  };
}

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  criteria: FilterCriteria;
  createdAt: Date;
  isDefault: boolean;
}

interface MapFiltersCustomizationProps {
  visitorLocations: VisitorLocation[];
  currentFilters: FilterCriteria;
  currentSettings: CustomizationSettings;
  onFiltersChange: (filters: FilterCriteria) => void;
  onSettingsChange: (settings: CustomizationSettings) => void;
  onSaveFilter: (filter: SavedFilter) => void;
  onLoadFilter: (filter: SavedFilter) => void;
  savedFilters?: SavedFilter[];
}

/**
 * Map Filters and Customization Component
 */
export function MapFiltersCustomization({
  visitorLocations,
  currentFilters,
  currentSettings,
  onFiltersChange,
  onSettingsChange,
  onSaveFilter,
  onLoadFilter,
  savedFilters = []
}: MapFiltersCustomizationProps) {
  const [activeTab, setActiveTab] = useState<'filters' | 'customize' | 'saved'>('filters');
  const [tempFilters, setTempFilters] = useState<FilterCriteria>(currentFilters);
  const [tempSettings, setTempSettings] = useState<CustomizationSettings>(currentSettings);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveFilterDescription, setSaveFilterDescription] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract unique values for filter dropdowns
  const uniqueCountries = [...new Set(visitorLocations.map(v => v.country))];
  const uniqueCities = [...new Set(visitorLocations.map(v => v.city))];
  const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];
  const engagementLevels = ['Low', 'Medium', 'High'];
  const conversionStatuses = ['Converted', 'Active', 'Inactive'];

  // Apply filters in real-time
  useEffect(() => {
    if (isPreviewMode) {
      onFiltersChange(tempFilters);
      onSettingsChange(tempSettings);
    }
  }, [tempFilters, tempSettings, isPreviewMode, onFiltersChange, onSettingsChange]);

  // Update temporary filters
  const updateTempFilters = (updates: Partial<FilterCriteria>) => {
    setTempFilters(prev => ({ ...prev, ...updates }));
  };

  // Update temporary settings
  const updateTempSettings = (updates: Partial<CustomizationSettings>) => {
    setTempSettings(prev => ({ ...prev, ...updates }));
  };

  // Apply changes permanently
  const applyChanges = () => {
    onFiltersChange(tempFilters);
    onSettingsChange(tempSettings);
    setIsPreviewMode(false);
  };

  // Reset to current values
  const resetChanges = () => {
    setTempFilters(currentFilters);
    setTempSettings(currentSettings);
    setIsPreviewMode(false);
  };

  // Save current filter configuration
  const saveCurrentFilter = () => {
    if (!saveFilterName) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName,
      description: saveFilterDescription,
      criteria: tempFilters,
      createdAt: new Date(),
      isDefault: false
    };

    onSaveFilter(newFilter);
    setSaveFilterName('');
    setSaveFilterDescription('');
  };

  // Load saved filter
  const loadSavedFilter = (filter: SavedFilter) => {
    setTempFilters(filter.criteria);
    onLoadFilter(filter);
  };

  // Add custom filter
  const addCustomFilter = () => {
    updateTempFilters({
      customFilters: [
        ...tempFilters.customFilters,
        { field: 'city', operator: 'equals', value: '' }
      ]
    });
  };

  // Remove custom filter
  const removeCustomFilter = (index: number) => {
    updateTempFilters({
      customFilters: tempFilters.customFilters.filter((_, i) => i !== index)
    });
  };

  // Get filter summary
  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (tempFilters.timeRange !== 'all') activeFilters.push(`Time: ${tempFilters.timeRange}`);
    if (tempFilters.deviceTypes.length > 0) activeFilters.push(`Devices: ${tempFilters.deviceTypes.length}`);
    if (tempFilters.countries.length > 0) activeFilters.push(`Countries: ${tempFilters.countries.length}`);
    if (tempFilters.cities.length > 0) activeFilters.push(`Cities: ${tempFilters.cities.length}`);
    if (tempFilters.engagementLevel.length > 0) activeFilters.push(`Engagement: ${tempFilters.engagementLevel.length}`);
    if (tempFilters.conversionStatus.length > 0) activeFilters.push(`Conversion: ${tempFilters.conversionStatus.length}`);
    if (tempFilters.customFilters.length > 0) activeFilters.push(`Custom: ${tempFilters.customFilters.length}`);
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Map Filters & Customization
          </CardTitle>
          <CardDescription>
            Advanced filtering and customization options for the visitor map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={isPreviewMode} 
                onCheckedChange={setIsPreviewMode}
              />
              <span className="text-sm">Live Preview</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={applyChanges}
                disabled={!isPreviewMode}
              >
                <Check className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={resetChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex-1 text-sm text-muted-foreground">
              {getFilterSummary()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Range */}
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select 
                  value={tempFilters.timeRange} 
                  onValueChange={(value) => updateTempFilters({ timeRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device Types */}
              <div className="space-y-2">
                <Label>Device Types</Label>
                <div className="flex flex-wrap gap-2">
                  {deviceTypes.map(device => (
                    <div key={device} className="flex items-center space-x-2">
                      <Checkbox
                        id={device}
                        checked={tempFilters.deviceTypes.includes(device)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateTempFilters({
                              deviceTypes: [...tempFilters.deviceTypes, device]
                            });
                          } else {
                            updateTempFilters({
                              deviceTypes: tempFilters.deviceTypes.filter(d => d !== device)
                            });
                          }
                        }}
                      />
                      <label htmlFor={device} className="text-sm">{device}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countries */}
              <div className="space-y-2">
                <Label>Countries</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {uniqueCountries.map(country => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={country}
                        checked={tempFilters.countries.includes(country)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateTempFilters({
                              countries: [...tempFilters.countries, country]
                            });
                          } else {
                            updateTempFilters({
                              countries: tempFilters.countries.filter(c => c !== country)
                            });
                          }
                        }}
                      />
                      <label htmlFor={country} className="text-sm">{country}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Level */}
              <div className="space-y-2">
                <Label>Engagement Level</Label>
                <div className="flex flex-wrap gap-2">
                  {engagementLevels.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={tempFilters.engagementLevel.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateTempFilters({
                              engagementLevel: [...tempFilters.engagementLevel, level]
                            });
                          } else {
                            updateTempFilters({
                              engagementLevel: tempFilters.engagementLevel.filter(l => l !== level)
                            });
                          }
                        }}
                      />
                      <label htmlFor={level} className="text-sm">{level}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit Count Range */}
              <div className="space-y-2">
                <Label>Visit Count Range</Label>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Minimum: {tempFilters.minimumVisitCount}</Label>
                    <Slider
                      value={[tempFilters.minimumVisitCount]}
                      onValueChange={([value]) => updateTempFilters({ minimumVisitCount: value })}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Maximum: {tempFilters.maximumVisitCount}</Label>
                    <Slider
                      value={[tempFilters.maximumVisitCount]}
                      onValueChange={([value]) => updateTempFilters({ maximumVisitCount: value })}
                      max={1000}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Advanced Filters</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showAdvancedFilters && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    {tempFilters.customFilters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={filter.field}
                          onValueChange={(value) => {
                            const newFilters = [...tempFilters.customFilters];
                            newFilters[index].field = value;
                            updateTempFilters({ customFilters: newFilters });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="city">City</SelectItem>
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="device">Device</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => {
                            const newFilters = [...tempFilters.customFilters];
                            newFilters[index].operator = value;
                            updateTempFilters({ customFilters: newFilters });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={filter.value}
                          onChange={(e) => {
                            const newFilters = [...tempFilters.customFilters];
                            newFilters[index].value = e.target.value;
                            updateTempFilters({ customFilters: newFilters });
                          }}
                          placeholder="Value"
                          className="flex-1"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomFilter(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomFilter}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={tempSettings.theme} 
                  onValueChange={(value) => updateTempSettings({ theme: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <Select 
                  value={tempSettings.colorScheme} 
                  onValueChange={(value) => updateTempSettings({ colorScheme: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visual Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Marker Size: {tempSettings.markerSize}</Label>
                  <Slider
                    value={[tempSettings.markerSize]}
                    onValueChange={([value]) => updateTempSettings({ markerSize: value })}
                    max={20}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Animation Speed: {tempSettings.animationSpeed}x</Label>
                  <Slider
                    value={[tempSettings.animationSpeed]}
                    onValueChange={([value]) => updateTempSettings({ animationSpeed: value })}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opacity: {tempSettings.opacity}%</Label>
                  <Slider
                    value={[tempSettings.opacity]}
                    onValueChange={([value]) => updateTempSettings({ opacity: value })}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heatmap Intensity: {tempSettings.heatmapIntensity}%</Label>
                  <Slider
                    value={[tempSettings.heatmapIntensity]}
                    onValueChange={([value]) => updateTempSettings({ heatmapIntensity: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLabels"
                    checked={tempSettings.showLabels}
                    onCheckedChange={(checked) => updateTempSettings({ showLabels: checked as boolean })}
                  />
                  <label htmlFor="showLabels" className="text-sm">Show Labels</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showMetrics"
                    checked={tempSettings.showMetrics}
                    onCheckedChange={(checked) => updateTempSettings({ showMetrics: checked as boolean })}
                  />
                  <label htmlFor="showMetrics" className="text-sm">Show Metrics</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showGrid"
                    checked={tempSettings.showGrid}
                    onCheckedChange={(checked) => updateTempSettings({ showGrid: checked as boolean })}
                  />
                  <label htmlFor="showGrid" className="text-sm">Show Grid</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoRotate"
                    checked={tempSettings.autoRotate}
                    onCheckedChange={(checked) => updateTempSettings({ autoRotate: checked as boolean })}
                  />
                  <label htmlFor="autoRotate" className="text-sm">Auto Rotate</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="particleEffects"
                    checked={tempSettings.particleEffects}
                    onCheckedChange={(checked) => updateTempSettings({ particleEffects: checked as boolean })}
                  />
                  <label htmlFor="particleEffects" className="text-sm">Particle Effects</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Filters</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Save Current Filter */}
              <div className="space-y-4 p-4 border rounded-lg mb-4">
                <h4 className="font-medium">Save Current Configuration</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Filter name"
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={saveFilterDescription}
                    onChange={(e) => setSaveFilterDescription(e.target.value)}
                  />
                  <Button onClick={saveCurrentFilter} disabled={!saveFilterName}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Filter
                  </Button>
                </div>
              </div>

              {/* Saved Filters List */}
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{filter.name}</h4>
                        {filter.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{filter.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {filter.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedFilter(filter)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Load
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
                
                {savedFilters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No saved filters yet</p>
                    <p className="text-sm">Save your current configuration to reuse it later</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MapFiltersCustomization;