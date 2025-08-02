"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Send,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Hash,
  Eye,
  Heart,
  Clock,
  Sparkles,
  Globe,
  Plus,
  RefreshCw,
  Download,
  CheckCircle,
  Loader2,
  FileText,
  Copy,
  Instagram
} from "lucide-react";
import { toast } from "sonner";

// Platform icons mapping
const PlatformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  telegram: MessageCircle,
  pinterest: FileText,
  snapchat: FileText,
  reddit: MessageCircle,
  whatsapp: MessageCircle
};

interface SocialMediaOverview {
  system_status: string;
  connected_platforms: number;
  posts_today: number;
  engagement_rate: number;
  reach_today: number;
  pending_posts: number;
  active_campaigns: number;
  trending_topics: number;
}

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags: string[];
  optimal_timing: string;
  engagement_prediction: number;
  visual_suggestions: string[];
  ai_insights: string[];
}

interface HashtagResearch {
  hashtag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reach_potential: number;
  engagement_rate: number;
  trending_status: 'rising' | 'stable' | 'declining';
  aiInsights: {
    recommendation: string;
    reason: string;
  };
}

interface PlatformAnalytics {
  platform: string;
  analytics: {
    overview: {
      totalReach: number;
      totalEngagement: number;
      engagementRate: number;
      followerGrowth: number;
    };
    content: {
      totalPosts: number;
      avgEngagement: number;
      topContent: any[];
    };
    audience: {
      demographics: any;
      interests: string[];
      activeHours: number[];
    };
    roi: {
      roi: number;
      conversion_rate: number;
      revenue_generated: number;
    };
  };
}

export default function SocialMediaDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("content");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<SocialMediaOverview | null>(null);
  
  // Content Generation States
  const [contentTopic, setContentTopic] = useState("");
  const [contentType, setContentType] = useState("post");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "instagram", "twitter", "linkedin"]);
  const [contentTone, setContentTone] = useState("professional");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [contentGenerating, setContentGenerating] = useState(false);
  
  // Hashtag Research States
  const [hashtagTopic, setHashtagTopic] = useState("");
  const [maxHashtags, setMaxHashtags] = useState(30);
  const [hashtagResults, setHashtagResults] = useState<HashtagResearch[]>([]);
  const [hashtagResearching, setHashtagResearching] = useState(false);
  
  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dateRange] = useState({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
    end: new Date().toISOString() 
  });
  
  // MCP Integration States
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  // Load overview data and connection status
  useEffect(() => {
    if (session?.user) {
      loadOverview();
      loadConnectionStatus();
    }
  }, [session]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/ai/social-media-management?action=get_overview');
      const data = await response.json();
      
      if (data.success) {
        setOverview(data.data.overview);
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      toast.error('Failed to load social media overview');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!contentTopic.trim()) {
      toast.error('Please enter a topic for content generation');
      return;
    }

    setContentGenerating(true);
    setInsightsLoading(true);
    
    try {
      // Get customer insights from MCP
      const insights = await getCustomerInsights();
      setCustomerInsights(insights);
      
      const response = await fetch('/api/v2/ai/social-media-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_content',
          topic: contentTopic,
          content_type: contentType,
          platforms: selectedPlatforms,
          content_options: {
            tone: contentTone,
            length: 'medium',
            include_hashtags: true,
            include_mentions: false,
            visual_elements: true,
            call_to_action: true,
            trending: true,
            customer_insights: insights // Pass MCP insights to AI
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedContent(data.data.generated_content);
        toast.success('Content generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setContentGenerating(false);
      setInsightsLoading(false);
    }
  };

  const researchHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Please enter a topic for hashtag research');
      return;
    }

    setHashtagResearching(true);
    try {
      const response = await fetch('/api/v2/ai/social-media-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'research_hashtags',
          topic: hashtagTopic,
          platforms: selectedPlatforms,
          hashtag_options: {
            max_hashtags: maxHashtags,
            difficulty: 'mixed',
            trending: true,
            competitor_analysis: true,
            audience_size: 'medium'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const allHashtags = data.data.hashtag_research.flatMap((result: any) => 
          result.hashtags.map((hashtag: any) => ({
            ...hashtag,
            platform: result.platform
          }))
        );
        setHashtagResults(allHashtags);
        toast.success('Hashtag research completed!');
      } else {
        toast.error(data.message || 'Failed to research hashtags');
      }
    } catch (error) {
      console.error('Error researching hashtags:', error);
      toast.error('Failed to research hashtags');
    } finally {
      setHashtagResearching(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Load both social media analytics and campaign analytics via MCP
      const [socialResponse, campaignResponse] = await Promise.all([
        fetch('/api/v2/ai/social-media-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_analytics',
            platforms: selectedPlatforms,
            analytics_options: {
              time_range: {
                start_date: dateRange.start,
                end_date: dateRange.end
              },
              metrics: ['engagement', 'reach', 'impressions', 'clicks', 'conversions'],
              competitor_analysis: true,
              trend_analysis: true,
              roi_analysis: true
            }
          })
        }),
        // Campaign Analytics via MCP
        fetch('/api/v2/ai/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_campaign_analytics',
            platforms: selectedPlatforms,
            time_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          })
        })
      ]);

      const socialData = await socialResponse.json();
      const campaignData = await campaignResponse.json();
      
      if (socialData.success) {
        // Merge social media analytics with campaign analytics
        const enrichedAnalytics = socialData.data.platform_analytics.map((platform: any) => ({
          ...platform,
          campaignMetrics: campaignData.success ? campaignData.data.find((c: any) => c.platform === platform.platform) : null
        }));
        
        setAnalyticsData(enrichedAnalytics);
        toast.success('Analytics loaded successfully!');
      } else {
        toast.error(socialData.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const postContent = async (content: GeneratedContent) => {
    try {
      const response = await fetch('/api/v2/ai/social-media-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post_autonomously',
          content: content.content,
          platforms: [content.platform],
          posting_options: {
            cross_post: false,
            adapt_content: true,
            hashtags: content.hashtags,
            track_conversions: true
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Content posted successfully on ${content.platform}!`);
      } else {
        toast.error(data.message || 'Failed to post content');
      }
    } catch (error) {
      console.error('Error posting content:', error);
      toast.error('Failed to post content');
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const connectPlatform = (platform: string) => {
    const callbackUrl = `${window.location.origin}/api/auth/callback/${platform}`;
    
    switch (platform) {
      case 'facebook':
        // Use our custom OAuth flow for Facebook
        window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish&response_type=code`;
        break;
      case 'instagram':
        // Instagram uses Facebook OAuth
        window.location.href = `https://api.instagram.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user_profile,user_media&response_type=code`;
        break;
      case 'twitter':
        // Use our custom OAuth flow for Twitter
        const twitterState = Math.random().toString(36).substring(2, 15);
        const twitterCodeChallenge = 'challenge'; // In production, generate proper PKCE challenge
        window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=tweet.read%20tweet.write%20users.read&state=${twitterState}&code_challenge=${twitterCodeChallenge}&code_challenge_method=plain`;
        break;
      case 'linkedin':
        // Use our custom OAuth flow for LinkedIn
        const linkedinState = Math.random().toString(36).substring(2, 15);
        window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=r_liteprofile%20w_member_social&state=${linkedinState}`;
        break;
      case 'youtube':
        // YouTube uses Google OAuth
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube&response_type=code&access_type=offline`;
        break;
      default:
        toast.error(`${platform} connection not yet implemented`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = PlatformIcons[platform as keyof typeof PlatformIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  // MCP Integration for customer insights
  const getCustomerInsights = async () => {
    try {
      const response = await fetch('/api/v2/ai/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_customer_insights',
          query: contentTopic || 'general content',
          options: {
            includeSegments: true,
            includePredictions: true,
            includeEngagement: true
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching customer insights:', error);
    }
    return null;
  };

  const loadConnectionStatus = async () => {
    try {
      const response = await fetch('/api/v2/social-media/connections');
      const data = await response.json();
      
      if (data.success) {
        const status: Record<string, boolean> = {};
        data.data.connections.forEach((conn: any) => {
          status[conn.platform] = conn.isActive && (!conn.expiresAt || new Date(conn.expiresAt) > new Date());
        });
        setConnectionStatus(status);
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            Social Media Management
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            Multi-platform content generation, scheduling, and analytics with AI intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadOverview} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.href = '/campaigns'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Social Media Accounts Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to enable posting and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Facebook', icon: Facebook, platform: 'facebook' },
              { name: 'Instagram', icon: Instagram, platform: 'instagram' },
              { name: 'Twitter', icon: Twitter, platform: 'twitter' },
              { name: 'LinkedIn', icon: Linkedin, platform: 'linkedin' },
              { name: 'YouTube', icon: Youtube, platform: 'youtube' },
              { name: 'Telegram', icon: MessageCircle, platform: 'telegram' }
            ].map((platform) => {
              const isConnected = connectionStatus[platform.platform] || false;
              return (
              <div key={platform.name} className="flex flex-col items-center p-3 border rounded-lg">
                <platform.icon className={`h-8 w-8 mb-2 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{platform.name}</span>
                <div className="mt-2">
                  {isConnected ? (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">Connected</Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6"
                      onClick={() => connectPlatform(platform.platform)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.connected_platforms}/11</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> since last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Reach</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.reach_today)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overview.engagement_rate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+0.5%</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.active_campaigns}</div>
              <p className="text-xs text-muted-foreground">
                {overview.pending_posts} posts pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content Studio</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Content Studio Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Generation Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
                  Generate optimized content for multiple platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Content Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Digital marketing trends, Product launch, Industry insights"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="thread">Thread</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Content Tone</Label>
                  <Select value={contentTone} onValueChange={setContentTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Platforms</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'telegram'].map((platform) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <Switch
                          id={platform}
                          checked={selectedPlatforms.includes(platform)}
                          onCheckedChange={() => togglePlatform(platform)}
                        />
                        <Label htmlFor={platform} className="flex items-center gap-2 text-sm">
                          {getPlatformIcon(platform)}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={generateContent} 
                  disabled={contentGenerating || !contentTopic.trim()}
                  className="w-full"
                >
                  {contentGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Generate Content</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Hashtag Research Helper Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Hashtag Research
                </CardTitle>
                <CardDescription>
                  Discover trending hashtags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hashtag-topic">Research Topic</Label>
                  <Input
                    id="hashtag-topic"
                    placeholder="e.g., digital marketing, AI"
                    value={hashtagTopic}
                    onChange={(e) => setHashtagTopic(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-hashtags">Max Hashtags</Label>
                  <Select value={maxHashtags.toString()} onValueChange={(value) => setMaxHashtags(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={researchHashtags} 
                  disabled={hashtagResearching || !hashtagTopic.trim()}
                  className="w-full"
                  size="sm"
                >
                  {hashtagResearching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Researching...</>
                  ) : (
                    <><Hash className="h-4 w-4 mr-2" />Research</>
                  )}
                </Button>

                {hashtagResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {hashtagResults.slice(0, 10).map((hashtag, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                        <span className="font-medium">{hashtag.hashtag}</span>
                        <Button size="sm" variant="outline" className="h-6 px-2">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Insights from MCP */}
                {insightsLoading && (
                  <div className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading customer insights...</p>
                  </div>
                )}
                
                {customerInsights && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-xs font-medium mb-2 text-blue-700">Customer Insights</h4>
                    <div className="space-y-1 text-xs text-blue-600">
                      {customerInsights.segments && (
                        <p>• Target: {customerInsights.segments.slice(0, 2).join(', ')}</p>
                      )}
                      {customerInsights.preferences && (
                        <p>• Interests: {customerInsights.preferences.slice(0, 3).join(', ')}</p>
                      )}
                      {customerInsights.engagement && (
                        <p>• Best time: {customerInsights.engagement.optimal_time}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Content Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent.length > 0 ? (
                <div className="space-y-4">
                  {generatedContent.map((content, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(content.platform)}
                          <span className="font-medium capitalize">{content.platform}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(content.engagement_prediction * 100).toFixed(1)}% predicted engagement
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p>{content.content}</p>
                        </div>
                        
                        {content.hashtags && content.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {content.hashtags.map((hashtag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {content.optimal_timing && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Best time to post: {content.optimal_timing}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => postContent(content)}
                          className="flex-1"
                        >
                          <Send className="h-3 w-3 mr-2" />
                          Post Now
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-3 w-3 mr-2" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content generated yet</p>
                  <p className="text-sm">Enter a topic and generate AI-powered content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Social Media Analytics</h3>
              <p className="text-sm text-muted-foreground">Track performance across all platforms</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={loadAnalytics} disabled={analyticsLoading}>
                {analyticsLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />Refresh</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.map((platform, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getPlatformIcon(platform.platform)}
                    {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {platform.analytics.overview.engagementRate.toFixed(1)}%
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(platform.analytics.overview.totalReach)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(platform.analytics.overview.totalEngagement)} engagements
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>ROI</span>
                      <span className="font-medium">${platform.analytics.roi.roi.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Conversion</span>
                      <span className="font-medium">{(platform.analytics.roi.conversion_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {analyticsData.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No analytics data available</p>
                <p className="text-sm text-muted-foreground">Click refresh to load analytics data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}