"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Search, 
  TrendingUp, 
  Globe, 
  Edit3, 
  Zap, 
  BarChart3, 
  Eye, 
  Target, 
  Sparkles,
  RefreshCw,
  BookOpen,
  Hash,
  Share2,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Rocket,
  FileText,
  Users,
  Star,
  MessageSquare,
  Link2,
  Download,
  Plus,
  Lightbulb,
  Filter,
  ArrowRight,
  Flame,
  Crown,
  Coffee,
  Activity
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  trend: 'rising' | 'stable' | 'falling';
  competition: 'low' | 'medium' | 'high';
  opportunity: number;
  localRelevance: number;
}

interface ContentIdea {
  title: string;
  description: string;
  contentType: 'blog' | 'video' | 'infographic' | 'social' | 'email';
  targetKeywords: string[];
  estimatedTraffic: number;
  difficulty: number;
  viralPotential: number;
  culturalRelevance: number;
  trendAlignment: number;
}

interface SEOAuditResult {
  score: number;
  title: string;
  description: string;
  keywords: string[];
  issues: Array<{
    type: 'critical' | 'warning' | 'suggestion';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
}

interface ViralContent {
  title: string;
  hook: string;
  content: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok';
  hashtags: string[];
  engagement_prediction: number;
  virality_score: number;
  cultural_fit: number;
  timing_score: number;
}

export default function SEOContentMarketingHub() {
  const [activeTab, setActiveTab] = useState('keyword-research');
  const [isLoading, setIsLoading] = useState(false);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('nigeria');
  const [contentTopic, setContentTopic] = useState('');
  const [auditUrl, setAuditUrl] = useState('');
  const [viralTopic, setViralTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  
  // State for data
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [auditResults, setAuditResults] = useState<SEOAuditResult | null>(null);
  const [viralContent, setViralContent] = useState<ViralContent[]>([]);
  const [selectedContentType, setSelectedContentType] = useState('blog');

  // SEO Content Marketing Analytics Engine
  const seoAnalyticsEngine = {
    // Keyword Research with African Market Intelligence
    researchKeywords: async (query: string, market: string) => {
      try {
        const response = await fetch('/api/v2/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskType: 'KEYWORD_RESEARCH',
            context: {
              query,
              market,
              focus: 'African fintech and marketing automation',
              intent: 'Generate comprehensive keyword opportunities with local relevance'
            }
          })
        });
        
        if (!response.ok) throw new Error('Failed to research keywords');
        
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Keyword research error:', error);
        return [];
      }
    },

    // Content Ideas Generation with AI
    generateContentIdeas: async (topic: string, type: string, market: string) => {
      try {
        const response = await fetch('/api/v2/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskType: 'CONTENT_IDEATION',
            context: {
              topic,
              contentType: type,
              market,
              focus: 'African business culture and financial services',
              intent: 'Generate viral-worthy content ideas with cultural relevance'
            }
          })
        });
        
        if (!response.ok) throw new Error('Failed to generate content ideas');
        
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Content ideation error:', error);
        return [];
      }
    },

    // SEO Audit with Intelligence
    auditSEO: async (url: string) => {
      try {
        const response = await fetch('/api/v2/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskType: 'SEO_AUDIT',
            context: {
              url,
              focus: 'African market SEO optimization',
              intent: 'Comprehensive SEO analysis with actionable recommendations'
            }
          })
        });
        
        if (!response.ok) throw new Error('Failed to audit SEO');
        
        const result = await response.json();
        return result.data || null;
      } catch (error) {
        console.error('SEO audit error:', error);
        return null;
      }
    },

    // Viral Content Generation
    generateViralContent: async (topic: string, platform: string, market: string) => {
      try {
        const response = await fetch('/api/v2/ai/supreme-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskType: 'VIRAL_CONTENT_GENERATION',
            context: {
              topic,
              platform,
              market,
              focus: 'African social media trends and engagement patterns',
              intent: 'Create viral-worthy content with cultural intelligence'
            }
          })
        });
        
        if (!response.ok) throw new Error('Failed to generate viral content');
        
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('Viral content generation error:', error);
        return [];
      }
    }
  };

  // Keyword Research Handler
  const handleKeywordResearch = async () => {
    if (!keywordQuery.trim()) {
      toast.error('Please enter a keyword to research');
      return;
    }

    setIsLoading(true);
    try {
      const results = await seoAnalyticsEngine.researchKeywords(keywordQuery, selectedMarket);
      setKeywordData(results);
      toast.success(`Found ${results.length} keyword opportunities`);
    } catch (error) {
      toast.error('Failed to research keywords');
    } finally {
      setIsLoading(false);
    }
  };

  // Content Ideas Handler
  const handleContentIdeas = async () => {
    if (!contentTopic.trim()) {
      toast.error('Please enter a topic for content ideas');
      return;
    }

    setIsLoading(true);
    try {
      const ideas = await seoAnalyticsEngine.generateContentIdeas(contentTopic, selectedContentType, selectedMarket);
      setContentIdeas(ideas);
      toast.success(`Generated ${ideas.length} content ideas`);
    } catch (error) {
      toast.error('Failed to generate content ideas');
    } finally {
      setIsLoading(false);
    }
  };

  // SEO Audit Handler
  const handleSEOAudit = async () => {
    if (!auditUrl.trim()) {
      toast.error('Please enter a URL to audit');
      return;
    }

    setIsLoading(true);
    try {
      const audit = await seoAnalyticsEngine.auditSEO(auditUrl);
      setAuditResults(audit);
      toast.success('SEO audit completed');
    } catch (error) {
      toast.error('Failed to complete SEO audit');
    } finally {
      setIsLoading(false);
    }
  };

  // Viral Content Handler
  const handleViralContent = async () => {
    if (!viralTopic.trim()) {
      toast.error('Please enter a topic for viral content');
      return;
    }

    setIsLoading(true);
    try {
      const content = await seoAnalyticsEngine.generateViralContent(viralTopic, selectedPlatform, selectedMarket);
      setViralContent(content);
      toast.success(`Generated ${content.length} viral content variations`);
    } catch (error) {
      toast.error('Failed to generate viral content');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-500';
    if (difficulty <= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Content Marketing Hub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered content creation and SEO optimization for African markets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            <Activity className="h-3 w-3 mr-1" />
            AI Enhanced
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
            <Crown className="h-3 w-3 mr-1" />
            Supreme-AI v3
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keyword-research" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Keyword Research
          </TabsTrigger>
          <TabsTrigger value="content-ideas" className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Content Ideas
          </TabsTrigger>
          <TabsTrigger value="seo-audit" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            SEO Audit
          </TabsTrigger>
          <TabsTrigger value="viral-content" className="flex items-center">
            <Flame className="h-4 w-4 mr-2" />
            Viral Content
          </TabsTrigger>
        </TabsList>

        {/* Keyword Research Tab */}
        <TabsContent value="keyword-research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Keyword Research & Analysis
              </CardTitle>
              <CardDescription>
                Discover high-opportunity keywords with African market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="keyword-query">Keyword or Topic</Label>
                    <Input
                      id="keyword-query"
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      placeholder="e.g., mobile banking, fintech Nigeria..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-select">Target Market</Label>
                    <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                      <SelectTrigger id="market-select" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nigeria">Nigeria</SelectItem>
                        <SelectItem value="kenya">Kenya</SelectItem>
                        <SelectItem value="south-africa">South Africa</SelectItem>
                        <SelectItem value="ghana">Ghana</SelectItem>
                        <SelectItem value="africa">All Africa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleKeywordResearch} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Researching Keywords...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Research Keywords
                    </>
                  )}
                </Button>

                {keywordData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Keyword Opportunities</h3>
                      <Badge variant="outline">{keywordData.length} keywords found</Badge>
                    </div>
                    
                    <div className="grid gap-4">
                      {keywordData.map((keyword, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{keyword.keyword}</h4>
                                <Badge variant={keyword.trend === 'rising' ? 'default' : keyword.trend === 'stable' ? 'secondary' : 'destructive'}>
                                  {keyword.trend === 'rising' ? <TrendingUp className="h-3 w-3 mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                                  {keyword.trend}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span>Volume: {keyword.volume.toLocaleString()}</span>
                                <span>CPC: ${keyword.cpc.toFixed(2)}</span>
                                <span className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                                  Difficulty: {keyword.difficulty}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Opportunity Score</div>
                              <div className="text-2xl font-bold text-green-600">{keyword.opportunity}</div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Local Relevance</div>
                              <Progress value={keyword.localRelevance} className="h-2" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Competition</div>
                              <Badge variant={keyword.competition === 'low' ? 'default' : keyword.competition === 'medium' ? 'secondary' : 'destructive'}>
                                {keyword.competition}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Ideas Tab */}
        <TabsContent value="content-ideas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                AI Content Ideas Generator
              </CardTitle>
              <CardDescription>
                Generate viral-worthy content ideas with cultural intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="content-topic">Topic or Industry</Label>
                    <Input
                      id="content-topic"
                      value={contentTopic}
                      onChange={(e) => setContentTopic(e.target.value)}
                      placeholder="e.g., cryptocurrency, mobile payments..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                      <SelectTrigger id="content-type" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="video">Video Content</SelectItem>
                        <SelectItem value="infographic">Infographic</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleContentIdeas} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Content Ideas
                    </>
                  )}
                </Button>

                {contentIdeas.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Content Ideas</h3>
                      <Badge variant="outline">{contentIdeas.length} ideas generated</Badge>
                    </div>
                    
                    <div className="grid gap-4">
                      {contentIdeas.map((idea, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium">{idea.title}</h4>
                                <Badge variant="secondary">{idea.contentType}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {idea.targetKeywords.map((keyword, kidx) => (
                                  <Badge key={kidx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm text-gray-500">Est. Traffic</div>
                              <div className="text-xl font-bold text-blue-600">{idea.estimatedTraffic.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Viral Potential</div>
                              <Progress value={idea.viralPotential} className="h-2" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Cultural Relevance</div>
                              <Progress value={idea.culturalRelevance} className="h-2" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Trend Alignment</div>
                              <Progress value={idea.trendAlignment} className="h-2" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Audit Tab */}
        <TabsContent value="seo-audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                SEO Audit & Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive SEO analysis with African market optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="audit-url">Website URL</Label>
                  <Input
                    id="audit-url"
                    value={auditUrl}
                    onChange={(e) => setAuditUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleSEOAudit} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Auditing SEO...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Run SEO Audit
                    </>
                  )}
                </Button>

                {auditResults && (
                  <div className="mt-6 space-y-6">
                    {/* SEO Score */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>SEO Score</span>
                          <span className={`text-3xl font-bold ${getScoreColor(auditResults.score)}`}>
                            {auditResults.score}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={auditResults.score} className="h-3" />
                        <div className="mt-2 text-sm text-gray-600">
                          {auditResults.score >= 80 ? 'Excellent SEO performance' :
                           auditResults.score >= 60 ? 'Good SEO with room for improvement' :
                           'SEO needs significant improvement'}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Issues */}
                    {auditResults.issues.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                            Issues Found
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {auditResults.issues.map((issue, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  issue.type === 'critical' ? 'bg-red-500' :
                                  issue.type === 'warning' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{issue.title}</h4>
                                    <Badge variant={issue.impact === 'high' ? 'destructive' : issue.impact === 'medium' ? 'secondary' : 'outline'}>
                                      {issue.impact} impact
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {auditResults.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {auditResults.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{rec.title}</h4>
                                    <Badge variant={rec.priority === 'high' ? 'default' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                                      {rec.priority} priority
                                    </Badge>
                                    <Badge variant="outline">
                                      {rec.effort} effort
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Viral Content Tab */}
        <TabsContent value="viral-content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="h-5 w-5 mr-2" />
                Viral Content Generator
              </CardTitle>
              <CardDescription>
                Create viral-worthy content with cultural intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="viral-topic">Topic or Theme</Label>
                    <Input
                      id="viral-topic"
                      value={viralTopic}
                      onChange={(e) => setViralTopic(e.target.value)}
                      placeholder="e.g., fintech innovation, African entrepreneurship..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform-select">Target Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger id="platform-select" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleViralContent} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Viral Content...
                    </>
                  ) : (
                    <>
                      <Flame className="h-4 w-4 mr-2" />
                      Generate Viral Content
                    </>
                  )}
                </Button>

                {viralContent.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Viral Content Variations</h3>
                      <Badge variant="outline">{viralContent.length} variations generated</Badge>
                    </div>
                    
                    <div className="grid gap-4">
                      {viralContent.map((content, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium flex items-center">
                                <Badge variant="secondary" className="mr-2">
                                  {content.platform}
                                </Badge>
                                {content.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  {content.virality_score}% viral
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="font-medium text-sm mb-1">Hook:</div>
                              <p className="text-sm">{content.hook}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="font-medium text-sm mb-1">Content:</div>
                              <p className="text-sm">{content.content}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {content.hashtags.map((hashtag, hidx) => (
                                <Badge key={hidx} variant="outline" className="text-xs">
                                  #{hashtag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Engagement Prediction</div>
                                <Progress value={content.engagement_prediction} className="h-2" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Cultural Fit</div>
                                <Progress value={content.cultural_fit} className="h-2" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Timing Score</div>
                                <Progress value={content.timing_score} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
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