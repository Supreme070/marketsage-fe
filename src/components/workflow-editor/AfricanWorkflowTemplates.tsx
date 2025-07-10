"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Globe,
  Clock,
  MessageSquare,
  Smartphone,
  Users,
  TrendingUp,
  Settings,
  Play,
  BarChart3,
  Calendar,
  Languages,
  Heart,
  Zap,
  Target,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface AfricanWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  target_countries: string[];
  primary_language: string;
  supported_languages: string[];
  cultural_considerations: string[];
  optimal_timing: {
    business_hours: { start: number; end: number };
    best_days: string[];
    avoid_periods: string[];
  };
  communication_preferences: {
    primary_channel: string;
    secondary_channels: string[];
    mobile_optimization: boolean;
  };
  success_metrics: {
    expected_open_rate: number;
    expected_click_rate: number;
    expected_conversion_rate: number;
  };
  african_optimizations: Array<{
    type: string;
    description: string;
    expected_improvement: number;
  }>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'NG': '🇳🇬',
  'KE': '🇰🇪', 
  'ZA': '🇿🇦',
  'GH': '🇬🇭',
  'UG': '🇺🇬',
  'TZ': '🇹🇿',
  'ET': '🇪🇹',
  'SN': '🇸🇳',
  'ML': '🇲🇱'
};

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'sw': 'Swahili',
  'ha': 'Hausa',
  'am': 'Amharic',
  'zu': 'Zulu',
  'af': 'Afrikaans',
  'xh': 'Xhosa',
  'fr': 'French',
  'wo': 'Wolof',
  'ig': 'Igbo',
  'yo': 'Yoruba'
};

const CHANNEL_ICONS: Record<string, any> = {
  'sms': MessageSquare,
  'whatsapp': MessageSquare,
  'email': MessageSquare
};

export function AfricanWorkflowTemplates() {
  const [templates, setTemplates] = useState<AfricanWorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deployingTemplate, setDeployingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCountry, selectedLanguage]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      let url = '/api/workflows/templates/african?action=list';
      
      if (selectedCountry !== 'all') {
        url = `/api/workflows/templates/african?action=by-country&country=${selectedCountry}`;
      } else if (selectedLanguage !== 'all') {
        url = `/api/workflows/templates/african?action=by-language&language=${selectedLanguage}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading African workflow templates');
    } finally {
      setLoading(false);
    }
  };

  const deployTemplate = async (templateId: string, customizations?: any) => {
    try {
      setDeployingTemplate(templateId);
      
      const response = await fetch('/api/workflows/templates/african', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          templateId,
          customizations
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('African workflow template deployed successfully', {
          description: `Workflow ID: ${data.workflowId} with ${data.optimizations_applied} optimizations applied`
        });
      } else {
        toast.error('Failed to deploy template');
      }
    } catch (error) {
      console.error('Error deploying template:', error);
      toast.error('Error deploying workflow template');
    } finally {
      setDeployingTemplate(null);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.target_countries.some(country => 
      country.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getChannelIcon = (channel: string) => {
    const Icon = CHANNEL_ICONS[channel] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getOptimizationColor = (type: string) => {
    const colors: Record<string, string> = {
      'timing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'cultural': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'channel': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'language': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'payment': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'content': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            African Workflow Templates
          </h2>
          <p className="text-muted-foreground">
            Pre-built, culturally optimized workflows for African markets
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {filteredTemplates.length} Templates Available
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Search Templates</Label>
              <Input
                id="search"
                placeholder="Search by name, description, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="country">Filter by Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                  <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="ZA">🇿🇦 South Africa</SelectItem>
                  <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                  <SelectItem value="UG">🇺🇬 Uganda</SelectItem>
                  <SelectItem value="TZ">🇹🇿 Tanzania</SelectItem>
                  <SelectItem value="ET">🇪🇹 Ethiopia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Filter by Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="am">Amharic</SelectItem>
                  <SelectItem value="zu">Zulu</SelectItem>
                  <SelectItem value="af">Afrikaans</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchTemplates} className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-2">
                    {template.target_countries.slice(0, 3).map(country => (
                      <span key={country} className="text-lg">
                        {COUNTRY_FLAGS[country] || '🌍'}
                      </span>
                    ))}
                    {template.target_countries.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.target_countries.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Features */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Primary:</span>
                    <Badge variant="outline" className="text-xs">
                      {LANGUAGE_NAMES[template.primary_language]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(template.communication_preferences.primary_channel)}
                    <span className="text-muted-foreground">Channel:</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.communication_preferences.primary_channel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Hours:</span>
                    <Badge variant="outline" className="text-xs">
                      {template.optimal_timing.business_hours.start}:00-{template.optimal_timing.business_hours.end}:00
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mobile:</span>
                    <Badge variant={template.communication_preferences.mobile_optimization ? "default" : "outline"} className="text-xs">
                      {template.communication_preferences.mobile_optimization ? 'Optimized' : 'Standard'}
                    </Badge>
                  </div>
                </div>

                {/* Success Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {(template.success_metrics.expected_open_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {(template.success_metrics.expected_click_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Click Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {(template.success_metrics.expected_conversion_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Conversion</div>
                  </div>
                </div>

                {/* African Optimizations */}
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    African Market Optimizations
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.african_optimizations.slice(0, 3).map((opt, index) => (
                      <Badge key={index} className={`text-xs ${getOptimizationColor(opt.type)}`}>
                        {opt.type} (+{(opt.expected_improvement * 100).toFixed(0)}%)
                      </Badge>
                    ))}
                    {template.african_optimizations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.african_optimizations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          {template.name}
                        </DialogTitle>
                        <DialogDescription>
                          {template.description}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="cultural">Cultural</TabsTrigger>
                          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
                          <TabsTrigger value="timing">Timing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Target Countries</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {template.target_countries.map(country => (
                                    <Badge key={country} variant="outline">
                                      {COUNTRY_FLAGS[country]} {country}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Supported Languages</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {template.supported_languages.map(lang => (
                                    <Badge key={lang} variant="outline">
                                      {LANGUAGE_NAMES[lang] || lang}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Expected Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {(template.success_metrics.expected_open_rate * 100).toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">Expected Open Rate</div>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {(template.success_metrics.expected_click_rate * 100).toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">Expected Click Rate</div>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {(template.success_metrics.expected_conversion_rate * 100).toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">Expected Conversion</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="cultural" className="space-y-4 mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Cultural Considerations</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-2">
                                {template.cultural_considerations.map((consideration, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm capitalize">
                                      {consideration.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="optimizations" className="space-y-4 mt-4">
                          <div className="grid gap-3">
                            {template.african_optimizations.map((optimization, index) => (
                              <Card key={index}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <Badge className={`mb-2 ${getOptimizationColor(optimization.type)}`}>
                                        {optimization.type.toUpperCase()}
                                      </Badge>
                                      <p className="text-sm">{optimization.description}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-4">
                                      +{(optimization.expected_improvement * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="timing" className="space-y-4 mt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Optimal Timing</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Business Hours</Label>
                                  <div className="font-medium">
                                    {template.optimal_timing.business_hours.start}:00 - {template.optimal_timing.business_hours.end}:00
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Best Days</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {template.optimal_timing.best_days.map(day => (
                                      <Badge key={day} variant="outline" className="text-xs capitalize">
                                        {day}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Avoid Periods</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {template.optimal_timing.avoid_periods.map((period, index) => (
                                    <div key={index} className="text-sm text-muted-foreground capitalize">
                                      • {period.replace(/_/g, ' ')}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => deployTemplate(template.id)}
                    disabled={deployingTemplate === template.id}
                  >
                    {deployingTemplate === template.id ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Deploy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card className="text-center py-8">
          <CardContent>
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search criteria to find African workflow templates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}