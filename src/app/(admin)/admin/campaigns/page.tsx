"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  MessageSquare, 
  Phone,
  Search, 
  Filter,
  MoreHorizontal,
  TrendingUp,
  Users,
  AlertTriangle,
  RefreshCw,
  Download,
  Pause,
  Play,
  Eye,
  Ban,
  CheckCircle,
  Calendar,
  Activity,
  BarChart3,
  Send,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  organization: {
    id: string;
    name: string;
  };
  creator: {
    name: string;
    email: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened?: number;
    clicked?: number;
    failed: number;
    deliveryRate: number;
    openRate?: number;
    clickRate?: number;
  };
  scheduledAt?: string;
  createdAt: string;
  lastUpdated: string;
  audience: {
    totalRecipients: number;
    segmentName?: string;
  };
}

// Staff email domains and whitelist
const ADMIN_DOMAINS = ['marketsage.africa'];
const ADMIN_EMAILS = [
  'admin@marketsage.africa',
  'support@marketsage.africa',
];

export default function AdminCampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "loading") return;
    
    // If not authenticated, redirect to admin login
    if (!session) {
      router.replace("/admin");
      return;
    }

    // Check if user is MarketSage staff
    const userEmail = session.user?.email;
    const userRole = (session.user as any)?.role;
    
    const isStaff = userEmail && (
      ADMIN_EMAILS.includes(userEmail) ||
      ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
      ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
    );

    if (!isStaff) {
      router.replace("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Real API call to fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(searchTerm && { search: searchTerm }),
          ...(typeFilter !== 'all' && { type: typeFilter }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
        });
        
        const response = await fetch(`/api/admin/campaigns?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }
        
        const data = await response.json();
        if (data.success) {
          setCampaigns(data.data.campaigns || []);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        // Fallback to empty array on error
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [searchTerm, typeFilter, statusFilter, currentPage]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no session, show redirect message
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const userEmail = session.user?.email;
  const userRole = (session.user as any)?.role;
  
  const isStaff = userEmail && (
    ADMIN_EMAILS.includes(userEmail) ||
    ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
    ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
  );

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <Phone className="h-4 w-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "flex items-center gap-1";
    switch (type) {
      case 'EMAIL':
        return <Badge variant="outline" className={`${baseClasses} bg-blue-50 text-blue-700`}><Mail className="h-3 w-3" />Email</Badge>;
      case 'SMS':
        return <Badge variant="outline" className={`${baseClasses} bg-green-50 text-green-700`}><Phone className="h-3 w-3" />SMS</Badge>;
      case 'WHATSAPP':
        return <Badge variant="outline" className={`${baseClasses} bg-purple-50 text-purple-700`}><MessageSquare className="h-3 w-3" />WhatsApp</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handlePauseCampaign = (campaignId: string) => {
    console.log('Pausing campaign:', campaignId);
  };

  const handleResumeCampaign = (campaignId: string) => {
    console.log('Resuming campaign:', campaignId);
  };

  const handleViewCampaign = (campaignId: string) => {
    console.log('Viewing campaign:', campaignId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Monitoring</h1>
            <p className="text-sm text-gray-600">
              Monitor all campaigns across email, SMS, and WhatsApp channels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              {campaigns.length} Campaigns
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                19.2% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.7K</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.3%</span> vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">97.8%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+0.2%</span> improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Campaigns</CardTitle>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campaigns List */}
                {loading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading campaigns...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                                {getTypeBadge(campaign.type)}
                                {getStatusBadge(campaign.status)}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Organization:</span> {campaign.organization.name}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Creator:</span> {campaign.creator.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Audience:</span> {campaign.audience.totalRecipients.toLocaleString()} recipients
                                {campaign.audience.segmentName && ` (${campaign.audience.segmentName})`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewCampaign(campaign.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {campaign.status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseCampaign(campaign.id)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pause
                                </Button>
                              ) : campaign.status === 'paused' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeCampaign(campaign.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Resume
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{campaign.stats.sent.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{campaign.stats.delivered.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Delivered</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{campaign.stats.deliveryRate}%</div>
                              <div className="text-xs text-gray-500">Delivery Rate</div>
                            </div>
                            {campaign.stats.opened && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{campaign.stats.opened.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Opened</div>
                              </div>
                            )}
                            {campaign.stats.openRate && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{campaign.stats.openRate}%</div>
                                <div className="text-xs text-gray-500">Open Rate</div>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{campaign.stats.failed.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Failed</div>
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                            <div>
                              Created: {new Date(campaign.createdAt).toLocaleDateString()} at {new Date(campaign.createdAt).toLocaleTimeString()}
                            </div>
                            <div>
                              Last updated: {new Date(campaign.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Currently running campaigns that need monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Campaign Monitor</h3>
                  <p className="text-gray-600 mb-4">
                    Real-time monitoring of active campaigns with detailed performance metrics
                  </p>
                  <p className="text-sm text-gray-500">
                    This view shows only campaigns that are currently sending messages
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Campaigns</CardTitle>
                <CardDescription>Upcoming campaigns and their scheduled send times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Campaigns</h3>
                  <p className="text-gray-600 mb-4">
                    View and manage campaigns scheduled for future delivery
                  </p>
                  <p className="text-sm text-gray-500">
                    Monitor upcoming campaigns and adjust timing if needed
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Analytics</CardTitle>
                <CardDescription>Performance insights and trends across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Comprehensive analytics and insights for campaign performance optimization
                  </p>
                  <p className="text-sm text-gray-500">
                    Track trends, identify top-performing campaigns, and optimize strategies
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Development Notice */}
        {userRole === 'SUPER_ADMIN' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Development Status</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Campaign Monitoring foundation complete with multi-channel campaign overview, 
                  performance metrics, and basic management actions. Advanced analytics and real-time monitoring are in development.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}