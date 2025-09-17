"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Copy, 
  Edit, 
  Layers, 
  Loader2, 
  Mail, 
  Send, 
  Trash2,
  User,
  Users,
  BarChart,
  Eye
} from "lucide-react";
import { format } from "date-fns";

// Define campaign type
interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  from: string;
  replyTo: string | null;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  templateId: string | null;
  content: string | null;
  design: string | null;
  template: {
    id: string;
    name: string;
  } | null;
  lists: {
    id: string;
    name: string;
  }[];
  segments: {
    id: string;
    name: string;
  }[];
  statistics: {
    totalSent: number;
    activitiesCount?: number;
  };
}

interface CampaignAnalytics {
  summary: {
    totalSent: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    deliveryRate: number;
  };
  topClickedUrls: {
    url: string;
    clicks: number;
  }[];
  opensOverTime: {
    time: string;
    opens: number;
  }[];
  activityBreakdown: Record<string, number>;
  lastUpdated: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campaignId = params.id as string;

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/email/campaigns/${campaignId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Campaign not found. It may have been deleted or you don't have access to it.");
            toast({
              title: "Campaign Not Found",
              description: "The campaign you're looking for doesn't exist or has been deleted.",
              variant: "destructive",
            });
            return;
          }
          
          if (response.status === 403) {
            setError("You don't have permission to view this campaign.");
            toast({
              title: "Access Denied", 
              description: "You don't have permission to view this campaign.",
              variant: "destructive",
            });
            return;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(`Failed to load campaign: ${errorMessage}`);
        toast({
          title: "Error",
          description: `Failed to load campaign details: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, toast]);

  // Fetch analytics when campaign is loaded and sent
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!campaign || campaign.status !== 'SENT') return;
      
      try {
        setAnalyticsLoading(true);
        const response = await fetch(`/api/email/campaigns/${campaignId}/analytics`);
        
        if (response.ok) {
          const analyticsData = await response.json();
          setAnalytics(analyticsData);
        } else {
          console.error('Failed to fetch analytics:', response.statusText);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [campaign, campaignId]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/email/campaigns/edit/${campaignId}`);
  };

  const handleDuplicate = async () => {
    try {
      // Fetch full campaign data to duplicate
      const response = await fetch(`/api/email/campaigns/${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch campaign data");
      
      const campaignData = await response.json();
      
      // Prepare data for duplication
      const duplicateData = {
        name: `Copy of ${campaignData.name}`,
        description: campaignData.description,
        subject: campaignData.subject,
        from: campaignData.from,
        replyTo: campaignData.replyTo,
        templateId: campaignData.templateId,
        content: campaignData.content,
        design: campaignData.design,
        listIds: campaignData.lists.map((list: any) => list.id),
        segmentIds: campaignData.segments.map((segment: any) => segment.id),
      };
      
      // Create the duplicate
      const createResponse = await fetch('/api/v2/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      });
      
      if (!createResponse.ok) throw new Error("Failed to duplicate campaign");
      
      const newCampaign = await createResponse.json();
      
      toast({
        title: "Success",
        description: "Campaign duplicated successfully",
      });
      
      // Navigate to the new campaign
      router.push(`/email/campaigns/${newCampaign.id}`);
      
    } catch (err) {
      console.error("Error duplicating campaign:", err);
      toast({
        title: "Error",
        description: "Failed to duplicate campaign. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!campaign) return;
    
    try {
      setIsSending(true);
      
      const response = await fetch(`/api/email/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send campaign: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Campaign sent successfully! ${result.summary?.sentCount || 0} emails sent.`,
      });
      
      // Update the campaign status in the UI
      setCampaign(prev => prev ? { ...prev, status: "SENT" } : null);
      
    } catch (err) {
      console.error("Error sending campaign:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DRAFT": return "secondary";
      case "SCHEDULED": return "outline";
      case "SENDING": return "default";
      case "SENT": return "default";
      case "PAUSED": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading campaign details...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error || "Campaign not found"}</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
          <Badge variant={getStatusBadgeVariant(campaign.status)}>
            {campaign.status.toLowerCase()}
          </Badge>
        </div>
        <div className="flex space-x-2">
          {campaign.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending ? "Sending..." : "Send"}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          {(campaign.status === "SENT" || campaign.status === "SENDING") && (
            <TabsTrigger value="reports">Reports</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subject Line</h3>
                  <p className="mt-1">{campaign.subject}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">From Address</h3>
                  <p className="mt-1">{campaign.from}</p>
                </div>
                {campaign.replyTo && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reply-To</h3>
                    <p className="mt-1">{campaign.replyTo}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Template</h3>
                  <p className="mt-1">{campaign.template ? campaign.template.name : "Custom Content"}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {campaign.status === "SCHEDULED" && campaign.scheduledFor && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-medium">Scheduled For</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(campaign.scheduledFor)}</p>
                    </div>
                  </div>
                )}
                {campaign.status === "SENT" && campaign.sentAt && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-medium">Sent At</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(campaign.sentAt)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-medium">Created</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-medium">Last Modified</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(campaign.updatedAt)}</p>
                  </div>
                </div>
              </div>
              
              {campaign.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{campaign.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {(campaign.status === "SENT" || campaign.status === "SENDING") && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics for this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{campaign.statistics.totalSent}</p>
                    <p className="text-sm text-muted-foreground">Recipients</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">
                      {analyticsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : analytics ? (
                        `${analytics.summary.openRate.toFixed(1)}%`
                      ) : (
                        campaign.status === 'SENT' ? '--' : 'N/A'
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <BarChart className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">
                      {analyticsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : analytics ? (
                        `${analytics.summary.clickRate.toFixed(1)}%`
                      ) : (
                        campaign.status === 'SENT' ? '--' : 'N/A'
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">
                      {analyticsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : analytics ? (
                        `${analytics.summary.unsubscribeRate.toFixed(1)}%`
                      ) : (
                        campaign.status === 'SENT' ? '--' : 'N/A'
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Unsubscribes</p>
                  </div>
                </div>
                <Button variant="link" className="mt-4 p-0" onClick={() => {
                  const reportsTab = document.querySelector('[data-value="reports"]') as HTMLElement;
                  if (reportsTab) reportsTab.click();
                }}>
                  View detailed reports →
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Audience</CardTitle>
              <CardDescription>Lists and segments included in this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Lists</h3>
                {campaign.lists.length === 0 ? (
                  <p className="text-muted-foreground">No lists assigned to this campaign.</p>
                ) : (
                  <ul className="space-y-2">
                    {campaign.lists.map(list => (
                      <li key={list.id} className="flex items-center p-2 bg-muted rounded-md">
                        <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                        {list.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Segments</h3>
                {campaign.segments.length === 0 ? (
                  <p className="text-muted-foreground">No segments assigned to this campaign.</p>
                ) : (
                  <ul className="space-y-2">
                    {campaign.segments.map(segment => (
                      <li key={segment.id} className="flex items-center p-2 bg-muted rounded-md">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {segment.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Total Audience</h3>
                <p className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-xl font-bold">{campaign.statistics.totalSent}</span>
                  <span className="text-muted-foreground ml-2">recipients</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Preview of the email content</CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.template ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Template: {campaign.template.name}</h3>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                    <p>{campaign.subject}</p>
                  </div>
                  <div className="p-4 border rounded-md mt-4 max-h-[500px] overflow-auto">
                    {campaign.content ? (
                      <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
                    ) : (
                      <p className="text-muted-foreground">Content is managed by the template</p>
                    )}
                  </div>
                </div>
              ) : campaign.content ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Custom Content</h3>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                    <p>{campaign.subject}</p>
                  </div>
                  <div className="p-4 border rounded-md mt-4 max-h-[500px] overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No content available for this campaign.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {(campaign.status === "SENT" || campaign.status === "SENDING") && (
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Reports</CardTitle>
                <CardDescription>Detailed analytics for this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Sent</span>
                      <span className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : analytics ? (
                          analytics.summary.sent
                        ) : (
                          campaign.statistics.activitiesCount || 0
                        )}
                      </span>
                      <div className="mt-2 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 w-full rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Delivered</span>
                      <span className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : analytics ? (
                          analytics.summary.delivered
                        ) : (
                          campaign.statistics.activitiesCount || 0
                        )}
                      </span>
                      <div className="mt-2 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: analytics ? `${analytics.summary.deliveryRate}%` : '100%' 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Opens</span>
                      <span className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : analytics ? (
                          analytics.summary.opened
                        ) : (
                          '--'
                        )}
                      </span>
                      <div className="mt-2 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: analytics ? `${analytics.summary.openRate}%` : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Clicks</span>
                      <span className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : analytics ? (
                          analytics.summary.clicked
                        ) : (
                          '--'
                        )}
                      </span>
                      <div className="mt-2 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: analytics ? `${analytics.summary.clickRate}%` : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Opens Over Time</h3>
                    <div className="h-[300px] w-full bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Charts will be integrated here</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Link Clicks</h3>
                    <div className="space-y-2">
                      {analyticsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : analytics?.topClickedUrls.length ? (
                        analytics.topClickedUrls.map((link, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <span className="truncate mr-2">{link.url}</span>
                            <span className="font-medium">{link.clicks} click{link.clicks !== 1 ? 's' : ''}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-muted-foreground">
                          {campaign.status === 'SENT' ? 'No link clicks recorded yet' : 'No clicks available for unsent campaigns'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 