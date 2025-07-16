"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Send,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Zap,
  BarChart3,
  Hash,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Clock,
  Sparkles,
  Globe,
  Settings,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Camera,
  Video,
  Image as ImageIcon,
  Mic,
  FileText,
  Star,
  ThumbsUp,
  Bookmark,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";

// Platform icons mapping
const PlatformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Video,
  telegram: MessageCircle,
  pinterest: ImageIcon,
  snapchat: Camera,
  reddit: MessageSquare,
  whatsapp: MessageCircle
};

// Content type icons
const ContentTypeIcons = {
  post: FileText,
  story: Camera,
  reel: Video,
  video: Video,
  image: ImageIcon,
  carousel: ImageIcon,
  thread: MessageSquare,
  live: Video,
  short: Video,
  article: FileText,
  poll: BarChart3,
  event: Calendar
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

interface InfluencerProfile {
  username: string;
  display_name: string;
  follower_count: number;
  engagement_rate: number;
  platform: string;
  niche: string[];
  location: string;
  collaboration_potential: {
    score: number;
    reasons: string[];
  };
  contact_info: {
    email?: string;
    website?: string;
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
  const [activeTab, setActiveTab] = useState("overview");
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
  const [hashtagDifficulty, setHashtagDifficulty] = useState("mixed");
  const [hashtagResults, setHashtagResults] = useState<HashtagResearch[]>([]);
  const [hashtagResearching, setHashtagResearching] = useState(false);
  
  // Influencer Research States
  const [influencerNiche, setInfluencerNiche] = useState("");
  const [minFollowers, setMinFollowers] = useState(1000);
  const [maxFollowers, setMaxFollowers] = useState(100000);
  const [influencerResults, setInfluencerResults] = useState<InfluencerProfile[]>([]);
  const [influencerSearching, setInfluencerSearching] = useState(false);
  
  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() });

  // Load overview data
  useEffect(() => {
    if (session?.user) {
      loadOverview();
    }
  }, [session]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/social-media-management?action=get_overview');
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
    try {
      const response = await fetch('/api/ai/social-media-management', {
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
            trending: true
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
    }
  };

  const researchHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Please enter a topic for hashtag research');
      return;
    }

    setHashtagResearching(true);
    try {
      const response = await fetch('/api/ai/social-media-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'research_hashtags',
          topic: hashtagTopic,
          platforms: selectedPlatforms,
          hashtag_options: {
            max_hashtags: maxHashtags,
            difficulty: hashtagDifficulty,
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

  const searchInfluencers = async () => {
    if (!influencerNiche.trim()) {
      toast.error('Please enter a niche for influencer search');
      return;
    }

    setInfluencerSearching(true);
    try {
      const response = await fetch('/api/ai/social-media-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'identify_influencers',
          topic: influencerNiche,
          platforms: selectedPlatforms,
          influencer_options: {
            follower_range: { min: minFollowers, max: maxFollowers },
            engagement_rate: { min: 0.01, max: 0.20 },
            language: 'en',
            audience_match: 0.7,
            brand_alignment: [influencerNiche]
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const allInfluencers = data.data.influencer_identification.flatMap((result: any) => 
          result.influencers.map((influencer: any) => ({
            ...influencer,
            platform: result.platform
          }))
        );
        setInfluencerResults(allInfluencers);
        toast.success('Influencer search completed!');
      } else {
        toast.error(data.message || 'Failed to search influencers');
      }
    } catch (error) {
      console.error('Error searching influencers:', error);
      toast.error('Failed to search influencers');
    } finally {
      setInfluencerSearching(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/ai/social-media-management', {
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
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data.platform_analytics);
        toast.success('Analytics loaded successfully!');
      } else {
        toast.error(data.message || 'Failed to load analytics');
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
      const response = await fetch('/api/ai/social-media-management', {
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

  const getPlatformIcon = (platform: string) => {
    const IconComponent = PlatformIcons[platform as keyof typeof PlatformIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  const getContentTypeIcon = (type: string) => {
    const IconComponent = ContentTypeIcons[type as keyof typeof ContentTypeIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendingColor = (status: string) => {
    switch (status) {
      case 'rising': return 'bg-green-100 text-green-800';
      case 'stable': return 'bg-blue-100 text-blue-800';
      case 'declining': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Studio</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtag Research</TabsTrigger>
          <TabsTrigger value="influencers">Influencer Hub</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Instagram', 'Facebook', 'Twitter', 'LinkedIn'].map((platform, index) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(platform.toLowerCase())}
                        <span className="font-medium">{platform}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(Math.floor(Math.random() * 50000) + 10000)} reach
                        </div>
                        <Progress value={Math.floor(Math.random() * 100)} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Content Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '09:00 AM', platform: 'Instagram', type: 'Story', status: 'scheduled' },
                    { time: '01:00 PM', platform: 'Facebook', type: 'Post', status: 'published' },
                    { time: '05:00 PM', platform: 'Twitter', type: 'Thread', status: 'scheduled' },
                    { time: '07:00 PM', platform: 'LinkedIn', type: 'Article', status: 'draft' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{item.time}</div>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(item.platform.toLowerCase())}
                          <span className="text-sm">{item.platform}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <Badge variant={item.status === 'published' ? 'default' : item.status === 'scheduled' ? 'secondary' : 'outline'}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Studio Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Generation Form */}
            <Card>
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
                    {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'].map((platform) => (
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
          </div>
        </TabsContent>

        {/* Hashtag Research Tab */}
        <TabsContent value="hashtags" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hashtag Research Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Hashtag Research
                </CardTitle>
                <CardDescription>
                  Discover trending and relevant hashtags for your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hashtag-topic">Research Topic</Label>
                  <Input
                    id="hashtag-topic"
                    placeholder="e.g., digital marketing, AI, startup, fitness"
                    value={hashtagTopic}
                    onChange={(e) => setHashtagTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-hashtags">Maximum Hashtags</Label>
                  <Select value={maxHashtags.toString()} onValueChange={(value) => setMaxHashtags(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 hashtags</SelectItem>
                      <SelectItem value="20">20 hashtags</SelectItem>
                      <SelectItem value="30">30 hashtags</SelectItem>
                      <SelectItem value="50">50 hashtags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={hashtagDifficulty} onValueChange={setHashtagDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (Low competition)</SelectItem>
                      <SelectItem value="medium">Medium (Moderate competition)</SelectItem>
                      <SelectItem value="hard">Hard (High competition)</SelectItem>
                      <SelectItem value="mixed">Mixed (All levels)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={researchHashtags} 
                  disabled={hashtagResearching || !hashtagTopic.trim()}
                  className="w-full"
                >
                  {hashtagResearching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Researching...</>
                  ) : (
                    <><Hash className="h-4 w-4 mr-2" />Research Hashtags</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Hashtag Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Hashtag Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hashtagResults.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {hashtagResults.map((hashtag, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-sm">{hashtag.hashtag}</div>
                          <Badge className={`text-xs ${getDifficultyColor(hashtag.difficulty)}`}>
                            {hashtag.difficulty}
                          </Badge>
                          <Badge className={`text-xs ${getTrendingColor(hashtag.trending_status)}`}>
                            {hashtag.trending_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(hashtag.reach_potential)} reach
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(hashtag.engagement_rate * 100).toFixed(1)}% eng.
                          </div>
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hashtags researched yet</p>
                    <p className="text-sm">Enter a topic to discover relevant hashtags</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Influencer Hub Tab */}
        <TabsContent value="influencers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Influencer Search Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Influencer Discovery
                </CardTitle>
                <CardDescription>
                  Find relevant influencers for your brand and campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="influencer-niche">Niche/Industry</Label>
                  <Input
                    id="influencer-niche"
                    placeholder="e.g., fitness, tech, fashion, food"
                    value={influencerNiche}
                    onChange={(e) => setInfluencerNiche(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-followers">Min Followers</Label>
                    <Input
                      id="min-followers"
                      type="number"
                      placeholder="1000"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(parseInt(e.target.value) || 1000)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-followers">Max Followers</Label>
                    <Input
                      id="max-followers"
                      type="number"
                      placeholder="100000"
                      value={maxFollowers}
                      onChange={(e) => setMaxFollowers(parseInt(e.target.value) || 100000)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={searchInfluencers} 
                  disabled={influencerSearching || !influencerNiche.trim()}
                  className="w-full"
                >
                  {influencerSearching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Searching...</>
                  ) : (
                    <><Users className="h-4 w-4 mr-2" />Search Influencers</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Influencer Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Influencer Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {influencerResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {influencerResults.map((influencer, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                              {influencer.display_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{influencer.display_name}</div>
                              <div className="text-sm text-muted-foreground">@{influencer.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(influencer.platform)}
                            <Badge variant="outline" className="text-xs">
                              {(influencer.collaboration_potential.score * 100).toFixed(0)}% match
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Followers</div>
                            <div className="font-medium">{formatNumber(influencer.follower_count)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Engagement</div>
                            <div className="font-medium">{(influencer.engagement_rate * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Location</div>
                            <div className="font-medium">{influencer.location}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Niche</div>
                            <div className="font-medium">{influencer.niche.join(', ')}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="flex-1">
                            <MessageCircle className="h-3 w-3 mr-2" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Bookmark className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No influencers found yet</p>
                    <p className="text-sm">Enter a niche to discover relevant influencers</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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